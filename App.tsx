
import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Outlet, Navigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Stage, Layer, Image as KonvaImage, Text, Circle, Group, Transformer } from 'react-konva';
import useImage from 'use-image';
import { 
  Home, Compass, Layers, Sun, Moon, Search, ArrowRight, ArrowLeft, Heart, 
  Share2, Calendar, MapPin, Users, Upload, RotateCw, RotateCcw, ZoomIn, ZoomOut,
  RefreshCw, Check, Download, Twitter, Facebook, MessageCircle, Settings, 
  BarChart, LayoutDashboard, Plus, Trash2, Edit, Save, Lock, LogOut
} from 'lucide-react';
import Konva from 'konva';

// ==========================================
// 1. GLOBAL TYPES & STORE
// ==========================================
type User = { id: string; email: string; name: string; role: 'USER' | 'ADMIN' };
type Template = { 
  id: string; frameUrl: string; exportWidth: number; exportHeight: number;
  photoX: number; photoY: number; photoRadius: number;
  nameX: number; nameY: number; nameFont: string; nameFontSize: number; nameColor: string;
  labelX: number; labelY: number; labelFont: string; labelFontSize: number; labelColor: string;
};
type Campaign = {
  id: string; slug: string; title: string; shortTitle: string; description: string;
  eventDate: string; venue: string; category: string; tagline: string;
  themePrimary: string; themeSecondary: string; themeAccent: string; themeText: string; themeBg: string;
  logoText: string; attendeeLabel: string; tags: string[]; featured: boolean; trending: boolean; isPublished: boolean;
  template?: Template; _count?: { analytics: number };
};

interface AppState {
  token: string | null; user: User | null; darkMode: boolean;
  setAuth: (token: string, user: User) => void; logout: () => void; toggleTheme: () => void;
  // Canvas State
  imageDataUrl: string | null; imageX: number; imageY: number; imageScale: number; imageRotation: number; attendeeName: string;
  setCanvasData: (data: Partial<AppState>) => void; resetCanvas: () => void;
}

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      token: null, user: null, darkMode: true,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      toggleTheme: () => {
        const next = !get().darkMode;
        document.documentElement.classList.toggle('dark', next);
        set({ darkMode: next });
      },
      imageDataUrl: null, imageX: 0, imageY: 0, imageScale: 1, imageRotation: 0, attendeeName: '',
      setCanvasData: (data) => set((s) => ({ ...s, ...data })),
      resetCanvas: () => set({ imageDataUrl: null, imageX: 0, imageY: 0, imageScale: 1, imageRotation: 0, attendeeName: '' }),
    }),
    { name: 'eventdp-storage', partialize: (s) => ({ token: s.token, user: s.user, darkMode: s.darkMode }) }
  )
);

// ==========================================
// 2. API SERVICE WRAPPER
// ==========================================
const API_URL = '/api';
async function apiFetch(path: string, options: RequestInit = {}) {
  const token = useAppStore.getState().token;
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'API Request Failed');
  return data;
}

// ==========================================
// 3. SHARED COMPONENTS
// ==========================================
const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
    {children}
  </motion.div>
);

const CampaignCard = ({ campaign }: { campaign: Campaign }) => (
  <Link to={`/c/${campaign.slug}`} className="block group">
    <div className="relative rounded-2xl overflow-hidden glass border border-white/10 hover:-translate-y-1 transition-all shadow-lg hover:shadow-2xl">
      <div className="relative h-40 flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${campaign.themeBg} 0%, ${campaign.themePrimary} 100%)` }}>
        <div className="absolute z-10 text-center">
          <div className="text-2xl font-display font-bold tracking-wider" style={{ color: campaign.themeAccent }}>{campaign.logoText}</div>
          <div className="mt-1 px-4 py-0.5 rounded-full text-xs font-medium border"
            style={{ color: campaign.themeAccent, borderColor: campaign.themeAccent, background: campaign.themeAccent + '15' }}>
            {campaign.attendeeLabel}
          </div>
        </div>
        {campaign.template?.frameUrl && (
          <img src={campaign.template.frameUrl} alt="Frame" className="absolute inset-0 w-full h-full object-contain opacity-40 pointer-events-none" />
        )}
      </div>
      <div className="p-4 bg-ink-900/50">
        <h3 className="font-display font-semibold text-ink-100 group-hover:text-amber-400 transition-colors line-clamp-2 mb-2">{campaign.title}</h3>
        <div className="flex flex-col gap-1 text-xs text-ink-400">
          <div className="flex items-center gap-1.5"><Calendar size={11} className="text-amber-400/70" /><span>{campaign.eventDate}</span></div>
          <div className="flex items-center gap-1.5"><MapPin size={11} className="text-amber-400/70" /><span>{campaign.venue}</span></div>
        </div>
      </div>
    </div>
  </Link>
);

// ==========================================
// 4. PUBLIC PAGES & ENGINE
// ==========================================
function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => { apiFetch('/campaigns').then(setCampaigns).catch(console.error); }, []);

  const featured = campaigns.filter(c => c.featured).slice(0, 3);
  const trending = campaigns.filter(c => c.trending).slice(0, 4);

  return (
    <PageTransition>
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/5 to-transparent pointer-events-none" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-amber-400/20 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-8">
            Create · Share · Celebrate
          </span>
          <h1 className="font-display text-5xl sm:text-7xl font-bold leading-tight mb-6">
            Your Event.<br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">Your Face.</span> Instantly.
          </h1>
          <p className="text-lg text-ink-400 max-w-xl mx-auto mb-10">
            Generate personalized event DPs, Twibbons, and banners in seconds. High-quality exports ready for social media.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); navigate(`/explore?q=${query}`); }} className="relative max-w-lg mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events..."
              className="w-full pl-12 pr-32 py-4 rounded-2xl glass border border-white/15 focus:border-amber-400 focus:outline-none text-ink-100" />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-gold px-5 py-2 rounded-xl text-sm">Explore</button>
          </form>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-white/10">
          <div className="flex justify-between items-end mb-8">
            <div><h2 className="font-display text-3xl font-bold">Featured Events</h2></div>
            <Link to="/explore" className="text-amber-400 text-sm font-medium hover:underline">View all &rarr;</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map(c => <CampaignCard key={c.id} campaign={c} />)}
          </div>
        </section>
      )}
    </PageTransition>
  );
}

function Explore() {
  const [params] = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const query = params.get('q') || '';

  useEffect(() => { 
    apiFetch(`/campaigns?search=${encodeURIComponent(query)}`).then(setCampaigns).catch(console.error); 
  }, [query]);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 py-24">
        <h1 className="font-display text-4xl font-bold mb-8">Explore Campaigns</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
          {campaigns.length === 0 && <p className="text-ink-400 col-span-full">No campaigns found.</p>}
        </div>
      </div>
    </PageTransition>
  );
}

function CampaignView() {
  const { slug } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    if (slug) {
      apiFetch(`/campaigns/${slug}`).then(setCampaign).catch(console.error);
      apiFetch(`/analytics/views/${campaign?.id || slug}`, { method: 'POST' }).catch(() => {}); // track view silently
    }
  }, [slug]);

  if (!campaign) return <div className="pt-32 text-center text-ink-400">Loading...</div>;

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-24 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="relative rounded-3xl overflow-hidden aspect-square shadow-2xl glass border border-white/10"
             style={{ background: `linear-gradient(135deg, ${campaign.themeBg} 0%, ${campaign.themePrimary} 100%)` }}>
          {campaign.template?.frameUrl ? (
            <img src={campaign.template.frameUrl} alt="Frame" className="w-full h-full object-contain" />
          ) : (
             <div className="w-full h-full flex items-center justify-center font-display text-3xl opacity-50">No Template</div>
          )}
        </div>
        <div className="space-y-6 flex flex-col justify-center">
          <span className="px-3 py-1 rounded-full text-xs font-semibold border"
            style={{ borderColor: campaign.themeAccent, color: campaign.themeAccent }}>{campaign.category}</span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight">{campaign.title}</h1>
          <p className="text-ink-400 text-lg">{campaign.description}</p>
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3 text-ink-200"><Calendar size={18} className="text-amber-400" /> {campaign.eventDate}</div>
            <div className="flex items-center gap-3 text-ink-200"><MapPin size={18} className="text-amber-400" /> {campaign.venue}</div>
          </div>
          <Link to={`/c/${campaign.slug}/generate`} className="btn-gold w-full py-4 rounded-xl text-center text-lg font-bold shadow-lg shadow-amber-400/20">
            Create My DP Now
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}

// THE CORE DP GENERATOR ENGINE
function Generator() {
  const { slug } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { imageDataUrl, imageX, imageY, imageScale, imageRotation, attendeeName, setCanvasData } = useAppStore();
  
  // Load Images via useImage hook
  const [userImage] = useImage(imageDataUrl || '');
  const [frameImage] = useImage(campaign?.template?.frameUrl || '', 'anonymous');

  useEffect(() => {
    if (slug) apiFetch(`/campaigns/${slug}`).then(setCampaign).catch(console.error);
  }, [slug]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCanvasData({ imageDataUrl: ev.target?.result as string, imageX: 0, imageY: 0, imageScale: 1, imageRotation: 0 });
    reader.readAsDataURL(file);
  };

  const handleExport = async () => {
    if (!stageRef.current || !campaign?.template) return;
    apiFetch(`/analytics/generatedDps/${campaign.id}`, { method: 'POST' }).catch(() => {});
    
    // Scale up for HD export
    const originalWidth = stageRef.current.width();
    const exportWidth = campaign.template.exportWidth;
    const pixelRatio = exportWidth / originalWidth;
    
    const dataUrl = stageRef.current.toDataURL({ pixelRatio, mimeType: 'image/png' });
    const link = document.createElement('a');
    link.download = `${campaign.slug}-dp.png`;
    link.href = dataUrl;
    link.click();
    apiFetch(`/analytics/downloads/${campaign.id}`, { method: 'POST' }).catch(() => {});
  };

  if (!campaign || !campaign.template) return <div className="pt-32 text-center">Loading DP Engine...</div>;

  const tpl = campaign.template;
  const CANVAS_SIZE = 400; // Fixed preview size, scales on export
  const scaleRatio = CANVAS_SIZE / tpl.exportWidth;

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Canvas Viewer */}
        <div className="flex flex-col items-center">
          <div className="relative shadow-2xl rounded-2xl overflow-hidden glass border-4 border-white/5" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, background: campaign.themeBg }}>
            <Stage width={CANVAS_SIZE} height={CANVAS_SIZE} ref={stageRef}>
              <Layer>
                {/* Background Color Base */}
                <KonvaImage image={undefined} x={0} y={0} width={CANVAS_SIZE} height={CANVAS_SIZE} fill={campaign.themeBg} />
                
                {/* Photo Clipping Mask */}
                <Group clipFunc={(ctx) => { ctx.arc(tpl.photoX * scaleRatio, tpl.photoY * scaleRatio, tpl.photoRadius * scaleRatio, 0, Math.PI * 2, false); }}>
                  {userImage && (
                    <KonvaImage 
                      image={userImage}
                      x={tpl.photoX * scaleRatio + imageX * scaleRatio}
                      y={tpl.photoY * scaleRatio + imageY * scaleRatio}
                      offsetX={(userImage.width * imageScale * scaleRatio) / 2}
                      offsetY={(userImage.height * imageScale * scaleRatio) / 2}
                      width={userImage.width * imageScale * scaleRatio}
                      height={userImage.height * imageScale * scaleRatio}
                      rotation={imageRotation}
                      draggable
                      onDragMove={(e) => setCanvasData({ imageX: (e.target.x() - tpl.photoX * scaleRatio) / scaleRatio, imageY: (e.target.y() - tpl.photoY * scaleRatio) / scaleRatio })}
                    />
                  )}
                  {!userImage && (
                    <Circle x={tpl.photoX * scaleRatio} y={tpl.photoY * scaleRatio} radius={tpl.photoRadius * scaleRatio} fill={campaign.themePrimary + '50'} />
                  )}
                </Group>

                {/* Overlay Frame */}
                {frameImage && <KonvaImage image={frameImage} width={CANVAS_SIZE} height={CANVAS_SIZE} listening={false} />}

                {/* Name Overlay */}
                {attendeeName && (
                  <Text 
                    text={attendeeName.toUpperCase()} x={(tpl.nameX - 500) * scaleRatio} y={tpl.nameY * scaleRatio}
                    width={1000 * scaleRatio} align="center" fontSize={tpl.nameFontSize * scaleRatio}
                    fontFamily={tpl.nameFont} fill={tpl.nameColor} fontStyle="bold"
                    shadowColor="rgba(0,0,0,0.5)" shadowBlur={4} shadowOffsetY={2} listening={false}
                  />
                )}
              </Layer>
            </Stage>
          </div>
          <p className="mt-4 text-xs text-ink-500">Drag photo to reposition inside the frame</p>
        </div>

        {/* Right: Controls */}
        <div className="space-y-6">
          <h2 className="font-display text-3xl font-bold">{campaign.shortTitle}</h2>
          
          <div className="glass p-5 rounded-2xl space-y-4">
            <label className="block text-xs font-semibold text-ink-300 uppercase">Your Photo</label>
            <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleUpload} />
            {!imageDataUrl ? (
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-ink-600 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400/50 transition-colors">
                <Upload size={24} className="mx-auto mb-2 text-ink-400" />
                <p className="text-sm font-medium">Click to upload photo</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => fileRef.current?.click()} className="flex-1 py-2 rounded-lg bg-ink-800 border border-ink-600 text-sm hover:bg-ink-700">Change Photo</button>
                  <button onClick={() => setCanvasData({ imageDataUrl: null })} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"><Trash2 size={18}/></button>
                </div>
                
                {/* Zoom & Rotate Controls */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-ink-400"><label>Zoom</label><span>{(imageScale * 100).toFixed(0)}%</span></div>
                  <input type="range" min="0.1" max="3" step="0.05" value={imageScale} onChange={(e) => setCanvasData({ imageScale: parseFloat(e.target.value) })} className="w-full accent-amber-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-ink-400"><label>Rotation</label><span>{imageRotation}°</span></div>
                  <input type="range" min="-180" max="180" step="1" value={imageRotation} onChange={(e) => setCanvasData({ imageRotation: parseFloat(e.target.value) })} className="w-full accent-amber-400" />
                </div>
              </div>
            )}
          </div>

          <div className="glass p-5 rounded-2xl space-y-4">
            <label className="block text-xs font-semibold text-ink-300 uppercase">Your Name</label>
            <input type="text" value={attendeeName} onChange={(e) => setCanvasData({ attendeeName: e.target.value })} maxLength={40} placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-xl bg-ink-800 border border-ink-600 focus:border-amber-400 focus:outline-none" />
          </div>

          <button onClick={handleExport} disabled={!imageDataUrl} className="btn-gold w-full py-4 rounded-xl text-lg font-bold flex justify-center items-center gap-2 disabled:opacity-50">
            <Download size={20} /> Download HD Image
          </button>
        </div>
      </div>
    </PageTransition>
  );
}

// ==========================================
// 5. ADMIN DASHBOARD & EDITOR
// ==========================================
function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setAuth } = useAppStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setAuth(data.token, data.user);
      navigate('/admin/dashboard');
    } catch (err: any) { setError(err.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass p-8 rounded-2xl w-full max-w-md">
        <h2 className="font-display text-3xl font-bold mb-6 text-center">Admin Login</h2>
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="block text-sm text-ink-400 mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-ink-800 border border-ink-600 focus:border-amber-400" required /></div>
          <div><label className="block text-sm text-ink-400 mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-ink-800 border border-ink-600 focus:border-amber-400" required /></div>
          <button type="submit" className="btn-gold w-full py-3 rounded-xl font-bold">Login</button>
        </form>
      </div>
    </div>
  );
}

function AdminLayout() {
  const { user, logout } = useAppStore();
  if (!user || user.role !== 'ADMIN') return <Navigate to="/admin/login" />;

  return (
    <div className="min-h-screen flex bg-ink-950">
      {/* Sidebar */}
      <div className="w-64 glass border-r border-white/10 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold"><Layers className="text-amber-400"/> EventDP <span className="text-xs text-ink-500 bg-ink-800 px-2 py-0.5 rounded">ADMIN</span></Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-ink-300 hover:bg-white/5 hover:text-white"><LayoutDashboard size={18}/> Dashboard</Link>
          <Link to="/admin/campaigns" className="flex items-center gap-3 px-4 py-3 rounded-xl text-ink-300 hover:bg-white/5 hover:text-white"><Layers size={18}/> Campaigns</Link>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10"><LogOut size={18}/> Logout</button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-auto"><Outlet /></div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { apiFetch('/analytics/stats').then(setStats).catch(console.error); }, []);

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-bold mb-8">Dashboard Overview</h1>
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass p-6 rounded-2xl"><div className="text-ink-400 mb-2">Total Campaigns</div><div className="text-3xl font-bold">{stats.totalCampaigns}</div></div>
          <div className="glass p-6 rounded-2xl"><div className="text-ink-400 mb-2">Total Views</div><div className="text-3xl font-bold">{stats.totalViews}</div></div>
          <div className="glass p-6 rounded-2xl"><div className="text-ink-400 mb-2">DPs Generated</div><div className="text-3xl font-bold">{stats.totalGenerated}</div></div>
          <div className="glass p-6 rounded-2xl"><div className="text-ink-400 mb-2">Total Downloads</div><div className="text-3xl font-bold">{stats.totalDownloads}</div></div>
        </div>
      ) : <div>Loading stats...</div>}
    </div>
  );
}

function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  useEffect(() => { apiFetch('/campaigns').then(setCampaigns).catch(console.error); }, []); // Need admin route to see all, but reusing public for brevity. Assume backend handles auth.

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-3xl font-bold">Manage Campaigns</h1>
        <Link to="/admin/campaigns/new" className="btn-gold px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={16}/> New Campaign</Link>
      </div>
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-ink-400 text-sm"><tr><th className="p-4">Title</th><th className="p-4">Date</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead>
          <tbody className="divide-y divide-white/5">
            {campaigns.map(c => (
              <tr key={c.id} className="hover:bg-white/5">
                <td className="p-4 font-medium">{c.title}</td><td className="p-4 text-ink-400">{c.eventDate}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${c.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{c.isPublished ? 'Published' : 'Draft'}</span></td>
                <td className="p-4 flex gap-2">
                  <Link to={`/admin/campaigns/${c.slug}/edit`} className="p-2 bg-ink-800 rounded hover:bg-ink-700"><Edit size={16}/></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// THE VISUAL DRAG-AND-DROP TEMPLATE EDITOR
function AdminCampaignEditor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Partial<Campaign>>({ title: '', slug: '', shortTitle: '', description: '', eventDate: '', venue: '', category: 'General', tagline: '', themePrimary: '#000000', themeSecondary: '#333333', themeAccent: '#fbbf24', themeBg: '#ffffff', themeText: '#ffffff', logoText: '', attendeeLabel: "I'M ATTENDING", isPublished: false });
  const [template, setTemplate] = useState<Partial<Template>>({ exportWidth: 1080, exportHeight: 1080, photoX: 540, photoY: 490, photoRadius: 340, nameX: 540, nameY: 900, nameFont: 'Playfair Display', nameFontSize: 42, nameColor: '#FFD600', labelX: 540, labelY: 960, labelFont: 'DM Sans', labelFontSize: 22, labelColor: '#FFFFFF', frameUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [frameImage] = useImage(template.frameUrl || '', 'anonymous');
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    if (slug && slug !== 'new') {
      apiFetch(`/campaigns/${slug}?preview=true`).then(data => { setCampaign(data); if (data.template) setTemplate(data.template); }).catch(console.error);
    }
  }, [slug]);

  const handleFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData(); formData.append('file', file);
    try {
      const data = await apiFetch('/upload', { method: 'POST', body: formData });
      setTemplate(prev => ({ ...prev, frameUrl: data.url }));
    } catch (err) { alert('Upload failed'); } finally { setUploading(false); }
  };

  const handleSave = async () => {
    try {
      const payload = { ...campaign, template: template.frameUrl ? template : undefined };
      const method = campaign.id ? 'PUT' : 'POST';
      const path = campaign.id ? `/campaigns/${campaign.id}` : '/campaigns';
      await apiFetch(path, { method, body: JSON.stringify(payload) });
      navigate('/admin/campaigns');
    } catch (err: any) { alert(err.message); }
  };

  const EDITOR_SIZE = 400;
  const ratio = EDITOR_SIZE / (template.exportWidth || 1080);

  return (
    <div className="p-8 pb-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-3xl font-bold">{campaign.id ? 'Edit Campaign' : 'Create Campaign'}</h1>
        <button onClick={handleSave} className="btn-gold px-6 py-2 rounded-xl flex items-center gap-2"><Save size={18}/> Save Campaign</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Details */}
        <div className="glass p-6 rounded-2xl space-y-4">
          <h2 className="text-xl font-bold border-b border-white/10 pb-2">Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-ink-400">Title</label><input type="text" value={campaign.title} onChange={e => setCampaign({...campaign, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})} className="w-full bg-ink-800 p-2 rounded border border-ink-600" /></div>
            <div><label className="text-xs text-ink-400">Slug</label><input type="text" value={campaign.slug} onChange={e => setCampaign({...campaign, slug: e.target.value})} className="w-full bg-ink-800 p-2 rounded border border-ink-600" /></div>
            <div><label className="text-xs text-ink-400">Short Title</label><input type="text" value={campaign.shortTitle} onChange={e => setCampaign({...campaign, shortTitle: e.target.value})} className="w-full bg-ink-800 p-2 rounded border border-ink-600" /></div>
            <div><label className="text-xs text-ink-400">Category</label><input type="text" value={campaign.category} onChange={e => setCampaign({...campaign, category: e.target.value})} className="w-full bg-ink-800 p-2 rounded border border-ink-600" /></div>
            <div><label className="text-xs text-ink-400">Event Date</label><input type="text" value={campaign.eventDate} onChange={e => setCampaign({...campaign, eventDate: e.target.value})} className="w-full bg-ink-800 p-2 rounded border border-ink-600" /></div>
            <div><label className="text-xs text-ink-400">Venue</label><input type="text" value={campaign.venue} onChange={e => setCampaign({...campaign, venue: e.target.value})} className="w-full bg-ink-800 p-2 rounded border border-ink-600" /></div>
          </div>
          <h2 className="text-xl font-bold border-b border-white/10 pb-2 pt-4">Theme & Text</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-xs text-ink-400">Primary Color</label><input type="color" value={campaign.themePrimary} onChange={e => setCampaign({...campaign, themePrimary: e.target.value})} className="w-full h-10 bg-ink-800 rounded border border-ink-600" /></div>
            <div><label className="text-xs text-ink-400">Accent Color</label><input type="color" value={campaign.themeAccent} onChange={e => setCampaign({...campaign, themeAccent: e.target.value})} className="w-full h-10 bg-ink-800 rounded border border-ink-600" /></div>
            <div><label className="text-xs text-ink-400">Bg Color</label><input type="color" value={campaign.themeBg} onChange={e => setCampaign({...campaign, themeBg: e.target.value})} className="w-full h-10 bg-ink-800 rounded border border-ink-600" /></div>
            <div><label className="text-xs text-ink-400">Logo Text</label><input type="text" value={campaign.logoText} onChange={e => setCampaign({...campaign, logoText: e.target.value})} className="w-full bg-ink-800 p-2 rounded border border-ink-600" /></div>
            <div><label className="text-xs text-ink-400">Attendee Label</label><input type="text" value={campaign.attendeeLabel} onChange={e => setCampaign({...campaign, attendeeLabel: e.target.value})} className="w-full bg-ink-800 p-2 rounded border border-ink-600" /></div>
            <div className="flex items-center gap-2 pt-6"><input type="checkbox" checked={campaign.isPublished} onChange={e => setCampaign({...campaign, isPublished: e.target.checked})} /> <label className="text-sm">Published</label></div>
          </div>
        </div>

        {/* Visual Template Editor */}
        <div className="glass p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <h2 className="text-xl font-bold">Visual Template Editor</h2>
            <label className="btn-gold px-3 py-1 text-xs rounded-lg cursor-pointer">
              {uploading ? 'Uploading...' : 'Upload Frame PNG'}
              <input type="file" accept="image/png" className="hidden" onChange={handleFrameUpload} disabled={uploading}/>
            </label>
          </div>
          
          <p className="text-xs text-ink-400">Drag the red circle to position the photo area. Drag the text to position the name.</p>
          
          <div className="flex justify-center bg-ink-900 border border-ink-700 rounded-xl p-4 overflow-hidden">
            <div style={{ width: EDITOR_SIZE, height: EDITOR_SIZE, backgroundColor: campaign.themeBg }} className="relative border border-white/10">
              <Stage width={EDITOR_SIZE} height={EDITOR_SIZE} ref={stageRef}>
                <Layer>
                  {/* Visualizer Frame Base */}
                  {frameImage && <KonvaImage image={frameImage} width={EDITOR_SIZE} height={EDITOR_SIZE} opacity={0.5} listening={false} />}
                  
                  {/* Photo Drag Zone */}
                  <Circle 
                    x={(template.photoX || 540) * ratio} y={(template.photoY || 490) * ratio} radius={(template.photoRadius || 340) * ratio} 
                    fill="rgba(239, 68, 68, 0.4)" stroke="red" strokeWidth={2} draggable
                    onDragMove={(e) => setTemplate({ ...template, photoX: e.target.x() / ratio, photoY: e.target.y() / ratio })}
                  />
                  <Text text="PHOTO HOLE (DRAG)" x={(template.photoX || 540) * ratio - 50} y={(template.photoY || 490) * ratio - 10} fill="white" listening={false} />

                  {/* Name Drag Zone */}
                  <Text 
                    text="ATTENDEE NAME" x={(template.nameX || 540) * ratio - 100} y={(template.nameY || 900) * ratio} 
                    fontSize={(template.nameFontSize || 42) * ratio} fontFamily={template.nameFont} fill={template.nameColor}
                    draggable fontStyle="bold" shadowColor="black" shadowBlur={4}
                    onDragMove={(e) => setTemplate({ ...template, nameX: (e.target.x() + 100) / ratio, nameY: e.target.y() / ratio })}
                  />
                </Layer>
              </Stage>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-xs text-ink-400">Photo Radius</label><input type="number" value={template.photoRadius} onChange={e => setTemplate({...template, photoRadius: Number(e.target.value)})} className="w-full bg-ink-800 p-2 rounded border border-ink-600" /></div>
            <div><label className="text-xs text-ink-400">Name Font Size</label><input type="number" value={template.nameFontSize} onChange={e => setTemplate({...template, nameFontSize: Number(e.target.value)})} className="w-full bg-ink-800 p-2 rounded border border-ink-600" /></div>
            <div><label className="text-xs text-ink-400">Name Color</label><input type="color" value={template.nameColor} onChange={e => setTemplate({...template, nameColor: e.target.value})} className="w-full h-10 bg-ink-800 rounded border border-ink-600" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. MAIN LAYOUT & ROUTING
// ==========================================
function Layout() {
  const { darkMode, toggleTheme } = useAppStore();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 glass border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <Layers className="text-amber-400" /> Event<span className="text-amber-400">DP</span>
          </Link>
          <nav className="hidden md:flex gap-6 font-medium text-sm text-ink-300">
            <Link to="/" className="hover:text-amber-400 transition-colors">Home</Link>
            <Link to="/explore" className="hover:text-amber-400 transition-colors">Explore</Link>
          </nav>
          <div className="flex gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white/10 text-ink-300">{darkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
            <Link to="/explore" className="btn-gold px-4 py-2 rounded-xl text-sm hidden sm:block">Find Event</Link>
          </div>
        </div>
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t border-white/10 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-ink-500">
          <p>© {new Date().getFullYear()} EventDP Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="explore" element={<Explore />} />
            <Route path="c/:slug" element={<CampaignView />} />
            <Route path="c/:slug/generate" element={<Generator />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="campaigns" element={<AdminCampaigns />} />
            <Route path="campaigns/:slug/edit" element={<AdminCampaignEditor />} />
            <Route path="campaigns/new" element={<AdminCampaignEditor />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}

// React Entry Point Binding
const rootElement = document.getElementById('root');
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  
  // Theme init fallback
  if (localStorage.getItem('eventdp-storage')?.includes('"darkMode":true')) {
    document.documentElement.classList.add('dark');
  } else if (!localStorage.getItem('eventdp-storage')) {
    document.documentElement.classList.add('dark'); // Default
  }

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
