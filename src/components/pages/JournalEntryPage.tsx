import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { marked } from 'marked';
import type { JournalEntry } from '../../types/journal';
import { assetUrl } from '../../utils/asset';
import Magnetic from '../Magnetic';

interface JournalEntryPageProps {
  entry: JournalEntry | null;
  onNavigate: (path: string) => void;
}

export default function JournalEntryPage({ entry, onNavigate }: JournalEntryPageProps) {
  if (!entry) {
    return (
      <motion.main className="relative z-10 min-h-screen px-6 pb-24 pt-32" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <section className="mx-auto max-w-3xl border-y border-white/10 py-16 text-center">
          <p className="font-serif text-3xl text-white/70">没有找到这篇日记。</p>
          <button className="mt-8 text-micro text-white/50 hover:text-white" onClick={() => onNavigate('/blog')}>
            返回 Journal
          </button>
        </section>
      </motion.main>
    );
  }

  return (
    <motion.main
      key={entry.slug}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="relative z-10 min-h-screen px-6 pb-24 pt-32"
    >
      <article className="mx-auto max-w-[1320px]">
        <Magnetic>
          <button onClick={() => onNavigate('/blog')} className="mb-10 flex items-center gap-2 text-micro text-white/45 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> 返回 Journal
          </button>
        </Magnetic>

        <header className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="text-micro mb-5 text-white/35">{entry.date}{entry.location ? ` / ${entry.location}` : ''}</p>
            <h1 className="font-serif text-[clamp(2.5rem,5.8vw,5.8rem)] leading-[1.08] text-white/90">{entry.title}</h1>
          </div>
          <p className="max-w-2xl font-serif text-xl leading-[2] tracking-[0.06em] text-white/58 lg:ml-auto">
            {entry.excerpt}
          </p>
        </header>

        {entry.coverImage && (
          <div className="mt-14 overflow-hidden">
            <img src={assetUrl(entry.coverImage)} alt="" className="aspect-[16/8] w-full object-cover opacity-82" />
          </div>
        )}

        <div className="mx-auto mt-14 max-w-[760px] border-y border-white/10 py-10">
          <div
            className="font-serif text-lg leading-[2.25] tracking-[0.06em] text-white/70 space-y-8 [&_p]:mb-0 [&_p]:[text-indent:2em]"
            dangerouslySetInnerHTML={{ __html: marked.parse(entry.body) as string }}
          />
        </div>

        {entry.relatedAlbumId && (
          <div className="mx-auto mt-12 max-w-[760px]">
            <button
              type="button"
              onClick={() => onNavigate(`/album/${entry.relatedAlbumId}`)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-xs tracking-[0.16em] text-white/62 transition-colors hover:border-white/35 hover:text-white"
            >
              相关相册 <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </article>
    </motion.main>
  );
}
