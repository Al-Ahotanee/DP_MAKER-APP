import './index.css';
import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter, Routes, Route, Link, useNavigate, useParams,
  Outlet, Navigate, useSearchParams, useLocation,
} from 'react-router-dom';
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
  Check, Link as LinkIcon, Sparkles, ArrowLeft, Star, Shield, Zap,
} from 'lucide-react';

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(' ');

// ==========================================
// CUSTOM IMAGE HOOK
// ==========================================
const useImage = (url: string, crossOrigin = 'anonymous') => {
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

// ==========================================
// TYPES
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
  imageDataUrl: string | null; imageX: number; imageY: number; imageScale: number;
  imageRotation: number; attendeeName: string;
  setCanvasData: (data: Partial<AppState>) => void; resetCanvas: () => void;
}

// ==========================================
// STORE
// ==========================================
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
// API WRAPPER
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
// ██████╗  █████╗ ███╗   ██╗███╗   ██╗███████╗██████╗ 
// ██╔══██╗██╔══██╗████╗  ██║████╗  ██║██╔════╝██╔══██╗
// ██████╔╝███████║██╔██╗ ██║██╔██╗ ██║█████╗  ██████╔╝
// ██╔══██╗██╔══██║██║╚██╗██║██║╚██╗██║██╔══╝  ██╔══██╗
// ██████╔╝██║  ██║██║ ╚████║██║ ╚████║███████╗██║  ██║
// ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝
// PREMIUM SVG BANNER TEMPLATE SYSTEM
// ==========================================

const enc = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// ------------------------------------------
// TEMPLATE 1 — ROYAL EMERALD GOLD
// Deep forest green · Metallic gold · Classic prestige
// ------------------------------------------
const makeSvgEmeraldGold = () => enc(`<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="bg" cx="58%" cy="38%" r="82%"><stop offset="0%" stop-color="#0f4229"/><stop offset="60%" stop-color="#071c10"/><stop offset="100%" stop-color="#020c06"/></radialGradient>
<linearGradient id="gH" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#4A3208"/><stop offset="18%" stop-color="#B8922A"/><stop offset="38%" stop-color="#F5E27A"/><stop offset="50%" stop-color="#FFFACC"/><stop offset="62%" stop-color="#F5E27A"/><stop offset="82%" stop-color="#B8922A"/><stop offset="100%" stop-color="#4A3208"/></linearGradient>
<linearGradient id="gV" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4A3208"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#4A3208"/></linearGradient>
<linearGradient id="rp" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0b2e16" stop-opacity="0.97"/><stop offset="100%" stop-color="#020d07" stop-opacity="0.97"/></linearGradient>
<linearGradient id="bann" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0d3b1c"/><stop offset="100%" stop-color="#030e07"/></linearGradient>
<filter id="gw" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="sh"><feDropShadow dx="0" dy="14" stdDeviation="22" flood-color="#000" flood-opacity="0.9"/></filter>
<filter id="sh2"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.7"/></filter>
<mask id="m"><rect width="1080" height="1080" fill="white"/><circle cx="340" cy="420" r="267" fill="black"/></mask>
</defs>
<g mask="url(#m)">
<rect width="1080" height="1080" fill="url(#bg)"/>
<path d="M820,0 L1080,0 L1080,560 Z" fill="#1d6b3d" opacity="0.11"/>
<path d="M640,0 L1080,440" stroke="#C9A96E" stroke-width="1.2" opacity="0.09"/>
<path d="M700,0 L1080,380" stroke="#C9A96E" stroke-width="0.6" opacity="0.06"/>
<ellipse cx="870" cy="250" rx="290" ry="340" fill="#134829" opacity="0.16"/>
<path d="M0,870 L1080,710 L1080,1080 L0,1080 Z" fill="#010b04" opacity="0.82"/>
<g fill="#D4AF37" opacity="0.075">
<circle cx="700" cy="62" r="4.5"/><circle cx="744" cy="62" r="4.5"/><circle cx="788" cy="62" r="4.5"/><circle cx="832" cy="62" r="4.5"/><circle cx="876" cy="62" r="4.5"/><circle cx="920" cy="62" r="4.5"/><circle cx="964" cy="62" r="4.5"/><circle cx="1008" cy="62" r="4.5"/>
<circle cx="722" cy="106" r="4.5"/><circle cx="766" cy="106" r="4.5"/><circle cx="810" cy="106" r="4.5"/><circle cx="854" cy="106" r="4.5"/><circle cx="898" cy="106" r="4.5"/><circle cx="942" cy="106" r="4.5"/><circle cx="986" cy="106" r="4.5"/>
<circle cx="700" cy="150" r="4.5"/><circle cx="744" cy="150" r="4.5"/><circle cx="788" cy="150" r="4.5"/><circle cx="832" cy="150" r="4.5"/><circle cx="876" cy="150" r="4.5"/><circle cx="920" cy="150" r="4.5"/>
<circle cx="722" cy="194" r="4.5"/><circle cx="766" cy="194" r="4.5"/><circle cx="810" cy="194" r="4.5"/><circle cx="854" cy="194" r="4.5"/><circle cx="898" cy="194" r="4.5"/>
</g>
</g>
<rect x="0" y="0" width="1080" height="12" fill="url(#gH)"/>
<rect x="0" y="1068" width="1080" height="12" fill="url(#gH)"/>
<rect x="0" y="0" width="12" height="1080" fill="url(#gV)"/>
<rect x="1068" y="0" width="12" height="1080" fill="url(#gV)"/>
<rect x="12" y="12" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="12" y="12" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<rect x="988" y="12" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="1065" y="12" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<rect x="12" y="1065" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="12" y="988" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<rect x="988" y="1065" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="1065" y="988" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<polygon points="12,12 50,12 12,50" fill="#D4AF37" opacity="0.6"/>
<polygon points="1068,12 1030,12 1068,50" fill="#D4AF37" opacity="0.6"/>
<polygon points="12,1068 50,1068 12,1030" fill="#D4AF37" opacity="0.6"/>
<polygon points="1068,1068 1030,1068 1068,1030" fill="#D4AF37" opacity="0.6"/>
<circle cx="340" cy="420" r="312" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.14"/>
<circle cx="340" cy="420" r="301" fill="none" stroke="#D4AF37" stroke-width="1.5" opacity="0.22"/>
<circle cx="340" cy="420" r="290" fill="none" stroke="url(#gH)" stroke-width="14"/>
<circle cx="340" cy="420" r="276" fill="none" stroke="#D4AF37" stroke-width="3" opacity="0.45"/>
<circle cx="340" cy="420" r="270" fill="none" stroke="#FFFACC" stroke-width="1.2" opacity="0.28"/>
<circle cx="340" cy="118" r="13" fill="#D4AF37" filter="url(#gw)"/>
<circle cx="340" cy="722" r="13" fill="#D4AF37" filter="url(#gw)"/>
<circle cx="38" cy="420" r="13" fill="#D4AF37" filter="url(#gw)"/>
<circle cx="642" cy="420" r="13" fill="#D4AF37" filter="url(#gw)"/>
<polygon points="340,98 358,118 340,138 322,118" fill="#FFD700"/>
<polygon points="340,702 358,722 340,742 322,722" fill="#FFD700"/>
<polygon points="18,420 38,404 58,420 38,436" fill="#FFD700"/>
<polygon points="622,420 642,404 662,420 642,436" fill="#FFD700"/>
<rect x="644" y="48" width="424" height="667" rx="15" fill="url(#rp)" filter="url(#sh)"/>
<rect x="644" y="48" width="424" height="667" rx="15" fill="none" stroke="url(#gH)" stroke-width="2.5"/>
<rect x="644" y="48" width="424" height="8" rx="4" fill="url(#gH)"/>
<rect x="644" y="707" width="424" height="8" rx="4" fill="url(#gH)"/>
<line x1="675" y1="174" x2="1038" y2="174" stroke="#D4AF37" stroke-width="1.5" opacity="0.28"/>
<line x1="675" y1="462" x2="1038" y2="462" stroke="#D4AF37" stroke-width="1.5" opacity="0.28"/>
<line x1="675" y1="610" x2="1038" y2="610" stroke="#D4AF37" stroke-width="0.8" opacity="0.18"/>
<g transform="translate(856,106)" filter="url(#gw)">
<circle r="40" fill="none" stroke="#D4AF37" stroke-width="1.5" opacity="0.32"/>
<polygon points="0,-30 8,-11 29,-11 14,2 19,24 0,13 -19,24 -14,2 -29,-11 -8,-11" fill="#D4AF37"/>
<polygon points="0,-20 5.5,-8 20,-8 10,1.5 13.5,16 0,9 -13.5,16 -10,1.5 -20,-8 -5.5,-8" fill="#FFFACC" opacity="0.38"/>
</g>
<rect x="0" y="742" width="1080" height="5" fill="url(#gH)"/>
<rect x="0" y="747" width="1080" height="154" fill="url(#bann)"/>
<rect x="0" y="901" width="1080" height="5" fill="url(#gH)"/>
<line x1="60" y1="786" x2="1020" y2="786" stroke="#D4AF37" stroke-width="1" opacity="0.16"/>
<line x1="60" y1="882" x2="1020" y2="882" stroke="#D4AF37" stroke-width="1" opacity="0.16"/>
<rect x="372" y="722" width="336" height="36" rx="18" fill="#071c10" filter="url(#sh2)"/>
<rect x="372" y="722" width="336" height="36" rx="18" fill="none" stroke="#D4AF37" stroke-width="2.2"/>
<polygon points="55,824 76,808 76,840" fill="#D4AF37" opacity="0.58"/>
<polygon points="1025,824 1004,808 1004,840" fill="#D4AF37" opacity="0.58"/>
<line x1="86" y1="824" x2="148" y2="824" stroke="#D4AF37" stroke-width="1.8" opacity="0.32"/>
<line x1="932" y1="824" x2="994" y2="824" stroke="#D4AF37" stroke-width="1.8" opacity="0.32"/>
<rect x="0" y="910" width="1080" height="170" fill="#010c05" opacity="0.98"/>
<rect x="0" y="910" width="1080" height="3" fill="url(#gH)"/>
<rect x="28" y="926" width="330" height="136" rx="13" fill="#0b2e16" opacity="0.88"/>
<rect x="28" y="926" width="330" height="136" rx="13" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.68"/>
<rect x="28" y="926" width="330" height="7" rx="3.5" fill="#D4AF37"/>
<rect x="382" y="926" width="670" height="136" rx="13" fill="#0b2e16" opacity="0.88"/>
<rect x="382" y="926" width="670" height="136" rx="13" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.68"/>
<rect x="382" y="926" width="670" height="7" rx="3.5" fill="#D4AF37"/>
<rect x="0" y="1063" width="1080" height="17" fill="url(#gH)"/>
</svg>`);

// ------------------------------------------
// TEMPLATE 2 — NAVY IMPERIAL
// Midnight navy · Imperial gold · Heraldic prestige
// ------------------------------------------
const makeSvgNavyImperial = () => enc(`<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="bg" cx="55%" cy="38%" r="80%"><stop offset="0%" stop-color="#0a1e45"/><stop offset="62%" stop-color="#040d20"/><stop offset="100%" stop-color="#010508"/></radialGradient>
<linearGradient id="gH" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#4A3208"/><stop offset="20%" stop-color="#B8922A"/><stop offset="40%" stop-color="#F5E27A"/><stop offset="50%" stop-color="#FFFACC"/><stop offset="60%" stop-color="#F5E27A"/><stop offset="80%" stop-color="#B8922A"/><stop offset="100%" stop-color="#4A3208"/></linearGradient>
<linearGradient id="gV" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4A3208"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#4A3208"/></linearGradient>
<linearGradient id="rp" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0a1e45" stop-opacity="0.97"/><stop offset="100%" stop-color="#020814" stop-opacity="0.97"/></linearGradient>
<linearGradient id="bann" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0d2248"/><stop offset="100%" stop-color="#02060f"/></linearGradient>
<filter id="gw" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="sh"><feDropShadow dx="0" dy="14" stdDeviation="22" flood-color="#000" flood-opacity="0.9"/></filter>
<filter id="sh2"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.7"/></filter>
<mask id="m"><rect width="1080" height="1080" fill="white"/><circle cx="340" cy="420" r="267" fill="black"/></mask>
</defs>
<g mask="url(#m)">
<rect width="1080" height="1080" fill="url(#bg)"/>
<path d="M760,0 L1080,0 L1080,520 Z" fill="#1a3e8a" opacity="0.12"/>
<ellipse cx="850" cy="270" rx="280" ry="330" fill="#0e2458" opacity="0.18"/>
<path d="M0,880 L1080,720 L1080,1080 L0,1080 Z" fill="#010409" opacity="0.85"/>
<path d="M648,0 L1080,432" stroke="#C9A96E" stroke-width="1.2" opacity="0.09"/>
<path d="M705,0 L1080,375" stroke="#C9A96E" stroke-width="0.6" opacity="0.06"/>
<g fill="#D4AF37" opacity="0.07">
<circle cx="700" cy="62" r="4.5"/><circle cx="744" cy="62" r="4.5"/><circle cx="788" cy="62" r="4.5"/><circle cx="832" cy="62" r="4.5"/><circle cx="876" cy="62" r="4.5"/><circle cx="920" cy="62" r="4.5"/><circle cx="964" cy="62" r="4.5"/><circle cx="1008" cy="62" r="4.5"/>
<circle cx="722" cy="106" r="4.5"/><circle cx="766" cy="106" r="4.5"/><circle cx="810" cy="106" r="4.5"/><circle cx="854" cy="106" r="4.5"/><circle cx="898" cy="106" r="4.5"/><circle cx="942" cy="106" r="4.5"/>
<circle cx="700" cy="150" r="4.5"/><circle cx="744" cy="150" r="4.5"/><circle cx="788" cy="150" r="4.5"/><circle cx="832" cy="150" r="4.5"/><circle cx="876" cy="150" r="4.5"/>
</g>
<!-- Heraldic chevron dividers in right area -->
<path d="M660,640 L860,620 L1060,640" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.14"/>
<path d="M660,650 L860,630 L1060,650" fill="none" stroke="#D4AF37" stroke-width="0.5" opacity="0.09"/>
</g>
<rect x="0" y="0" width="1080" height="12" fill="url(#gH)"/>
<rect x="0" y="1068" width="1080" height="12" fill="url(#gH)"/>
<rect x="0" y="0" width="12" height="1080" fill="url(#gV)"/>
<rect x="1068" y="0" width="12" height="1080" fill="url(#gV)"/>
<rect x="12" y="12" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="12" y="12" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<rect x="988" y="12" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="1065" y="12" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<rect x="12" y="1065" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="12" y="988" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<rect x="988" y="1065" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="1065" y="988" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<polygon points="12,12 50,12 12,50" fill="#D4AF37" opacity="0.6"/>
<polygon points="1068,12 1030,12 1068,50" fill="#D4AF37" opacity="0.6"/>
<polygon points="12,1068 50,1068 12,1030" fill="#D4AF37" opacity="0.6"/>
<polygon points="1068,1068 1030,1068 1068,1030" fill="#D4AF37" opacity="0.6"/>
<circle cx="340" cy="420" r="312" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.14"/>
<circle cx="340" cy="420" r="301" fill="none" stroke="#D4AF37" stroke-width="1.5" opacity="0.22"/>
<circle cx="340" cy="420" r="290" fill="none" stroke="url(#gH)" stroke-width="14"/>
<circle cx="340" cy="420" r="276" fill="none" stroke="#D4AF37" stroke-width="3" opacity="0.45"/>
<circle cx="340" cy="420" r="270" fill="none" stroke="#FFFACC" stroke-width="1.2" opacity="0.28"/>
<circle cx="340" cy="118" r="13" fill="#D4AF37" filter="url(#gw)"/>
<circle cx="340" cy="722" r="13" fill="#D4AF37" filter="url(#gw)"/>
<circle cx="38" cy="420" r="13" fill="#D4AF37" filter="url(#gw)"/>
<circle cx="642" cy="420" r="13" fill="#D4AF37" filter="url(#gw)"/>
<polygon points="340,98 358,118 340,138 322,118" fill="#FFD700"/>
<polygon points="340,702 358,722 340,742 322,722" fill="#FFD700"/>
<polygon points="18,420 38,404 58,420 38,436" fill="#FFD700"/>
<polygon points="622,420 642,404 662,420 642,436" fill="#FFD700"/>
<rect x="644" y="48" width="424" height="667" rx="15" fill="url(#rp)" filter="url(#sh)"/>
<rect x="644" y="48" width="424" height="667" rx="15" fill="none" stroke="url(#gH)" stroke-width="2.5"/>
<rect x="644" y="48" width="424" height="8" rx="4" fill="url(#gH)"/>
<rect x="644" y="707" width="424" height="8" rx="4" fill="url(#gH)"/>
<line x1="675" y1="174" x2="1038" y2="174" stroke="#D4AF37" stroke-width="1.5" opacity="0.28"/>
<line x1="675" y1="462" x2="1038" y2="462" stroke="#D4AF37" stroke-width="1.5" opacity="0.28"/>
<!-- Shield badge in panel header -->
<g transform="translate(856,104)" filter="url(#gw)">
<path d="M0,-34 L24,-20 L24,6 Q24,26 0,38 Q-24,26 -24,6 L-24,-20 Z" fill="#D4AF37"/>
<path d="M0,-24 L16,-14 L16,4 Q16,18 0,28 Q-16,18 -16,4 L-16,-14 Z" fill="#FFFACC" opacity="0.38"/>
<line x1="0" y1="-24" x2="0" y2="28" stroke="#4A3208" stroke-width="2" opacity="0.4"/>
<line x1="-16" y1="-4" x2="16" y2="-4" stroke="#4A3208" stroke-width="2" opacity="0.4"/>
</g>
<rect x="0" y="742" width="1080" height="5" fill="url(#gH)"/>
<rect x="0" y="747" width="1080" height="154" fill="url(#bann)"/>
<rect x="0" y="901" width="1080" height="5" fill="url(#gH)"/>
<line x1="60" y1="786" x2="1020" y2="786" stroke="#D4AF37" stroke-width="1" opacity="0.16"/>
<line x1="60" y1="882" x2="1020" y2="882" stroke="#D4AF37" stroke-width="1" opacity="0.16"/>
<rect x="372" y="722" width="336" height="36" rx="18" fill="#040d20" filter="url(#sh2)"/>
<rect x="372" y="722" width="336" height="36" rx="18" fill="none" stroke="#D4AF37" stroke-width="2.2"/>
<polygon points="55,824 76,808 76,840" fill="#D4AF37" opacity="0.58"/>
<polygon points="1025,824 1004,808 1004,840" fill="#D4AF37" opacity="0.58"/>
<line x1="86" y1="824" x2="148" y2="824" stroke="#D4AF37" stroke-width="1.8" opacity="0.32"/>
<line x1="932" y1="824" x2="994" y2="824" stroke="#D4AF37" stroke-width="1.8" opacity="0.32"/>
<rect x="0" y="910" width="1080" height="170" fill="#010408" opacity="0.98"/>
<rect x="0" y="910" width="1080" height="3" fill="url(#gH)"/>
<rect x="28" y="926" width="330" height="136" rx="13" fill="#0a1e45" opacity="0.88"/>
<rect x="28" y="926" width="330" height="136" rx="13" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.68"/>
<rect x="28" y="926" width="330" height="7" rx="3.5" fill="#D4AF37"/>
<rect x="382" y="926" width="670" height="136" rx="13" fill="#0a1e45" opacity="0.88"/>
<rect x="382" y="926" width="670" height="136" rx="13" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.68"/>
<rect x="382" y="926" width="670" height="7" rx="3.5" fill="#D4AF37"/>
<rect x="0" y="1063" width="1080" height="17" fill="url(#gH)"/>
</svg>`);

// ------------------------------------------
// TEMPLATE 3 — CRIMSON DYNASTY
// Deep crimson · Blazing gold · Bold & powerful
// ------------------------------------------
const makeSvgCrimsonDynasty = () => enc(`<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="bg" cx="55%" cy="38%" r="82%"><stop offset="0%" stop-color="#3e0a0a"/><stop offset="55%" stop-color="#1a0404"/><stop offset="100%" stop-color="#060101"/></radialGradient>
<linearGradient id="gH" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#4A3208"/><stop offset="20%" stop-color="#B8922A"/><stop offset="40%" stop-color="#F5E27A"/><stop offset="50%" stop-color="#FFFACC"/><stop offset="60%" stop-color="#F5E27A"/><stop offset="80%" stop-color="#B8922A"/><stop offset="100%" stop-color="#4A3208"/></linearGradient>
<linearGradient id="gV" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4A3208"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#4A3208"/></linearGradient>
<linearGradient id="rp" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3a0808" stop-opacity="0.97"/><stop offset="100%" stop-color="#0e0202" stop-opacity="0.97"/></linearGradient>
<linearGradient id="bann" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#3a0808"/><stop offset="100%" stop-color="#080101"/></linearGradient>
<filter id="gw" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="sh"><feDropShadow dx="0" dy="14" stdDeviation="22" flood-color="#000" flood-opacity="0.9"/></filter>
<filter id="sh2"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.7"/></filter>
<mask id="m"><rect width="1080" height="1080" fill="white"/><circle cx="340" cy="420" r="267" fill="black"/></mask>
</defs>
<g mask="url(#m)">
<rect width="1080" height="1080" fill="url(#bg)"/>
<path d="M780,0 L1080,0 L1080,500 Z" fill="#6b1212" opacity="0.14"/>
<ellipse cx="860" cy="260" rx="280" ry="320" fill="#5a1010" opacity="0.16"/>
<path d="M0,875 L1080,715 L1080,1080 L0,1080 Z" fill="#040101" opacity="0.85"/>
<path d="M650,0 L1080,430" stroke="#C9A96E" stroke-width="1.2" opacity="0.09"/>
<!-- Angular red accents -->
<path d="M1060,200 L1080,200 L1080,220" fill="none" stroke="#8B2222" stroke-width="3" opacity="0.3"/>
<path d="M1060,550 L1080,550 L1080,570" fill="none" stroke="#8B2222" stroke-width="3" opacity="0.3"/>
<g fill="#D4AF37" opacity="0.07">
<circle cx="700" cy="62" r="4.5"/><circle cx="744" cy="62" r="4.5"/><circle cx="788" cy="62" r="4.5"/><circle cx="832" cy="62" r="4.5"/><circle cx="876" cy="62" r="4.5"/><circle cx="920" cy="62" r="4.5"/><circle cx="964" cy="62" r="4.5"/><circle cx="1008" cy="62" r="4.5"/>
<circle cx="722" cy="106" r="4.5"/><circle cx="766" cy="106" r="4.5"/><circle cx="810" cy="106" r="4.5"/><circle cx="854" cy="106" r="4.5"/><circle cx="898" cy="106" r="4.5"/><circle cx="942" cy="106" r="4.5"/>
<circle cx="700" cy="150" r="4.5"/><circle cx="744" cy="150" r="4.5"/><circle cx="788" cy="150" r="4.5"/><circle cx="832" cy="150" r="4.5"/>
</g>
</g>
<rect x="0" y="0" width="1080" height="12" fill="url(#gH)"/>
<rect x="0" y="1068" width="1080" height="12" fill="url(#gH)"/>
<rect x="0" y="0" width="12" height="1080" fill="url(#gV)"/>
<rect x="1068" y="0" width="12" height="1080" fill="url(#gV)"/>
<rect x="12" y="12" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="12" y="12" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<rect x="988" y="12" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="1065" y="12" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<rect x="12" y="1065" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="12" y="988" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<rect x="988" y="1065" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="1065" y="988" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<polygon points="12,12 50,12 12,50" fill="#D4AF37" opacity="0.6"/>
<polygon points="1068,12 1030,12 1068,50" fill="#D4AF37" opacity="0.6"/>
<polygon points="12,1068 50,1068 12,1030" fill="#D4AF37" opacity="0.6"/>
<polygon points="1068,1068 1030,1068 1068,1030" fill="#D4AF37" opacity="0.6"/>
<circle cx="340" cy="420" r="312" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.14"/>
<circle cx="340" cy="420" r="301" fill="none" stroke="#D4AF37" stroke-width="1.5" opacity="0.22"/>
<circle cx="340" cy="420" r="290" fill="none" stroke="url(#gH)" stroke-width="14"/>
<circle cx="340" cy="420" r="276" fill="none" stroke="#D4AF37" stroke-width="3" opacity="0.45"/>
<circle cx="340" cy="420" r="270" fill="none" stroke="#FFFACC" stroke-width="1.2" opacity="0.28"/>
<circle cx="340" cy="118" r="13" fill="#D4AF37" filter="url(#gw)"/>
<circle cx="340" cy="722" r="13" fill="#D4AF37" filter="url(#gw)"/>
<circle cx="38" cy="420" r="13" fill="#D4AF37" filter="url(#gw)"/>
<circle cx="642" cy="420" r="13" fill="#D4AF37" filter="url(#gw)"/>
<polygon points="340,98 358,118 340,138 322,118" fill="#FFD700"/>
<polygon points="340,702 358,722 340,742 322,722" fill="#FFD700"/>
<polygon points="18,420 38,404 58,420 38,436" fill="#FFD700"/>
<polygon points="622,420 642,404 662,420 642,436" fill="#FFD700"/>
<rect x="644" y="48" width="424" height="667" rx="15" fill="url(#rp)" filter="url(#sh)"/>
<rect x="644" y="48" width="424" height="667" rx="15" fill="none" stroke="url(#gH)" stroke-width="2.5"/>
<rect x="644" y="48" width="424" height="8" rx="4" fill="url(#gH)"/>
<rect x="644" y="707" width="424" height="8" rx="4" fill="url(#gH)"/>
<line x1="675" y1="174" x2="1038" y2="174" stroke="#D4AF37" stroke-width="1.5" opacity="0.28"/>
<line x1="675" y1="462" x2="1038" y2="462" stroke="#D4AF37" stroke-width="1.5" opacity="0.28"/>
<!-- Star cluster badge in panel -->
<g transform="translate(856,105)" filter="url(#gw)">
<polygon points="0,-30 8,-11 29,-11 14,2 19,24 0,13 -19,24 -14,2 -29,-11 -8,-11" fill="#D4AF37"/>
<polygon points="0,-20 5.5,-8 20,-8 10,1.5 13.5,16 0,9 -13.5,16 -10,1.5 -20,-8 -5.5,-8" fill="#FFFACC" opacity="0.38"/>
</g>
<!-- Extra flanking stars -->
<g transform="translate(816,108)" opacity="0.55" filter="url(#gw)">
<polygon points="0,-18 5,-7 16,-7 8,1 11,14 0,8 -11,14 -8,1 -16,-7 -5,-7" fill="#D4AF37"/>
</g>
<g transform="translate(896,108)" opacity="0.55" filter="url(#gw)">
<polygon points="0,-18 5,-7 16,-7 8,1 11,14 0,8 -11,14 -8,1 -16,-7 -5,-7" fill="#D4AF37"/>
</g>
<rect x="0" y="742" width="1080" height="5" fill="url(#gH)"/>
<rect x="0" y="747" width="1080" height="154" fill="url(#bann)"/>
<rect x="0" y="901" width="1080" height="5" fill="url(#gH)"/>
<line x1="60" y1="786" x2="1020" y2="786" stroke="#D4AF37" stroke-width="1" opacity="0.16"/>
<line x1="60" y1="882" x2="1020" y2="882" stroke="#D4AF37" stroke-width="1" opacity="0.16"/>
<rect x="372" y="722" width="336" height="36" rx="18" fill="#1a0404" filter="url(#sh2)"/>
<rect x="372" y="722" width="336" height="36" rx="18" fill="none" stroke="#D4AF37" stroke-width="2.2"/>
<polygon points="55,824 76,808 76,840" fill="#D4AF37" opacity="0.58"/>
<polygon points="1025,824 1004,808 1004,840" fill="#D4AF37" opacity="0.58"/>
<line x1="86" y1="824" x2="148" y2="824" stroke="#D4AF37" stroke-width="1.8" opacity="0.32"/>
<line x1="932" y1="824" x2="994" y2="824" stroke="#D4AF37" stroke-width="1.8" opacity="0.32"/>
<rect x="0" y="910" width="1080" height="170" fill="#040101" opacity="0.98"/>
<rect x="0" y="910" width="1080" height="3" fill="url(#gH)"/>
<rect x="28" y="926" width="330" height="136" rx="13" fill="#3e0a0a" opacity="0.7"/>
<rect x="28" y="926" width="330" height="136" rx="13" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.68"/>
<rect x="28" y="926" width="330" height="7" rx="3.5" fill="#D4AF37"/>
<rect x="382" y="926" width="670" height="136" rx="13" fill="#3e0a0a" opacity="0.7"/>
<rect x="382" y="926" width="670" height="136" rx="13" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.68"/>
<rect x="382" y="926" width="670" height="7" rx="3.5" fill="#D4AF37"/>
<rect x="0" y="1063" width="1080" height="17" fill="url(#gH)"/>
</svg>`);

// ------------------------------------------
// TEMPLATE 4 — BLACK GOLD EXECUTIVE
// Jet black · Bright gold · Ultra-luxury minimal
// ------------------------------------------
const makeSvgBlackGold = () => enc(`<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="bg" cx="55%" cy="40%" r="80%"><stop offset="0%" stop-color="#1a1a1a"/><stop offset="60%" stop-color="#0a0a0a"/><stop offset="100%" stop-color="#030303"/></radialGradient>
<linearGradient id="gH" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#4A3208"/><stop offset="18%" stop-color="#B8922A"/><stop offset="38%" stop-color="#F5E27A"/><stop offset="50%" stop-color="#FFFACC"/><stop offset="62%" stop-color="#F5E27A"/><stop offset="82%" stop-color="#B8922A"/><stop offset="100%" stop-color="#4A3208"/></linearGradient>
<linearGradient id="gV" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4A3208"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#4A3208"/></linearGradient>
<linearGradient id="rp" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1c1c1c" stop-opacity="0.98"/><stop offset="100%" stop-color="#080808" stop-opacity="0.98"/></linearGradient>
<linearGradient id="bann" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#181818"/><stop offset="100%" stop-color="#050505"/></linearGradient>
<filter id="gw" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="sh"><feDropShadow dx="0" dy="14" stdDeviation="22" flood-color="#000" flood-opacity="0.95"/></filter>
<filter id="sh2"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.8"/></filter>
<mask id="m"><rect width="1080" height="1080" fill="white"/><circle cx="340" cy="420" r="267" fill="black"/></mask>
</defs>
<g mask="url(#m)">
<rect width="1080" height="1080" fill="url(#bg)"/>
<!-- Diamond grid pattern right area -->
<g stroke="#D4AF37" stroke-width="0.6" opacity="0.07" fill="none">
<line x1="660" y1="0" x2="1080" y2="420"/><line x1="700" y1="0" x2="1080" y2="380"/><line x1="740" y1="0" x2="1080" y2="340"/><line x1="780" y1="0" x2="1080" y2="300"/>
<line x1="820" y1="0" x2="1080" y2="260"/><line x1="860" y1="0" x2="1080" y2="220"/><line x1="900" y1="0" x2="1080" y2="180"/><line x1="940" y1="0" x2="1080" y2="140"/>
<line x1="660" y1="0" x2="660" y2="720"/><line x1="700" y1="0" x2="700" y2="720"/><line x1="740" y1="0" x2="740" y2="720"/><line x1="780" y1="0" x2="780" y2="720"/>
<line x1="820" y1="0" x2="820" y2="720"/><line x1="860" y1="0" x2="860" y2="720"/><line x1="900" y1="0" x2="900" y2="720"/><line x1="940" y1="0" x2="940" y2="720"/><line x1="980" y1="0" x2="980" y2="720"/><line x1="1020" y1="0" x2="1020" y2="720"/>
</g>
<ellipse cx="860" cy="260" rx="280" ry="320" fill="#2a2a2a" opacity="0.18"/>
<path d="M0,880 L1080,720 L1080,1080 L0,1080 Z" fill="#010101" opacity="0.9"/>
</g>
<rect x="0" y="0" width="1080" height="12" fill="url(#gH)"/>
<rect x="0" y="1068" width="1080" height="12" fill="url(#gH)"/>
<rect x="0" y="0" width="12" height="1080" fill="url(#gV)"/>
<rect x="1068" y="0" width="12" height="1080" fill="url(#gV)"/>
<rect x="12" y="12" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="12" y="12" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<rect x="988" y="12" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="1065" y="12" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<rect x="12" y="1065" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="12" y="988" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<rect x="988" y="1065" width="80" height="3" fill="#D4AF37" opacity="0.85"/><rect x="1065" y="988" width="3" height="80" fill="#D4AF37" opacity="0.85"/>
<polygon points="12,12 50,12 12,50" fill="#D4AF37" opacity="0.6"/>
<polygon points="1068,12 1030,12 1068,50" fill="#D4AF37" opacity="0.6"/>
<polygon points="12,1068 50,1068 12,1030" fill="#D4AF37" opacity="0.6"/>
<polygon points="1068,1068 1030,1068 1068,1030" fill="#D4AF37" opacity="0.6"/>
<circle cx="340" cy="420" r="312" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.14"/>
<circle cx="340" cy="420" r="301" fill="none" stroke="#D4AF37" stroke-width="1.5" opacity="0.22"/>
<circle cx="340" cy="420" r="290" fill="none" stroke="url(#gH)" stroke-width="14"/>
<circle cx="340" cy="420" r="276" fill="none" stroke="#D4AF37" stroke-width="3" opacity="0.45"/>
<circle cx="340" cy="420" r="270" fill="none" stroke="#FFFACC" stroke-width="1.2" opacity="0.28"/>
<circle cx="340" cy="118" r="13" fill="#D4AF37" filter="url(#gw)"/>
<circle cx="340" cy="722" r="13" fill="#D4AF37" filter="url(#gw)"/>
<circle cx="38" cy="420" r="13" fill="#D4AF37" filter="url(#gw)"/>
<circle cx="642" cy="420" r="13" fill="#D4AF37" filter="url(#gw)"/>
<polygon points="340,98 358,118 340,138 322,118" fill="#FFD700"/>
<polygon points="340,702 358,722 340,742 322,722" fill="#FFD700"/>
<polygon points="18,420 38,404 58,420 38,436" fill="#FFD700"/>
<polygon points="622,420 642,404 662,420 642,436" fill="#FFD700"/>
<rect x="644" y="48" width="424" height="667" rx="15" fill="url(#rp)" filter="url(#sh)"/>
<rect x="644" y="48" width="424" height="667" rx="15" fill="none" stroke="url(#gH)" stroke-width="2.5"/>
<rect x="644" y="48" width="424" height="8" rx="4" fill="url(#gH)"/>
<rect x="644" y="707" width="424" height="8" rx="4" fill="url(#gH)"/>
<line x1="675" y1="174" x2="1038" y2="174" stroke="#D4AF37" stroke-width="1.5" opacity="0.28"/>
<line x1="675" y1="462" x2="1038" y2="462" stroke="#D4AF37" stroke-width="1.5" opacity="0.28"/>
<!-- Diamond medallion in panel -->
<g transform="translate(856,106)" filter="url(#gw)">
<polygon points="0,-36 22,0 0,36 -22,0" fill="#D4AF37"/>
<polygon points="0,-24 15,0 0,24 -15,0" fill="#FFFACC" opacity="0.35"/>
<polygon points="0,-12 7.5,0 0,12 -7.5,0" fill="#D4AF37"/>
</g>
<!-- Precision vertical lines flanking medallion -->
<line x1="810" y1="72" x2="810" y2="140" stroke="#D4AF37" stroke-width="1" opacity="0.3"/>
<line x1="902" y1="72" x2="902" y2="140" stroke="#D4AF37" stroke-width="1" opacity="0.3"/>
<rect x="0" y="742" width="1080" height="5" fill="url(#gH)"/>
<rect x="0" y="747" width="1080" height="154" fill="url(#bann)"/>
<rect x="0" y="901" width="1080" height="5" fill="url(#gH)"/>
<line x1="60" y1="786" x2="1020" y2="786" stroke="#D4AF37" stroke-width="1" opacity="0.16"/>
<line x1="60" y1="882" x2="1020" y2="882" stroke="#D4AF37" stroke-width="1" opacity="0.16"/>
<rect x="372" y="722" width="336" height="36" rx="18" fill="#0a0a0a" filter="url(#sh2)"/>
<rect x="372" y="722" width="336" height="36" rx="18" fill="none" stroke="#D4AF37" stroke-width="2.2"/>
<polygon points="55,824 76,808 76,840" fill="#D4AF37" opacity="0.58"/>
<polygon points="1025,824 1004,808 1004,840" fill="#D4AF37" opacity="0.58"/>
<line x1="86" y1="824" x2="148" y2="824" stroke="#D4AF37" stroke-width="1.8" opacity="0.32"/>
<line x1="932" y1="824" x2="994" y2="824" stroke="#D4AF37" stroke-width="1.8" opacity="0.32"/>
<rect x="0" y="910" width="1080" height="170" fill="#030303" opacity="0.99"/>
<rect x="0" y="910" width="1080" height="3" fill="url(#gH)"/>
<rect x="28" y="926" width="330" height="136" rx="13" fill="#111111" opacity="0.9"/>
<rect x="28" y="926" width="330" height="136" rx="13" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.68"/>
<rect x="28" y="926" width="330" height="7" rx="3.5" fill="#D4AF37"/>
<rect x="382" y="926" width="670" height="136" rx="13" fill="#111111" opacity="0.9"/>
<rect x="382" y="926" width="670" height="136" rx="13" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.68"/>
<rect x="382" y="926" width="670" height="7" rx="3.5" fill="#D4AF37"/>
<rect x="0" y="1063" width="1080" height="17" fill="url(#gH)"/>
</svg>`);

// ------------------------------------------
// TEMPLATE 5 — PURPLE ROYALE
// Deep violet · Rose gold · Regal elegance
// ------------------------------------------
const makeSvgPurpleRoyale = () => enc(`<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="bg" cx="55%" cy="38%" r="82%"><stop offset="0%" stop-color="#26114a"/><stop offset="58%" stop-color="#110822"/><stop offset="100%" stop-color="#060312"/></radialGradient>
<linearGradient id="gH" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#5C3A1E"/><stop offset="20%" stop-color="#C9A96E"/><stop offset="40%" stop-color="#E8D5A3"/><stop offset="50%" stop-color="#F5ECCC"/><stop offset="60%" stop-color="#E8D5A3"/><stop offset="80%" stop-color="#C9A96E"/><stop offset="100%" stop-color="#5C3A1E"/></linearGradient>
<linearGradient id="gV" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#5C3A1E"/><stop offset="50%" stop-color="#C9A96E"/><stop offset="100%" stop-color="#5C3A1E"/></linearGradient>
<linearGradient id="rp" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#20103e" stop-opacity="0.97"/><stop offset="100%" stop-color="#08041a" stop-opacity="0.97"/></linearGradient>
<linearGradient id="bann" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#20103e"/><stop offset="100%" stop-color="#06030f"/></linearGradient>
<filter id="gw" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="sh"><feDropShadow dx="0" dy="14" stdDeviation="22" flood-color="#000" flood-opacity="0.9"/></filter>
<filter id="sh2"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.7"/></filter>
<mask id="m"><rect width="1080" height="1080" fill="white"/><circle cx="340" cy="420" r="267" fill="black"/></mask>
</defs>
<g mask="url(#m)">
<rect width="1080" height="1080" fill="url(#bg)"/>
<path d="M800,0 L1080,0 L1080,540 Z" fill="#3d1870" opacity="0.13"/>
<ellipse cx="860" cy="260" rx="290" ry="340" fill="#2a1050" opacity="0.18"/>
<path d="M0,870 L1080,700 L1080,1080 L0,1080 Z" fill="#03010c" opacity="0.85"/>
<path d="M650,0 L1080,430" stroke="#C9A96E" stroke-width="1.2" opacity="0.09"/>
<!-- Ornate corner flourish top-right panel area -->
<path d="M640,48 Q700,48 700,90" fill="none" stroke="#C9A96E" stroke-width="1.5" opacity="0.18"/>
<path d="M1068,48 Q1010,48 1010,90" fill="none" stroke="#C9A96E" stroke-width="1.5" opacity="0.18"/>
<g fill="#C9A96E" opacity="0.07">
<circle cx="700" cy="62" r="4.5"/><circle cx="744" cy="62" r="4.5"/><circle cx="788" cy="62" r="4.5"/><circle cx="832" cy="62" r="4.5"/><circle cx="876" cy="62" r="4.5"/><circle cx="920" cy="62" r="4.5"/><circle cx="964" cy="62" r="4.5"/>
<circle cx="722" cy="106" r="4.5"/><circle cx="766" cy="106" r="4.5"/><circle cx="810" cy="106" r="4.5"/><circle cx="854" cy="106" r="4.5"/><circle cx="898" cy="106" r="4.5"/>
<circle cx="700" cy="150" r="4.5"/><circle cx="744" cy="150" r="4.5"/><circle cx="788" cy="150" r="4.5"/><circle cx="832" cy="150" r="4.5"/>
</g>
</g>
<rect x="0" y="0" width="1080" height="12" fill="url(#gH)"/>
<rect x="0" y="1068" width="1080" height="12" fill="url(#gH)"/>
<rect x="0" y="0" width="12" height="1080" fill="url(#gV)"/>
<rect x="1068" y="0" width="12" height="1080" fill="url(#gV)"/>
<rect x="12" y="12" width="80" height="3" fill="#C9A96E" opacity="0.85"/><rect x="12" y="12" width="3" height="80" fill="#C9A96E" opacity="0.85"/>
<rect x="988" y="12" width="80" height="3" fill="#C9A96E" opacity="0.85"/><rect x="1065" y="12" width="3" height="80" fill="#C9A96E" opacity="0.85"/>
<rect x="12" y="1065" width="80" height="3" fill="#C9A96E" opacity="0.85"/><rect x="12" y="988" width="3" height="80" fill="#C9A96E" opacity="0.85"/>
<rect x="988" y="1065" width="80" height="3" fill="#C9A96E" opacity="0.85"/><rect x="1065" y="988" width="3" height="80" fill="#C9A96E" opacity="0.85"/>
<polygon points="12,12 50,12 12,50" fill="#C9A96E" opacity="0.6"/>
<polygon points="1068,12 1030,12 1068,50" fill="#C9A96E" opacity="0.6"/>
<polygon points="12,1068 50,1068 12,1030" fill="#C9A96E" opacity="0.6"/>
<polygon points="1068,1068 1030,1068 1068,1030" fill="#C9A96E" opacity="0.6"/>
<circle cx="340" cy="420" r="312" fill="none" stroke="#C9A96E" stroke-width="1" opacity="0.14"/>
<circle cx="340" cy="420" r="301" fill="none" stroke="#C9A96E" stroke-width="1.5" opacity="0.22"/>
<circle cx="340" cy="420" r="290" fill="none" stroke="url(#gH)" stroke-width="14"/>
<circle cx="340" cy="420" r="276" fill="none" stroke="#C9A96E" stroke-width="3" opacity="0.45"/>
<circle cx="340" cy="420" r="270" fill="none" stroke="#F5ECCC" stroke-width="1.2" opacity="0.28"/>
<circle cx="340" cy="118" r="13" fill="#C9A96E" filter="url(#gw)"/>
<circle cx="340" cy="722" r="13" fill="#C9A96E" filter="url(#gw)"/>
<circle cx="38" cy="420" r="13" fill="#C9A96E" filter="url(#gw)"/>
<circle cx="642" cy="420" r="13" fill="#C9A96E" filter="url(#gw)"/>
<polygon points="340,98 358,118 340,138 322,118" fill="#C9A96E"/>
<polygon points="340,702 358,722 340,742 322,722" fill="#C9A96E"/>
<polygon points="18,420 38,404 58,420 38,436" fill="#C9A96E"/>
<polygon points="622,420 642,404 662,420 642,436" fill="#C9A96E"/>
<rect x="644" y="48" width="424" height="667" rx="15" fill="url(#rp)" filter="url(#sh)"/>
<rect x="644" y="48" width="424" height="667" rx="15" fill="none" stroke="url(#gH)" stroke-width="2.5"/>
<rect x="644" y="48" width="424" height="8" rx="4" fill="url(#gH)"/>
<rect x="644" y="707" width="424" height="8" rx="4" fill="url(#gH)"/>
<line x1="675" y1="174" x2="1038" y2="174" stroke="#C9A96E" stroke-width="1.5" opacity="0.28"/>
<line x1="675" y1="462" x2="1038" y2="462" stroke="#C9A96E" stroke-width="1.5" opacity="0.28"/>
<!-- Fleur ornament in panel -->
<g transform="translate(856,106)" filter="url(#gw)">
<polygon points="0,-34 9,-12 32,-12 15,2 21,26 0,14 -21,26 -15,2 -32,-12 -9,-12" fill="#C9A96E"/>
<polygon points="0,-22 6,-8 22,-8 10,1.5 14,17 0,10 -14,17 -10,1.5 -22,-8 -6,-8" fill="#F5ECCC" opacity="0.38"/>
<circle r="5" fill="#C9A96E"/>
</g>
<rect x="0" y="742" width="1080" height="5" fill="url(#gH)"/>
<rect x="0" y="747" width="1080" height="154" fill="url(#bann)"/>
<rect x="0" y="901" width="1080" height="5" fill="url(#gH)"/>
<line x1="60" y1="786" x2="1020" y2="786" stroke="#C9A96E" stroke-width="1" opacity="0.16"/>
<line x1="60" y1="882" x2="1020" y2="882" stroke="#C9A96E" stroke-width="1" opacity="0.16"/>
<rect x="372" y="722" width="336" height="36" rx="18" fill="#110822" filter="url(#sh2)"/>
<rect x="372" y="722" width="336" height="36" rx="18" fill="none" stroke="#C9A96E" stroke-width="2.2"/>
<polygon points="55,824 76,808 76,840" fill="#C9A96E" opacity="0.58"/>
<polygon points="1025,824 1004,808 1004,840" fill="#C9A96E" opacity="0.58"/>
<line x1="86" y1="824" x2="148" y2="824" stroke="#C9A96E" stroke-width="1.8" opacity="0.32"/>
<line x1="932" y1="824" x2="994" y2="824" stroke="#C9A96E" stroke-width="1.8" opacity="0.32"/>
<rect x="0" y="910" width="1080" height="170" fill="#04020e" opacity="0.98"/>
<rect x="0" y="910" width="1080" height="3" fill="url(#gH)"/>
<rect x="28" y="926" width="330" height="136" rx="13" fill="#1a0a38" opacity="0.88"/>
<rect x="28" y="926" width="330" height="136" rx="13" fill="none" stroke="#C9A96E" stroke-width="2" opacity="0.68"/>
<rect x="28" y="926" width="330" height="7" rx="3.5" fill="#C9A96E"/>
<rect x="382" y="926" width="670" height="136" rx="13" fill="#1a0a38" opacity="0.88"/>
<rect x="382" y="926" width="670" height="136" rx="13" fill="none" stroke="#C9A96E" stroke-width="2" opacity="0.68"/>
<rect x="382" y="926" width="670" height="7" rx="3.5" fill="#C9A96E"/>
<rect x="0" y="1063" width="1080" height="17" fill="url(#gH)"/>
</svg>`);

// ------------------------------------------
// TEMPLATE 6 — SAPPHIRE ELITE
// Royal sapphire · Ice white · Modern prestige
// ------------------------------------------
const makeSvgSapphireElite = () => enc(`<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="bg" cx="55%" cy="38%" r="82%"><stop offset="0%" stop-color="#0a2252"/><stop offset="58%" stop-color="#060e2a"/><stop offset="100%" stop-color="#02040f"/></radialGradient>
<linearGradient id="gH" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#1a3060"/><stop offset="20%" stop-color="#4a78c8"/><stop offset="40%" stop-color="#a8c4f0"/><stop offset="50%" stop-color="#ddeeff"/><stop offset="60%" stop-color="#a8c4f0"/><stop offset="80%" stop-color="#4a78c8"/><stop offset="100%" stop-color="#1a3060"/></linearGradient>
<linearGradient id="gV" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1a3060"/><stop offset="50%" stop-color="#6ba3e8"/><stop offset="100%" stop-color="#1a3060"/></linearGradient>
<linearGradient id="rp" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0a1e4a" stop-opacity="0.97"/><stop offset="100%" stop-color="#030a1e" stop-opacity="0.97"/></linearGradient>
<linearGradient id="bann" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0a1e4a"/><stop offset="100%" stop-color="#030510"/></linearGradient>
<filter id="gw" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="sh"><feDropShadow dx="0" dy="14" stdDeviation="22" flood-color="#000" flood-opacity="0.9"/></filter>
<filter id="sh2"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.7"/></filter>
<mask id="m"><rect width="1080" height="1080" fill="white"/><circle cx="340" cy="420" r="267" fill="black"/></mask>
</defs>
<g mask="url(#m)">
<rect width="1080" height="1080" fill="url(#bg)"/>
<path d="M800,0 L1080,0 L1080,520 Z" fill="#1a3e8a" opacity="0.12"/>
<ellipse cx="860" cy="260" rx="290" ry="340" fill="#0e2562" opacity="0.18"/>
<path d="M0,870 L1080,700 L1080,1080 L0,1080 Z" fill="#01030d" opacity="0.85"/>
<!-- Hexagonal dot pattern -->
<g fill="#6ba3e8" opacity="0.07">
<circle cx="695" cy="62" r="5"/><circle cx="737" cy="62" r="5"/><circle cx="779" cy="62" r="5"/><circle cx="821" cy="62" r="5"/><circle cx="863" cy="62" r="5"/><circle cx="905" cy="62" r="5"/><circle cx="947" cy="62" r="5"/><circle cx="989" cy="62" r="5"/>
<circle cx="716" cy="99" r="5"/><circle cx="758" cy="99" r="5"/><circle cx="800" cy="99" r="5"/><circle cx="842" cy="99" r="5"/><circle cx="884" cy="99" r="5"/><circle cx="926" cy="99" r="5"/><circle cx="968" cy="99" r="5"/>
<circle cx="695" cy="136" r="5"/><circle cx="737" cy="136" r="5"/><circle cx="779" cy="136" r="5"/><circle cx="821" cy="136" r="5"/><circle cx="863" cy="136" r="5"/><circle cx="905" cy="136" r="5"/>
<circle cx="716" cy="173" r="5"/><circle cx="758" cy="173" r="5"/><circle cx="800" cy="173" r="5"/><circle cx="842" cy="173" r="5"/><circle cx="884" cy="173" r="5"/>
<circle cx="695" cy="210" r="5"/><circle cx="737" cy="210" r="5"/><circle cx="779" cy="210" r="5"/><circle cx="821" cy="210" r="5"/>
</g>
<line x1="650" y1="0" x2="1080" y2="430" stroke="#6ba3e8" stroke-width="1.2" opacity="0.09"/>
<line x1="700" y1="0" x2="1080" y2="380" stroke="#6ba3e8" stroke-width="0.6" opacity="0.06"/>
</g>
<rect x="0" y="0" width="1080" height="12" fill="url(#gH)"/>
<rect x="0" y="1068" width="1080" height="12" fill="url(#gH)"/>
<rect x="0" y="0" width="12" height="1080" fill="url(#gV)"/>
<rect x="1068" y="0" width="12" height="1080" fill="url(#gV)"/>
<rect x="12" y="12" width="80" height="3" fill="#6ba3e8" opacity="0.85"/><rect x="12" y="12" width="3" height="80" fill="#6ba3e8" opacity="0.85"/>
<rect x="988" y="12" width="80" height="3" fill="#6ba3e8" opacity="0.85"/><rect x="1065" y="12" width="3" height="80" fill="#6ba3e8" opacity="0.85"/>
<rect x="12" y="1065" width="80" height="3" fill="#6ba3e8" opacity="0.85"/><rect x="12" y="988" width="3" height="80" fill="#6ba3e8" opacity="0.85"/>
<rect x="988" y="1065" width="80" height="3" fill="#6ba3e8" opacity="0.85"/><rect x="1065" y="988" width="3" height="80" fill="#6ba3e8" opacity="0.85"/>
<polygon points="12,12 50,12 12,50" fill="#6ba3e8" opacity="0.6"/>
<polygon points="1068,12 1030,12 1068,50" fill="#6ba3e8" opacity="0.6"/>
<polygon points="12,1068 50,1068 12,1030" fill="#6ba3e8" opacity="0.6"/>
<polygon points="1068,1068 1030,1068 1068,1030" fill="#6ba3e8" opacity="0.6"/>
<circle cx="340" cy="420" r="312" fill="none" stroke="#6ba3e8" stroke-width="1" opacity="0.14"/>
<circle cx="340" cy="420" r="301" fill="none" stroke="#6ba3e8" stroke-width="1.5" opacity="0.22"/>
<circle cx="340" cy="420" r="290" fill="none" stroke="url(#gH)" stroke-width="14"/>
<circle cx="340" cy="420" r="276" fill="none" stroke="#6ba3e8" stroke-width="3" opacity="0.45"/>
<circle cx="340" cy="420" r="270" fill="none" stroke="#ddeeff" stroke-width="1.2" opacity="0.28"/>
<circle cx="340" cy="118" r="13" fill="#6ba3e8" filter="url(#gw)"/>
<circle cx="340" cy="722" r="13" fill="#6ba3e8" filter="url(#gw)"/>
<circle cx="38" cy="420" r="13" fill="#6ba3e8" filter="url(#gw)"/>
<circle cx="642" cy="420" r="13" fill="#6ba3e8" filter="url(#gw)"/>
<polygon points="340,98 358,118 340,138 322,118" fill="#93C5FD"/>
<polygon points="340,702 358,722 340,742 322,722" fill="#93C5FD"/>
<polygon points="18,420 38,404 58,420 38,436" fill="#93C5FD"/>
<polygon points="622,420 642,404 662,420 642,436" fill="#93C5FD"/>
<rect x="644" y="48" width="424" height="667" rx="15" fill="url(#rp)" filter="url(#sh)"/>
<rect x="644" y="48" width="424" height="667" rx="15" fill="none" stroke="url(#gH)" stroke-width="2.5"/>
<rect x="644" y="48" width="424" height="8" rx="4" fill="url(#gH)"/>
<rect x="644" y="707" width="424" height="8" rx="4" fill="url(#gH)"/>
<line x1="675" y1="174" x2="1038" y2="174" stroke="#6ba3e8" stroke-width="1.5" opacity="0.28"/>
<line x1="675" y1="462" x2="1038" y2="462" stroke="#6ba3e8" stroke-width="1.5" opacity="0.28"/>
<!-- Geometric star/compass in panel -->
<g transform="translate(856,106)" filter="url(#gw)">
<circle r="38" fill="none" stroke="#6ba3e8" stroke-width="1.5" opacity="0.3"/>
<polygon points="0,-30 8,-8 30,-8 12,6 19,28 0,16 -19,28 -12,6 -30,-8 -8,-8" fill="#6ba3e8"/>
<polygon points="0,-20 5,-5 20,-5 8,4 13,19 0,11 -13,19 -8,4 -20,-5 -5,-5" fill="#ddeeff" opacity="0.35"/>
<circle r="5" fill="#93C5FD"/>
</g>
<rect x="0" y="742" width="1080" height="5" fill="url(#gH)"/>
<rect x="0" y="747" width="1080" height="154" fill="url(#bann)"/>
<rect x="0" y="901" width="1080" height="5" fill="url(#gH)"/>
<line x1="60" y1="786" x2="1020" y2="786" stroke="#6ba3e8" stroke-width="1" opacity="0.16"/>
<line x1="60" y1="882" x2="1020" y2="882" stroke="#6ba3e8" stroke-width="1" opacity="0.16"/>
<rect x="372" y="722" width="336" height="36" rx="18" fill="#060e2a" filter="url(#sh2)"/>
<rect x="372" y="722" width="336" height="36" rx="18" fill="none" stroke="#6ba3e8" stroke-width="2.2"/>
<polygon points="55,824 76,808 76,840" fill="#6ba3e8" opacity="0.58"/>
<polygon points="1025,824 1004,808 1004,840" fill="#6ba3e8" opacity="0.58"/>
<line x1="86" y1="824" x2="148" y2="824" stroke="#6ba3e8" stroke-width="1.8" opacity="0.32"/>
<line x1="932" y1="824" x2="994" y2="824" stroke="#6ba3e8" stroke-width="1.8" opacity="0.32"/>
<rect x="0" y="910" width="1080" height="170" fill="#020510" opacity="0.98"/>
<rect x="0" y="910" width="1080" height="3" fill="url(#gH)"/>
<rect x="28" y="926" width="330" height="136" rx="13" fill="#0a1e4a" opacity="0.88"/>
<rect x="28" y="926" width="330" height="136" rx="13" fill="none" stroke="#6ba3e8" stroke-width="2" opacity="0.68"/>
<rect x="28" y="926" width="330" height="7" rx="3.5" fill="#6ba3e8"/>
<rect x="382" y="926" width="670" height="136" rx="13" fill="#0a1e4a" opacity="0.88"/>
<rect x="382" y="926" width="670" height="136" rx="13" fill="none" stroke="#6ba3e8" stroke-width="2" opacity="0.68"/>
<rect x="382" y="926" width="670" height="7" rx="3.5" fill="#6ba3e8"/>
<rect x="0" y="1063" width="1080" height="17" fill="url(#gH)"/>
</svg>`);

// ==========================================
// TEMPLATE PRESET REGISTRY
// ==========================================
const TEMPLATE_PRESETS = [
  {
    id: 'emerald-gold', name: 'Royal Emerald', icon: '🌿',
    bg: '#061a0d', primary: '#0a3b1c', accent: '#FFD700',
    svg: makeSvgEmeraldGold(),
  },
  {
    id: 'navy-imperial', name: 'Navy Imperial', icon: '⚓',
    bg: '#030814', primary: '#091c3d', accent: '#FFD700',
    svg: makeSvgNavyImperial(),
  },
  {
    id: 'crimson-dynasty', name: 'Crimson Dynasty', icon: '🔴',
    bg: '#120202', primary: '#2a0608', accent: '#FFD700',
    svg: makeSvgCrimsonDynasty(),
  },
  {
    id: 'black-gold', name: 'Black Gold Executive', icon: '♦',
    bg: '#050505', primary: '#111111', accent: '#D4AF37',
    svg: makeSvgBlackGold(),
  },
  {
    id: 'purple-royale', name: 'Purple Royale', icon: '👑',
    bg: '#0a0518', primary: '#1a0838', accent: '#C9A96E',
    svg: makeSvgPurpleRoyale(),
  },
  {
    id: 'sapphire-elite', name: 'Sapphire Elite', icon: '💎',
    bg: '#020916', primary: '#07193b', accent: '#93C5FD',
    svg: makeSvgSapphireElite(),
  },
] as const;

// ==========================================
// SHARED COMPONENTS
// ==========================================
const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
    {children}
  </motion.div>
);

const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
  const accentColor = campaign.themeAccent || '#FFD700';
  return (
    <Link to={`/c/${campaign.slug}`} className="block group">
      <div className="relative rounded-2xl overflow-hidden border border-white/8 hover:-translate-y-1.5 transition-all duration-300 shadow-lg hover:shadow-2xl">
        {/* Poster Preview */}
        <div className="relative h-48 overflow-hidden" style={{ background: `radial-gradient(ellipse at 60% 40%, ${campaign.themePrimary} 0%, ${campaign.themeBg} 100%)` }}>
          {campaign.template?.frameUrl && (
            <img src={campaign.template.frameUrl} alt="Frame" className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-90" />
          )}
          {/* Center branding overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
            <p className="font-display font-black text-lg tracking-[0.2em] uppercase text-center drop-shadow-lg" style={{ color: accentColor }}>
              {campaign.logoText || ''}
            </p>
            {campaign.trending && (
              <span className="mt-2 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase"
                style={{ background: accentColor + '22', color: accentColor, border: `1px solid ${accentColor}55` }}>
                🔥 Trending
              </span>
            )}
          </div>
          {/* Gradient fade bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-ink-950 to-transparent" />
        </div>
        {/* Card info */}
        <div className="px-4 py-4 bg-ink-900/80 backdrop-blur-sm">
          <h3 className="font-display font-semibold text-ink-100 group-hover:text-amber-400 transition-colors line-clamp-2 text-sm mb-2 leading-tight">
            {campaign.title}
          </h3>
          <div className="flex flex-col gap-1 text-[11px] text-ink-400">
            <div className="flex items-center gap-1.5"><Calendar size={10} className="shrink-0" style={{ color: accentColor + 'cc' }} /><span className="truncate">{campaign.eventDate}</span></div>
            <div className="flex items-center gap-1.5"><MapPin size={10} className="shrink-0" style={{ color: accentColor + 'cc' }} /><span className="truncate">{campaign.venue}</span></div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: accentColor + '18', color: accentColor, border: `1px solid ${accentColor}35` }}>
              {campaign.attendeeLabel || "I'm Attending"}
            </span>
            <span className="text-[10px] text-ink-500 flex items-center gap-1">
              <Users size={9} /> {campaign._count?.analytics || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ==========================================
// PUBLIC PAGES
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
      <section className="relative min-h-[82vh] flex items-center justify-center overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-amber-400/20 text-amber-400 text-xs font-bold uppercase tracking-widest mb-8">
            <Sparkles size={12} /> Create · Share · Celebrate
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-display text-5xl sm:text-7xl font-bold leading-tight mb-6">
            Your Event.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-600">Your Face.</span> Instantly.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="text-lg text-ink-400 max-w-xl mx-auto mb-10">
            Generate personalized event DPs, Twibbons & banners in seconds — premium quality, social-media ready.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to={token ? '/dashboard/campaigns/new' : '/register'}
              className="btn-gold w-full sm:w-auto px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform">
              <Plus size={20} /> Create a Campaign
            </Link>
            <form onSubmit={(e) => { e.preventDefault(); navigate(`/explore?q=${query}`); }} className="relative w-full sm:w-auto">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events..."
                className="w-full sm:w-80 pl-12 pr-4 py-4 rounded-xl glass border border-white/12 focus:border-amber-400 focus:outline-none text-white text-sm" />
            </form>
          </motion.div>
          {/* Theme swatches preview */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-3 flex-wrap">
            {TEMPLATE_PRESETS.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-white/10 text-xs text-ink-400">
                <div className="w-3 h-3 rounded-full" style={{ background: p.accent }} />
                {p.name}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-white/8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold">Featured Events</h2>
              <p className="text-ink-400 text-sm mt-1">Select a campaign and create your personalized DP</p>
            </div>
            <Link to="/explore" className="text-amber-400 text-sm font-medium hover:underline flex items-center gap-1">View all <ChevronRight size={14} /></Link>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold">Explore Campaigns</h1>
            <p className="text-ink-400 mt-1">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} available</p>
          </div>
          <Link to={token ? '/dashboard/campaigns/new' : '/register'} className="btn-gold px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-amber-400/20">
            <Plus size={18} /> Create Your Own
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
          {campaigns.length === 0 && <p className="text-ink-400 col-span-full py-16 text-center">No campaigns found.</p>}
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
    if (slug) apiFetch(`/campaigns/slug/${slug}`).then(setCampaign).catch(console.error);
  }, [slug]);

  if (!campaign) return <div className="pt-32 text-center text-ink-400 animate-pulse">Loading Campaign...</div>;

  const campaignUrl = `${window.location.origin}/c/${campaign.slug}`;
  const shareOnWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`🎉 Join me at ${campaign.title}!\n📅 ${campaign.eventDate}\n📍 ${campaign.venue}\n\nCreate your personalized DP: ${campaignUrl}`)}`, '_blank');
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(campaignUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { }
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-16">
        <button onClick={() => navigate('/explore')} className="flex items-center gap-2 text-ink-400 hover:text-amber-400 transition-colors text-sm mb-8"><ArrowLeft size={16} /> Back to Explore</button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="relative rounded-3xl overflow-hidden aspect-square shadow-2xl border border-white/8"
            style={{ background: `radial-gradient(ellipse at 60% 40%, ${campaign.themePrimary} 0%, ${campaign.themeBg} 100%)` }}>
            {campaign.template?.frameUrl
              ? <img src={campaign.template.frameUrl} alt="Frame" className="w-full h-full object-contain" />
              : <div className="w-full h-full flex items-center justify-center font-display text-3xl opacity-40">No Template</div>}
            {campaign.trending && <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-400 text-xs font-bold tracking-widest uppercase">🔥 Trending</span>}
          </div>
          <div className="space-y-6 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{ background: campaign.themePrimary + '55', color: campaign.themeAccent, border: `1px solid ${campaign.themeAccent}40` }}>{campaign.category}</span>
              <span className="text-xs text-ink-500 flex items-center gap-1"><Users size={11} /> {campaign._count?.analytics || 0} Attending</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight">{campaign.title}</h1>
            {campaign.tagline && <p className="text-xl font-display italic" style={{ color: campaign.themeAccent }}>"{campaign.tagline}"</p>}
            <p className="text-ink-400 leading-relaxed">{campaign.description}</p>
            <div className="glass rounded-2xl p-5 space-y-3 border-white/8">
              <div className="flex items-center gap-3 text-ink-200"><Calendar size={18} className="shrink-0" style={{ color: campaign.themeAccent }} /><span className="font-medium">{campaign.eventDate}</span></div>
              <div className="flex items-center gap-3 text-ink-200"><MapPin size={18} className="shrink-0" style={{ color: campaign.themeAccent }} /><span className="font-medium">{campaign.venue}</span></div>
            </div>
            <Link to={`/c/${campaign.slug}/generate`}
              className="btn-gold w-full py-4 rounded-xl text-center text-lg font-bold shadow-lg shadow-amber-400/20 flex justify-center items-center gap-2">
              <Sparkles size={20} /> Create My DP Now
            </Link>
            <div className="pt-4 border-t border-white/8">
              <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">Invite Friends</p>
              <div className="flex gap-2">
                <button onClick={shareOnWhatsApp} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 transition-all font-medium text-sm">
                  <MessageCircle size={16} /> WhatsApp
                </button>
                <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass border border-white/10 text-ink-300 hover:text-amber-400 hover:border-amber-400/30 transition-all font-medium text-sm">
                  {copied ? <Check size={16} className="text-green-400" /> : <LinkIcon size={16} />} {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// ==========================================
// THE DP GENERATOR
// ==========================================
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
      setSuccess(true); setTimeout(() => setSuccess(false), 5000);
    } catch { alert('Export failed. Please try again.'); } finally { setExporting(false); }
  };

  const campaignUrl = campaign ? `${window.location.origin}/c/${campaign.slug}` : '';
  const shareOnWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`I just created my personalized DP for ${campaign?.title}!\n\nCreate yours here: ${campaignUrl}`)}`, '_blank');
  const shareOnFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignUrl)}`, '_blank', 'width=600,height=400');
  const shareOnTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm attending ${campaign?.title}! Get your DP: ${campaignUrl}`)}`, '_blank', 'width=600,height=400');
  const copyLink = async () => { try { await navigator.clipboard.writeText(campaignUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { } };

  if (!campaign || !campaign.template) return (
    <div className="pt-32 text-center text-ink-400">
      <Loader2 size={32} className="mx-auto mb-3 animate-spin text-amber-400" />
      <p>Loading Premium Generator...</p>
    </div>
  );

  const tpl = campaign.template;
  const isPreset = !!tpl.frameUrl?.startsWith('data:image/svg');
  const CANVAS_SIZE = 420;
  const scaleRatio = CANVAS_SIZE / tpl.exportWidth;

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-24">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(`/c/${campaign.slug}`)} className="flex items-center gap-2 text-ink-400 hover:text-amber-400 transition-colors text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{ background: campaign.themePrimary + '22', color: campaign.themeAccent, border: `1px solid ${campaign.themeAccent}45` }}>
            {campaign.attendeeLabel}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12">
          {/* Canvas */}
          <div className="flex flex-col items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/8"
              style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, backgroundColor: campaign.themeBg }}>
              <Stage width={CANVAS_SIZE} height={CANVAS_SIZE} ref={stageRef}>
                <Layer>
                  <Rect x={0} y={0} width={CANVAS_SIZE} height={CANVAS_SIZE} fill={campaign.themeBg} />
                  <Group clipFunc={(ctx) => { ctx.arc(tpl.photoX * scaleRatio, tpl.photoY * scaleRatio, tpl.photoRadius * scaleRatio, 0, Math.PI * 2, false); }}>
                    {userImage ? (
                      <KonvaImage image={userImage}
                        x={tpl.photoX * scaleRatio + imageX * scaleRatio} y={tpl.photoY * scaleRatio + imageY * scaleRatio}
                        offsetX={(userImage.width * imageScale * scaleRatio) / 2} offsetY={(userImage.height * imageScale * scaleRatio) / 2}
                        width={userImage.width * imageScale * scaleRatio} height={userImage.height * imageScale * scaleRatio}
                        rotation={imageRotation} draggable
                        onDragMove={(e) => setCanvasData({ imageX: (e.target.x() - tpl.photoX * scaleRatio) / scaleRatio, imageY: (e.target.y() - tpl.photoY * scaleRatio) / scaleRatio })} />
                    ) : <Circle x={tpl.photoX * scaleRatio} y={tpl.photoY * scaleRatio} radius={tpl.photoRadius * scaleRatio} fill={campaign.themePrimary + '90'} />}
                  </Group>

                  {frameImage && <KonvaImage image={frameImage} width={CANVAS_SIZE} height={CANVAS_SIZE} listening={false} />}

                  {/* Dynamic text overlays for preset templates */}
                  {isPreset && (
                    <Group>
                      <Text text={campaign.logoText || 'ORGANIZATION'} x={620 * scaleRatio} y={96 * scaleRatio} width={420 * scaleRatio} align="center" fontSize={26 * scaleRatio} fill={campaign.themeAccent} fontFamily="Playfair Display" fontStyle="bold" shadowColor="black" shadowBlur={5} listening={false} />
                      <Text text={(campaign.title || '').toUpperCase()} x={620 * scaleRatio} y={186 * scaleRatio} width={420 * scaleRatio} align="center" fontSize={48 * scaleRatio} fill="#ffffff" fontFamily="Playfair Display" fontStyle="bold" shadowColor="black" shadowBlur={12} shadowOffsetY={5} listening={false} />
                      <Text text={(campaign.tagline || 'REUNION & CELEBRATION').toUpperCase()} x={620 * scaleRatio} y={464 * scaleRatio} width={420 * scaleRatio} align="center" fontSize={22 * scaleRatio} fill={campaign.themeAccent} fontFamily="DM Sans" fontStyle="bold" letterSpacing={3} shadowColor="black" shadowBlur={5} listening={false} />
                      <Text text={`★ ${campaign.attendeeLabel || "I'M ATTENDING"} ★`} x={0} y={740 * scaleRatio} width={1080 * scaleRatio} align="center" fontSize={16 * scaleRatio} fill="#ffffff" fontFamily="DM Sans" fontStyle="bold" letterSpacing={4} listening={false} />
                      <Text text="DATE:" x={78 * scaleRatio} y={958 * scaleRatio} width={270 * scaleRatio} fontSize={14 * scaleRatio} fill={campaign.themeAccent} fontFamily="DM Sans" fontStyle="bold" listening={false} />
                      <Text text={campaign.eventDate} x={78 * scaleRatio} y={988 * scaleRatio} width={270 * scaleRatio} fontSize={20 * scaleRatio} fill="#ffffff" fontFamily="DM Sans" fontStyle="bold" listening={false} />
                      <Text text="VENUE:" x={432 * scaleRatio} y={958 * scaleRatio} width={600 * scaleRatio} fontSize={14 * scaleRatio} fill={campaign.themeAccent} fontFamily="DM Sans" fontStyle="bold" listening={false} />
                      <Text text={campaign.venue} x={432 * scaleRatio} y={988 * scaleRatio} width={600 * scaleRatio} fontSize={20 * scaleRatio} fill="#ffffff" fontFamily="DM Sans" fontStyle="bold" wrap="word" listening={false} />
                    </Group>
                  )}

                  {attendeeName && (
                    <Text text={attendeeName.toUpperCase()} x={(tpl.nameX - 500) * scaleRatio} y={tpl.nameY * scaleRatio}
                      width={1000 * scaleRatio} align="center" fontSize={tpl.nameFontSize * scaleRatio}
                      fontFamily={tpl.nameFont} fill={tpl.nameColor} fontStyle="bold"
                      shadowColor="rgba(0,0,0,0.8)" shadowBlur={8} shadowOffsetY={3} listening={false} />
                  )}
                </Layer>
              </Stage>

              {!imageDataUrl && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="text-center px-5 py-4 rounded-2xl backdrop-blur-sm" style={{ background: campaign.themeBg + 'cc', border: `1px solid ${campaign.themeAccent}40` }}>
                    <Upload size={28} className="mx-auto mb-2" style={{ color: campaign.themeAccent }} />
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: campaign.themeAccent }}>Upload Photo to Begin</p>
                  </div>
                </div>
              )}
            </div>
            <p className="mt-4 text-xs font-medium text-ink-500 flex items-center gap-2">
              <GripHorizontal size={13} /> Drag photo to reposition inside frame
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">{campaign.shortTitle || campaign.title}</h2>
              <p className="text-ink-400 text-sm mt-1">{campaign.category} · {campaign.eventDate}</p>
            </div>

            {/* Step 1: Photo */}
            <div className="glass p-5 rounded-2xl space-y-4 border border-white/8">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs font-bold flex items-center justify-center">1</div>
                <label className="text-sm font-bold text-ink-200 uppercase tracking-wider">Your Photo</label>
              </div>
              <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleUpload} />
              {!imageDataUrl ? (
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all group"
                  style={{ borderColor: campaign.themeAccent + '55', background: campaign.themeAccent + '08' }}
                  onMouseEnter={e => (e.currentTarget.style.background = campaign.themeAccent + '14')}
                  onMouseLeave={e => (e.currentTarget.style.background = campaign.themeAccent + '08')}>
                  <Upload size={24} className="mx-auto mb-2" style={{ color: campaign.themeAccent }} />
                  <p className="text-sm font-bold" style={{ color: campaign.themeAccent }}>Click to upload photo</p>
                  <p className="text-xs text-ink-500 mt-1">JPG, PNG or WEBP recommended</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button onClick={() => fileRef.current?.click()} className="flex-1 py-2 rounded-lg bg-ink-800 border border-white/10 hover:border-amber-400/40 text-sm font-medium text-white transition-all">Change Photo</button>
                    <button onClick={() => setCanvasData({ imageDataUrl: null })} className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"><Trash2 size={16} /></button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-ink-400 uppercase"><label>Zoom</label><span className="text-amber-400">{(imageScale * 100).toFixed(0)}%</span></div>
                    <input type="range" min="0.1" max="3" step="0.05" value={imageScale} onChange={(e) => setCanvasData({ imageScale: parseFloat(e.target.value) })} className="w-full accent-amber-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-ink-400 uppercase"><label>Rotate</label><span className="text-amber-400">{imageRotation}°</span></div>
                    <input type="range" min="-180" max="180" step="1" value={imageRotation} onChange={(e) => setCanvasData({ imageRotation: parseFloat(e.target.value) })} className="w-full accent-amber-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Name */}
            <div className="glass p-5 rounded-2xl space-y-3 border border-white/8">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs font-bold flex items-center justify-center">2</div>
                <label className="text-sm font-bold text-ink-200 uppercase tracking-wider">Your Name</label>
              </div>
              <input type="text" value={attendeeName} onChange={(e) => setCanvasData({ attendeeName: e.target.value })} maxLength={40}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-xl bg-ink-900 border border-white/10 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 focus:outline-none transition-all placeholder-ink-600 text-sm" />
            </div>

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-green-500/15 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                  <CheckCircle2 size={16} /> DP downloaded successfully!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: Download & Share */}
            <div className="glass p-5 rounded-2xl space-y-4 border border-white/8" style={{ background: campaign.themeAccent + '06' }}>
              <button onClick={handleExport} disabled={!imageDataUrl || exporting}
                className="btn-gold w-full py-4 rounded-xl text-base font-bold flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-400/20">
                {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                {exporting ? 'Generating HD Image...' : 'Download HD Image'}
              </button>
              <div>
                <p className="text-xs font-bold text-ink-500 uppercase tracking-widest text-center mb-3">Share with Friends</p>
                <div className="grid grid-cols-4 gap-2">
                  <button onClick={shareOnWhatsApp} className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-all text-[10px] font-bold"><MessageCircle size={18} /> WhatsApp</button>
                  <button onClick={shareOnFacebook} className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] transition-all text-[10px] font-bold"><Facebook size={18} /> Facebook</button>
                  <button onClick={shareOnTwitter} className="flex flex-col items-center gap-1 py-2.5 rounded-xl glass hover:bg-white/10 text-white transition-all text-[10px] font-bold"><Twitter size={18} /> Twitter</button>
                  <button onClick={copyLink} className="flex flex-col items-center gap-1 py-2.5 rounded-xl glass hover:bg-white/10 text-amber-400 transition-all text-[10px] font-bold">
                    {copied ? <Check size={18} /> : <LinkIcon size={18} />} {copied ? 'Copied' : 'Copy Link'}
                  </button>
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
// AUTH PAGES
// ==========================================
const AuthLayout = ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) => (
  <div className="min-h-screen flex bg-ink-950 pt-16">
    <div className="hidden lg:flex flex-1 flex-col justify-center p-16 border-r border-white/8 glass">
      <h1 className="font-display text-5xl font-bold text-white leading-tight mb-6">Empower your<br />community with<br /><span className="text-amber-400">stunning DPs.</span></h1>
      <p className="text-ink-400 text-lg max-w-md">Join thousands of event organizers creating viral, world-class campaigns for reunions, conferences, and celebrations.</p>
      <div className="mt-10 flex gap-3 flex-wrap">
        {TEMPLATE_PRESETS.map(p => (
          <div key={p.id} className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 shadow-lg"
            style={{ background: `radial-gradient(ellipse at 60% 40%, ${p.primary}, ${p.bg})` }}>
          </div>
        ))}
      </div>
    </div>
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-bold text-white mb-2">{title}</h2>
          <p className="text-ink-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  </div>
);

function LoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const navigate = useNavigate(); const setAuth = useAppStore(s => s.setAuth);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try { const d = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setAuth(d.token, d.user); navigate('/dashboard'); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your campaigns">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        <div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-4 rounded-xl glass border border-white/10 text-white placeholder-ink-600 focus:border-amber-400 focus:outline-none" placeholder="Email Address" /></div>
        <div className="relative"><Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" /><input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-4 rounded-xl glass border border-white/10 text-white placeholder-ink-600 focus:border-amber-400 focus:outline-none" placeholder="Password" /></div>
        <button type="submit" disabled={loading} className="w-full btn-gold py-4 rounded-xl font-bold disabled:opacity-70">{loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Sign In'}</button>
        <p className="text-center text-sm text-ink-400">No account? <Link to="/register" className="text-amber-400 hover:underline">Create one</Link></p>
      </form>
    </AuthLayout>
  );
}

function RegisterPage() {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const navigate = useNavigate(); const setAuth = useAppStore(s => s.setAuth);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try { const d = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }); setAuth(d.token, d.user); navigate('/dashboard'); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };
  return (
    <AuthLayout title="Create account" subtitle="Start building viral campaigns today">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        <div className="relative"><UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" /><input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full pl-11 pr-4 py-4 rounded-xl glass border border-white/10 text-white placeholder-ink-600 focus:border-amber-400 focus:outline-none" placeholder="Full Name" /></div>
        <div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-4 rounded-xl glass border border-white/10 text-white placeholder-ink-600 focus:border-amber-400 focus:outline-none" placeholder="Email Address" /></div>
        <div className="relative"><Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" /><input type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={6} className="w-full pl-11 pr-4 py-4 rounded-xl glass border border-white/10 text-white placeholder-ink-600 focus:border-amber-400 focus:outline-none" placeholder="Password (min 6 chars)" /></div>
        <button type="submit" disabled={loading} className="w-full btn-gold py-4 rounded-xl font-bold disabled:opacity-70">{loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Create Account'}</button>
        <p className="text-center text-sm text-ink-400">Already have an account? <Link to="/login" className="text-amber-400 hover:underline">Sign in</Link></p>
      </form>
    </AuthLayout>
  );
}

// ==========================================
// DASHBOARD
// ==========================================
function DashboardLayout() {
  const { user, logout, token } = useAppStore();
  const location = useLocation();
  if (!token || !user) return <Navigate to="/login" replace />;
  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { path: '/dashboard/campaigns', label: 'My Campaigns', icon: <Layers size={16} /> },
  ];
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-ink-950 text-white">
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/8 glass sticky top-0 z-50">
        <Link to="/" className="font-display text-lg font-bold">Frame<span className="text-amber-400">It</span></Link>
        <button onClick={logout} className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg"><LogOut size={18} /></button>
      </div>
      <div className="md:hidden flex overflow-x-auto p-3 gap-2 border-b border-white/8 bg-ink-950">
        {navItems.map(item => <Link key={item.path} to={item.path} className={cn('whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all', location.pathname === item.path ? 'bg-amber-400/10 text-amber-400' : 'text-ink-400 bg-white/5')}>{item.icon} {item.label}</Link>)}
      </div>
      <aside className="w-60 glass border-r border-white/8 flex-col h-screen sticky top-0 hidden md:flex">
        <div className="p-5 border-b border-white/8"><Link to="/" className="flex items-center gap-2 font-display text-lg font-bold"><Layers className="text-amber-400" /> FrameIt</Link></div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => <Link key={item.path} to={item.path} className={cn('flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all', location.pathname === item.path ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 'text-ink-400 hover:text-white hover:bg-white/5')}>{item.icon} {item.label}</Link>)}
        </nav>
        <div className="p-4 border-t border-white/8">
          <div className="px-3 py-2 mb-2"><p className="text-sm font-bold text-white truncate">{user?.name}</p><p className="text-xs text-ink-500 truncate">{user?.email}</p></div>
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-400/10 text-sm"><LogOut size={16} /> Logout</button>
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
  const firstName = user?.name?.split(' ')[0] || 'Creator';
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-8">Welcome back, {firstName} 👋</h1>
      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Campaigns', value: stats.totalCampaigns, icon: <Layers className="text-amber-400" /> },
            { label: 'Total Views', value: stats.totalViews, icon: <Eye className="text-amber-400" /> },
            { label: 'DPs Generated', value: stats.totalGenerated, icon: <Users className="text-amber-400" /> },
            { label: 'Downloads', value: stats.totalDownloads, icon: <Download className="text-amber-400" /> },
          ].map(s => (
            <div key={s.label} className="glass p-5 rounded-2xl border border-white/8">
              <div className="mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value?.toLocaleString()}</div>
              <div className="text-xs text-ink-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      ) : <div className="text-ink-500 animate-pulse">Loading stats...</div>}
      <div className="mt-10">
        <Link to="/dashboard/campaigns/new" className="btn-gold px-6 py-3 rounded-xl inline-flex items-center gap-2 font-bold shadow-lg shadow-amber-400/20">
          <Plus size={18} /> Create New Campaign
        </Link>
      </div>
    </div>
  );
}

function DashboardCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  useEffect(() => { apiFetch('/me/campaigns').then(setCampaigns).catch(console.error); }, []);
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold">My Campaigns</h1>
        <Link to="/dashboard/campaigns/new" className="btn-gold px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold"><Plus size={15} /> New</Link>
      </div>
      <div className="glass rounded-2xl overflow-x-auto border border-white/8">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-white/4 text-ink-400 text-xs uppercase tracking-wider">
            <tr><th className="p-4">Title</th><th className="p-4">Date</th><th className="p-4">Generations</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {campaigns.length === 0
              ? <tr><td colSpan={5} className="p-10 text-center text-ink-500">No campaigns yet. <Link to="/dashboard/campaigns/new" className="text-amber-400 hover:underline">Create your first one →</Link></td></tr>
              : campaigns.map(c => (
                <tr key={c.id} className="hover:bg-white/3 transition-colors">
                  <td className="p-4"><p className="font-medium text-white">{c.title}</p><p className="text-xs text-ink-500">/c/{c.slug}</p></td>
                  <td className="p-4 text-sm text-ink-400">{c.eventDate}</td>
                  <td className="p-4 font-bold text-white">{c._count?.analytics || 0}</td>
                  <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.isPublished ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'}`}>{c.isPublished ? 'Live' : 'Draft'}</span></td>
                  <td className="p-4"><Link to={`/dashboard/campaigns/${c.slug}/edit`} className="p-2 bg-ink-800 rounded-lg hover:bg-ink-700 text-amber-400 inline-flex"><Edit size={15} /></Link></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// CAMPAIGN EDITOR (Enterprise Wizard)
// ==========================================
function DashboardCampaignEditor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [campaign, setCampaign] = useState<Partial<Campaign>>({
    title: '', slug: '', shortTitle: '', description: '', eventDate: '', venue: '',
    category: 'General', tagline: '', themePrimary: TEMPLATE_PRESETS[0].primary,
    themeSecondary: '#333333', themeAccent: TEMPLATE_PRESETS[0].accent,
    themeBg: TEMPLATE_PRESETS[0].bg, themeText: '#ffffff',
    logoText: '', attendeeLabel: "I'M ATTENDING", isPublished: false,
  });

  const [template, setTemplate] = useState<Partial<Template>>({
    exportWidth: 1080, exportHeight: 1080,
    photoX: 340, photoY: 420, photoRadius: 260,
    nameX: 540, nameY: 825, nameFont: 'Playfair Display', nameFontSize: 52, nameColor: '#FFD700',
    labelX: 540, labelY: 960, labelFont: 'DM Sans', labelFontSize: 22, labelColor: '#FFFFFF',
    frameUrl: TEMPLATE_PRESETS[0].svg,
  });

  const [frameImage] = useImage(template.frameUrl || '', 'anonymous');
  const stageRef = useRef<any>(null);
  const EDITOR_SIZE = 460;
  const ratio = EDITOR_SIZE / (template.exportWidth || 1080);
  const isPreset = !!template.frameUrl?.startsWith('data:image/svg');

  useEffect(() => {
    if (slug && slug !== 'new') {
      apiFetch(`/campaigns/slug/${slug}?preview=true`)
        .then(data => { setCampaign(data); if (data.template) setTemplate(data.template); })
        .catch(console.error);
    }
  }, [slug]);

  const handleFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const formData = new FormData(); formData.append('file', file);
    try { const data = await apiFetch('/upload', { method: 'POST', body: formData }); setTemplate(prev => ({ ...prev, frameUrl: data.url })); }
    catch { alert('Upload failed. Ensure image is under 10MB.'); } finally { setUploading(false); }
  };

  const handlePresetSelect = (preset: typeof TEMPLATE_PRESETS[number]) => {
    setTemplate(prev => ({
      ...prev, frameUrl: preset.svg, nameColor: preset.accent,
      photoX: 340, photoY: 420, photoRadius: 260, nameX: 540, nameY: 825, nameFontSize: 52,
    }));
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

  const steps = [{ num: 1, title: 'Details' }, { num: 2, title: 'Template' }, { num: 3, title: 'Review' }];

  return (
    <div className="p-4 md:p-8 pb-32 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-3">{campaign.id ? 'Edit Campaign' : 'Create Campaign'}</h1>
          <div className="flex items-center gap-2 text-sm font-medium">
            {steps.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div onClick={() => setStep(s.num)} className={cn('flex items-center gap-2 cursor-pointer transition-colors', step === s.num ? 'text-amber-400' : step > s.num ? 'text-green-400' : 'text-ink-500')}>
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border', step === s.num ? 'border-amber-400 bg-amber-400/10' : step > s.num ? 'border-green-400 bg-green-400/10' : 'border-ink-600')}>
                    {step > s.num ? <CheckCircle2 size={14} /> : s.num}
                  </div>
                  <span className="hidden sm:block">{s.title}</span>
                </div>
                {idx < 2 && <div className="w-10 h-px bg-ink-700" />}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          {step > 1 && <button onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-xl glass text-sm hover:text-white border border-white/10">Back</button>}
          {step < 3
            ? <button onClick={() => setStep(step + 1)} className="btn-gold px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">Next <ChevronRight size={15} /></button>
            : <button onClick={handleSave} disabled={saving} className="btn-gold px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">{saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Publish</button>
          }
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Details */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="glass p-6 md:p-8 rounded-2xl border border-white/8">
            <div className="flex items-center gap-2 text-lg font-bold border-b border-white/8 pb-4 mb-6"><Settings2 size={18} className="text-amber-400" /> General Information</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5">Event Title *</label>
                <input type="text" value={campaign.title} onChange={e => setCampaign({ ...campaign, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} className="w-full bg-ink-900 p-3 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm" placeholder="e.g. Government Secondary School Aujara Reunion 2026" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5">Organization / Logo Text</label>
                <input type="text" value={campaign.logoText} onChange={e => setCampaign({ ...campaign, logoText: e.target.value })} className="w-full bg-ink-900 p-3 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm" placeholder="e.g. GSS AUJARA" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5">Tagline / Subtitle</label>
                <input type="text" value={campaign.tagline} onChange={e => setCampaign({ ...campaign, tagline: e.target.value })} className="w-full bg-ink-900 p-3 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm" placeholder="e.g. OLD BOYS REUNION 2026" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5">Public URL Slug</label>
                <div className="flex">
                  <span className="bg-ink-900 border border-r-0 border-white/10 text-ink-500 px-3 py-3 rounded-l-xl text-xs hidden sm:flex items-center">frameit.app/c/</span>
                  <input type="text" value={campaign.slug} onChange={e => setCampaign({ ...campaign, slug: e.target.value })} className="w-full bg-ink-900 p-3 rounded-r-xl border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5">Short Title (Mobile)</label>
                <input type="text" value={campaign.shortTitle} onChange={e => setCampaign({ ...campaign, shortTitle: e.target.value })} className="w-full bg-ink-900 p-3 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm" placeholder="e.g. GSS Reunion" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5">Event Date</label>
                <input type="text" value={campaign.eventDate} onChange={e => setCampaign({ ...campaign, eventDate: e.target.value })} className="w-full bg-ink-900 p-3 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm" placeholder="e.g. SUNDAY, JUNE 29TH 2026" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5">Venue</label>
                <input type="text" value={campaign.venue} onChange={e => setCampaign({ ...campaign, venue: e.target.value })} className="w-full bg-ink-900 p-3 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm" placeholder="e.g. School Hall, Aujara" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5">Attendee Label</label>
                <input type="text" value={campaign.attendeeLabel} onChange={e => setCampaign({ ...campaign, attendeeLabel: e.target.value })} className="w-full bg-ink-900 p-3 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm" placeholder="e.g. I'M ATTENDING" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea rows={3} value={campaign.description} onChange={e => setCampaign({ ...campaign, description: e.target.value })} className="w-full bg-ink-900 p-3 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm resize-none" placeholder="Tell attendees about this event..." />
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Template */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8">

            {/* Left sidebar */}
            <div className="space-y-5">
              <div className="glass p-5 rounded-2xl border border-white/8">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-ink-200"><ImageIcon size={16} className="text-amber-400" /> Choose Template</h3>

                <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">6 Premium Presets</p>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {TEMPLATE_PRESETS.map(preset => (
                    <div key={preset.id} onClick={() => handlePresetSelect(preset)}
                      className={cn('cursor-pointer group rounded-xl overflow-hidden border-2 transition-all', template.frameUrl === preset.svg ? 'border-amber-400 shadow-lg shadow-amber-400/20' : 'border-white/10 hover:border-amber-400/50')}>
                      <div className="aspect-square relative overflow-hidden" style={{ background: `radial-gradient(ellipse at 60% 40%, ${preset.primary}, ${preset.bg})` }}>
                        <img src={preset.svg} alt={preset.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="px-2 py-1.5 bg-ink-900">
                        <p className="text-[10px] font-bold text-center text-ink-300 group-hover:text-amber-400 transition-colors truncate">{preset.icon} {preset.name}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/8 pt-4">
                  <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">Or Upload Custom Frame</p>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-amber-400/35 bg-amber-400/4 hover:bg-amber-400/8 transition-colors rounded-xl p-5 cursor-pointer">
                    {uploading ? <Loader2 className="animate-spin text-amber-400 mb-2" size={22} /> : <Upload className="text-amber-400 mb-2" size={22} />}
                    <span className="text-xs font-bold text-amber-400">{uploading ? 'Uploading...' : 'Upload Custom Frame'}</span>
                    <p className="text-[10px] text-ink-500 mt-1">Transparent PNG · Max 10MB</p>
                    <input type="file" accept="image/png" className="hidden" onChange={handleFrameUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              {/* Adjustments */}
              <div className="glass p-5 rounded-2xl border border-white/8">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-ink-200"><Palette size={16} className="text-amber-400" /> Adjustments</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-ink-400 uppercase mb-1.5"><label>Photo Radius</label><span className="text-amber-400">{template.photoRadius}px</span></div>
                    <input type="range" min="150" max="450" value={template.photoRadius} onChange={e => setTemplate({ ...template, photoRadius: Number(e.target.value) })} className="w-full accent-amber-400" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-ink-400 uppercase mb-1.5"><label>Name Font Size</label><span className="text-amber-400">{template.nameFontSize}px</span></div>
                    <input type="range" min="20" max="100" value={template.nameFontSize} onChange={e => setTemplate({ ...template, nameFontSize: Number(e.target.value) })} className="w-full accent-amber-400" />
                  </div>
                  {!isPreset && (
                    <div className="flex justify-between items-center pt-1">
                      <label className="text-xs text-ink-400 font-bold uppercase">Name Color</label>
                      <input type="color" value={template.nameColor} onChange={e => setTemplate({ ...template, nameColor: e.target.value })} className="w-9 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview canvas */}
            <div className="glass p-6 rounded-2xl border border-white/8 flex flex-col">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/8">
                <div>
                  <h3 className="font-bold text-base">Live Preview</h3>
                  <p className="text-xs text-ink-400 mt-0.5">Drag the blue circle to reposition the photo area. Drag the text to reposition the name.</p>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center bg-ink-950 rounded-xl border border-ink-800 overflow-auto p-4">
                <div style={{ width: EDITOR_SIZE, height: EDITOR_SIZE, backgroundColor: campaign.themeBg, flexShrink: 0 }} className="relative shadow-2xl">
                  <Stage width={EDITOR_SIZE} height={EDITOR_SIZE} ref={stageRef}>
                    <Layer>
                      <Rect width={EDITOR_SIZE} height={EDITOR_SIZE} fill={campaign.themeBg || '#050505'} />
                      {frameImage && <KonvaImage image={frameImage} width={EDITOR_SIZE} height={EDITOR_SIZE} listening={false} />}

                      {/* Preset text preview */}
                      {isPreset && (
                        <Group>
                          <Text text={campaign.logoText || 'ORGANIZATION'} x={620 * ratio} y={96 * ratio} width={420 * ratio} align="center" fontSize={26 * ratio} fill={campaign.themeAccent || '#FFD700'} fontFamily="Playfair Display" fontStyle="bold" shadowColor="black" shadowBlur={5} listening={false} />
                          <Text text={(campaign.title || 'EVENT NAME').toUpperCase()} x={620 * ratio} y={186 * ratio} width={420 * ratio} align="center" fontSize={48 * ratio} fill="#ffffff" fontFamily="Playfair Display" fontStyle="bold" shadowColor="black" shadowBlur={12} shadowOffsetY={5} listening={false} />
                          <Text text={(campaign.tagline || 'REUNION 2026').toUpperCase()} x={620 * ratio} y={464 * ratio} width={420 * ratio} align="center" fontSize={22 * ratio} fill={campaign.themeAccent || '#FFD700'} fontFamily="DM Sans" fontStyle="bold" letterSpacing={3} listening={false} />
                          <Text text={`★ ${campaign.attendeeLabel || "I'M ATTENDING"} ★`} x={0} y={740 * ratio} width={1080 * ratio} align="center" fontSize={16 * ratio} fill="#ffffff" fontFamily="DM Sans" fontStyle="bold" letterSpacing={4} listening={false} />
                          <Text text="DATE:" x={78 * ratio} y={958 * ratio} width={270 * ratio} fontSize={14 * ratio} fill={campaign.themeAccent || '#FFD700'} fontFamily="DM Sans" fontStyle="bold" listening={false} />
                          <Text text={campaign.eventDate || 'Event Date'} x={78 * ratio} y={988 * ratio} width={270 * ratio} fontSize={18 * ratio} fill="#ffffff" fontFamily="DM Sans" fontStyle="bold" listening={false} />
                          <Text text="VENUE:" x={432 * ratio} y={958 * ratio} width={600 * ratio} fontSize={14 * ratio} fill={campaign.themeAccent || '#FFD700'} fontFamily="DM Sans" fontStyle="bold" listening={false} />
                          <Text text={campaign.venue || 'Venue, City'} x={432 * ratio} y={988 * ratio} width={600 * ratio} fontSize={18 * ratio} fill="#ffffff" fontFamily="DM Sans" fontStyle="bold" wrap="word" listening={false} />
                        </Group>
                      )}

                      {/* Draggable photo zone indicator */}
                      <Group x={(template.photoX || 340) * ratio} y={(template.photoY || 420) * ratio} draggable
                        onDragMove={(e) => setTemplate({ ...template, photoX: e.target.x() / ratio, photoY: e.target.y() / ratio })}>
                        <Circle x={0} y={0} radius={(template.photoRadius || 260) * ratio} fill="rgba(59,130,246,0.15)" stroke="#3B82F6" strokeWidth={2} dash={[6, 4]} />
                        <Circle x={0} y={0} radius={7} fill="#3B82F6" />
                        <Text text="DRAG PHOTO ZONE" x={-48} y={-8} fill="#3B82F6" fontStyle="bold" fontSize={11} listening={false} />
                      </Group>

                      {/* Draggable name indicator */}
                      <Group x={(template.nameX || 540) * ratio} y={(template.nameY || 825) * ratio} draggable
                        onDragMove={(e) => setTemplate({ ...template, nameX: e.target.x() / ratio, nameY: e.target.y() / ratio })}>
                        <Rect x={-220} y={-18} width={440} height={38} stroke="#F59E0B" strokeWidth={1.5} dash={[5, 4]} fill="rgba(245,158,11,0.05)" />
                        <Text text="ATTENDEE NAME" x={-220} y={0} width={440} align="center" fontSize={(template.nameFontSize || 52) * ratio} fontFamily={template.nameFont} fill={template.nameColor} fontStyle="bold" shadowColor="black" shadowBlur={5} />
                        <Circle x={0} y={0} radius={5} fill="#F59E0B" />
                      </Group>
                    </Layer>
                  </Stage>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="glass p-8 rounded-2xl border border-white/8 max-w-2xl mx-auto text-center space-y-6">
            <div className="w-20 h-20 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 size={40} /></div>
            <h2 className="font-display text-3xl font-bold">Ready to Publish?</h2>
            <p className="text-ink-400">Your campaign <strong className="text-white">{campaign.title}</strong> is configured and ready.</p>
            <div className="bg-ink-900/80 border border-white/8 rounded-xl p-5 text-left space-y-3">
              {[
                { label: 'Public URL', value: `/c/${campaign.slug}` },
                { label: 'Template', value: template.frameUrl ? '✓ HD Frame Loaded' : '⚠ No frame set' },
                { label: 'Accent Color', value: campaign.themeAccent || 'Default' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-ink-500 text-sm">{row.label}</span>
                  <span className="text-amber-400 text-sm font-medium">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 bg-amber-400/8 border border-amber-400/20 p-4 rounded-xl cursor-pointer"
              onClick={() => setCampaign({ ...campaign, isPublished: !campaign.isPublished })}>
              <input type="checkbox" checked={campaign.isPublished} readOnly className="w-5 h-5 accent-amber-400 pointer-events-none" />
              <label className="font-bold text-amber-400 cursor-pointer">Make this campaign Live & Public</label>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-gold w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save & Launch Campaign
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// MAIN LAYOUT & ROUTING
// ==========================================
function Layout() {
  const { darkMode, toggleTheme, token } = useAppStore();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 glass border-b border-white/8 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <Layers size={20} className="text-amber-400" /> Frame<span className="text-amber-400">It</span>
          </Link>
          <nav className="hidden md:flex gap-6 font-medium text-sm text-ink-300">
            <Link to="/" className="hover:text-amber-400 transition-colors">Home</Link>
            <Link to="/explore" className="hover:text-amber-400 transition-colors">Explore</Link>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white/8 text-ink-400">{darkMode ? <Sun size={17} /> : <Moon size={17} />}</button>
            {token ? (
              <Link to="/dashboard" className="hidden sm:flex items-center gap-2 btn-gold px-4 py-2 rounded-xl text-sm font-bold"><LayoutDashboard size={15} /> Dashboard</Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="text-ink-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Sign In</Link>
                <Link to="/register" className="btn-gold px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-amber-400/20">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 pt-16"><Outlet /></main>
      <footer className="border-t border-white/8 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-ink-500">
          <p>© {new Date().getFullYear()} FrameIt Platform · Premium Event DP Generator</p>
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
  const stored = localStorage.getItem('eventdp-storage');
  if (!stored || stored.includes('"darkMode":true')) {
    document.documentElement.classList.add('dark');
  }
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
