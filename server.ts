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

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Increased to 15MB to support heavy cinematic transparent frames
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, 
});

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, 
  message: 'Too many requests from this IP.',
});
app.use('/api/', apiLimiter);

interface AuthRequest extends Request { user?: { id: string; role: string }; }

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
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin privileges required' });
  next();
};

// ==========================================
// 1. AUTHENTICATION
// ==========================================
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, adminCode } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = (adminCode && adminCode === process.env.ADMIN_SETUP_CODE) ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({ data: { email, password: hashedPassword, name, role } });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) { res.status(500).json({ error: 'Failed to register' }); }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) { res.status(500).json({ error: 'Failed to login' }); }
});

// ==========================================
// 2. CREATOR DASHBOARD
// ==========================================
app.get('/api/me/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userCampaigns = await prisma.campaign.findMany({ where: { authorId: req.user!.id }, select: { id: true } });
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
  } catch (error) { res.status(500).json({ error: 'Failed to load stats' }); }
});

app.get('/api/me/campaigns', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { authorId: req.user!.id },
      include: { _count: { select: { analytics: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(campaigns);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch campaigns' }); }
});

// ==========================================
// 3. CAMPAIGNS & UPLOADS
// ==========================================
// Removed requireAdmin so ANY creator can upload HD frames for their campaigns
app.post('/api/upload', authenticateToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'eventdp_frames', format: 'png', quality: 'auto:best' },
      (error, result) => {
        if (error) return res.status(500).json({ error: 'Upload failed' });
        res.json({ url: result?.secure_url });
      }
    );
    uploadStream.end(req.file.buffer);
  } catch (error) { res.status(500).json({ error: 'Upload failed' }); }
});

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
  } catch (error) { res.status(500).json({ error: 'Failed to fetch campaigns' }); }
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
  } catch (error) { res.status(500).json({ error: 'Failed to fetch campaign' }); }
});

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

app.put('/api/campaigns/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Campaign not found' });
    
    // SECURE OWNERSHIP CHECK
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
  } catch (error) { res.status(500).json({ error: 'Failed to update campaign' }); }
});

// ==========================================
// 4. ANALYTICS
// ==========================================
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
  } catch (error) { res.status(200).json({ success: false }); }
});

if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  app.use(express.static(path.join(process.cwd(), 'dist')));
  app.get('*', (req, res) => { if (!req.path.startsWith('/api')) { res.sendFile(path.join(process.cwd(), 'dist', 'index.html')); } });
}

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 API running on ${PORT}`));
} else if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`🚀 API running on ${PORT}`));
}
export default app;
