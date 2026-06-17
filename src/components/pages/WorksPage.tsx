import { motion } from 'motion/react';
import type { Album } from '../../types/portfolio';
import Magnetic from '../Magnetic';
import { assetUrl } from '../../utils/asset';

interface WorksPageProps {
  albums: Album[];
  onAlbumOpen: (id: string) => void;
  onNavigate: (path: string) => void;
}

export default function WorksPage({ albums, onAlbumOpen, onNavigate }: WorksPageProps) {
  return (
    <motion.main
      key="works"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="pt-28 md:pt-32 px-5 md:px-8 pb-20 max-w-[1600px] mx-auto min-h-screen relative z-10"
    >
      <section className="mb-16 md:mb-20 grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
        <div>
          <p className="text-micro mb-5 text-white/35">WORKS / {albums.length} CHAPTERS</p>
          <h1 className="font-serif text-[clamp(2.85rem,6.2vw,6.2rem)] leading-[1.02] text-white/90">
            Colin的摄影集
          </h1>
        </div>
        <div className="max-w-xl md:ml-auto">
          <p className="font-serif text-lg md:text-xl leading-[2] tracking-[0.06em] text-white/58">
            这里是一些公园、海边、动物和路过城市角落的章节。每一组照片都像一段停下来的路程。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Magnetic>
              <button
                type="button"
                onClick={() => onNavigate('/about')}
                className="rounded-full border border-white/15 px-5 py-2 text-xs tracking-[0.18em] text-white/60 transition-colors hover:border-white/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
              >
                ABOUT
              </button>
            </Magnetic>
            <Magnetic>
              <button
                type="button"
                onClick={() => onNavigate('/blog')}
                className="rounded-full border border-white/15 px-5 py-2 text-xs tracking-[0.18em] text-white/60 transition-colors hover:border-white/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
              >
                JOURNAL 日记
              </button>
            </Magnetic>
          </div>
        </div>
      </section>

      <div className="flex flex-col">
        {albums.map((album, index) => {
          const layoutType = index % 3;
          let containerClasses = 'group cursor-pointer flex flex-col relative ';
          let imageContainerClasses = 'overflow-hidden rounded-sm relative z-10 ';
          let textContainerClasses = 'flex flex-col justify-center relative z-20 ';
          const isZhuozheng = album.id === 'zhuozheng-garden';

          if (layoutType === 0) {
            containerClasses += 'md:flex-row items-center md:gap-12 ml-0 md:ml-12 mb-20 md:mb-24';
            imageContainerClasses += 'w-full md:w-3/5 aspect-[16/10]';
            textContainerClasses += 'w-full md:w-2/5 mt-6 md:mt-0 md:-ml-16 md:mt-24';
          } else if (layoutType === 1) {
            containerClasses += 'md:flex-row-reverse items-center md:gap-16 mr-0 md:mr-24 mb-20 md:mb-24';
            imageContainerClasses += 'w-full md:w-2/5 aspect-[4/3]';
            textContainerClasses += 'w-full md:w-3/5 mt-6 md:mt-0 md:text-right md:items-end';
          } else {
            containerClasses += 'items-center mb-20 md:mb-24';
            imageContainerClasses += 'w-full md:w-4/5 aspect-[21/9]';
            textContainerClasses += 'w-full text-center mt-8 md:-mt-16 bg-[#0a0a0f]/80 backdrop-blur-md p-8 md:w-1/2 border border-white/5';
          }

          if (isZhuozheng) {
            imageContainerClasses = 'overflow-hidden rounded-sm relative z-10 w-full md:w-4/5 aspect-[235/100]';
          }

          return (
            <motion.div
              key={album.id}
              data-album-id={album.id}
              role="button"
              tabIndex={0}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className={containerClasses}
              onClick={() => onAlbumOpen(album.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onAlbumOpen(album.id);
                }
              }}
            >
              <div className={imageContainerClasses}>
                <img
                  src={assetUrl(album.coverImage)}
                  alt={album.title}
                  className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 opacity-75 group-hover:opacity-100 group-focus-visible:opacity-100"
                  style={{ objectPosition: album.style.coverObjectPosition ?? '50% 50%' }}
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/5 group-focus-visible:bg-black/5 transition-colors duration-500" />
              </div>
              <div className={textContainerClasses}>
                <p className="text-micro mb-4" style={{ color: album.style.accentColor }}>{album.location}</p>
                <h2
                  className={`${album.style.fontClass} mb-4 text-[clamp(2.6rem,5vw,4.9rem)] leading-[1.08] transition-all duration-1000 ease-out group-hover:tracking-[0.04em]`}
                  style={{ color: album.style.accentColor }}
                >
                  {album.title}
                </h2>
                <p className="text-sm tracking-wider opacity-50 mb-6">{album.epigraph}</p>
                <div
                  className={`w-12 h-[1px] group-hover:w-24 transition-all duration-500 ${layoutType === 1 ? 'md:ml-auto' : ''} ${layoutType === 2 ? 'mx-auto' : ''}`}
                  style={{ backgroundColor: `${album.style.accentColor}60` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.main>
  );
}
