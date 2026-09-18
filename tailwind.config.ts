import type { Config } from "tailwindcss";

function withOpacity(variableName: string, fallback: string) {
  return ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue !== undefined) {
      return `color-mix(in srgb, var(${variableName}, ${fallback}) calc(${opacityValue} * 100%), transparent)`;
    }
    return `var(${variableName}, ${fallback})`;
  };
}

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
          DEFAULT: withOpacity('--color-canvas-default', '#0b0f19'),
          editor: withOpacity('--color-editor-bg', '#1e1e1e'),
          elevated: withOpacity('--color-canvas-elevated', '#111827'),
          surface: withOpacity('--color-canvas-surface', '#161e2e'),
          border: withOpacity('--color-canvas-border', '#1f293d'),
          highlight: withOpacity('--color-canvas-highlight', '#28354f'),
          text: withOpacity('--color-text-primary', '#f8fafc'),
          secondary: withOpacity('--color-text-secondary', '#cbd5e1'),
          muted: withOpacity('--color-text-muted', '#64748b'),
        },
        brand: {
          primary: withOpacity('--color-brand-primary', '#38bdf8'), // Electric Sky / Accent
          text: withOpacity('--color-brand-text', '#ffffff'),
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
