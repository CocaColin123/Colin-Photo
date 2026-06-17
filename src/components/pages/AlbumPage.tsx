import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play } from 'lucide-react';
import type { Album, Media } from '../../types/portfolio';
import Magnetic from '../Magnetic';
import { assetUrl } from '../../utils/asset';

interface AlbumPageProps {
  album: Album;
  albumIndex: number;
  showOverlay: boolean;
  onBack: () => void;
  onSelectMedia: (item: Media) => void;
  onShowOverlayChange: (value: boolean) => void;
  renderImageOverlays: (item: Media, mode: 'card' | 'lightbox') => ReactNode;
}

export default function AlbumPage({
  album,
  albumIndex,
  showOverlay,
  onBack,
  onSelectMedia,
  onShowOverlayChange,
  renderImageOverlays,
}: AlbumPageProps) {
  const accent = album.style.accentColor;
  const fontCls = album.style.fontClass;
  const lead = album.media[0];
  const rest = album.media.slice(1);

  return (
    <motion.main
      key={album.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="pt-32 px-6 pb-24 max-w-[1800px] mx-auto min-h-screen relative z-10"
    >
      <div
        className={`${fontCls} fixed pointer-events-none select-none z-[1] leading-none`}
        style={{ fontSize: 'clamp(20rem, 45vw, 40rem)', color: accent, opacity: 0.03, ...album.style.bgCharPos }}
      >
        {album.style.bgChar}
      </div>

      <div className="flex items-center justify-between mb-12 relative z-10 px-2 md:px-6">
        <Magnetic>
          <button onClick={onBack} data-no-sfx className="flex items-center gap-2 text-micro hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> 返回作品集
          </button>
        </Magnetic>

        <div className="mode-switch relative z-[60] flex rounded-full border overflow-hidden transition-colors duration-300" style={{ borderColor: `${accent}30` }}>
          <button
            onClick={() => onShowOverlayChange(true)}
            className="px-4 py-1.5 text-xs tracking-[0.15em] transition-all duration-300"
            style={{ backgroundColor: showOverlay ? `${accent}20` : 'transparent', color: showOverlay ? accent : 'rgba(255,255,255,0.35)' }}
          >
            诗意
          </button>
          <div className="w-[1px] self-stretch" style={{ backgroundColor: `${accent}20` }} />
          <button
            onClick={() => onShowOverlayChange(false)}
            className="px-4 py-1.5 text-xs tracking-[0.15em] transition-all duration-300"
            style={{ backgroundColor: !showOverlay ? `${accent}20` : 'transparent', color: !showOverlay ? accent : 'rgba(255,255,255,0.35)' }}
          >
            纯净
          </button>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[0.75fr_1.35fr] lg:gap-20 relative z-10">
        <aside className={`${fontCls} lg:sticky lg:top-32 h-fit`}>
          <p className="text-sm tracking-[0.2em] mb-6 opacity-50" style={{ color: accent }}>{album.location}</p>
          <h1 className="mb-6 text-[clamp(2.7rem,4.8vw,4.8rem)] leading-[1.12]" style={{ color: accent }}>{album.title}</h1>
          <p className="text-base tracking-wider opacity-40 mb-10 italic" style={{ color: accent }}>{album.epigraph}</p>
          <div className="w-16 h-[1px] mb-10" style={{ backgroundColor: `${accent}40` }} />
          <p className="text-lg md:text-xl leading-[2.2] tracking-[0.06em]" style={{ color: `${accent}cc` }}>
            {album.description}
          </p>
          <dl className="mt-12 grid grid-cols-3 gap-4 border-y border-white/10 py-6 text-white/45">
            <div>
              <dt className="text-[10px] tracking-[0.2em]">CHAPTER</dt>
              <dd className="mt-2 font-serif text-2xl text-white/70">{String(albumIndex + 1).padStart(2, '0')}</dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.2em]">FRAMES</dt>
              <dd className="mt-2 font-serif text-2xl text-white/70">{album.media.length}</dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.2em]">TONE</dt>
              <dd className="mt-2 h-7 w-7 rounded-full border border-white/20" style={{ backgroundColor: accent }} />
            </div>
          </dl>
        </aside>

        <section>
          {lead && (
            <button
              type="button"
              onClick={() => onSelectMedia(lead)}
              className="group relative mb-10 block w-full overflow-hidden rounded-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
            >
              <div className="aspect-[16/9] overflow-hidden bg-black">
                {lead.type === 'image' ? (
                  <img
                    src={assetUrl(lead.url)}
                    alt={lead.title}
                    className="h-full w-full object-cover opacity-85 transition-all duration-1000 group-hover:scale-[1.025] group-hover:opacity-100"
                    style={{ objectPosition: album.style.coverObjectPosition ?? '50% 50%' }}
                  />
                ) : (
                  <video src={lead.url} poster={lead.thumbnail} autoPlay loop muted playsInline className="h-full w-full object-cover" />
                )}
              </div>
              {renderImageOverlays(lead, 'card')}
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-6">
                <div>
                  <p className="text-[10px] tracking-[0.25em] text-white/45">LEAD FRAME</p>
                  <h2 className="mt-2 font-serif text-2xl text-white/80">{lead.title}</h2>
                </div>
              </div>
            </button>
          )}

          <div className="masonry-grid">
            {rest.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
                className="masonry-item"
              >
                <div className="group relative cursor-pointer overflow-hidden rounded-sm" onClick={() => onSelectMedia(item)}>
                  {item.type === 'image' ? (
                    album.id === 'zhuozheng-garden' ? (
                      <div className="w-full aspect-[235/100] overflow-hidden">
                        <img src={assetUrl(item.url)} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
                      </div>
                    ) : (
                      <img src={assetUrl(item.url)} alt={item.title} className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
                    )
                  ) : (
                    <div className="relative w-full aspect-video md:aspect-square">
                      <video src={item.url} poster={item.thumbnail} autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center">
                          <Play className="w-5 h-5 text-white ml-1" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                  )}
                  {renderImageOverlays(item, 'card')}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                    <h3 className="font-serif text-xl">{item.title}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </motion.main>
  );
}
