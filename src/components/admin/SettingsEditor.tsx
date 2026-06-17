import { useState } from 'react';
import { Save } from 'lucide-react';
import type { SiteSettings } from '../../types/settings';

interface SettingsEditorProps {
  settings: SiteSettings;
  onSave: (s: SiteSettings) => void;
}

export default function SettingsEditor({ settings, onSave }: SettingsEditorProps) {
  const [edit, setEdit] = useState<SiteSettings>({ ...settings });

  const update = (patch: Partial<SiteSettings>) => setEdit({ ...edit, ...patch });

  return (
    <div className="mx-auto max-w-[660px] space-y-8 p-6 md:p-8">
      <section>
        <h3 className="mb-4 font-serif text-lg text-white/70">站点标识</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">站点标题</label>
            <input value={edit.siteTitle} onChange={e => update({ siteTitle: e.target.value })} className="admin-input w-full font-serif text-xl" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">落地页副标题</label>
            <input value={edit.landingSubtitle} onChange={e => update({ landingSubtitle: e.target.value })} className="admin-input w-full text-sm" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-4 font-serif text-lg text-white/70">落地页名言（三行）</h3>
        <div className="space-y-3">
          {edit.landingQuote.map((line, i) => (
            <div key={i}>
              <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">第 {i + 1} 行</label>
              <input value={line} onChange={e => { const q = [...edit.landingQuote] as [string, string, string]; q[i] = e.target.value; update({ landingQuote: q }); }} className="admin-input w-full text-sm" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-4 font-serif text-lg text-white/70">关于页面</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">简介</label>
            <textarea value={edit.aboutBio} onChange={e => update({ aboutBio: e.target.value })} className="admin-input min-h-[80px] w-full resize-y text-sm leading-relaxed" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">详细描述</label>
            <textarea value={edit.aboutDetail} onChange={e => update({ aboutDetail: e.target.value })} className="admin-input min-h-[100px] w-full resize-y text-sm leading-relaxed" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">关于页配图</label>
            <input value={edit.aboutImage} onChange={e => update({ aboutImage: e.target.value })} className="admin-input w-full font-mono text-sm" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-4 font-serif text-lg text-white/70">关于页属性卡片</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {(['base', 'subject', 'pace', 'format'] as const).map(key => (
            <div key={key}>
              <label className="mb-1 block text-[10px] tracking-[0.14em] text-white/30">{key.toUpperCase()}</label>
              <input value={edit.aboutMeta[key]} onChange={e => update({ aboutMeta: { ...edit.aboutMeta, [key]: e.target.value } })} className="admin-input w-full text-sm" />
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-white/6 pt-6">
        <button onClick={() => onSave(edit)} className="flex items-center gap-1.5 rounded border border-white/20 bg-white/[0.06] px-5 py-2 text-xs tracking-[0.12em] text-white/80 transition-colors hover:border-white/35 hover:bg-white/[0.1]">
          <Save className="h-3.5 w-3.5" /> 保存设置
        </button>
      </div>
    </div>
  );
}
