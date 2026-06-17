import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { JournalEntry } from '../../types/journal';
import { assetUrl } from '../../utils/asset';

interface JournalPageProps {
  entries: JournalEntry[];
  onNavigate: (path: string) => void;
}

export default function JournalPage({ entries, onNavigate }: JournalPageProps) {
  const published = entries.filter(e => e.status !== 'draft');

  return (
    <motion.main
      key="journal"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="relative z-10 min-h-screen px-6 pb-24 pt-32"
    >
      <section className="mx-auto max-w-[1400px]">
        <p className="text-micro mb-5 text-white/35">JOURNAL / 日记</p>
        <div className="grid gap-8 md:grid-cols-[0.95fr_1.05fr] md:items-end">
          <h1 className="font-serif text-[clamp(2.8rem,6.2vw,6.2rem)] leading-[1.04] text-white/90">
            日记
          </h1>
          <p className="max-w-2xl font-serif text-xl leading-[2] tracking-[0.06em] text-white/58 md:ml-auto">
            一些和照片放在一起的文字。它们不是正式文章，更像拍摄之后留下的余温。
          </p>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[1400px]">
        {published.length === 0 ? (
          <div className="border-y border-white/10 py-16 text-center">
            <p className="font-serif text-2xl text-white/62">日记还在整理。</p>
            <p className="mt-4 text-sm tracking-[0.12em] text-white/35">新的文字会放在这里，像夹在照片之间的纸页。</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {published.map((entry, index) => (
              <button
                key={entry.slug}
                type="button"
                onClick={() => onNavigate(`/blog/${entry.slug}`)}
                className="group grid gap-6 border-t border-white/10 pt-8 text-left transition-colors last:border-b last:pb-8 hover:border-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70 md:grid-cols-[0.18fr_0.42fr_0.4fr]"
              >
                <div className="text-micro text-white/30">{String(index + 1).padStart(2, '0')}</div>
                <div>
                  <p className="text-micro mb-4 text-white/35">{entry.date}{entry.location ? ` / ${entry.location}` : ''}</p>
                  <h2 className="font-serif text-3xl text-white/82 transition-colors group-hover:text-white">{entry.title}</h2>
                  <p className="mt-5 max-w-xl text-sm leading-[2] tracking-[0.08em] text-white/48">{entry.excerpt}</p>
                </div>
                <div className="relative min-h-44 overflow-hidden bg-white/[0.03]">
                  {entry.coverImage ? (
                    <img src={assetUrl(entry.coverImage)} alt="" className="h-full min-h-44 w-full object-cover opacity-72 transition-all duration-700 group-hover:scale-105 group-hover:opacity-92" />
                  ) : (
                    <div className="h-full min-h-44 w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
                  )}
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] tracking-[0.2em] text-white/0 transition-colors group-hover:text-white/65">
                    READ <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </motion.main>
  );
}
