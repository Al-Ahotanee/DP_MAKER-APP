import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

// --- INITIALIZATION ---
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// --- CLOUDINARY CONFIGURATION ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- MULTER: Memory storage → stream to Cloudinary ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max per frame PNG
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PNG, JPEG, WEBP or SVG files are accepted'));
  },
});

// ==============================================
// MIDDLEWARE STACK
// ==============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // CSP managed by Vite in dev / Vercel in prod
}));

// Permissive CORS in development; lock down via env in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['*'];

app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: !allowedOrigins.includes('*'),
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// --- RATE LIMITING ---
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests – please try again shortly.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts – please wait before trying again.' },
  skipSuccessfulRequests: true,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 30,
  message: { error: 'Upload limit reached – try again in an hour.' },
});

const analyticsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 500,
  message: { error: 'Analytics throttled.' },
  skip: () => false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api/analytics/', analyticsLimiter);

// ==============================================
// AUTH TYPES & MIDDLEWARE
// ==============================================
interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'Access token required' }); return; }
  jwt.verify(token, JWT_SECRET, (err: any, payload: any) => {
    if (err) { res.status(403).json({ error: 'Invalid or expired token' }); return; }
    req.user = payload;
    next();
  });
};

const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err: any, payload: any) => {
      if (!err) req.user = payload;
    });
  }
  next();
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin privileges required' }); return;
  }
  next();
};

// ==============================================
// HEALTH CHECK
// ==============================================
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'FrameIt API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ==============================================
// AUTHENTICATION ROUTES
// ==============================================
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, adminCode } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Name, email and password are required' }); return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' }); return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) { res.status(409).json({ error: 'Account with this email already exists' }); return; }

    const hashedPassword = await bcrypt.hash(password, 12);
    const role = (adminCode && adminCode === process.env.ADMIN_SETUP_CODE) ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: { email: email.toLowerCase().trim(), password: hashedPassword, name: name.trim(), role },
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('[Register]', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: 'Email and password required' }); return; }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) { res.status(401).json({ error: 'Invalid email or password' }); return; }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) { res.status(401).json({ error: 'Invalid email or password' }); return; }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('[Login]', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// ==============================================
// CREATOR DASHBOARD — STATS & CAMPAIGNS
// ==============================================
app.get('/api/me/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userCampaigns = await prisma.campaign.findMany({
      where: { authorId: userId },
      select: { id: true },
    });
    const campaignIds = userCampaigns.map(c => c.id);

    const stats = await prisma.analytics.aggregate({
      where: { campaignId: { in: campaignIds } },
      _sum: { views: true, generatedDps: true, downloads: true },
    });

    res.json({
      totalCampaigns: userCampaigns.length,
      totalViews:     stats._sum.views       || 0,
      totalGenerated: stats._sum.generatedDps || 0,
      totalDownloads: stats._sum.downloads    || 0,
    });
  } catch (error) {
    console.error('[Stats]', error);
    res.status(500).json({ error: 'Failed to load statistics' });
  }
});

app.get('/api/me/campaigns', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { authorId: req.user!.id },
      include: { _count: { select: { analytics: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your campaigns' });
  }
});

// ==============================================
// FILE UPLOAD — Cloudinary
// ==============================================
app.post('/api/upload', authenticateToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: 'No file provided' }); return; }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'frameit_frames',
        format: 'png',
        transformation: [{ quality: 'auto:best' }],
      },
      (error, result) => {
        if (error || !result) {
          res.status(500).json({ error: 'Cloud upload failed. Check your Cloudinary credentials.' });
          return;
        }
        res.json({ url: result.secure_url, publicId: result.public_id });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('[Upload]', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// ==============================================
// CAMPAIGNS — Public Discovery
// ==============================================
app.get('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const { search, category, featured, trending, limit = '50', page = '1' } = req.query;
    const take = Math.min(parseInt(String(limit), 10) || 50, 100);
    const skip = (parseInt(String(page), 10) - 1) * take;

    const whereClause: any = { isPublished: true };
    if (search)   whereClause.OR = [
      { title:       { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
      { logoText:    { contains: String(search), mode: 'insensitive' } },
    ];
    if (category) whereClause.category = String(category);
    if (featured === 'true')  whereClause.featured  = true;
    if (trending === 'true')  whereClause.trending   = true;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where: whereClause,
        include: { template: true, _count: { select: { analytics: true } } },
        orderBy: [{ featured: 'desc' }, { trending: 'desc' }, { createdAt: 'desc' }],
        take,
        skip,
      }),
      prisma.campaign.count({ where: whereClause }),
    ]);

    res.json(campaigns);
  } catch (error) {
    console.error('[Campaigns]', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Single campaign by slug — auth-gated preview
app.get('/api/campaigns/slug/:slug', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { slug: req.params.slug },
      include: { template: true, _count: { select: { analytics: true } } },
    });

    if (!campaign) { res.status(404).json({ error: 'Campaign not found' }); return; }

    // Unpublished campaigns: owner or admin only
    if (!campaign.isPublished) {
      const isOwner = req.user && (req.user.id === (campaign as any).authorId || req.user.role === 'ADMIN');
      const hasPreviewParam = req.query.preview === 'true';
      if (!isOwner || !hasPreviewParam) {
        res.status(404).json({ error: 'Campaign not found or not yet published' }); return;
      }
    }

    // Async view tracking (fire-and-forget)
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    prisma.analytics.upsert({
      where:  { campaignId_date: { campaignId: campaign.id, date: today } },
      update: { views: { increment: 1 } },
      create: { campaignId: campaign.id, date: today, views: 1 },
    }).catch(() => {});

    res.json(campaign);
  } catch (error) {
    console.error('[Campaign By Slug]', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create new campaign (any authenticated user)
app.post('/api/campaigns', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { template, tags, ...campaignData } = req.body;

    if (!campaignData.title || !campaignData.slug) {
      res.status(400).json({ error: 'Title and slug are required' }); return;
    }

    // Sanitize slug
    const slug = String(campaignData.slug)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const campaign = await prisma.campaign.create({
      data: {
        ...campaignData,
        slug,
        tags: Array.isArray(tags) ? tags : [],
        authorId: req.user!.id,
        template: template ? { create: template } : undefined,
      },
      include: { template: true },
    });

    res.status(201).json(campaign);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'A campaign with this URL slug already exists. Please choose a different one.' });
      return;
    }
    console.error('[Create Campaign]', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update campaign (owner or admin)
app.put('/api/campaigns/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Campaign not found' }); return; }

    const isOwner = existing.authorId === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isOwner && !isAdmin) { res.status(403).json({ error: 'You do not own this campaign' }); return; }

    const { template, tags, ...campaignData } = req.body;
    delete campaignData.authorId; // never allow author re-assignment this way

    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: {
        ...campaignData,
        tags: Array.isArray(tags) ? tags : existing.tags,
        template: template
          ? { upsert: { create: template, update: template } }
          : undefined,
      },
      include: { template: true },
    });

    res.json(campaign);
  } catch (error) {
    console.error('[Update Campaign]', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete campaign (owner or admin)
app.delete('/api/campaigns/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Campaign not found' }); return; }

    const isOwner = existing.authorId === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isOwner && !isAdmin) { res.status(403).json({ error: 'You do not own this campaign' }); return; }

    await prisma.campaign.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('[Delete Campaign]', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// Toggle featured / trending (admin only)
app.patch('/api/campaigns/:id/toggle', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { field } = req.body;
    if (!['featured', 'trending', 'isPublished'].includes(field)) {
      res.status(400).json({ error: 'Invalid toggle field' }); return;
    }

    const existing = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      select: { id: true, [field]: true },
    });
    if (!existing) { res.status(404).json({ error: 'Campaign not found' }); return; }

    const updated = await prisma.campaign.update({
      where: { id: req.params.id },
      data:  { [field]: !(existing as any)[field] },
      select: { id: true, [field]: true },
    });

    res.json({ success: true, [field]: (updated as any)[field] });
  } catch (error) {
    console.error('[Toggle Campaign]', error);
    res.status(500).json({ error: 'Failed to toggle campaign field' });
  }
});

// ==============================================
// ANALYTICS TRACKING
// ==============================================
const VALID_METRICS = new Set(['views', 'generatedDps', 'downloads']);

app.post('/api/analytics/:metric/:campaignId', async (req: Request, res: Response) => {
  try {
    const { metric, campaignId } = req.params;
    if (!VALID_METRICS.has(metric)) { res.status(400).json({ error: 'Invalid metric' }); return; }

    const today = new Date(); today.setUTCHours(0, 0, 0, 0);

    await prisma.analytics.upsert({
      where:  { campaignId_date: { campaignId, date: today } },
      update: { [metric]: { increment: 1 } },
      create: { campaignId, date: today, [metric]: 1 },
    });

    res.json({ success: true });
  } catch {
    // Silently absorb analytics failures — never block user flow
    res.status(200).json({ success: false });
  }
});

// Aggregate analytics for a campaign (owner or admin)
app.get('/api/analytics/campaign/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) { res.status(404).json({ error: 'Campaign not found' }); return; }

    const isOwner = campaign.authorId === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isOwner && !isAdmin) { res.status(403).json({ error: 'Access denied' }); return; }

    const days = parseInt(String(req.query.days || '30'), 10);
    const since = new Date(); since.setDate(since.getDate() - days); since.setUTCHours(0, 0, 0, 0);

    const rows = await prisma.analytics.findMany({
      where: { campaignId: req.params.id, date: { gte: since } },
      orderBy: { date: 'asc' },
    });

    const totals = rows.reduce(
      (acc, r) => ({
        views:       acc.views       + (r.views       || 0),
        generatedDps: acc.generatedDps + (r.generatedDps || 0),
        downloads:   acc.downloads   + (r.downloads   || 0),
      }),
      { views: 0, generatedDps: 0, downloads: 0 }
    );

    res.json({ totals, daily: rows, days });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load campaign analytics' });
  }
});

// Platform-wide admin stats
app.get('/api/analytics/stats', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [totalCampaigns, totalUsers, globalStats] = await Promise.all([
      prisma.campaign.count(),
      prisma.user.count(),
      prisma.analytics.aggregate({
        _sum: { views: true, generatedDps: true, downloads: true },
      }),
    ]);

    res.json({
      totalCampaigns,
      totalUsers,
      totalViews:     globalStats._sum.views       || 0,
      totalGenerated: globalStats._sum.generatedDps || 0,
      totalDownloads: globalStats._sum.downloads    || 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load platform statistics' });
  }
});

// ==============================================
// GLOBAL ERROR HANDLER
// ==============================================
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'File too large. Maximum 10 MB allowed.' }); return;
    }
    res.status(400).json({ error: err.message }); return;
  }

  // JWT errors surfaced from middleware
  if (err.name === 'JsonWebTokenError') {
    res.status(403).json({ error: 'Invalid token' }); return;
  }

  console.error('[Unhandled Error]', err.stack || err.message || err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==============================================
// STATIC FILE SERVING (Production)
// ==============================================
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath, { maxAge: '1y', etag: true }));
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// ==============================================
// SERVER START
// ==============================================
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀  FrameIt API Server`);
    console.log(`    Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`    Port: ${PORT}`);
    console.log(`    Health: http://localhost:${PORT}/api/health\n`);
  });
}

export default app;
