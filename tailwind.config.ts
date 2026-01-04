import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Cinzel', 'serif'],
        body: ['var(--font-body)', 'DM Sans', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        sans: [
          'var(--font-body)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Arcane Artifact Design System colors
        void: 'rgb(2, 6, 23)',
        stone: {
          DEFAULT: 'rgb(15, 23, 42)',
          light: 'rgb(30, 41, 59)',
          lighter: 'rgb(51, 65, 85)',
        },
        arcane: {
          dim: 'rgb(13, 148, 136)',
          DEFAULT: 'rgb(45, 212, 191)',
          bright: 'rgb(94, 234, 212)',
        },
        gold: {
          dim: 'rgb(180, 140, 20)',
          DEFAULT: 'rgb(251, 191, 36)',
          bright: 'rgb(253, 224, 71)',
        },
        blood: {
          dim: 'rgb(190, 50, 75)',
          DEFAULT: 'rgb(244, 63, 94)',
          bright: 'rgb(251, 113, 133)',
        },
        emerald: {
          dim: 'rgb(20, 160, 120)',
          DEFAULT: 'rgb(52, 211, 153)',
          bright: 'rgb(110, 231, 183)',
        },
        purple: {
          dim: 'rgb(126, 58, 200)',
          DEFAULT: 'rgb(168, 85, 247)',
          bright: 'rgb(192, 132, 252)',
        },
        bone: 'rgb(226, 232, 240)',
        ash: 'rgb(148, 163, 184)',
        smoke: 'rgb(100, 116, 139)',
        // Campaign Ally brand colors
        teal: {
          DEFAULT: '#14b8a6',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
      },
      boxShadow: {
        'card': '0 25px 50px -12px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'glow-arcane': '0 0 20px rgba(45, 212, 191, 0.15)',
        'glow-arcane-strong': '0 0 30px rgba(45, 212, 191, 0.3)',
        'glow-gold': '0 0 20px rgba(251, 191, 36, 0.15)',
        'glow-blood': '0 0 20px rgba(244, 63, 94, 0.15)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.15)',
        'etched': 'inset 0 1px 0 rgba(255, 255, 255, 0.06), inset 0 -1px 0 rgba(0, 0, 0, 0.45)',
        'carved': 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      transitionTimingFunction: {
        'snap': 'cubic-bezier(0.2, 0, 0, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'sheen': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(300%)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        'spine-pulse': {
          '0%, 100%': {
            opacity: '0.8',
            boxShadow: '0 0 15px rgba(45, 212, 191, 0.3)'
          },
          '50%': {
            opacity: '1',
            boxShadow: '0 0 25px rgba(45, 212, 191, 0.5)'
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'sheen': 'sheen 0.7s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spine-pulse': 'spine-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
