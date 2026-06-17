import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Folder, Search } from 'lucide-react';
import { assetUrl } from '../../utils/asset';

interface ImageBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}

interface ImageData {
  dirs: string[];
  files: { path: string; dir: string; name: string }[];
}

export default function ImageBrowser({ open, onClose, onSelect }: ImageBrowserProps) {
  const [data, setData] = useState<ImageData | null>(null);
  const [activeDir, setActiveDir] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    fetch('/api/images')
      .then(res => res.json())
      .then((d: ImageData) => {
        setData(d);
        if (d.dirs.length > 0) setActiveDir(d.dirs[0]);
      });
  }, [open]);

  if (!open) return null;

  const dirFiles = data?.files.filter(f => f.dir === activeDir) ?? [];
  const filtered = search
    ? dirFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : dirFiles;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
          className="flex h-[85vh] w-[min(1000px,92vw)] flex-col overflow-hidden rounded-sm border border-white/10 bg-[#0e0e16] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/6 px-5 py-3">
            <span className="text-xs tracking-[0.14em] text-white/50">选择图片</span>
            <button onClick={onClose} className="text-white/30 transition-colors hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 border-b border-white/5 px-5 py-2">
            <Search className="h-3.5 w-3.5 text-white/20" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索文件名..."
              className="flex-1 bg-transparent text-xs text-white/60 outline-none placeholder:text-white/20"
            />
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Folder tree */}
            <div className="w-44 shrink-0 overflow-y-auto border-r border-white/5 p-2">
              {data?.dirs.map(dir => (
                <button
                  key={dir}
                  onClick={() => { setActiveDir(dir); setSearch(''); }}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                    dir === activeDir ? 'bg-white/[0.06] text-white/80' : 'text-white/35 hover:text-white/60'
                  }`}
                >
                  <Folder className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{dir}</span>
                </button>
              ))}
            </div>

            {/* Image grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                {filtered.map(f => (
                  <button
                    key={f.path}
                    onClick={() => { onSelect(f.path); onClose(); }}
                    className="group relative aspect-square overflow-hidden rounded-sm bg-white/[0.03] transition-colors hover:bg-white/[0.08]"
                  >
                    <img
                      src={assetUrl(f.path)}
                      alt={f.name}
                      className="h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-100"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
                      <span className="text-[9px] text-white/50">{f.name}</span>
                    </div>
                  </button>
                ))}
              </div>
              {filtered.length === 0 && (
                <p className="py-12 text-center text-xs text-white/20">没有图片</p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
