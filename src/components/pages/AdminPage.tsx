import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, X, Folder, Image, RotateCcw, Eye, Edit3 } from 'lucide-react';
import { marked } from 'marked';
import type { JournalEntry } from '../../types/journal';
import type { Album } from '../../types/portfolio';
import type { SiteSettings } from '../../types/settings';
import { assetUrl } from '../../utils/asset';

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

type Tab = 'journal' | 'albums' | 'settings';

interface ImageItem { path: string; dir: string; name: string }

const API = '/api';

async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API}/${endpoint}`);
  if (!res.ok) throw new Error(`${endpoint}: HTTP ${res.status}`);
  return res.json();
}

async function apiPut(endpoint: string, data: unknown) {
  const res = await fetch(`${API}/${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`${endpoint}: HTTP ${res.status}`);
  return res.json();
}

async function apiDelete(endpoint: string) {
  const res = await fetch(`${API}/${endpoint}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`${endpoint}: HTTP ${res.status}`);
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

function slugFromEntry(e: JournalEntry, idx: number) {
  return e.slug || `entry-${idx}`;
}

const FONT_OPTS = ['font-chillhuokai', 'font-nailao', 'font-qiji', 'font-huiwen', 'font-tsukiji'];

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const [tab, setTab] = useState<Tab>('journal');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [defSettings, setDefSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);

  // Journal editor
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<JournalEntry>(emptyEntry());

  // Album editor
  const [selAlbumId, setSelAlbumId] = useState<string | null>(null);
  const [albumForm, setAlbumForm] = useState<Album | null>(null);

  // Image browser
  const [imgOpen, setImgOpen] = useState(false);
  const [imgDirs, setImgDirs] = useState<string[]>([]);
  const [imgFiles, setImgFiles] = useState<ImageItem[]>([]);
  const [imgDir, setImgDir] = useState<string | null>(null);
  const [imgSearch, setImgSearch] = useState('');
  const [imgTarget, setImgTarget] = useState<'journal-cover' | 'album-cover' | 'settings-about'>('journal-cover');
  const [previewMode, setPreviewMode] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2400); };

  const loadData = () => Promise.all([
    apiGet<JournalEntry[]>('journal'),
    apiGet<Album[]>('albums'),
    apiGet<SiteSettings>('settings'),
  ]).then(([e, a, s]) => {
    setEntries(e);
    setAlbums(a);
    setSettings(s);
    setDefSettings(s);
  });

  useEffect(() => {
    loadData().then(() => setLoading(false)).catch((err: any) => {
      setError(err?.message || String(err));
      setLoading(false);
    });
  }, []);

  const openImgBrowser = (target: 'journal-cover' | 'album-cover' | 'settings-about') => {
    setImgTarget(target);
    setImgOpen(true);
    setImgSearch('');
    apiGet<{ dirs: string[]; files: ImageItem[] }>('images').then(d => {
      setImgDirs(d.dirs);
      setImgFiles(d.files);
      if (d.dirs.length > 0) setImgDir(d.dirs[0]);
    }).catch(() => showToast('加载图片目录失败'));
  };

  const selectImg = (path: string) => {
    if (imgTarget === 'journal-cover') setForm({ ...form, coverImage: path });
    else if (imgTarget === 'album-cover') setAlbumForm(af => af ? { ...af, coverImage: path } : null);
    else if (imgTarget === 'settings-about') setSettings(s => s ? { ...s, aboutImage: path } : null);
    setImgOpen(false);
  };

  const visibleFiles = imgFiles.filter(f => f.dir === imgDir && (imgSearch ? f.name.toLowerCase().includes(imgSearch.toLowerCase()) : true));

  // --- Journal actions ---
  const newEntry = () => {
    setEditIdx(null);
    setIsNew(true);
    setForm(emptyEntry());
    setPreviewMode(false);
  };

  const selectEntry = (idx: number) => {
    const e = entries[idx];
    if (!e) return;
    setEditIdx(idx);
    setIsNew(false);
    setForm({ ...e });
    setPreviewMode(false);
  };

  const saveEntry = async () => {
    if (!form.title.trim() && !form.body.trim()) { showToast('请至少填写标题或正文'); return; }
    const realSlug = isNew ? (form.slug || form.title.replace(/\s+/g, '-').toLowerCase() || 'entry-' + Date.now()) : slugFromEntry(editIdx !== null ? entries[editIdx] : form, editIdx ?? entries.length);
    const entry = { ...form, slug: realSlug };
    setBusy(true);
    try {
      const idxParam = isNew ? '' : `?index=${editIdx}`;
      await apiPut(`journal/${encodeURIComponent(realSlug)}${idxParam}`, entry);
      const loadAgain = await apiGet<JournalEntry[]>('journal');
      setEntries(loadAgain);
      editIdx !== null && setEditIdx(entries.findIndex(x => slugFromEntry(x, entries.indexOf(x)) === realSlug));
      setIsNew(false);
      showToast('已保存');
    } catch (err: any) { showToast('保存失败: ' + (err?.message || err)); }
    setBusy(false);
  };

  const deleteEntry = async () => {
    if (editIdx === null || isNew) return;
    const slug = slugFromEntry(entries[editIdx], editIdx);
    if (!slug || !confirm(`确定删除 "${entries[editIdx].title || slug}"？`)) return;
    setBusy(true);
    try {
      await apiDelete(`journal/${encodeURIComponent(slug)}?index=${editIdx}`);
      setEntries(prev => prev.filter((x, i) => i !== editIdx));
      setEditIdx(null);
      setIsNew(false);
      setForm(emptyEntry());
      showToast('已删除');
    } catch (err: any) { showToast('删除失败: ' + (err?.message || err)); }
    setBusy(false);
  };

  // --- Album actions ---
  const selectAlbum = (id: string) => {
    const a = albums.find(x => x.id === id);
    if (!a) return;
    setSelAlbumId(id);
    setAlbumForm({ ...a, style: { ...a.style } });
  };

  const saveAlbum = async () => {
    if (!albumForm) return;
    setBusy(true);
    try {
      await apiPut(`albums/${albumForm.id}`, albumForm);
      setAlbums(prev => prev.map(a => a.id === albumForm.id ? albumForm : a));
      showToast('已保存');
    } catch (err: any) { showToast('保存失败: ' + (err?.message || err)); }
    setBusy(false);
  };

  // --- Settings actions ---
  const saveSettings = async () => {
    if (!settings) return;
    setBusy(true);
    try {
      await apiPut('settings', settings);
      showToast('设置已保存');
    } catch (err: any) { showToast('保存失败: ' + (err?.message || err)); }
    setBusy(false);
  };

  const resetSettings = () => {
    if (!defSettings || !confirm('恢复为默认设置？')) return;
    setSettings({ ...defSettings });
    showToast('已恢复默认');
  };

  if (loading) return <div className="relative z-10 flex h-screen items-center justify-center bg-[#111118] text-base text-white/55">加载中...</div>;
  if (error) return (
    <div className="relative z-10 flex h-screen items-center justify-center bg-[#111118]">
      <div className="space-y-4 text-center">
        <p className="text-red-400">{error}</p>
        <button onClick={() => location.reload()} className="border border-white/25 px-4 py-2 text-sm text-white/65">重试</button>
      </div>
    </div>
  );

  return (
    <div className="relative z-10 flex h-screen overflow-hidden bg-[#111118] text-white">
      {/* ---- SIDEBAR ---- */}
      <aside className="flex w-48 shrink-0 flex-col border-r border-white/10 bg-[#161620]">
        <button onClick={() => onNavigate('/works')} className="flex items-center gap-1.5 border-b border-white/8 px-5 py-4 text-sm text-white/55 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> 返回站点
        </button>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {(['journal', 'albums', 'settings'] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setEditIdx(null); setIsNew(false); }} className={`block w-full rounded px-3 py-2.5 text-left text-sm ${tab === t ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}>
              {t === 'journal' ? '日记' : t === 'albums' ? '相册' : '设置'}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/8 px-4 py-3 text-[11px] text-white/30">CMS v1</div>
      </aside>

      {/* ---- MAIN ---- */}
      <main className="flex-1 overflow-y-auto">
        {/* ========== JOURNAL ========== */}
        {tab === 'journal' && (
          <div className="grid h-full md:grid-cols-[300px_1fr]">
            <div className="flex flex-col border-r border-white/8">
              <div className="border-b border-white/8 p-4">
                <button onClick={newEntry} className="flex w-full items-center justify-center gap-1.5 rounded border border-white/20 py-2 text-sm text-white/55 transition-colors hover:border-white/40 hover:text-white">
                  <Plus className="h-4 w-4" /> 新建日记
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {entries.map((e, i) => (
                  <button
                    key={slugFromEntry(e, i)}
                    onClick={() => selectEntry(i)}
                    className={`w-full border-b border-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.03] ${editIdx === i && !isNew ? 'bg-white/[0.06]' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-sm text-white/80 truncate">{e.title || '(空标题)'}</span>
                      <span className={`ml-auto h-2 w-2 shrink-0 rounded-full ${e.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    </div>
                    <div className="mt-1 text-[11px] text-white/30">{e.date}{e.location ? ' · ' + e.location : ''}</div>
                  </button>
                ))}
                {entries.length === 0 && <p className="p-6 text-center text-sm text-white/25">暂无日记</p>}
              </div>
            </div>

            <div className="overflow-y-auto p-6">
              {(isNew || editIdx !== null) ? (
                <div className="mx-auto max-w-[720px] space-y-5">
                  {/* Mode toggle */}
                  <div className="flex items-center gap-2 border-b border-white/8 pb-3">
                    <button onClick={() => setPreviewMode(false)} className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs transition-colors ${!previewMode ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
                      <Edit3 className="h-3.5 w-3.5" /> 编辑
                    </button>
                    <button onClick={() => setPreviewMode(true)} className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs transition-colors ${previewMode ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
                      <Eye className="h-3.5 w-3.5" /> 实况预览
                    </button>
                  </div>

                  {previewMode ? (
                    /* ====== LIVE PREVIEW (mimics JournalEntryPage) ====== */
                    <div className="rounded border border-white/8 bg-[#0a0a0f] overflow-hidden">
                      <article className="mx-auto max-w-[1320px] px-6 pb-16 pt-10">
                        {/* Header */}
                        <header className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
                          <div>
                            <p className="text-micro mb-5 text-white/35">{form.date}{form.location ? ` / ${form.location}` : ''}</p>
                            <h1 className="font-serif text-[clamp(2.5rem,5.8vw,5.8rem)] leading-[1.08] text-white/90">{form.title || '(空标题)'}</h1>
                          </div>
                          <p className="max-w-2xl font-serif text-xl leading-[2] tracking-[0.06em] text-white/58 lg:ml-auto">
                            {form.excerpt || '没有摘要'}
                          </p>
                        </header>

                        {/* Cover image */}
                        {form.coverImage && (
                          <div className="mt-14 overflow-hidden">
                            <img src={assetUrl(form.coverImage)} alt="" className="aspect-[16/8] w-full object-cover opacity-82" />
                          </div>
                        )}

                        {/* Body */}
                        <div className="mx-auto mt-14 max-w-[760px] border-y border-white/10 py-10">
                          <div className="font-serif text-lg leading-[2.25] tracking-[0.06em] text-white/70 space-y-8 [&_p]:mb-0" dangerouslySetInnerHTML={{ __html: marked.parse(form.body || '') as string }} />
                        </div>

                        {/* Related album link */}
                        {form.relatedAlbumId && (
                          <div className="mx-auto mt-12 max-w-[760px]">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-xs tracking-[0.16em] text-white/62">
                              相关相册 →
                            </span>
                          </div>
                        )}
                      </article>
                    </div>
                  ) : (
                    /* ====== EDIT FORM ====== */
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">SLUG</label>
                          <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 text-sm font-mono text-white/80 outline-none transition-colors focus:border-white/30" placeholder="auto" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">状态</label>
                          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'draft' | 'published' })} className="w-full rounded border border-white/12 bg-[#111118] px-3 py-2 text-sm text-white/80 outline-none transition-colors focus:border-white/30">
                            <option value="draft">草稿</option>
                            <option value="published">已发布</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">标题</label>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 font-serif text-lg text-white/85 outline-none transition-colors focus:border-white/30" placeholder="日记标题" />
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">日期</label>
                          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white/80 outline-none transition-colors focus:border-white/30" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">地点</label>
                          <input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value || undefined })} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white/80 outline-none transition-colors focus:border-white/30" placeholder="可选" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">关联相册</label>
                          <select value={form.relatedAlbumId || ''} onChange={e => setForm({ ...form, relatedAlbumId: e.target.value || undefined })} className="w-full rounded border border-white/12 bg-[#111118] px-3 py-2 text-sm text-white/80 outline-none transition-colors focus:border-white/30">
                            <option value="">无</option>
                            {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">摘要</label>
                        <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white/75 outline-none transition-colors focus:border-white/30 resize-y min-h-[50px]" placeholder="简短摘要..." />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">封面图</label>
                        <div className="flex gap-2">
                          <input value={form.coverImage || ''} onChange={e => setForm({ ...form, coverImage: e.target.value || undefined })} className="flex-1 rounded border border-white/12 bg-white/[0.03] px-3 py-2 font-mono text-sm text-white/75 outline-none transition-colors focus:border-white/30" placeholder="/images/..." />
                          <button onClick={() => openImgBrowser('journal-cover')} className="flex items-center gap-1 rounded border border-white/15 px-3 py-2 text-xs text-white/50 transition-colors hover:border-white/35 hover:text-white">
                            <Image className="h-4 w-4" /> 浏览
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[11px] tracking-[0.08em] text-white/35">正文 (Markdown)</label>
                        <div className="grid gap-4 md:grid-cols-2">
                          <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className="w-full rounded border border-white/12 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white/75 outline-none transition-colors focus:border-white/30 resize-y min-h-[300px]" placeholder="写点东西..." spellCheck={false} />
                          <div className="min-h-[300px] rounded border border-white/8 bg-white/[0.01] px-5 py-4 font-serif text-sm leading-[2.1] text-white/65 overflow-auto [&_p]:mb-3 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:font-serif [&_h2]:text-lg [&_h2]:text-white/80 [&_em]:italic [&_img]:my-3 [&_img]:max-w-full [&_blockquote]:border-l-2 [&_blockquote]:border-white/15 [&_blockquote]:pl-4 [&_blockquote]:text-white/45" dangerouslySetInnerHTML={{ __html: marked.parse(form.body || '') as string }} />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-3 border-t border-white/8 pt-5">
                    <button disabled={busy} onClick={saveEntry} className="rounded border border-white/20 bg-white/[0.06] px-5 py-2 text-sm text-white/80 transition-colors hover:border-white/40 hover:bg-white/[0.12]">
                      {busy ? '保存中...' : '保存'}
                    </button>
                    {!isNew && editIdx !== null && (
                      <button disabled={busy} onClick={deleteEntry} className="flex items-center gap-1.5 rounded border border-red-400/15 px-4 py-2 text-sm text-red-400/60 transition-colors hover:border-red-400/35 hover:text-red-400">
                        <Trash2 className="h-4 w-4" /> 删除
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-white/25">选择一篇日记编辑，或新建一篇。</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== ALBUMS ========== */}
        {tab === 'albums' && (
          <div className="grid h-full md:grid-cols-[260px_1fr]">
            <div className="flex flex-col border-r border-white/8">
              <div className="border-b border-white/8 px-4 py-3 text-[11px] text-white/30">{albums.length} 个相册</div>
              <div className="flex-1 overflow-y-auto">
                {albums.map(a => (
                  <button key={a.id} onClick={() => selectAlbum(a.id)} className={`w-full border-b border-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.03] ${selAlbumId === a.id ? 'bg-white/[0.06]' : ''}`}>
                    <div className="font-serif text-sm text-white/80">{a.title}</div>
                    <div className="mt-0.5 text-[11px] text-white/30">{a.location}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto p-6">
              {albumForm ? (
                <div className="mx-auto max-w-[660px] space-y-5">
                  <div>
                    <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">标题</label>
                    <input value={albumForm.title} onChange={e => setAlbumForm({ ...albumForm, title: e.target.value })} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 font-serif text-lg text-white/85 outline-none transition-colors focus:border-white/30" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">地点</label>
                      <input value={albumForm.location} onChange={e => setAlbumForm({ ...albumForm, location: e.target.value })} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white/80 outline-none transition-colors focus:border-white/30" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">题记</label>
                      <input value={albumForm.epigraph} onChange={e => setAlbumForm({ ...albumForm, epigraph: e.target.value })} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white/80 outline-none transition-colors focus:border-white/30" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">描述</label>
                    <textarea value={albumForm.description} onChange={e => setAlbumForm({ ...albumForm, description: e.target.value })} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white/75 outline-none transition-colors focus:border-white/30 resize-y min-h-[70px]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">封面图</label>
                    <div className="flex gap-2">
                      <input value={albumForm.coverImage} onChange={e => setAlbumForm({ ...albumForm, coverImage: e.target.value })} className="flex-1 rounded border border-white/12 bg-white/[0.03] px-3 py-2 font-mono text-sm text-white/75 outline-none transition-colors focus:border-white/30" />
                      <button onClick={() => openImgBrowser('album-cover')} className="flex items-center gap-1 rounded border border-white/15 px-3 py-2 text-xs text-white/50 transition-colors hover:border-white/35 hover:text-white">
                        <Image className="h-4 w-4" /> 浏览
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">字体</label>
                      <select value={albumForm.style.fontClass} onChange={e => setAlbumForm({ ...albumForm, style: { ...albumForm.style, fontClass: e.target.value } })} className="w-full rounded border border-white/12 bg-[#111118] px-3 py-2 text-sm text-white/80 outline-none transition-colors focus:border-white/30">
                        {FONT_OPTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">强调色</label>
                      <div className="flex gap-2">
                        <input type="color" value={albumForm.style.accentColor} onChange={e => setAlbumForm({ ...albumForm, style: { ...albumForm.style, accentColor: e.target.value } })} className="h-8 w-10 cursor-pointer rounded border border-white/10 bg-transparent" />
                        <input value={albumForm.style.accentColor} onChange={e => setAlbumForm({ ...albumForm, style: { ...albumForm.style, accentColor: e.target.value } })} className="flex-1 rounded border border-white/12 bg-white/[0.03] px-3 py-2 font-mono text-sm text-white/75 outline-none transition-colors focus:border-white/30" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] tracking-[0.08em] text-white/35">背景字</label>
                      <input value={albumForm.style.bgChar} onChange={e => setAlbumForm({ ...albumForm, style: { ...albumForm.style, bgChar: e.target.value } })} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 text-center font-serif text-xl text-white/85 outline-none transition-colors focus:border-white/30" maxLength={1} />
                    </div>
                  </div>
                  <div className="border-t border-white/8 pt-5">
                    <button disabled={busy} onClick={saveAlbum} className="rounded border border-white/20 bg-white/[0.06] px-5 py-2 text-sm text-white/80 transition-colors hover:border-white/40 hover:bg-white/[0.12]">
                      {busy ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-white/25">选择相册开始编辑。</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== SETTINGS ========== */}
        {tab === 'settings' && settings && (
          <div className="mx-auto max-w-[720px] space-y-8 p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-white/80">站点设置</h2>
              <button onClick={resetSettings} className="flex items-center gap-1.5 rounded border border-white/12 px-3 py-1.5 text-xs text-white/45 transition-colors hover:border-white/30 hover:text-white">
                <RotateCcw className="h-3.5 w-3.5" /> 恢复默认
              </button>
            </div>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg text-white/70">站点标识</h3>
                <button onClick={() => setSettings(s => s ? { ...s, siteTitle: defSettings!.siteTitle, landingSubtitle: defSettings!.landingSubtitle } : s)} className="text-[10px] tracking-[0.08em] text-white/30 transition-colors hover:text-white/60">恢复默认</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[11px] text-white/35">站点标题</label>
                  <input value={settings.siteTitle} onChange={e => setSettings({ ...settings, siteTitle: e.target.value })} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 font-serif text-lg text-white/85 outline-none transition-colors focus:border-white/30" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-white/35">落地页副标题</label>
                  <input value={settings.landingSubtitle} onChange={e => setSettings({ ...settings, landingSubtitle: e.target.value })} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white/80 outline-none transition-colors focus:border-white/30" />
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg text-white/70">落地页名言</h3>
                <button onClick={() => setSettings(s => s ? { ...s, landingQuote: defSettings!.landingQuote } : s)} className="text-[10px] tracking-[0.08em] text-white/30 transition-colors hover:text-white/60">恢复默认</button>
              </div>
              <div className="space-y-3">
                {settings.landingQuote.map((line, i) => (
                  <div key={i}>
                    <label className="mb-1 block text-[11px] text-white/35">第 {i + 1} 行</label>
                    <input value={line} onChange={e => { const q = [...settings.landingQuote] as [string, string, string]; q[i] = e.target.value; setSettings({ ...settings, landingQuote: q }); }} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white/80 outline-none transition-colors focus:border-white/30" />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg text-white/70">关于页面</h3>
                <button onClick={() => setSettings(s => s ? { ...s, aboutBio: defSettings!.aboutBio, aboutDetail: defSettings!.aboutDetail, aboutImage: defSettings!.aboutImage, aboutMeta: defSettings!.aboutMeta } : s)} className="text-[10px] tracking-[0.08em] text-white/30 transition-colors hover:text-white/60">恢复默认</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[11px] text-white/35">简介</label>
                  <textarea value={settings.aboutBio} onChange={e => setSettings({ ...settings, aboutBio: e.target.value })} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white/75 outline-none transition-colors focus:border-white/30 resize-y min-h-[180px] whitespace-pre-wrap" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-white/35">详细描述</label>
                  <textarea value={settings.aboutDetail} onChange={e => setSettings({ ...settings, aboutDetail: e.target.value })} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white/75 outline-none transition-colors focus:border-white/30 resize-y min-h-[200px] whitespace-pre-wrap" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-white/35">关于页配图</label>
                  <div className="flex gap-2">
                    <input value={settings.aboutImage} onChange={e => setSettings({ ...settings, aboutImage: e.target.value })} className="flex-1 rounded border border-white/12 bg-white/[0.03] px-3 py-2 font-mono text-sm text-white/75 outline-none transition-colors focus:border-white/30" />
                    <button onClick={() => openImgBrowser('settings-about')} className="flex items-center gap-1 rounded border border-white/15 px-3 py-2 text-xs text-white/50 transition-colors hover:border-white/35 hover:text-white">
                      <Image className="h-4 w-4" /> 浏览
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {(['base', 'subject', 'pace', 'format'] as const).map(key => (
                    <div key={key}>
                      <label className="mb-1 block text-[11px] text-white/35">{key.toUpperCase()}</label>
                      <input value={settings.aboutMeta[key]} onChange={e => setSettings({ ...settings, aboutMeta: { ...settings.aboutMeta, [key]: e.target.value } })} className="w-full rounded border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white/80 outline-none transition-colors focus:border-white/30" />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="border-t border-white/8 pt-5">
              <button disabled={busy} onClick={saveSettings} className="rounded border border-white/20 bg-white/[0.06] px-6 py-2.5 text-sm text-white/80 transition-colors hover:border-white/40 hover:bg-white/[0.12]">
                {busy ? '保存中...' : '保存设置'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ===== IMAGE BROWSER MODAL ===== */}
      {imgOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={() => setImgOpen(false)}>
          <div className="flex h-[85vh] w-[min(1000px,92vw)] flex-col overflow-hidden rounded-sm border border-white/10 bg-[#0e0e16] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/6 px-5 py-3">
              <span className="text-xs text-white/50">选择图片</span>
              <button onClick={() => setImgOpen(false)} className="text-white/30 transition-colors hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-2 border-b border-white/5 px-5 py-2">
              <input value={imgSearch} onChange={e => setImgSearch(e.target.value)} placeholder="搜索..." className="flex-1 bg-transparent text-xs text-white/55 outline-none placeholder:text-white/20" />
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="w-40 shrink-0 overflow-y-auto border-r border-white/5 p-2">
                {imgDirs.map(dir => (
                  <button key={dir} onClick={() => { setImgDir(dir); setImgSearch(''); }} className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${dir === imgDir ? 'bg-white/[0.06] text-white/80' : 'text-white/35 hover:text-white/60'}`}>
                    <Folder className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{dir}</span>
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                  {visibleFiles.map(f => (
                    <button key={f.path} onClick={() => selectImg(f.path)} className="group relative aspect-square overflow-hidden rounded-sm bg-white/[0.03] transition-colors hover:bg-white/[0.08]">
                      <img src={assetUrl(f.path)} alt="" className="h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-100" loading="lazy" />
                      <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 py-2 text-[9px] text-white/45">{f.name}</div>
                    </button>
                  ))}
                </div>
                {visibleFiles.length === 0 && <p className="py-12 text-center text-xs text-white/20">没有图片</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TOAST ===== */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[250] -translate-x-1/2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm backdrop-blur-md">{toast}</div>
      )}
    </div>
  );
}
