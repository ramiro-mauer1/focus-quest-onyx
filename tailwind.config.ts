import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        onyx: {
          bg: '#020817',
          t1: '#e2e8f0',
          t2: '#94a3b8',
          t3: '#334155',
        },
        pillar: {
          pro: '#f97316',
          des: '#ef4444',
          bod: '#38bdf8',
          rhy: '#22c55e',
        },
        violet: {
          accent: '#a855f7',
          soft: '#c084fc',
          deep: '#6d28d9',
        },
      },
      animation: {
        'aura-spin': 'aura-spin 16s linear infinite',
        'aura-spin-rev': 'aura-spin-reverse 10s linear infinite',
        'avatar-float': 'avatar-float 4s ease-in-out infinite',
        'led-pulse': 'led-pulse 2.8s ease-in-out infinite',
        'cursor-blink': 'blink 1s step-end infinite',
        'slide-down': 'slide-down 0.22s ease forwards',
        'toast-in': 'toast-in 0.25s ease forwards',
      },
    },
  },
  plugins: [],
};

export default config;
