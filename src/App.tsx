import { useState, useEffect, useRef, useCallback, type MouseEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Instagram, Twitter, Mail, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { albums, journalEntries, siteSettings, type Media } from './data';
import CustomCursor from './components/CustomCursor';
import FilmStrip from './components/FilmStrip';
import LandingPage from './components/LandingPage';
import MusicWidget from './components/MusicWidget';
import Magnetic from './components/Magnetic';
import WorksPage from './components/pages/WorksPage';
import AlbumPage from './components/pages/AlbumPage';
import AboutPage from './components/pages/AboutPage';
import JournalPage from './components/pages/JournalPage';
import JournalEntryPage from './components/pages/JournalEntryPage';
import AdminPage from './components/pages/AdminPage';
import { assetUrl } from './utils/asset';
import { hrefFor, parseRoute, pathFromLocation, routePath, type AppRoute } from './utils/routing';

const GUIDED_KEY = 'colin-photo-guided';
const BASE_URL = import.meta.env.BASE_URL || '/';

function routeKey(route: AppRoute) {
  return routePath(route);
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(pathFromLocation(window.location, BASE_URL)));
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
  const contactRef = useRef<HTMLElement | null>(null);
  const sfxApiRef = useRef<{ playClick: (kind: 'grass' | 'tree' | 'sea' | 'stone') => void } | null>(null);

  const activeAlbum = route.name === 'album'
    ? albums.find(a => a.id === route.albumId) || null
    : null;
  const activeAlbumIndex = activeAlbum ? albums.findIndex(a => a.id === activeAlbum.id) : -1;
  const activeAlbumId = activeAlbum?.id ?? null;
  const activeJournalEntry = route.name === 'journalEntry'
    ? journalEntries.find(entry => entry.slug === route.slug) || null
    : null;
  const lightboxIndex = activeAlbum && selectedMedia
    ? activeAlbum.media.findIndex(m => m.id === selectedMedia.id) : -1;
  const lightboxPosition = lightboxIndex >= 0 ? lightboxIndex + 1 : 1;
  const accent = activeAlbum?.style.accentColor ?? '#ffffff';
  const fontCls = activeAlbum?.style.fontClass ?? '';
  const isLanding = route.name === 'landing';
  const isAdmin = route.name === 'admin';
  const showChrome = !isLanding && !isAdmin;

  const navigate = useCallback((path: string, options?: { replace?: boolean; restoreScrollY?: number; scroll?: 'none' }) => {
    const [pathOnly, hash] = path.split('#');
    const href = hrefFor(path, BASE_URL);
    const nextRoute = parseRoute(pathOnly || '/');
    if (options?.replace) window.history.replaceState(null, '', href);
    else window.history.pushState(null, '', href);
    setSelectedMedia(null);
    setShowCommentary(false);
    setShowSpotlight(false);
    setRoute(nextRoute);
    window.setTimeout(() => {
      if (hash === 'contact') contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else if (typeof options?.restoreScrollY === 'number') {
        const target = options.restoreScrollY;
        const tryRestore = () => {
          if (target <= 0 || document.body.scrollHeight > target + window.innerHeight * 0.5) {
            window.scrollTo({ top: target, behavior: 'instant' as ScrollBehavior });
          } else {
            requestAnimationFrame(tryRestore);
          }
        };
        tryRestore();
      } else if (options?.scroll !== 'none') {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    }, 0);
  }, []);

  const albumClickKind = useCallback((albumId: string | null): 'grass' | 'tree' | 'sea' | 'stone' | null => {
    if (!albumId) return null;
    if (albumId === 'dinosaurs') return 'stone';
    if (albumId === 'lambs' || albumId === 'zoo') return 'grass';
    if (albumId === 'gongqing-forest' || albumId === 'longhua-temple' || albumId === 'weipo' || albumId === 'zhuozheng-garden') return 'tree';
    if (albumId === 'seaside' || albumId === 'hupao-park' || albumId === 'seabirds' || albumId === 'sanmenxia-swans') return 'sea';
    return 'stone';
  }, []);

  const enterAlbum = useCallback((id: string) => {
    savedScrollY.current = window.scrollY;
    const kind = albumClickKind(id);
    if (kind) sfxApiRef.current?.playClick(kind);
    navigate(`/album/${id}`);
  }, [albumClickKind, navigate]);

  const enterSite = useCallback(() => {
    navigate('/works');
  }, [navigate]);

  const goLanding = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const goWorks = useCallback(() => {
    navigate('/works', route.name === 'album' ? { restoreScrollY: savedScrollY.current } : undefined);
  }, [navigate, route.name]);

  useEffect(() => {
    const onPopState = () => {
      setSelectedMedia(null);
      setShowCommentary(false);
      setShowSpotlight(false);
      setRoute(parseRoute(pathFromLocation(window.location, BASE_URL)));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (route.name === 'album' && !activeAlbum) {
      navigate('/works', { replace: true });
    }
  }, [route, activeAlbum, navigate]);

  useEffect(() => {
    document.body.style.overflow = selectedMedia ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedMedia]);

  useEffect(() => { setShowCommentary(false); }, [selectedMedia]);

  useEffect(() => {
    setShowSpotlight(Boolean(activeAlbum && !selectedMedia && !guided && spotlightReady));
  }, [activeAlbum, selectedMedia, guided, spotlightReady]);

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

  useEffect(() => {
    let cancelled = false;
    setSpotlightReady(false);

    if (!activeAlbum || guided) return;

    const firstBatch = activeAlbum.media
      .filter(m => m.type === 'image' && typeof m.url === 'string' && m.url.length > 0)
      .slice(0, 8);

    const preloadOne = (src: string) => new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const dec = img.decode?.bind(img);
          if (dec) await dec();
        } catch { /* noop */ }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = assetUrl(src);
    });

    const timeout = (ms: number) => new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });

    (async () => {
      try {
        await Promise.race([
          Promise.all(firstBatch.map(m => preloadOne(m.url))),
          timeout(6000),
        ]);
      } finally {
        if (!cancelled) setSpotlightReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, [guided, activeAlbum]);

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

  useEffect(() => {
    if (!selectedMedia) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedMedia(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedMedia, activeAlbum]);

  const renderImageOverlays = (item: Media, mode: 'card' | 'lightbox'): ReactNode => {
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

  const renderRoute = () => {
    if (route.name === 'landing') return <LandingPage onEnter={enterSite} quote={siteSettings.landingQuote} subtitle={siteSettings.landingSubtitle} siteTitle={siteSettings.siteTitle} />;
    if (route.name === 'about') return <AboutPage onNavigate={navigate} bio={siteSettings.aboutBio} detail={siteSettings.aboutDetail} meta={siteSettings.aboutMeta} heroImage={siteSettings.aboutImage} />;
    if (route.name === 'blog') return <JournalPage entries={journalEntries} onNavigate={navigate} />;
    if (route.name === 'journalEntry') return <JournalEntryPage entry={activeJournalEntry} onNavigate={navigate} />;
    if (route.name === 'admin') return <AdminPage onNavigate={navigate} />;
    if (activeAlbum) {
      return (
        <AlbumPage
          album={activeAlbum}
          albumIndex={activeAlbumIndex}
          showOverlay={showOverlay}
          onBack={goWorks}
          onSelectMedia={setSelectedMedia}
          onShowOverlayChange={setShowOverlay}
          renderImageOverlays={renderImageOverlays}
        />
      );
    }
    return <WorksPage albums={albums} onAlbumOpen={enterAlbum} onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-white/20 relative">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,12,18,0.96),rgba(7,8,12,1))]" />
        <div className="absolute inset-0 opacity-[0.055] mix-blend-soft-light"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%270 0 160 160%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")',
          }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.18)_60%,rgba(0,0,0,0.52)_100%)]" />
      </div>

      <CustomCursor />
      <MusicWidget registerSfxApi={(api) => { sfxApiRef.current = api; }} duckDb={activeAlbum ? -7 : 0} />
      <FilmStrip accentColor={accent} visible={!selectedMedia && route.name === 'works'} />

      {showChrome && (
        <>
          <AnimatePresence>
            {showZoomPrompt && (route.name === 'works' || route.name === 'album') && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-6 right-6 z-50 glass-panel px-4 py-3 rounded-sm flex items-center gap-4 shadow-2xl">
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
              <button type="button" className="font-serif text-xl tracking-widest uppercase cursor-pointer" onClick={goLanding} data-no-sfx>
                Colin
              </button>
            </Magnetic>
            <div className="flex gap-5 md:gap-6">
              <Magnetic><button type="button" onClick={goWorks} className="text-micro hover:text-white transition-colors">Works</button></Magnetic>
              <Magnetic><button type="button" onClick={() => navigate('/about')} className="text-micro hover:text-white transition-colors">关于 Colin</button></Magnetic>
              <Magnetic><button type="button" onClick={() => navigate('/blog')} className="text-micro hover:text-white transition-colors">Journal</button></Magnetic>
              <Magnetic><button type="button" onClick={() => navigate('/works#contact')} className="text-micro hover:text-white transition-colors">联系合作</button></Magnetic>
            </div>
          </nav>
        </>
      )}

      <AnimatePresence mode="sync">
        <div key={routeKey(route)}>
          {renderRoute()}
        </div>
      </AnimatePresence>

      {showChrome && (
        <footer id="contact" ref={contactRef} className="px-6 py-12 border-t border-white/5 mt-auto relative z-10">
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="font-serif text-xl italic text-white/50">Colin的摄影集</div>
              <div className="mt-2 text-[11px] tracking-[0.18em] text-white/30">PHOTOGRAPHY / JOURNAL / QUIET ARCHIVE</div>
            </div>
            <div className="flex gap-8">
              <Magnetic><a href="#" className="text-white/40 hover:text-white transition-colors"><Instagram className="w-4 h-4" /></a></Magnetic>
              <Magnetic><a href="#" className="text-white/40 hover:text-white transition-colors"><Twitter className="w-4 h-4" /></a></Magnetic>
              <Magnetic><a href="mailto:" className="text-white/40 hover:text-white transition-colors"><Mail className="w-4 h-4" /></a></Magnetic>
            </div>
          </div>
        </footer>
      )}

      <AnimatePresence>
        {showSpotlight && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed right-6 top-28 z-[55] pointer-events-none"
            onClick={closeSpotlight}
            style={{ background: 'transparent' }}
          >
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/12 bg-[#0b0c10]/75 px-3 py-2 shadow-2xl backdrop-blur-md"
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

      <AnimatePresence>
        {selectedMedia && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 bg-[#08080d] flex items-center justify-center">
            <Magnetic className="absolute top-8 right-8 z-50">
              <button aria-label="Close image" className="text-white/50 hover:text-white transition-colors p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70" onClick={() => setSelectedMedia(null)}>
                <X className="w-8 h-8" />
              </button>
            </Magnetic>
            {activeAlbum && lightboxIndex > 0 && (
              <button aria-label="Previous image" onClick={handlePrev} className="absolute left-0 top-0 z-40 h-full w-[30%] cursor-w-resize bg-transparent" />
            )}
            {activeAlbum && lightboxIndex < activeAlbum.media.length - 1 && (
              <button aria-label="Next image" onClick={handleNext} className="absolute right-0 top-0 z-40 h-full w-[30%] cursor-e-resize bg-transparent" />
            )}
            {activeAlbum && lightboxIndex > 0 && (
              <button aria-label="Previous image" onClick={handlePrev} className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-4 z-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70">
                <ChevronLeft className="w-10 h-10 md:w-12 md:h-12" strokeWidth={1} />
              </button>
            )}
            {activeAlbum && lightboxIndex < activeAlbum.media.length - 1 && (
              <button aria-label="Next image" onClick={handleNext} className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-4 z-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70">
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
                        <img src={assetUrl(selectedMedia.url)} alt={selectedMedia.title}
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
    </div>
  );
}
