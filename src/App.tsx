import { useState, useEffect, useRef, useCallback, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, ArrowLeft, Instagram, Twitter, Mail, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { albums, type Media } from './data';
import CustomCursor from './components/CustomCursor';
import FilmStrip from './components/FilmStrip';
import LandingPage from './components/LandingPage';
import MusicWidget from './components/MusicWidget';
import Magnetic from './components/Magnetic';

const GUIDED_KEY = 'colin-photo-guided';

export default function App() {
  const [entered, setEntered] = useState(false);
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [showZoomPrompt, setShowZoomPrompt] = useState(true);
  const [showCommentary, setShowCommentary] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [spotlightReady, setSpotlightReady] = useState(false);
  const [guided, setGuided] = useState(() => {
    try { return sessionStorage.getItem(GUIDED_KEY) === '1'; } catch { return false; }
  });

  const savedScrollY = useRef(0);
  const sfxApiRef = useRef<{ playClick: (kind: 'grass' | 'tree' | 'sea' | 'stone') => void } | null>(null);

  const albumClickKind = useCallback((albumId: string | null): 'grass' | 'tree' | 'sea' | 'stone' | null => {
    if (!albumId) return null;
    if (albumId === 'dinosaurs') return 'stone';
    if (albumId === 'lambs' || albumId === 'zoo') return 'grass';
    if (albumId === 'gongqing-forest' || albumId === 'longhua-temple' || albumId === 'weipo' || albumId === 'zhuozheng-garden') return 'tree';
    if (albumId === 'seaside' || albumId === 'hupao-park' || albumId === 'seabirds' || albumId === 'sanmenxia-swans') return 'sea';
    return 'stone';
  }, []);

  const activeAlbum = albums.find(a => a.id === activeAlbumId) || null;
  const lightboxIndex = activeAlbum && selectedMedia
    ? activeAlbum.media.findIndex(m => m.id === selectedMedia.id) : -1;
  const lightboxPosition = lightboxIndex >= 0 ? lightboxIndex + 1 : 1;
  const accent = activeAlbum?.style.accentColor ?? '#ffffff';
  const fontCls = activeAlbum?.style.fontClass ?? '';

  const enterAlbum = useCallback((id: string) => {
    savedScrollY.current = window.scrollY;
    const kind = albumClickKind(id);
    if (kind) sfxApiRef.current?.playClick(kind);
    setActiveAlbumId(id);
  }, []);

  const exitAlbum = useCallback(() => {
    setActiveAlbumId(null);
    setShowSpotlight(false);
  }, []);

  const enterSite = useCallback(() => {
    setEntered(true);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const goLanding = useCallback(() => {
    setSelectedMedia(null);
    setActiveAlbumId(null);
    setShowSpotlight(false);
    setEntered(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const goHome = useCallback(() => {
    setEntered(true);
    setSelectedMedia(null);
    setActiveAlbumId(null);
    setShowSpotlight(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  useEffect(() => {
    if (activeAlbumId) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    } else if (savedScrollY.current > 0) {
      const target = savedScrollY.current;
      const tryRestore = () => {
        if (document.body.scrollHeight > target + window.innerHeight * 0.5) {
          window.scrollTo({ top: target, behavior: 'instant' as ScrollBehavior });
        } else {
          requestAnimationFrame(tryRestore);
        }
      };
      const timer = setTimeout(tryRestore, 50);
      return () => clearTimeout(timer);
    }
  }, [activeAlbumId]);

  useEffect(() => {
    document.body.style.overflow = selectedMedia ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedMedia]);
  useEffect(() => { setShowCommentary(false); }, [selectedMedia]);

  useEffect(() => {
    setShowSpotlight(Boolean(activeAlbumId && !guided && spotlightReady));
  }, [activeAlbumId, guided, spotlightReady]);

  // 全局点击音效：在对应相册/相册内点击时播放（排除音乐盒开关、模式切换）
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t) return;
      if (t.closest('[data-music-widget]')) return;
      if (t.closest('.mode-switch')) return;
      if (t.closest('[data-no-sfx]')) return;

      const fromCard = t.closest('[data-album-id]')?.getAttribute('data-album-id') ?? null;
      const ctxAlbum = activeAlbumId ?? fromCard;
      const kind = albumClickKind(ctxAlbum);
      if (kind) sfxApiRef.current?.playClick(kind);
    };
    document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);
  }, [activeAlbumId, albumClickKind]);

  // 让聚光灯等相册首屏图片加载/解码后再出现，避免“遮罩先到、图片后到”的突兀感
  useEffect(() => {
    let cancelled = false;
    setSpotlightReady(false);

    if (!activeAlbumId || guided || !activeAlbum) return;

    const firstBatch = activeAlbum.media
      .filter(m => m.type === 'image' && typeof m.url === 'string' && m.url.length > 0)
      .slice(0, 8);

    const preloadOne = (src: string) => new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = async () => {
        try {
          // decode() 让图片在真正绘制前完成解码，减少首帧抖动
          // 某些浏览器/跨域场景可能抛错，这里降级为“已 onload 即算完成”
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dec = (img as any).decode?.bind(img);
          if (dec) await dec();
        } catch { /* noop */ }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = src;
    });

    const timeout = (ms: number) => new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });

    (async () => {
      try {
        // 不无限等待：图片缺失/很慢时，最多等 6s 也要让引导出现
        await Promise.race([
          Promise.all(firstBatch.map(m => preloadOne(m.url))),
          timeout(6000),
        ]);
      } finally {
        if (!cancelled) setSpotlightReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, [activeAlbumId, guided, activeAlbum]);

  const closeSpotlight = () => setShowSpotlight(false);

  const acknowledgeSpotlight = () => {
    setShowSpotlight(false);
    setGuided(true);
    try { sessionStorage.setItem(GUIDED_KEY, '1'); } catch { /* noop */ }
  };

  const handleNext = (e?: MouseEvent<Element>) => {
    e?.stopPropagation();
    if (!activeAlbum || !selectedMedia) return;
    const i = activeAlbum.media.findIndex(m => m.id === selectedMedia.id);
    if (i < activeAlbum.media.length - 1) setSelectedMedia(activeAlbum.media[i + 1]);
  };
  const handlePrev = (e?: MouseEvent<Element>) => {
    e?.stopPropagation();
    if (!activeAlbum || !selectedMedia) return;
    const i = activeAlbum.media.findIndex(m => m.id === selectedMedia.id);
    if (i > 0) setSelectedMedia(activeAlbum.media[i - 1]);
  };
  const handleDragEnd = (
    _event: PointerEvent | MouseEvent | TouchEvent,
    info: { offset: { x: number; y: number } },
  ) => {
    if (info.offset.x < -50) handleNext();
    else if (info.offset.x > 50) handlePrev();
  };

  const renderImageOverlays = (item: Media, mode: 'card' | 'lightbox') => {
    const isCard = mode === 'card';
    const hasInfo = !!item.infoStamp;
    return (
      <>
        {showOverlay && item.overlay && !hasInfo && (
          <div
            className={`${fontCls} absolute pointer-events-none ${isCard ? 'bottom-3 right-3 md:bottom-4 md:right-4 text-lg md:text-xl' : 'bottom-4 right-6 text-xl md:text-2xl'} tracking-[0.12em] text-right`}
            style={{
              color: accent, opacity: isCard ? 0.85 : 0.7, maxWidth: '70%',
              textShadow: '0 2px 16px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.6)',
            }}>
            {item.overlay}
          </div>
        )}

        {showOverlay && hasInfo && (
          <div
            className={`${fontCls} absolute pointer-events-none`}
            style={{
              left: '8%', bottom: '10%',
              color: '#ffffffee',
              textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.5)',
              letterSpacing: '0.16em',
              lineHeight: 1.8,
            }}>
            <div style={{ fontSize: isCard ? 'clamp(1.25rem, 2.8vw, 1.6rem)' : 'clamp(1.9rem, 3vw, 2.4rem)' }}>
              {item.infoStamp!.place}
            </div>
            <div style={{
              fontSize: isCard ? 'clamp(1.05rem, 2.4vw, 1.35rem)' : 'clamp(1.6rem, 2.4vw, 2rem)',
              opacity: 0.7,
            }}>
              {item.infoStamp!.time}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-white/20 relative">
      {/* 原首页背景光晕（保持原样，不用视频） */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-indigo-950/20 rounded-full blur-[150px]" />
        <div className="absolute top-[30%] right-[-10%] w-[40vw] h-[60vh] bg-slate-800/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[50vh] bg-amber-950/10 rounded-full blur-[150px]" />
      </div>

      <CustomCursor />
      {/* BGM 组件保持常驻，避免落地页→首页重播 */}
      <MusicWidget registerSfxApi={(api) => { sfxApiRef.current = api; }} duckDb={entered && activeAlbumId ? -7 : 0} />
      <FilmStrip accentColor={accent} visible={!selectedMedia && !activeAlbumId} />

      {!entered ? (
        <LandingPage onEnter={enterSite} />
      ) : (
        <>

      <AnimatePresence>
        {showZoomPrompt && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-6 z-50 glass-panel px-4 py-3 rounded-sm flex items-center gap-4 shadow-2xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs tracking-widest opacity-80">提示：缩放页面以获得最佳视觉比例</span>
            </div>
            <button onClick={() => setShowZoomPrompt(false)} className="opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed top-0 left-0 w-full z-40 px-6 py-6 flex justify-between items-center glass-panel border-x-0 border-t-0">
        <Magnetic>
          <div
            className="font-serif text-xl tracking-widest uppercase cursor-pointer"
            onClick={() => {
              // 首页/相册页都允许回落地页；避免首页点 Colin 无反应
              if (entered) goLanding();
            }}
            data-no-sfx
          >
            Colin
          </div>
        </Magnetic>
        <div className="flex gap-6">
          <Magnetic><a href="#" className="text-micro hover:text-white transition-colors">关于 Colin</a></Magnetic>
          <Magnetic><a href="#" className="text-micro hover:text-white transition-colors">联系合作</a></Magnetic>
        </div>
      </nav>

      <AnimatePresence mode="sync">
        {!activeAlbumId ? (
          <motion.main key="home"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="pt-32 px-6 pb-24 max-w-[1600px] mx-auto min-h-screen flex flex-col justify-center relative z-10">
            <div className="flex flex-col">
              {albums.map((album, index) => {
                const layoutType = index % 3;
                let containerClasses = "group cursor-pointer flex flex-col relative ";
                let imageContainerClasses = "overflow-hidden rounded-sm relative z-10 ";
                let textContainerClasses = "flex flex-col justify-center relative z-20 ";
                const isZhuozheng = album.id === 'zhuozheng-garden';
                if (layoutType === 0) {
                  containerClasses += "md:flex-row items-center md:gap-12 ml-0 md:ml-12 mb-32";
                  imageContainerClasses += "w-full md:w-3/5 aspect-[16/10]";
                  textContainerClasses += "w-full md:w-2/5 mt-6 md:mt-0 md:-ml-16 md:mt-24";
                } else if (layoutType === 1) {
                  containerClasses += "md:flex-row-reverse items-center md:gap-16 mr-0 md:mr-24 mb-32";
                  // 取消竖向封面：改为半横向比例
                  imageContainerClasses += "w-full md:w-2/5 aspect-[4/3]";
                  textContainerClasses += "w-full md:w-3/5 mt-6 md:mt-0 md:text-right md:items-end";
                } else {
                  containerClasses += "items-center mb-32";
                  imageContainerClasses += "w-full md:w-4/5 aspect-[21/9]";
                  textContainerClasses += "w-full text-center mt-8 md:-mt-16 bg-[#0a0a0f]/80 backdrop-blur-md p-8 md:w-1/2 border border-white/5";
                }
                // 拙政园封面：电影 2.35:1，并放大显示
                if (isZhuozheng) {
                  imageContainerClasses = "overflow-hidden rounded-sm relative z-10 w-full md:w-4/5 aspect-[235/100]";
                }
                return (
                  <motion.div
                    key={album.id}
                    data-album-id={album.id}
                    initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, delay: 0.1 }}
                    className={containerClasses} onClick={() => enterAlbum(album.id)}>
                    <div className={imageContainerClasses}>
                      <img src={album.coverImage} alt={album.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                        style={{ objectPosition: album.style.coverObjectPosition ?? '50% 50%' }} />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                    </div>
                    <div className={textContainerClasses}>
                      <p className="text-micro mb-4" style={{ color: album.style.accentColor }}>{album.location}</p>
                      <h2 className={`${album.style.fontClass} text-5xl md:text-7xl mb-4 transition-all duration-1000 ease-out group-hover:tracking-wider`}
                        style={{ color: album.style.accentColor }}>{album.title}</h2>
                      <p className="text-sm tracking-wider opacity-50 mb-6">{album.epigraph}</p>
                      <div className={`w-12 h-[1px] group-hover:w-24 transition-all duration-500 ${layoutType === 1 ? 'md:ml-auto' : ''} ${layoutType === 2 ? 'mx-auto' : ''}`}
                        style={{ backgroundColor: album.style.accentColor + '60' }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.main>
        ) : (
          <motion.main key="album"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="pt-32 px-6 pb-24 max-w-[1800px] mx-auto min-h-screen relative z-10">

            {/* 背景装饰字 */}
            <div className={`${fontCls} fixed pointer-events-none select-none z-[1] leading-none`}
              style={{ fontSize: 'clamp(20rem, 45vw, 40rem)', color: accent, opacity: 0.03, ...activeAlbum.style.bgCharPos }}>
              {activeAlbum.style.bgChar}
            </div>

            {/* Top bar */}
            <div className="flex items-center justify-between mb-12 relative z-10 px-2 md:px-6">
              <Magnetic>
                <button onClick={goHome} data-no-sfx
                  className="flex items-center gap-2 text-micro hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4" /> 返回作品集
                </button>
              </Magnetic>

              {/* 选择式模式开关：诗意 / 纯净 — 从右边缘内移 */}
              <div className="mode-switch relative z-[60] flex rounded-full border overflow-hidden transition-colors duration-300"
                style={{ borderColor: accent + '30' }}>
                <button
                  onClick={() => setShowOverlay(true)}
                  className="px-4 py-1.5 text-xs tracking-[0.15em] transition-all duration-300"
                  style={{
                    backgroundColor: showOverlay ? accent + '20' : 'transparent',
                    color: showOverlay ? accent : 'rgba(255,255,255,0.35)',
                  }}>
                  诗意
                </button>
                <div className="w-[1px] self-stretch" style={{ backgroundColor: accent + '20' }} />
                <button
                  onClick={() => setShowOverlay(false)}
                  className="px-4 py-1.5 text-xs tracking-[0.15em] transition-all duration-300"
                  style={{
                    backgroundColor: !showOverlay ? accent + '20' : 'transparent',
                    color: !showOverlay ? accent : 'rgba(255,255,255,0.35)',
                  }}>
                  纯净
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 relative z-10">
              <div className={`${fontCls} w-full lg:w-1/3 lg:sticky lg:top-32 h-fit`}>
                <p className="text-sm tracking-[0.2em] mb-6 opacity-50" style={{ color: accent }}>{activeAlbum.location}</p>
                <h1 className="text-5xl md:text-6xl leading-[1.2] mb-6" style={{ color: accent }}>{activeAlbum.title}</h1>
                <p className="text-base tracking-wider opacity-40 mb-10 italic" style={{ color: accent }}>{activeAlbum.epigraph}</p>
                <div className="w-16 h-[1px] mb-10" style={{ backgroundColor: accent + '40' }} />
                <p className="text-lg md:text-xl leading-[2.2] tracking-[0.06em]" style={{ color: accent + 'cc' }}>
                  {activeAlbum.description}
                </p>
                <div className="mt-12 w-full h-[1px] bg-white/10" />
              </div>

              <div className="w-full lg:w-2/3 masonry-grid">
                {activeAlbum.media.map((item, index) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
                    className="masonry-item">
                    <div className="group relative cursor-pointer overflow-hidden rounded-sm"
                      onClick={() => setSelectedMedia(item)}>
                      {item.type === 'image' ? (
                        activeAlbum?.id === 'zhuozheng-garden' ? (
                          <div className="w-full aspect-[235/100] overflow-hidden">
                            <img src={item.url} alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              loading="lazy"
                              decoding="async" />
                          </div>
                        ) : (
                          <img src={item.url} alt={item.title}
                            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                            decoding="async" />
                        )
                      ) : (
                        <div className="relative w-full aspect-video md:aspect-square">
                          <video src={item.url} poster={item.thumbnail} autoPlay loop muted playsInline
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* 聚光灯引导遮罩 — 亮区对准 .mode-switch 按钮 */}
      <AnimatePresence>
        {showSpotlight && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[55]"
            onClick={closeSpotlight}
            style={{
              background: 'radial-gradient(ellipse 180px 80px at calc(100% - 140px) 132px, transparent 0%, rgba(0,0,0,0.90) 100%)',
            }}
          >
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="absolute top-[170px] flex items-center gap-3"
              style={{ right: 'max(1.5rem, calc(100% - 1600px + 1.5rem) / 2 + 1.5rem)' }}
            >
              <span className="text-xs tracking-[0.18em] text-white/60">切换观览模式</span>
              <button
                onClick={(e) => { e.stopPropagation(); acknowledgeSpotlight(); }}
                className="px-3 py-1 text-[11px] tracking-[0.15em] rounded-full border border-white/25 text-white/60 hover:text-white hover:border-white/50 transition-colors"
              >
                知晓
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="px-6 py-12 border-t border-white/5 mt-auto relative z-10">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-serif text-xl italic text-white/50">Colin的摄影集</div>
          <div className="flex gap-8">
            <Magnetic><a href="#" className="text-white/40 hover:text-white transition-colors"><Instagram className="w-4 h-4" /></a></Magnetic>
            <Magnetic><a href="#" className="text-white/40 hover:text-white transition-colors"><Twitter className="w-4 h-4" /></a></Magnetic>
            <Magnetic><a href="#" className="text-white/40 hover:text-white transition-colors"><Mail className="w-4 h-4" /></a></Magnetic>
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 bg-[#08080d] flex items-center justify-center">
            <Magnetic className="absolute top-8 right-8 z-50">
              <button className="text-white/50 hover:text-white transition-colors p-4" onClick={() => setSelectedMedia(null)}>
                <X className="w-8 h-8" />
              </button>
            </Magnetic>
            {activeAlbum && lightboxIndex > 0 && (
              <button onClick={handlePrev} className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-4 z-50">
                <ChevronLeft className="w-10 h-10 md:w-12 md:h-12" strokeWidth={1} />
              </button>
            )}
            {activeAlbum && lightboxIndex < activeAlbum.media.length - 1 && (
              <button onClick={handleNext} className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-4 z-50">
                <ChevronRight className="w-10 h-10 md:w-12 md:h-12" strokeWidth={1} />
              </button>
            )}
            <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.8}
              onDragEnd={handleDragEnd}
              className="w-full h-full flex items-center justify-center p-4 md:p-12 cursor-grab active:cursor-grabbing">
              <AnimatePresence mode="wait">
                <motion.div key={selectedMedia.id}
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="relative max-w-full max-h-full flex flex-col items-center justify-center">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-full max-h-[80vh]">
                    <div className="relative inline-block max-w-full max-h-full overflow-hidden">
                      {selectedMedia.type === 'image' ? (
                        <img src={selectedMedia.url} alt={selectedMedia.title}
                          className="max-w-full max-h-[80vh] object-contain shadow-2xl"
                          draggable={false}
                          decoding="async" />
                      ) : (
                        <div className="w-full max-w-6xl aspect-video bg-black shadow-2xl relative">
                          <video src={selectedMedia.url} controls autoPlay className="w-full h-full object-contain" />
                        </div>
                      )}
                      {renderImageOverlays(selectedMedia, 'lightbox')}
                      {selectedMedia.commentary && (
                        <button onClick={(e) => { e.stopPropagation(); setShowCommentary(!showCommentary); }}
                          className="absolute bottom-4 right-4 text-white/40 hover:text-white transition-colors bg-black/20 hover:bg-black/60 p-2.5 rounded-full backdrop-blur-md z-10">
                          <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {showCommentary && selectedMedia.commentary && (
                        <motion.div initial={{ opacity: 0, width: 0, x: -20 }} animate={{ opacity: 1, width: 300, x: 0 }} exit={{ opacity: 0, width: 0, x: -20 }}
                          className="hidden md:block overflow-hidden shrink-0">
                          <div className="w-[300px] text-sm text-white/80 font-serif leading-relaxed border-l border-white/20 pl-6 py-4">
                            {selectedMedia.commentary}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <AnimatePresence>
                    {showCommentary && selectedMedia.commentary && (
                      <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }}
                        className="md:hidden overflow-hidden mt-6 w-full max-w-md">
                        <div className="text-sm text-white/80 font-serif leading-relaxed border-l border-white/20 pl-4 py-2">
                          {selectedMedia.commentary}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="mt-6 text-center">
                    <h3 className="font-serif text-2xl font-light">{selectedMedia.title}</h3>
                    <p className="text-micro mt-2">{lightboxPosition} / {activeAlbum?.media.length ?? 0}</p>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-micro opacity-30 pointer-events-none">
              滑动切换作品
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}
