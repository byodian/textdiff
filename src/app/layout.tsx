import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TextDiff — Text & Code Snippet & Diff Inspector',
  description: 'A focused, aesthetic workspace for drafting snippets, inspecting real-time diffs, and traversing revision histories.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-canvas text-slate-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
