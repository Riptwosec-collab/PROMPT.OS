'use client';

import dynamic from 'next/dynamic';
import LanguageRuntime from '../components/LanguageRuntime.jsx';

const PromptOS = dynamic(() => import('../components/PromptOS.jsx'), {
  ssr: false,
  loading: () => (
    <main className="min-h-screen bg-[#050914] text-cyan-400 grid place-items-center font-mono">
      BOOTING_PROMPT.OS...
    </main>
  ),
});

export default function HomePage() {
  return (
    <LanguageRuntime>
      <PromptOS />
    </LanguageRuntime>
  );
}
