import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#0b0f19',
          elevated: '#111827',
          surface: '#161e2e',
          border: '#1f293d',
          highlight: '#28354f',
        },
        brand: {
          primary: '#38bdf8', // Electric Sky
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
