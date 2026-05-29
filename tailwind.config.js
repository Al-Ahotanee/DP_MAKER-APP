/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // ── Font Families ──────────────────────────────────────
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },

      // ── Full Color System ───────────────────────────────────
      colors: {
        // Near-black surface scale (primary UI palette)
        ink: {
          50:  '#f8f9fa',
          100: '#f1f3f5',
          200: '#e2e8f0',
          300: '#c9d1db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#080a0e',
        },

        // Gold metallic scale
        gold: {
          DEFAULT: '#D4AF37',
          50:  '#FFFACC',
          100: '#F5E27A',
          200: '#EDD050',
          300: '#D4AF37',
          400: '#C9A100',
          500: '#B8922A',
          600: '#9A7820',
          700: '#7B5E14',
          800: '#5C440C',
          900: '#3D2C06',
          950: '#1E1503',
        },

        // Rose gold accent scale
        'rose-gold': {
          DEFAULT: '#C9A96E',
          light:   '#E8D5A3',
          dark:    '#8B6A3E',
        },

        // Sapphire accent scale
        sapphire: {
          DEFAULT: '#2563EB',
          light:   '#93C5FD',
          dark:    '#1E3A8A',
        },

        // Brand aliases
        brand: {
          DEFAULT:  '#D4AF37',
          primary:  '#D4AF37',
          muted:    '#B8922A',
          bright:   '#F5E27A',
        },
      },

      // ── Typography Scale ────────────────────────────────────
      fontSize: {
        '2xs':  ['0.65rem',  { lineHeight: '1rem' }],
        xs:     ['0.75rem',  { lineHeight: '1.1rem' }],
        sm:     ['0.875rem', { lineHeight: '1.35rem' }],
        base:   ['1rem',     { lineHeight: '1.6rem' }],
        lg:     ['1.125rem', { lineHeight: '1.75rem' }],
        xl:     ['1.25rem',  { lineHeight: '1.85rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl':  ['3rem',     { lineHeight: '1.1' }],
        '6xl':  ['3.75rem',  { lineHeight: '1.05' }],
        '7xl':  ['4.5rem',   { lineHeight: '1.0' }],
        '8xl':  ['6rem',     { lineHeight: '1.0' }],
      },

      // ── Spacing & Sizing ────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
        '26':  '6.5rem',
        '30':  '7.5rem',
      },

      // ── Border Radius ───────────────────────────────────────
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl':   '1.5rem',
        '4xl':   '2rem',
      },

      // ── Box Shadows ─────────────────────────────────────────
      boxShadow: {
        'xs':        '0 1px 3px rgba(0,0,0,0.3)',
        'card':      '0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4)',
        'card-gold': '0 4px 20px rgba(212,175,55,0.2), 0 0 0 1px rgba(212,175,55,0.12)',
        'luxury':    '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        'glow-gold': '0 0 20px rgba(212,175,55,0.4), 0 0 60px rgba(212,175,55,0.15)',
        'glow-sm':   '0 0 8px rgba(212,175,55,0.3)',
        'inner-gold':'inset 0 1px 0 rgba(212,175,55,0.15)',
        'canvas':    '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.1)',
      },

      // ── Backdrop Blur ───────────────────────────────────────
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },

      // ── Animations ──────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          '0%':   { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-8px)' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-right': {
          '0%':   { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',     opacity: '1' },
        },
        'scale-in': {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(212,175,55,0.3)' },
          '50%':      { boxShadow: '0 0 28px rgba(212,175,55,0.7)' },
        },
        'border-shine': {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },

      animation: {
        'fade-in':    'fade-in 0.25s ease forwards',
        'fade-out':   'fade-out 0.2s ease forwards',
        'slide-up':   'slide-up 0.3s ease forwards',
        'slide-right':'slide-right 0.3s ease forwards',
        'scale-in':   'scale-in 0.2s ease forwards',
        'shimmer':    'shimmer 2.5s linear infinite',
        'float':      'float 4s ease-in-out infinite',
        'spin-slow':  'spin-slow 8s linear infinite',
        'pulse-gold': 'pulse-gold 2.5s ease-in-out infinite',
        'border-shine':'border-shine 3s ease infinite',
      },

      // ── Background Images ───────────────────────────────────
      backgroundImage: {
        'gold-gradient':    'linear-gradient(90deg, #4A3208 0%, #B8922A 20%, #F5E27A 50%, #FFFACC 50%, #F5E27A 60%, #B8922A 80%, #4A3208 100%)',
        'gold-linear':      'linear-gradient(135deg, #F5C518 0%, #D4A017 40%, #c49010 100%)',
        'ink-gradient':     'linear-gradient(145deg, rgba(25,30,40,0.95), rgba(12,15,20,0.98))',
        'radial-gold':      'radial-gradient(ellipse at center, rgba(212,175,55,0.15) 0%, transparent 70%)',
        'dots-gold':        'radial-gradient(circle, rgba(212,175,55,0.4) 1px, transparent 1px)',
      },

      // ── Z-index scale ───────────────────────────────────────
      zIndex: {
        '1':   '1',
        '2':   '2',
        '60':  '60',
        '70':  '70',
        '80':  '80',
        '90':  '90',
        '100': '100',
      },

      // ── Grid templates ──────────────────────────────────────
      gridTemplateColumns: {
        'auto-fill-280': 'repeat(auto-fill, minmax(280px, 1fr))',
        'auto-fill-320': 'repeat(auto-fill, minmax(320px, 1fr))',
      },
    },
  },
  plugins: [],
};
