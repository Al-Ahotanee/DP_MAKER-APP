import './index.css';
import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Outlet, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Stage, Layer, Image as KonvaImage, Text, Circle, Group, Rect } from 'react-konva';
import { 
  Layers, Sun, Moon, Search, Calendar, MapPin, Upload, Trash2, 
  Download, LayoutDashboard, Plus, Edit, Save, LogOut, Mail, Lock, 
  User as UserIcon, Loader2, Share2, BarChart3, Eye, Users,
  ChevronRight, Image as ImageIcon, Settings2, Palette, 
  CheckCircle2, GripHorizontal, MessageCircle, Twitter, Facebook, 
  Check, Link as LinkIcon, Sparkles, ArrowLeft
} from 'lucide-react';

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

// ==========================================
// 1. CUSTOM HOOKS & TYPES
// ==========================================
const useImage = (url: string, crossOrigin: string = 'anonymous') => {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);
  useEffect(() => {
    if (!url) { setImage(undefined); return; }
    const img = new window.Image();
    img.onload = () => setImage(img);
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.src = url;
  }, [url, crossOrigin]);
  return [image];
};

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
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>{children}</motion.div>
);

const CampaignCard = ({ campaign }: { campaign: Campaign }) => (
  <Link to={`/c/${campaign.slug}`} className="block group">
    <div className="relative rounded-2xl overflow-hidden glass border border-white/10 hover:-translate-y-1 transition-all shadow-lg hover:shadow-2xl">
      <div className="relative h-40 flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${campaign.themeBg} 0%, ${campaign.themePrimary} 100%)` }}>
        <div className="absolute z-10 text-center">
          <div className="text-2xl font-display font-bold tracking-wider" style={{ color: campaign.themeAccent }}>{campaign.logoText}</div>
          <div className="mt-1 px-4 py-0.5 rounded-full text-xs font-medium border" style={{ color: campaign.themeAccent, borderColor: campaign.themeAccent, background: campaign.themeAccent + '15' }}>{campaign.attendeeLabel}</div>
        </div>
        {campaign.template?.frameUrl && <img src={campaign.template.frameUrl} alt="Frame" className="absolute inset-0 w-full h-full object-contain opacity-40 pointer-events-none" />}
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
// 4. PUBLIC PAGES
// ==========================================
function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { token } = useAppStore();

  useEffect(() => { apiFetch('/campaigns').then(setCampaigns).catch(() => {}); }, []);
  const featured = campaigns.filter(c => c.featured).slice(0, 3);
  
  return (
    <PageTransition>
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/5 to-transparent pointer-events-none" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-amber-400/20 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-8">Create · Share · Celebrate</span>
          <h1 className="font-display text-5xl sm:text-7xl font-bold leading-tight mb-6">Your Event.<br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">Your Face.</span> Instantly.</h1>
          <p className="text-lg text-ink-400 max-w-xl mx-auto mb-10">Generate personalized event DPs, Twibbons, and banners in seconds. High-quality exports ready for social media.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to={token ? "/dashboard/campaigns/new" : "/register"} className="btn-gold w-full sm:w-auto px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 hover:-translate-y-1 transition-transform">
              <Plus size={20} /> Create a Campaign
            </Link>
            <form onSubmit={(e) => { e.preventDefault(); navigate(`/explore?q=${query}`); }} className="relative w-full sm:w-auto">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events..." className="w-full sm:w-80 pl-12 pr-4 py-4 rounded-xl glass border border-white/15 focus:border-amber-400 focus:outline-none text-white text-lg" />
            </form>
          </div>
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
  const { token } = useAppStore();

  useEffect(() => { apiFetch(`/campaigns?search=${encodeURIComponent(query)}`).then(setCampaigns).catch(console.error); }, [query]);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="font-display text-4xl font-bold">Explore Campaigns</h1>
          <Link to={token ? "/dashboard/campaigns/new" : "/register"} className="btn-gold px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-amber-400/20">
            <Plus size={18} /> Create Your Own
          </Link>
        </div>
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
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (slug) {
      apiFetch(`/campaigns/slug/${slug}`).then(setCampaign).catch(console.error);
      apiFetch(`/analytics/views/${campaign?.id || slug}`, { method: 'POST' }).catch(() => {});
    }
  }, [slug]);

  if (!campaign) return <div className="pt-32 text-center text-ink-400">Loading Campaign...</div>;

  const campaignUrl = `${window.location.origin}/c/${campaign.slug}`;

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`🎉 Join me at ${campaign.title}!\n📅 ${campaign.eventDate}\n📍 ${campaign.venue}\n\nCreate your own personalized DP here: ${campaignUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(campaignUrl);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea'); el.value = campaignUrl;
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-16">
        <button onClick={() => navigate('/explore')} className="flex items-center gap-2 text-ink-400 hover:text-amber-400 transition-colors text-sm mb-8"><ArrowLeft size={16} /> Back to Explore</button>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Visual Preview */}
          <div className="relative rounded-3xl overflow-hidden aspect-square shadow-2xl glass border border-white/10" style={{ background: `linear-gradient(135deg, ${campaign.themeBg} 0%, ${campaign.themePrimary} 100%)` }}>
            {campaign.template?.frameUrl ? <img src={campaign.template.frameUrl} alt="Frame" className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center font-display text-3xl opacity-50">No Template Configured</div>}
            {campaign.trending && <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-400 text-xs font-bold tracking-widest uppercase">🔥 Trending</span>}
          </div>

          {/* Campaign Details & Actions */}
          <div className="space-y-6 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: campaign.themePrimary + '40', color: campaign.themeAccent, border: `1px solid ${campaign.themeAccent}40` }}>{campaign.category}</span>
              <span className="text-xs text-ink-400 flex items-center gap-1"><Users size={12}/> {campaign._count?.analytics || 0} Attending</span>
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight text-white">{campaign.title}</h1>
            {campaign.tagline && <p className="text-xl font-display italic text-amber-400">"{campaign.tagline}"</p>}
            <p className="text-ink-400 text-lg leading-relaxed">{campaign.description}</p>
            
            <div className="glass rounded-2xl p-5 space-y-4 border-white/10">
              <div className="flex items-center gap-3 text-ink-200"><Calendar size={20} className="text-amber-400" /> <span className="font-medium">{campaign.eventDate}</span></div>
              <div className="flex items-center gap-3 text-ink-200"><MapPin size={20} className="text-amber-400" /> <span className="font-medium">{campaign.venue}</span></div>
            </div>

            <Link to={`/c/${campaign.slug}/generate`} className="btn-gold w-full py-4 rounded-xl text-center text-lg font-bold shadow-lg shadow-amber-400/20 flex justify-center items-center gap-2"><Sparkles size={20}/> Create My DP Now</Link>
            
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">Invite Friends & Share</p>
              <div className="flex gap-2">
                <button onClick={shareOnWhatsApp} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 transition-all font-medium text-sm"><MessageCircle size={16}/> WhatsApp</button>
                <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass border border-white/10 text-ink-300 hover:text-amber-400 hover:border-amber-400/30 transition-all font-medium text-sm">{copied ? <Check size={16} className="text-green-400"/> : <LinkIcon size={16}/>} {copied ? 'Copied!' : 'Copy Link'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// ==========================================
// 5. THE ENTERPRISE GENERATOR (PHASE 3 & 4)
// ==========================================

// This generates a beautiful, scalable Enterprise SVG background if the user doesn't upload a custom one.
const generatePremiumBannerSvg = (bg: string, primary: string, accent: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8B6508"/>
      <stop offset="25%" stop-color="#FFD700"/>
      <stop offset="50%" stop-color="#FFF8DC"/>
      <stop offset="75%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#8B6508"/>
    </linearGradient>
    <linearGradient id="goldDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#B8860B"/>
      <stop offset="50%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#DAA520"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="15" stdDeviation="15" flood-color="#000" flood-opacity="0.8"/>
    </filter>
    <filter id="glow">
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#FFD700" flood-opacity="0.5"/>
    </filter>
    <mask id="holeMask">
      <rect width="1080" height="1080" fill="white"/>
      <circle cx="340" cy="420" r="260" fill="black"/>
    </mask>
  </defs>
  
  <g mask="url(#holeMask)">
    <rect width="1080" height="1080" fill="url(#bg)"/>
    <path d="M0,0 L500,0 C600,400 800,800 1080,1080 L0,1080 Z" fill="url(#gold)" opacity="0.1"/>
    <path d="M0,0 C400,200 600,600 1080,800 L1080,0 Z" fill="url(#gold)" opacity="0.05"/>
    <path d="M0,300 C400,400 700,700 1080,900" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.3"/>
  </g>
  
  <circle cx="340" cy="420" r="285" fill="${primary}" stroke="url(#goldDark)" stroke-width="25" filter="url(#shadow)"/>
  <circle cx="340" cy="420" r="260" fill="none" stroke="url(#gold)" stroke-width="4"/>
  
  <path d="M30,760 L1050,760 L1080,825 L1050,890 L30,890 L0,825 Z" fill="${primary}" filter="url(#shadow)"/>
  <path d="M35,765 L1045,765 L1070,825 L1045,885 L35,885 L10,825 Z" fill="none" stroke="url(#gold)" stroke-width="4"/>
  
  <path d="M150,730 L930,730 L890,770 L190,770 Z" fill="url(#goldDark)" filter="url(#shadow)"/>
  <path d="M155,735 L925,735 L890,765 L190,765 Z" fill="none" stroke="#FFF" stroke-width="1" opacity="0.5"/>
  
  <circle cx="240" cy="750" r="65" fill="${primary}" stroke="url(#gold)" stroke-width="12" filter="url(#shadow)"/>
  <circle cx="240" cy="750" r="50" fill="none" stroke="url(#goldDark)" stroke-width="3"/>
  <polygon points="240,715 249,738 274,738 253,755 262,780 240,765 218,780 227,755 206,738 231,738" fill="url(#gold)" filter="url(#glow)"/>
  
  <rect x="50" y="940" width="320" height="100" rx="15" fill="${primary}" stroke="url(#gold)" stroke-width="3" filter="url(#shadow)"/>
  <rect x="400" y="940" width="400" height="100" rx="15" fill="${primary}" stroke="url(#gold)" stroke-width="3" filter="url(#shadow)"/>
  
  <rect x="0" y="1065" width="1080" height="15" fill="url(#gold)"/>
</svg>`)}`;

const TEMPLATE_PRESETS = [
  { id: 'royal-emerald', name: 'Royal Emerald', bg: '#061a0d', primary: '#0a3b1c', accent: '#FFD700' },
  { id: 'navy-imperial', name: 'Navy Imperial', bg: '#030814', primary: '#091c3d', accent: '#FFD700' },
  { id: 'crimson-pride', name: 'Crimson Pride', bg: '#1a0404', primary: '#3d0909', accent: '#FFD700' },
];

function Generator() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const stageRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { imageDataUrl, imageX, imageY, imageScale, imageRotation, attendeeName, setCanvasData, resetCanvas } = useAppStore();
  
  const [userImage] = useImage(imageDataUrl || '');
  const [frameImage] = useImage(campaign?.template?.frameUrl || '', 'anonymous');

  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { 
    resetCanvas();
    if (slug) apiFetch(`/campaigns/slug/${slug}`).then(setCampaign).catch(console.error); 
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
    setExporting(true);
    
    try {
      apiFetch(`/analytics/generatedDps/${campaign.id}`, { method: 'POST' }).catch(() => {});
      apiFetch(`/analytics/downloads/${campaign.id}`, { method: 'POST' }).catch(() => {});

      const pixelRatio = campaign.template.exportWidth / stageRef.current.width();
      const dataUrl = stageRef.current.toDataURL({ pixelRatio, mimeType: 'image/png' });
      
      const link = document.createElement('a');
      link.download = `${campaign.slug}-dp.png`;
      link.href = dataUrl;
      link.click();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (e) {
      alert("Failed to export high-definition image. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (!campaign || !campaign.template) return <div className="pt-32 text-center text-ink-400">Loading Premium Generator Engine...</div>;
  
  const tpl = campaign.template;
  const isPreset = !!tpl.frameUrl?.startsWith('data:image/svg');
  const CANVAS_SIZE = 400; 
  const scaleRatio = CANVAS_SIZE / tpl.exportWidth;
  const campaignUrl = `${window.location.origin}/c/${campaign.slug}`;

  const shareOnWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(`I just created my personalized DP for ${campaign.title}!\n\nJoin me and create yours here: ${campaignUrl}`)}`, '_blank'); };
  const shareOnFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignUrl)}`, '_blank', 'width=600,height=400');
  const shareOnTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm attending ${campaign.title}! Get your DP here: ${campaignUrl}`)}`, '_blank', 'width=600,height=400');
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(campaignUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { }
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-24">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(`/c/${campaign.slug}`)} className="flex items-center gap-2 text-ink-400 hover:text-amber-400 transition-colors text-sm"><ArrowLeft size={16} /> Back</button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: campaign.themePrimary + '20', color: campaign.themeAccent, border: `1px solid ${campaign.themeAccent}40` }}>{campaign.attendeeLabel}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
          {/* Left: Canvas Editor */}
          <div className="flex flex-col items-center">
            <div className="relative shadow-2xl rounded-2xl overflow-hidden glass border-4 border-white/10" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, backgroundColor: campaign.themeBg }}>
              <Stage width={CANVAS_SIZE} height={CANVAS_SIZE} ref={stageRef}>
                <Layer>
                  <KonvaImage image={undefined} x={0} y={0} width={CANVAS_SIZE} height={CANVAS_SIZE} fill={campaign.themeBg} />
                  
                  <Group clipFunc={(ctx) => { ctx.arc(tpl.photoX * scaleRatio, tpl.photoY * scaleRatio, tpl.photoRadius * scaleRatio, 0, Math.PI * 2, false); }}>
                    {userImage ? (
                      <KonvaImage image={userImage} x={tpl.photoX * scaleRatio + imageX * scaleRatio} y={tpl.photoY * scaleRatio + imageY * scaleRatio} offsetX={(userImage.width * imageScale * scaleRatio) / 2} offsetY={(userImage.height * imageScale * scaleRatio) / 2} width={userImage.width * imageScale * scaleRatio} height={userImage.height * imageScale * scaleRatio} rotation={imageRotation} draggable onDragMove={(e) => setCanvasData({ imageX: (e.target.x() - tpl.photoX * scaleRatio) / scaleRatio, imageY: (e.target.y() - tpl.photoY * scaleRatio) / scaleRatio })} />
                    ) : <Circle x={tpl.photoX * scaleRatio} y={tpl.photoY * scaleRatio} radius={tpl.photoRadius * scaleRatio} fill={campaign.themePrimary + '80'} />}
                  </Group>
                  
                  {frameImage && <KonvaImage image={frameImage} width={CANVAS_SIZE} height={CANVAS_SIZE} listening={false} />}
                  
                  {/* Dynamic Text Engine for Enterprise Preset */}
                  {isPreset && (
                    <Group>
                      <Text text={campaign.logoText || 'ORGANIZATION'} x={620 * scaleRatio} y={100 * scaleRatio} width={420 * scaleRatio} align="center" fontSize={28 * scaleRatio} fill={campaign.themeAccent} fontFamily="Playfair Display" fontStyle="bold" shadowColor="black" shadowBlur={4} listening={false} />
                      <Text text={(campaign.title || '').toUpperCase()} x={620 * scaleRatio} y={180 * scaleRatio} width={420 * scaleRatio} align="center" fontSize={55 * scaleRatio} fill="#ffffff" fontFamily="Playfair Display" fontStyle="bold" shadowColor="black" shadowBlur={10} shadowOffsetY={5} listening={false} />
                      <Text text={(campaign.tagline || 'REUNION & CELEBRATION').toUpperCase()} x={620 * scaleRatio} y={450 * scaleRatio} width={420 * scaleRatio} align="center" fontSize={24 * scaleRatio} fill={campaign.themeAccent} fontFamily="DM Sans" fontStyle="bold" letterSpacing={3} shadowColor="black" shadowBlur={4} listening={false} />
                      
                      <Text text={`★ ${campaign.attendeeLabel || "I'M ATTENDING"} ★`} x={0} y={742 * scaleRatio} width={1080 * scaleRatio} align="center" fontSize={18 * scaleRatio} fill="#ffffff" fontFamily="DM Sans" fontStyle="bold" letterSpacing={4} shadowColor="black" shadowBlur={4} listening={false}/>
                      
                      <Text text="DATE:" x={80 * scaleRatio} y={960 * scaleRatio} width={260 * scaleRatio} fontSize={16 * scaleRatio} fill={campaign.themeAccent} fontFamily="DM Sans" fontStyle="bold" listening={false} />
                      <Text text={campaign.eventDate} x={80 * scaleRatio} y={990 * scaleRatio} width={260 * scaleRatio} fontSize={22 * scaleRatio} fill="#ffffff" fontFamily="DM Sans" fontStyle="bold" listening={false} />

                      <Text text="VENUE:" x={430 * scaleRatio} y={960 * scaleRatio} width={340 * scaleRatio} fontSize={16 * scaleRatio} fill={campaign.themeAccent} fontFamily="DM Sans" fontStyle="bold" listening={false} />
                      <Text text={campaign.venue} x={430 * scaleRatio} y={990 * scaleRatio} width={340 * scaleRatio} fontSize={22 * scaleRatio} fill="#ffffff" fontFamily="DM Sans" fontStyle="bold" wrap="word" listening={false} />
                    </Group>
                  )}

                  {/* Standard Attendee Name mapped by Template */}
                  {attendeeName && (
                    <Text text={attendeeName.toUpperCase()} x={(tpl.nameX - 500) * scaleRatio} y={tpl.nameY * scaleRatio} width={1000 * scaleRatio} align="center" fontSize={tpl.nameFontSize * scaleRatio} fontFamily={tpl.nameFont} fill={tpl.nameColor} fontStyle="bold" shadowColor="rgba(0,0,0,0.7)" shadowBlur={6} shadowOffsetY={2} listening={false} />
                  )}
                </Layer>
              </Stage>

              {!imageDataUrl && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="text-center p-4 rounded-2xl bg-black/60 backdrop-blur-sm border border-white/20">
                    <Upload size={32} className="mx-auto mb-2 text-white" />
                    <p className="text-sm font-bold text-white uppercase tracking-widest">Upload Photo to Begin</p>
                  </div>
                </div>
              )}
            </div>
            <p className="mt-6 text-xs font-bold text-ink-500 uppercase tracking-widest"><GripHorizontal size={14} className="inline mr-1"/> Drag photo to reposition</p>
          </div>

          {/* Right: Controls */}
          <div className="space-y-6">
            <h2 className="font-display text-3xl font-bold text-white">{campaign.shortTitle}</h2>
            <div className="glass p-6 rounded-2xl space-y-5 border-white/10">
              <label className="block text-xs font-bold text-ink-300 uppercase tracking-wider">Step 1: Your Photo</label>
              <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleUpload} />
              
              {!imageDataUrl ? (
                <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-amber-400/40 bg-amber-400/5 hover:bg-amber-400/10 rounded-xl p-8 text-center cursor-pointer transition-colors">
                  <Upload size={24} className="mx-auto mb-2 text-amber-400" />
                  <p className="text-sm font-bold text-amber-400">Click to upload photo</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => fileRef.current?.click()} className="flex-1 py-2 rounded-lg bg-ink-800 border border-white/10 hover:border-amber-400 text-sm font-medium text-white transition-all">Change Photo</button>
                    <button onClick={() => setCanvasData({ imageDataUrl: null })} className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"><Trash2 size={18}/></button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-ink-400 uppercase tracking-wider"><label>Zoom Level</label><span className="text-amber-400">{(imageScale * 100).toFixed(0)}%</span></div>
                    <input type="range" min="0.1" max="3" step="0.05" value={imageScale} onChange={(e) => setCanvasData({ imageScale: parseFloat(e.target.value) })} className="w-full accent-amber-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-ink-400 uppercase tracking-wider"><label>Rotation</label><span className="text-amber-400">{imageRotation}°</span></div>
                    <input type="range" min="-180" max="180" step="1" value={imageRotation} onChange={(e) => setCanvasData({ imageRotation: parseFloat(e.target.value) })} className="w-full accent-amber-400" />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/10">
                <label className="block text-xs font-bold text-ink-300 uppercase tracking-wider mb-3">Step 2: Your Name</label>
                <input type="text" value={attendeeName} onChange={(e) => setCanvasData({ attendeeName: e.target.value })} maxLength={40} placeholder="Enter your full name" className="w-full px-4 py-3 rounded-xl bg-ink-900 border border-white/10 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 focus:outline-none transition-all" />
              </div>
            </div>

            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-green-500/15 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 size={18} /> Awesome! Your DP has been downloaded.
                </motion.div>
              )}
            </AnimatePresence>

            <div className="glass p-6 rounded-2xl space-y-4 border-white/10 bg-gradient-to-b from-transparent to-amber-400/5">
               <button onClick={handleExport} disabled={!imageDataUrl || exporting} className="btn-gold w-full py-4 rounded-xl text-lg font-bold flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-400/20">
                 {exporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />} 
                 {exporting ? 'Generating HD Image...' : 'Download HD Image'}
               </button>

               <div className="pt-2">
                 <p className="text-xs font-bold text-ink-400 uppercase tracking-widest text-center mb-3">Tell Your Friends</p>
                 <div className="grid grid-cols-4 gap-2">
                   <button onClick={shareOnWhatsApp} className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors"><MessageCircle size={20}/> <span className="text-[10px] font-bold">WhatsApp</span></button>
                   <button onClick={shareOnFacebook} className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] transition-colors"><Facebook size={20}/> <span className="text-[10px] font-bold">Facebook</span></button>
                   <button onClick={shareOnTwitter} className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl glass hover:bg-white/10 text-white transition-colors"><Twitter size={20}/> <span className="text-[10px] font-bold">X (Twitter)</span></button>
                   <button onClick={copyLink} className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl glass hover:bg-white/10 text-amber-400 transition-colors">{copied ? <Check size={20}/> : <LinkIcon size={20}/>} <span className="text-[10px] font-bold">{copied ? 'Copied' : 'Copy Link'}</span></button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// ==========================================
// 6. AUTHENTICATION & DASHBOARD SAAS PAGES
// ==========================================
const AuthLayout = ({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) => (
  <div className="min-h-screen flex bg-ink-950 pt-16">
    <div className="hidden lg:flex flex-1 flex-col justify-center p-16 border-r border-white/10 glass">
      <h1 className="font-display text-5xl font-bold text-white leading-tight mb-6">Empower your<br/>community with<br/><span className="text-amber-400">stunning DPs.</span></h1>
      <p className="text-ink-400 text-lg max-w-md">Join thousands of event organizers creating viral, world-class campaigns for reunions, conferences, and celebrations.</p>
    </div>
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8"><h2 className="font-display text-3xl font-bold text-white mb-2">{title}</h2><p className="text-ink-400">{subtitle}</p></div>
        {children}
      </div>
    </div>
  </div>
);

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAppStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setAuth(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your campaigns">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>}
        <div className="relative"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-xl glass border-white/10 text-white placeholder-ink-600" placeholder="Email Address" /></div>
        <div className="relative"><Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" /><input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-xl glass border-white/10 text-white placeholder-ink-600" placeholder="Password" /></div>
        <button type="submit" disabled={loading} className="w-full btn-gold py-4 rounded-xl font-bold mt-2 disabled:opacity-70">{loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Sign In'}</button>
        <p className="text-center text-sm text-ink-400 mt-6">Don't have an account? <Link to="/register" className="text-amber-400 hover:underline">Create one</Link></p>
      </form>
    </AuthLayout>
  );
}

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAppStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      setAuth(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Create an account" subtitle="Start building viral campaigns today">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>}
        <div className="relative"><UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" /><input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-xl glass border-white/10 text-white placeholder-ink-600" placeholder="Full Name" /></div>
        <div className="relative"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-xl glass border-white/10 text-white placeholder-ink-600" placeholder="Email Address" /></div>
        <div className="relative"><Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" /><input type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={6} className="w-full pl-12 pr-4 py-4 rounded-xl glass border-white/10 text-white placeholder-ink-600" placeholder="Password (Min 6 chars)" /></div>
        <button type="submit" disabled={loading} className="w-full btn-gold py-4 rounded-xl font-bold mt-2 disabled:opacity-70">{loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Create Account'}</button>
        <p className="text-center text-sm text-ink-400 mt-6">Already have an account? <Link to="/login" className="text-amber-400 hover:underline">Sign in</Link></p>
      </form>
    </AuthLayout>
  );
}

function DashboardLayout() {
  const { user, logout, token } = useAppStore();
  const location = useLocation();

  if (!token || !user) return <Navigate to="/login" replace />;

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { path: '/dashboard/campaigns', label: 'My Campaigns', icon: <Layers size={18} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-ink-950 text-white noise-overlay">
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 glass sticky top-0 z-50">
        <Link to="/" className="font-display text-xl font-bold text-white">Frame<span className="text-amber-400">It</span></Link>
        <button onClick={logout} className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg"><LogOut size={20}/></button>
      </div>
      <div className="md:hidden flex overflow-x-auto p-4 gap-2 border-b border-white/10 bg-ink-950">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} className={cn('whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all', location.pathname === item.path ? 'bg-amber-400/10 text-amber-400' : 'text-ink-400 bg-white/5')}>
            {item.icon} {item.label}
          </Link>
        ))}
      </div>
      <aside className="w-64 glass border-r border-white/10 flex-col h-screen sticky top-0 hidden md:flex">
        <div className="p-6 border-b border-white/10"><Link to="/" className="flex items-center gap-2 font-display text-xl font-bold"><Layers className="text-amber-400"/> FrameIt</Link></div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all', location.pathname === item.path ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 'text-ink-400 hover:text-white hover:bg-white/5')}>
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="px-4 py-2 mb-2"><p className="text-sm font-bold text-white truncate">{user?.name || 'Creator'}</p><p className="text-xs text-ink-500 truncate">{user?.email}</p></div>
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10"><LogOut size={18}/> Logout</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  );
}

function DashboardOverview() {
  const { user } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { apiFetch('/me/stats').then(setStats).catch(console.error); }, []);
  const firstName = user?.name ? user.name.split(' ')[0] : 'Creator';

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-8">Welcome back, {firstName}</h1>
      {stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass p-6 rounded-2xl"><div className="text-amber-400 mb-2"><Layers/></div><div className="text-ink-400 mb-1">Total Campaigns</div><div className="text-3xl font-bold">{stats.totalCampaigns}</div></div>
          <div className="glass p-6 rounded-2xl"><div className="text-amber-400 mb-2"><Eye/></div><div className="text-ink-400 mb-1">Total Views</div><div className="text-3xl font-bold">{stats.totalViews}</div></div>
          <div className="glass p-6 rounded-2xl"><div className="text-amber-400 mb-2"><Users/></div><div className="text-ink-400 mb-1">DPs Generated</div><div className="text-3xl font-bold">{stats.totalGenerated}</div></div>
          <div className="glass p-6 rounded-2xl"><div className="text-amber-400 mb-2"><Download/></div><div className="text-ink-400 mb-1">Downloads</div><div className="text-3xl font-bold">{stats.totalDownloads}</div></div>
        </div>
      ) : <div className="text-ink-500">Loading your stats...</div>}
    </div>
  );
}

function DashboardCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  useEffect(() => { apiFetch('/me/campaigns').then(setCampaigns).catch(console.error); }, []);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold">My Campaigns</h1>
        <Link to="/dashboard/campaigns/new" className="btn-gold px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={16}/> New</Link>
      </div>
      <div className="glass rounded-2xl overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-white/5 text-ink-400 text-sm"><tr><th className="p-4">Title</th><th className="p-4">Date</th><th className="p-4">Generations</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead>
          <tbody className="divide-y divide-white/5">
            {campaigns.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-ink-500">You haven't created any campaigns yet.</td></tr> : campaigns.map(c => (
              <tr key={c.id} className="hover:bg-white/5">
                <td className="p-4"><p className="font-medium text-white">{c.title}</p><p className="text-xs text-ink-500">/{c.slug}</p></td>
                <td className="p-4 text-sm text-ink-400">{c.eventDate}</td>
                <td className="p-4 font-bold">{c._count?.analytics || 0}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${c.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{c.isPublished ? 'Active' : 'Draft'}</span></td>
                <td className="p-4 flex gap-2"><Link to={`/dashboard/campaigns/${c.slug}/edit`} className="p-2 bg-ink-800 rounded hover:bg-ink-700 text-amber-400"><Edit size={16}/></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PHASE 3: ENTERPRISE CAMPAIGN WIZARD & TEMPLATE ENGINE
// ----------------------------------------------------

function DashboardCampaignEditor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [campaign, setCampaign] = useState<Partial<Campaign>>({ title: '', slug: '', shortTitle: '', description: '', eventDate: '', venue: '', category: 'General', tagline: '', themePrimary: '#0a3b1c', themeSecondary: '#333333', themeAccent: '#FFD700', themeBg: '#061a0d', themeText: '#ffffff', logoText: '', attendeeLabel: "I'M ATTENDING", isPublished: false });
  // Defaulting to the Royal Emerald layout mapped correctly
  const [template, setTemplate] = useState<Partial<Template>>({ exportWidth: 1080, exportHeight: 1080, photoX: 340, photoY: 420, photoRadius: 260, nameX: 540, nameY: 825, nameFont: 'Playfair Display', nameFontSize: 55, nameColor: '#FFD700', labelX: 540, labelY: 960, labelFont: 'DM Sans', labelFontSize: 22, labelColor: '#FFFFFF', frameUrl: TEMPLATE_PRESETS[0].svg });
  
  const [frameImage] = useImage(template.frameUrl || '', 'anonymous');
  const stageRef = useRef<any>(null);
  const EDITOR_SIZE = 500;
  const ratio = EDITOR_SIZE / (template.exportWidth || 1080);
  const isPreset = !!template.frameUrl?.startsWith('data:image/svg');

  useEffect(() => {
    if (slug && slug !== 'new') {
      apiFetch(`/campaigns/slug/${slug}?preview=true`).then(data => { setCampaign(data); if (data.template) setTemplate(data.template); }).catch(console.error);
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
    } catch (err) { alert('Upload failed. Ensure image is under 10MB.'); } finally { setUploading(false); }
  };

  const handlePresetSelect = (preset: typeof TEMPLATE_PRESETS[0]) => {
    setTemplate(prev => ({ ...prev, frameUrl: preset.svg, nameColor: preset.accent, photoX: 340, photoY: 420, photoRadius: 260, nameX: 540, nameY: 825, nameFontSize: 55 }));
    setCampaign(prev => ({ ...prev, themePrimary: preset.primary, themeBg: preset.bg, themeAccent: preset.accent }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...campaign, template: template.frameUrl ? template : undefined };
      const method = campaign.id ? 'PUT' : 'POST';
      const path = campaign.id ? `/campaigns/${campaign.id}` : '/campaigns';
      await apiFetch(path, { method, body: JSON.stringify(payload) });
      navigate('/dashboard/campaigns');
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-4 md:p-8 pb-32 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">{campaign.id ? 'Edit Campaign' : 'Create Campaign'}</h1>
          <div className="flex items-center gap-2 text-sm font-medium">
            {[ { num: 1, title: 'Details' }, { num: 2, title: 'Template' }, { num: 3, title: 'Review' } ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div onClick={() => setStep(s.num)} className={`flex items-center gap-2 cursor-pointer transition-colors ${step === s.num ? 'text-amber-400' : step > s.num ? 'text-green-400' : 'text-ink-500'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${step === s.num ? 'border-amber-400 bg-amber-400/10' : step > s.num ? 'border-green-400 bg-green-400/10' : 'border-ink-600'}`}>{step > s.num ? <CheckCircle2 size={12}/> : s.num}</div>
                  <span className="hidden sm:block">{s.title}</span>
                </div>
                {idx < 2 && <div className="w-8 h-px bg-ink-700" />}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          {step > 1 && <button onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-xl glass text-sm hover:text-white transition-all">Back</button>}
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="btn-gold px-6 py-2 rounded-xl text-sm flex items-center gap-2">Next <ChevronRight size={16}/></button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="btn-gold px-6 py-2 rounded-xl text-sm flex items-center gap-2">{saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Publish</button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass p-6 md:p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-2 text-xl font-bold border-b border-white/10 pb-4"><Settings2 className="text-amber-400"/> General Information</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2"><label className="text-xs font-semibold text-ink-400 uppercase">Event Title</label><input type="text" value={campaign.title} onChange={e => setCampaign({...campaign, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})} className="w-full bg-ink-900 mt-1 p-3 rounded-xl border border-white/10 focus:border-amber-400" placeholder="e.g. Government Secondary School Reunion" /></div>
              <div><label className="text-xs font-semibold text-ink-400 uppercase">Organization / Logo Text</label><input type="text" value={campaign.logoText} onChange={e => setCampaign({...campaign, logoText: e.target.value})} className="w-full bg-ink-900 mt-1 p-3 rounded-xl border border-white/10 focus:border-amber-400" placeholder="e.g. GSS AUJARA" /></div>
              <div><label className="text-xs font-semibold text-ink-400 uppercase">Tagline / Subtitle</label><input type="text" value={campaign.tagline} onChange={e => setCampaign({...campaign, tagline: e.target.value})} className="w-full bg-ink-900 mt-1 p-3 rounded-xl border border-white/10 focus:border-amber-400" placeholder="e.g. OLD BOYS REUNION" /></div>
              <div><label className="text-xs font-semibold text-ink-400 uppercase">Public URL Slug</label><div className="flex mt-1"><span className="bg-ink-900 border border-r-0 border-white/10 text-ink-500 px-3 py-3 rounded-l-xl text-sm hidden sm:block">frameit.app/c/</span><input type="text" value={campaign.slug} onChange={e => setCampaign({...campaign, slug: e.target.value})} className="w-full bg-ink-900 p-3 rounded-r-xl border border-white/10 focus:border-amber-400" /></div></div>
              <div><label className="text-xs font-semibold text-ink-400 uppercase">Short Name (For Mobile)</label><input type="text" value={campaign.shortTitle} onChange={e => setCampaign({...campaign, shortTitle: e.target.value})} className="w-full bg-ink-900 mt-1 p-3 rounded-xl border border-white/10 focus:border-amber-400" /></div>
              <div className="col-span-1 md:col-span-2"><label className="text-xs font-semibold text-ink-400 uppercase">Description</label><textarea rows={3} value={campaign.description} onChange={e => setCampaign({...campaign, description: e.target.value})} className="w-full bg-ink-900 mt-1 p-3 rounded-xl border border-white/10 focus:border-amber-400" placeholder="Tell attendees what this event is about..." /></div>
              <div><label className="text-xs font-semibold text-ink-400 uppercase">Date</label><input type="text" value={campaign.eventDate} onChange={e => setCampaign({...campaign, eventDate: e.target.value})} className="w-full bg-ink-900 mt-1 p-3 rounded-xl border border-white/10 focus:border-amber-400" placeholder="e.g. SUNDAY, MAY 31ST 2026" /></div>
              <div><label className="text-xs font-semibold text-ink-400 uppercase">Venue</label><input type="text" value={campaign.venue} onChange={e => setCampaign({...campaign, venue: e.target.value})} className="w-full bg-ink-900 mt-1 p-3 rounded-xl border border-white/10 focus:border-amber-400" placeholder="e.g. Government Secondary School Aujara" /></div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-8">
            <div className="space-y-6">
              <div className="glass p-6 rounded-2xl">
                <h3 className="font-bold mb-4 flex items-center gap-2"><ImageIcon size={18} className="text-amber-400"/> Template Library</h3>
                
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3">Enterprise Presets</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {TEMPLATE_PRESETS.map(preset => (
                    <div key={preset.id} onClick={() => handlePresetSelect(preset)} className="cursor-pointer group">
                      <div className="aspect-square rounded-lg border border-white/10 overflow-hidden mb-1 group-hover:border-amber-400 transition-colors" style={{ background: preset.bg }}>
                        <img src={preset.svg} alt={preset.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-center text-ink-300 group-hover:text-amber-400">{preset.name}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3 border-t border-white/10 pt-4">Or Upload Custom</p>
                <label className="block w-full text-center border-2 border-dashed border-amber-400/40 bg-amber-400/5 hover:bg-amber-400/10 transition-colors rounded-xl p-4 cursor-pointer">
                  {uploading ? <Loader2 className="mx-auto animate-spin text-amber-400 mb-2"/> : <Upload className="mx-auto text-amber-400 mb-2" size={24}/>}
                  <span className="text-sm font-bold text-amber-400">{uploading ? 'Uploading HD...' : 'Upload Custom Frame'}</span>
                  <p className="text-xs text-ink-400 mt-1">Transparent PNG up to 10MB</p>
                  <input type="file" accept="image/png" className="hidden" onChange={handleFrameUpload} disabled={uploading}/>
                </label>
              </div>

              {!isPreset && (
                <div className="glass p-6 rounded-2xl">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Palette size={18} className="text-amber-400"/> Custom Styling</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center"><label className="text-xs text-ink-300">Name Color</label><input type="color" value={template.nameColor} onChange={e => setTemplate({...template, nameColor: e.target.value})} className="w-8 h-8 rounded border border-white/10 bg-transparent" /></div>
                    <div className="flex justify-between items-center"><label className="text-xs text-ink-300">Brand Primary</label><input type="color" value={campaign.themePrimary} onChange={e => setCampaign({...campaign, themePrimary: e.target.value})} className="w-8 h-8 rounded border border-white/10 bg-transparent" /></div>
                    <div className="flex justify-between items-center"><label className="text-xs text-ink-300">Background</label><input type="color" value={campaign.themeBg} onChange={e => setCampaign({...campaign, themeBg: e.target.value})} className="w-8 h-8 rounded border border-white/10 bg-transparent" /></div>
                  </div>
                </div>
              )}
            </div>

            <div className="glass p-6 rounded-2xl flex flex-col items-center overflow-hidden">
              <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-4 border-b border-white/10 pb-4 gap-4">
                <div><h3 className="font-bold text-lg">Visual Template Engine</h3><p className="text-xs text-ink-400">Preview exactly how the attendee's banner will look.</p></div>
                <div className="flex items-center gap-4">
                   <div className="text-right"><p className="text-xs text-ink-400">Hole Radius</p><input type="range" min="150" max="450" value={template.photoRadius} onChange={e => setTemplate({...template, photoRadius: Number(e.target.value)})} className="w-24 accent-amber-400"/></div>
                   <div className="text-right"><p className="text-xs text-ink-400">Font Size</p><input type="range" min="20" max="100" value={template.nameFontSize} onChange={e => setTemplate({...template, nameFontSize: Number(e.target.value)})} className="w-24 accent-amber-400"/></div>
                </div>
              </div>

              <div className="bg-ink-950 border border-ink-800 rounded-2xl p-4 overflow-x-auto shadow-inner flex items-center justify-center bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/O1gwx8EKGQZQAwgZcjTjSDAAxEQAMhUDAfEGB3YAAAAASUVORK5CYII=')]">
                <div style={{ width: EDITOR_SIZE, height: EDITOR_SIZE, backgroundColor: campaign.themeBg, minWidth: EDITOR_SIZE }} className="relative shadow-2xl shrink-0">
                  <Stage width={EDITOR_SIZE} height={EDITOR_SIZE} ref={stageRef}>
                    <Layer>
                      {frameImage ? <KonvaImage image={frameImage} width={EDITOR_SIZE} height={EDITOR_SIZE} listening={false} /> : <Rect width={EDITOR_SIZE} height={EDITOR_SIZE} fill="transparent" />}
                      
                      <Group x={(template.photoX || 340) * ratio} y={(template.photoY || 420) * ratio} draggable onDragMove={(e) => setTemplate({ ...template, photoX: e.target.x() / ratio, photoY: e.target.y() / ratio })}>
                        <Circle x={0} y={0} radius={(template.photoRadius || 260) * ratio} fill="rgba(0, 0, 0, 0.5)" stroke="#FFD600" strokeWidth={2} dash={[5, 5]} />
                        <Circle x={0} y={0} radius={6} fill="#FFD600" />
                        <Text text="✛ DRAG PHOTO HOLE" x={-65} y={-10} fill="#FFD600" fontStyle="bold" fontSize={12} listening={false} />
                      </Group>

                      {isPreset && (
                        <Group>
                          <Text text={campaign.logoText || 'ORGANIZATION'} x={620 * ratio} y={120 * ratio} width={420 * ratio} align="center" fontSize={28 * ratio} fill={campaign.themeAccent} fontFamily="Playfair Display" fontStyle="bold" shadowColor="black" shadowBlur={4} listening={false} />
                          <Text text={(campaign.title || 'EVENT NAME').toUpperCase()} x={620 * ratio} y={180 * ratio} width={420 * ratio} align="center" fontSize={55 * ratio} fill="#ffffff" fontFamily="Playfair Display" fontStyle="bold" shadowColor="black" shadowBlur={10} shadowOffsetY={5} listening={false} />
                          <Text text={(campaign.tagline || 'REUNION 2026').toUpperCase()} x={620 * ratio} y={450 * ratio} width={420 * ratio} align="center" fontSize={24 * ratio} fill={campaign.themeAccent} fontFamily="DM Sans" fontStyle="bold" letterSpacing={3} shadowColor="black" shadowBlur={4} listening={false} />
                          <Text text={`★ ${campaign.attendeeLabel || "I'M ATTENDING"} ★`} x={0} y={742 * ratio} width={1080 * ratio} align="center" fontSize={18 * ratio} fill="#ffffff" fontFamily="DM Sans" fontStyle="bold" letterSpacing={4} shadowColor="black" shadowBlur={4} listening={false}/>
                          <Text text="DATE:" x={80 * ratio} y={960 * ratio} width={260 * ratio} fontSize={16 * ratio} fill={campaign.themeAccent} fontFamily="DM Sans" fontStyle="bold" listening={false} />
                          <Text text={campaign.eventDate || 'May 31st'} x={80 * ratio} y={990 * ratio} width={260 * ratio} fontSize={22 * ratio} fill="#ffffff" fontFamily="DM Sans" fontStyle="bold" listening={false} />
                          <Text text="VENUE:" x={430 * ratio} y={960 * ratio} width={340 * ratio} fontSize={16 * ratio} fill={campaign.themeAccent} fontFamily="DM Sans" fontStyle="bold" listening={false} />
                          <Text text={campaign.venue || 'Event Location'} x={430 * ratio} y={990 * ratio} width={340 * ratio} fontSize={22 * ratio} fill="#ffffff" fontFamily="DM Sans" fontStyle="bold" wrap="word" listening={false} />
                        </Group>
                      )}

                      <Group x={(template.nameX || 540) * ratio} y={(template.nameY || 825) * ratio} draggable onDragMove={(e) => setTemplate({ ...template, nameX: e.target.x() / ratio, nameY: e.target.y() / ratio })}>
                        <Rect x={-200} y={-20} width={400} height={40} stroke="#00E5FF" strokeWidth={1} dash={[4, 4]} opacity={0.5} />
                        <Text text="ATTENDEE NAME" x={-200} y={0} width={400} align="center" fontSize={(template.nameFontSize || 55) * ratio} fontFamily={template.nameFont} fill={template.nameColor} fontStyle="bold" shadowColor="black" shadowBlur={4} />
                        <Circle x={0} y={0} radius={4} fill="#00E5FF" />
                      </Group>
                    </Layer>
                  </Stage>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass p-8 rounded-2xl text-center max-w-2xl mx-auto space-y-6">
             <div className="w-20 h-20 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-2"><CheckCircle2 size={40}/></div>
             <h2 className="font-display text-3xl font-bold">Ready to Publish?</h2>
             <p className="text-ink-400">Your campaign <strong className="text-white">{campaign.title}</strong> is fully configured and ready for the world.</p>
             
             <div className="bg-ink-900 border border-white/10 rounded-xl p-4 text-left max-w-sm mx-auto my-6 overflow-hidden">
                <div className="flex justify-between mb-2"><span className="text-ink-500 text-sm">Public URL</span><span className="text-amber-400 text-sm truncate max-w-[200px]">/c/{campaign.slug}</span></div>
                <div className="flex justify-between mb-2"><span className="text-ink-500 text-sm">Theme</span><div className="flex gap-1"><div className="w-4 h-4 rounded-sm" style={{background: campaign.themePrimary}}/><div className="w-4 h-4 rounded-sm" style={{background: campaign.themeAccent}}/></div></div>
                <div className="flex justify-between"><span className="text-ink-500 text-sm">Template</span><span className="text-white text-sm">{template.frameUrl ? 'HD Graphic Loaded' : 'Missing'}</span></div>
             </div>

             <div className="flex items-center justify-center gap-3 bg-amber-400/10 border border-amber-400/20 p-4 rounded-xl cursor-pointer" onClick={() => setCampaign({...campaign, isPublished: !campaign.isPublished})}>
                <input type="checkbox" checked={campaign.isPublished} readOnly className="w-5 h-5 accent-amber-400 pointer-events-none" /> 
                <label className="font-bold text-amber-400 cursor-pointer">Make this campaign Live and Public</label>
             </div>

             <button onClick={handleSave} disabled={saving} className="btn-gold w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 mt-4">{saving ? <Loader2 className="animate-spin"/> : <Save/>} Save & Launch Campaign</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 7. MAIN LAYOUT & ROUTING
// ==========================================
function Layout() {
  const { darkMode, toggleTheme, token } = useAppStore();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 glass border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold"><Layers className="text-amber-400" /> Frame<span className="text-amber-400">It</span></Link>
          <nav className="hidden md:flex gap-6 font-medium text-sm text-ink-300">
            <Link to="/" className="hover:text-amber-400 transition-colors">Home</Link>
            <Link to="/explore" className="hover:text-amber-400 transition-colors">Explore</Link>
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white/10 text-ink-300">{darkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
            {token ? (
               <Link to="/dashboard" className="hidden sm:flex items-center gap-2 btn-gold px-4 py-2 rounded-xl text-sm"><LayoutDashboard size={16}/> Dashboard</Link>
            ) : (
               <div className="hidden sm:flex items-center gap-2">
                 <Link to="/login" className="text-ink-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors">Sign In</Link>
                 <Link to="/register" className="btn-gold px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-amber-400/20">Get Started</Link>
               </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 pt-16"><Outlet /></main>
      <footer className="border-t border-white/10 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-ink-500">
          <p>© {new Date().getFullYear()} FrameIt Platform. All rights reserved.</p>
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="campaigns" element={<DashboardCampaigns />} />
            <Route path="campaigns/:slug/edit" element={<DashboardCampaignEditor />} />
            <Route path="campaigns/new" element={<DashboardCampaignEditor />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}

const rootElement = document.getElementById('root');
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  if (localStorage.getItem('eventdp-storage')?.includes('"darkMode":true')) {
    document.documentElement.classList.add('dark');
  } else if (!localStorage.getItem('eventdp-storage')) {
    document.documentElement.classList.add('dark');
  }
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
