import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: 'var(--color-canvas-default, #0b0f19)',
          editor: 'var(--color-editor-bg, #1e1e1e)',
          elevated: 'var(--color-canvas-elevated, #111827)',
          surface: 'var(--color-canvas-surface, #161e2e)',
          border: 'var(--color-canvas-border, #1f293d)',
          highlight: 'var(--color-canvas-highlight, #28354f)',
          text: 'var(--color-text-primary, #f8fafc)',
          secondary: 'var(--color-text-secondary, #cbd5e1)',
          muted: 'var(--color-text-muted, #64748b)',
        },
        brand: {
          primary: 'var(--color-brand-primary, #38bdf8)', // Electric Sky / Accent
          text: 'var(--color-brand-text, #ffffff)',
          glow: '#0284c7',
        },
        diff: {
          added: '#10b981',
          addedBg: 'rgba(16, 185, 129, 0.12)',
          removed: '#f43f5e',
          removedBg: 'rgba(244, 63, 94, 0.12)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
