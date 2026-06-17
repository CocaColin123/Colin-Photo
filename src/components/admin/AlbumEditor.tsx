import { useState } from 'react';
import { Save, Image } from 'lucide-react';
import type { Album } from '../../types/portfolio';
import ImageBrowser from './ImageBrowser';

interface AlbumEditorProps {
  albums: Album[];
  onSave: (album: Album) => void;
}

const FONT_OPTIONS = [
  'font-chillhuokai', 'font-nailao', 'font-qiji', 'font-huiwen', 'font-tsukiji',
];

export default function AlbumEditor({ albums, onSave }: AlbumEditorProps) {
  const [selected, setSelected] = useState<Album | null>(null);
  const [edit, setEdit] = useState<Album | null>(null);
  const [showImageBrowser, setShowImageBrowser] = useState(false);

  const selectAlbum = (album: Album) => {
    setSelected(album);
    setEdit({ ...album, style: { ...album.style } });
  };

  const saveCurrent = () => {
    if (!edit) return;
    onSave(edit);
    setSelected(edit);
  };

  if (!edit && !selected) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-white/20">选择一个相册开始编辑。</p>
      </div>
    );
  }

  return (
    <div className="grid h-full gap-0 md:grid-cols-[260px_1fr]">
      {/* Album list */}
      <div className="flex flex-col border-r border-white/6">
        <div className="border-b border-white/6 px-4 py-3 text-[10px] tracking-[0.14em] text-white/25">
          {albums.length} 个相册
        </div>
        <div className="flex-1 overflow-y-auto">
          {albums.map(album => (
            <button
              key={album.id}
              onClick={() => selectAlbum(album)}
              className={`w-full border-b border-white/[0.03] px-4 py-3 text-left transition-colors hover:bg-white/[0.02] ${
                selected?.id === album.id ? 'bg-white/[0.04]' : ''
              }`}
            >
              <div className="font-serif text-sm text-white/75">{album.title}</div>
              <div className="mt-0.5 text-[10px] tracking-[0.08em] text-white/25">{album.location}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Edit form */}
      <div className="overflow-y-auto p-6 md:p-8">
        {edit && (
          <div className="mx-auto max-w-[660px] space-y-6">
            <div>
              <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">标题</label>
              <input
                value={edit.title}
                onChange={e => setEdit({ ...edit, title: e.target.value })}
                className="admin-input w-full font-serif text-xl"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">地点</label>
                <input
                  value={edit.location}
                  onChange={e => setEdit({ ...edit, location: e.target.value })}
                  className="admin-input w-full text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">题记</label>
                <input
                  value={edit.epigraph}
                  onChange={e => setEdit({ ...edit, epigraph: e.target.value })}
                  className="admin-input w-full text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">描述</label>
              <textarea
                value={edit.description}
                onChange={e => setEdit({ ...edit, description: e.target.value })}
                className="admin-input min-h-[80px] w-full resize-y text-sm leading-relaxed"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">封面图</label>
              <div className="flex gap-2">
                <input
                  value={edit.coverImage}
                  onChange={e => setEdit({ ...edit, coverImage: e.target.value })}
                  className="admin-input flex-1 font-mono text-sm"
                />
                <button
                  onClick={() => setShowImageBrowser(true)}
                  className="flex items-center gap-1 rounded border border-white/10 px-3 py-1.5 text-xs text-white/40 transition-colors hover:border-white/25 hover:text-white"
                >
                  <Image className="h-3.5 w-3.5" /> 浏览
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">字体</label>
                <select
                  value={edit.style.fontClass}
                  onChange={e => setEdit({ ...edit, style: { ...edit.style, fontClass: e.target.value } })}
                  className="admin-input w-full text-sm"
                >
                  {FONT_OPTIONS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">强调色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={edit.style.accentColor}
                    onChange={e => setEdit({ ...edit, style: { ...edit.style, accentColor: e.target.value } })}
                    className="h-8 w-10 cursor-pointer rounded border border-white/10 bg-transparent"
                  />
                  <input
                    value={edit.style.accentColor}
                    onChange={e => setEdit({ ...edit, style: { ...edit.style, accentColor: e.target.value } })}
                    className="admin-input flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">背景字</label>
                <input
                  value={edit.style.bgChar}
                  onChange={e => setEdit({ ...edit, style: { ...edit.style, bgChar: e.target.value } })}
                  className="admin-input w-full text-center font-serif text-2xl"
                  maxLength={1}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">裁切焦点</label>
                <input
                  value={edit.style.coverObjectPosition || ''}
                  onChange={e => setEdit({ ...edit, style: { ...edit.style, coverObjectPosition: e.target.value || undefined } })}
                  className="admin-input w-full font-mono text-sm"
                  placeholder="50% 50%"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">帧数</label>
                <div className="admin-input flex items-center text-sm text-white/35">{edit.media.length} frames</div>
              </div>
            </div>

            <div className="border-t border-white/6 pt-6">
              <button
                onClick={saveCurrent}
                className="flex items-center gap-1.5 rounded border border-white/20 bg-white/[0.06] px-5 py-2 text-xs tracking-[0.12em] text-white/80 transition-colors hover:border-white/35 hover:bg-white/[0.1]"
              >
                <Save className="h-3.5 w-3.5" /> 保存
              </button>
            </div>
          </div>
        )}
      </div>

      <ImageBrowser
        open={showImageBrowser}
        onClose={() => setShowImageBrowser(false)}
        onSelect={path => edit && setEdit({ ...edit, coverImage: path })}
      />
    </div>
  );
}
