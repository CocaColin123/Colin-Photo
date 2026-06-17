import { useState } from 'react';
import { Save, Trash2, Image } from 'lucide-react';
import type { JournalEntry } from '../../types/journal';
import type { Album } from '../../types/portfolio';
import MarkdownEditor from './MarkdownEditor';
import ImageBrowser from './ImageBrowser';

interface JournalEditorProps {
  entries: JournalEntry[];
  albums: Album[];
  onSave: (entry: JournalEntry) => void;
  onDelete: (slug: string) => void;
}

function emptyEntry(): JournalEntry {
  return {
    slug: '',
    title: '',
    date: new Date().toISOString().slice(0, 10),
    excerpt: '',
    body: '',
    status: 'draft',
  };
}

export default function JournalEditor({ entries, albums, onSave, onDelete }: JournalEditorProps) {
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [edit, setEdit] = useState<JournalEntry>(emptyEntry());
  const [showImageBrowser, setShowImageBrowser] = useState(false);

  const selectEntry = (entry: JournalEntry) => {
    setSelected(entry);
    setEdit({ ...entry });
  };

  const saveCurrent = () => {
    if (!edit.title.trim()) return;
    const slug = edit.slug || edit.title.replace(/\s+/g, '-').toLowerCase();
    onSave({ ...edit, slug });
    setSelected({ ...edit, slug });
  };

  const deleteCurrent = () => {
    if (!edit.slug || !confirm('确定删除这篇日记？')) return;
    onDelete(edit.slug);
    setSelected(null);
    setEdit(emptyEntry());
  };

  const newEntry = () => {
    setSelected(null);
    setEdit(emptyEntry());
  };

  return (
    <div className="grid h-full gap-0 md:grid-cols-[280px_1fr]">
      {/* Entry list */}
      <div className="flex flex-col border-r border-white/6">
        <div className="border-b border-white/6 px-5 py-3">
          <button
            onClick={newEntry}
            className="w-full rounded border border-white/10 py-2 text-xs tracking-[0.12em] text-white/50 transition-colors hover:border-white/25 hover:text-white"
          >
            + 新建日记
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {entries.map(entry => (
            <button
              key={entry.slug}
              onClick={() => selectEntry(entry)}
              className={`w-full border-b border-white/[0.03] px-5 py-3 text-left transition-colors hover:bg-white/[0.02] ${
                selected?.slug === entry.slug ? 'bg-white/[0.04]' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm text-white/75">{entry.title}</span>
                <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${entry.status === 'published' ? 'bg-emerald-500/60' : 'bg-amber-500/40'}`} />
              </div>
              <div className="mt-1 text-[10px] tracking-[0.08em] text-white/25">
                {entry.date}{entry.location ? ` · ${entry.location}` : ''}
              </div>
            </button>
          ))}
          {entries.length === 0 && (
            <p className="px-5 py-8 text-center text-xs text-white/20">暂无日记</p>
          )}
        </div>
      </div>

      {/* Edit form */}
      <div className="overflow-y-auto p-6 md:p-8">
        {edit.slug || selected ? (
          <div className="mx-auto max-w-[760px] space-y-6">
            {/* Slug */}
            <div>
              <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">SLUG</label>
              <input
                value={edit.slug}
                onChange={e => setEdit({ ...edit, slug: e.target.value })}
                className="admin-input w-full font-mono text-sm"
                placeholder="entry-slug"
              />
            </div>

            {/* Title */}
            <div>
              <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">标题</label>
              <input
                value={edit.title}
                onChange={e => setEdit({ ...edit, title: e.target.value })}
                className="admin-input w-full font-serif text-xl"
                placeholder="日记标题"
              />
            </div>

            {/* Date + Location + Status row */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">日期</label>
                <input
                  type="date"
                  value={edit.date}
                  onChange={e => setEdit({ ...edit, date: e.target.value })}
                  className="admin-input w-full text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">地点</label>
                <input
                  value={edit.location || ''}
                  onChange={e => setEdit({ ...edit, location: e.target.value })}
                  className="admin-input w-full text-sm"
                  placeholder="可选"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">状态</label>
                <select
                  value={edit.status}
                  onChange={e => setEdit({ ...edit, status: e.target.value as 'draft' | 'published' })}
                  className="admin-input w-full text-sm"
                >
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                </select>
              </div>
            </div>

            {/* Related album */}
            <div>
              <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">关联相册</label>
              <select
                value={edit.relatedAlbumId || ''}
                onChange={e => setEdit({ ...edit, relatedAlbumId: e.target.value || undefined })}
                className="admin-input w-full text-sm"
              >
                <option value="">无</option>
                {albums.map(a => (
                  <option key={a.id} value={a.id}>{a.title} ({a.location})</option>
                ))}
              </select>
            </div>

            {/* Excerpt */}
            <div>
              <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">摘要</label>
              <textarea
                value={edit.excerpt}
                onChange={e => setEdit({ ...edit, excerpt: e.target.value })}
                className="admin-input min-h-[60px] w-full resize-y text-sm leading-relaxed"
                placeholder="简短摘要..."
              />
            </div>

            {/* Cover image */}
            <div>
              <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">封面图</label>
              <div className="flex gap-2">
                <input
                  value={edit.coverImage || ''}
                  onChange={e => setEdit({ ...edit, coverImage: e.target.value })}
                  className="admin-input flex-1 font-mono text-sm"
                  placeholder="/images/..."
                />
                <button
                  onClick={() => setShowImageBrowser(true)}
                  className="flex items-center gap-1 rounded border border-white/10 px-3 py-1.5 text-xs text-white/40 transition-colors hover:border-white/25 hover:text-white"
                >
                  <Image className="h-3.5 w-3.5" /> 浏览
                </button>
              </div>
            </div>

            {/* Body (Markdown) */}
            <div>
              <label className="mb-2 block text-[10px] tracking-[0.14em] text-white/30">正文</label>
              <MarkdownEditor
                value={edit.body}
                onChange={v => setEdit({ ...edit, body: v })}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 border-t border-white/6 pt-6">
              <button
                onClick={saveCurrent}
                className="flex items-center gap-1.5 rounded border border-white/20 bg-white/[0.06] px-5 py-2 text-xs tracking-[0.12em] text-white/80 transition-colors hover:border-white/35 hover:bg-white/[0.1]"
              >
                <Save className="h-3.5 w-3.5" /> 保存
              </button>
              {edit.slug && (
                <button
                  onClick={deleteCurrent}
                  className="flex items-center gap-1.5 rounded border border-red-400/15 px-4 py-2 text-xs tracking-[0.12em] text-red-400/55 transition-colors hover:border-red-400/35 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" /> 删除
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-white/20">选择一篇日记开始编辑，或新建一篇。</p>
          </div>
        )}
      </div>

      <ImageBrowser
        open={showImageBrowser}
        onClose={() => setShowImageBrowser(false)}
        onSelect={path => setEdit({ ...edit, coverImage: path })}
      />
    </div>
  );
}
