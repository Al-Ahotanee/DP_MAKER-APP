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
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod';

// --- CONFIGURATIONS ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer config (Memory storage for streaming to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for HD graphics
});

// --- MIDDLEWARES ---
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, 
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', apiLimiter);

interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
};

// ==========================================
// API ROUTES
// ==========================================

// --- AUTHENTICATION ---
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, adminCode } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = (adminCode && adminCode === process.env.ADMIN_SETUP_CODE) ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role },
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});


// --- CREATOR DASHBOARD ENDPOINTS ---
app.get('/api/me/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userCampaigns = await prisma.campaign.findMany({ where: { authorId: userId }, select: { id: true } });
    const campaignIds = userCampaigns.map(c => c.id);

    const stats = await prisma.analytics.aggregate({
      where: { campaignId: { in: campaignIds } },
      _sum: { views: true, generatedDps: true, downloads: true }
    });
    
    res.json({
      totalCampaigns: userCampaigns.length,
      totalViews: stats._sum.views || 0,
      totalGenerated: stats._sum.generatedDps || 0,
      totalDownloads: stats._sum.downloads || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load user stats' });
  }
});

app.get('/api/me/campaigns', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { authorId: req.user!.id },
      include: { _count: { select: { analytics: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your campaigns' });
  }
});

// --- UPLOADS (Cloudinary Integration) ---
// ANY Authenticated user can upload a custom frame now
app.post('/api/upload', authenticateToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'eventdp_frames', format: 'png' },
      (error, result) => {
        if (error) return res.status(500).json({ error: 'Cloudinary upload failed' });
        res.json({ url: result?.secure_url });
      }
    );
    uploadStream.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// --- CAMPAIGNS (Public & SaaS Ownership) ---
app.get('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const { search, category, featured, trending } = req.query;
    const whereClause: any = { isPublished: true };
    if (search) whereClause.title = { contains: String(search), mode: 'insensitive' };
    if (category) whereClause.category = String(category);
    if (featured === 'true') whereClause.featured = true;
    if (trending === 'true') whereClause.trending = true;

    const campaigns = await prisma.campaign.findMany({
      where: whereClause,
      include: { _count: { select: { analytics: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

app.get('/api/campaigns/slug/:slug', async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { slug: req.params.slug },
      include: { template: true }
    });
    if (!campaign || (!campaign.isPublished && !req.query.preview)) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create new campaign (Any Authenticated User)
app.post('/api/campaigns', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { template, ...campaignData } = req.body;
    const campaign = await prisma.campaign.create({
      data: {
        ...campaignData,
        authorId: req.user!.id,
        template: template ? { create: template } : undefined
      },
      include: { template: true }
    });
    res.status(201).json(campaign);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Slug already exists' });
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update campaign (Must own the campaign)
app.put('/api/campaigns/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Campaign not found' });
    if (existing.authorId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to edit this campaign' });
    }

    const { template, ...campaignData } = req.body;
    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: {
        ...campaignData,
        template: template ? { upsert: { create: template, update: template } } : undefined
      },
      include: { template: true }
    });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete campaign (Must own the campaign)
app.delete('/api/campaigns/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Campaign not found' });
    if (existing.authorId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to delete this campaign' });
    }

    await prisma.campaign.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// --- ANALYTICS TRACKING ---
app.post('/api/analytics/:metric/:campaignId', async (req: Request, res: Response) => {
  try {
    const { metric, campaignId } = req.params;
    if (!['views', 'generatedDps', 'downloads'].includes(metric)) return res.status(400).json({ error: 'Invalid metric' });
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    await prisma.analytics.upsert({
      where: { campaignId_date: { campaignId, date: today } },
      update: { [metric]: { increment: 1 } },
      create: { campaignId, date: today, [metric]: 1 }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(200).json({ success: false, error: 'Tracking failed' });
  }
});

// Admin Global Stats
app.get('/api/analytics/stats', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [totalCampaigns, totalUsers, globalStats] = await Promise.all([
      prisma.campaign.count(), prisma.user.count(), prisma.analytics.aggregate({ _sum: { views: true, generatedDps: true, downloads: true } })
    ]);
    res.json({ totalCampaigns, totalUsers, totalViews: globalStats._sum.views || 0, totalGenerated: globalStats._sum.generatedDps || 0, totalDownloads: globalStats._sum.downloads || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// --- ERROR HANDLING & START ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  app.use(express.static(path.join(process.cwd(), 'dist')));
  app.get('*', (req, res) => { if (!req.path.startsWith('/api')) { res.sendFile(path.join(process.cwd(), 'dist', 'index.html')); } });
}

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 EventDP Platform Server running on port ${PORT}`));
} else if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`🚀 EventDP Platform Server running on port ${PORT}`));
}
export default app;
