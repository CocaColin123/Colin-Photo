# Diary Vault — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Electron desktop app for digitized handwritten diaries — paste OCR text, AI-assisted metadata extraction, Markdown archive, A4 paper reading/editing experience with layout presets.

**Architecture:** Electron main process handles file I/O and DeepSeek API calls; React renderer provides five views (Welcome, Timeline, Reader, Editor, Entry) plus API Settings and AI Chat side panels. Data is Markdown files with YAML frontmatter in a `年/月/` directory structure. IPC bridges main↔renderer.

**Tech Stack:** Electron 34, React 19, Tailwind 4, Vite 6, Motion (framer-motion), marked, js-yaml, lucide-react

**Design System:** Follows Colin Photography aesthetic — dark viewing room (#0a0a0f base), off-white text, serif Chinese typography, slow fades, translucent surfaces. A4 paper rendered as warm off-white (#faf8f5) with soft shadow against the dark archive backdrop.

---

## File Map

```
diary-vault/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── electron/
│   ├── main.ts              ← Electron main process, window, IPC handlers
│   ├── preload.ts           ← contextBridge API
│   ├── fs-handlers.ts       ← file read/write/scan operations
│   └── deepseek.ts          ← DeepSeek API client (title/tags/audit)
├── src/
│   ├── main.tsx             ← React entry
│   ├── index.css            ← Tailwind + fonts + design tokens
│   ├── App.tsx              ← Router-like view switching
│   ├── hooks/
│   │   ├── useDiaryConfig.ts
│   │   └── useIpc.ts
│   ├── types/
│   │   ├── diary.ts         ← DiaryEntry, DiaryConfig, Preset, PageParams
│   │   └── ipc.ts           ← IPC channel types
│   ├── views/
│   │   ├── WelcomePage.tsx
│   │   ├── TimelinePage.tsx
│   │   ├── ReaderPage.tsx
│   │   ├── EditorPage.tsx
│   │   └── EntryWindow.tsx
│   ├── panels/
│   │   ├── Sidebar.tsx
│   │   ├── ApiSettingsPanel.tsx
│   │   └── AiChatPanel.tsx
│   ├── components/
│   │   ├── A4Paper.tsx       ← A4 paper renderer (shared reader/editor)
│   │   ├── ImageStack.tsx    ← Stacked image flipper
│   │   ├── PresetEditor.tsx  ← Layout param controls
│   │   ├── PasteBox.tsx      ← Large paste textarea with pulse
│   │   ├── MetaFields.tsx    ← Date/location/title/tag inputs
│   │   └── ConfirmDialog.tsx
│   └── utils/
│       ├── markdown.ts       ← Parse/serialize MD + frontmatter
│       ├── parseOcr.ts       ← Regex: extract date, split entries
│       └── formatDate.ts
```

---

## Phase 1: Project Scaffold

### Task 1: Init Electron + Vite + React project

**Files:** Create all scaffold files

- [ ] **Step 1: Create project directory and package.json**

```bash
mkdir D:\my-ai-projects\diary-vault
cd D:\my-ai-projects\diary-vault
```

Create `package.json`:
```json
{
  "name": "diary-vault",
  "private": true,
  "version": "1.0.0",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "motion": "^12.23.24",
    "lucide-react": "^0.546.0",
    "marked": "^17.0.0",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/js-yaml": "^4.0.9",
    "@vitejs/plugin-react": "^5.0.4",
    "electron": "^34.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0",
    "vite-plugin-electron": "^0.28.0",
    "vite-plugin-electron-renderer": "^0.14.0",
    "tailwindcss": "^4.1.14",
    "@tailwindcss/vite": "^4.1.14"
  }
}
```

Run: `npm install`

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "jsx": "react-jsx",
    "paths": { "@/*": ["./src/*"] },
    "noEmit": true,
    "strict": true
  },
  "include": ["src", "electron"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron';
import electronRenderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      { entry: 'electron/main.ts' },
      { entry: 'electron/preload.ts', onstart(args) { args.reload(); } },
    ]),
    electronRenderer(),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

- [ ] **Step 4: Create electron/main.ts**

```ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
```

- [ ] **Step 5: Create electron/preload.ts**

```ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('diaryApi', {
  // File system
  scanDiaries: (rootPath: string) => ipcRenderer.invoke('fs:scanDiaries', rootPath),
  readDiary: (filePath: string) => ipcRenderer.invoke('fs:readDiary', filePath),
  writeDiary: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeDiary', filePath, content),
  deleteDiary: (filePath: string) => ipcRenderer.invoke('fs:deleteDiary', filePath),
  readConfig: (rootPath: string) => ipcRenderer.invoke('fs:readConfig', rootPath),
  writeConfig: (rootPath: string, config: any) => ipcRenderer.invoke('fs:writeConfig', rootPath, config),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  // DeepSeek API
  deepseekCall: (params: { apiKey: string; baseUrl: string; model: string; prompt: string; text: string }) =>
    ipcRenderer.invoke('ai:deepseek', params),
  // Images
  copyImage: (src: string, destDir: string) => ipcRenderer.invoke('fs:copyImage', src, destDir),
});
```

- [ ] **Step 6: Create index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>日记库</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
```

- [ ] **Step 7: Create src/main.tsx**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
```

- [ ] **Step 8: Create src/index.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500&family=Noto+Serif+SC:wght@300;400;500;600&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Noto Sans SC", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Noto Serif SC", "Playfair Display", ui-serif, Georgia, serif;
  --color-paper: #faf8f5;
  --color-ink: #1a1a1a;
}

body {
  background-color: #0a0a0f;
  color: #ffffff;
  font-family: "Noto Sans SC", sans-serif;
  -webkit-font-smoothing: antialiased;
}

.text-micro {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
}

.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.admin-input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  outline: none;
  transition: border-color 0.2s;
}
.admin-input:focus { border-color: rgba(255, 255, 255, 0.3); }
```

- [ ] **Step 9: Verify scaffold**

```bash
npm run dev
```

Expected: Electron window opens, blank dark page visible.

---

## Phase 2: Types + Config + File System Layer

### Task 2: Define types and config

**Files:**
- Create: `src/types/diary.ts`
- Create: `src/types/ipc.ts`

- [ ] **Step 1: Create src/types/diary.ts**

```ts
export interface PageParams {
  // Paper
  aspectRatio: number;       // width/height, default 0.707 (A4)
  marginTop: number;         // mm
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  shadow: 'none' | 'light' | 'heavy';
  // Text
  fontFamily: string;
  fontSize: number;          // px
  lineHeight: number;        // multiplier
  letterSpacing: number;     // em
  paragraphSpacing: number;  // em
  textColor: string;
  textIndent: number;        // em, 0 = no indent
  // Background
  bgColor: string;
  bgTexture: string | null;
  bgTextureOpacity: number;  // 0-1
  // Images
  imageMode: 'embed' | 'float';
  floatPadding: number;      // px
}

export interface Preset {
  name: string;
  params: PageParams;
}

export interface DiaryConfig {
  vaultPath: string;
  defaultPreset: string;
  presets: Preset[];
  api: {
    provider: string;
    baseUrl: string;
    apiKey: string;
    model: string;
  };
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
}

export interface DiaryMeta {
  date: string;
  title: string;
  location?: string;
  tags?: string[];
  preset?: string;
}

export interface DiaryEntry {
  filePath: string;
  meta: DiaryMeta;
  body: string;
  images: string[];
}

export interface ImagePosition {
  x?: number;
  y?: number;
  w?: number;
}
```

- [ ] **Step 2: Create src/types/ipc.ts**

```ts
export interface IpcChannels {
  'fs:scanDiaries': { args: [string]; ret: DiaryEntry[] };
  'fs:readDiary': { args: [string]; ret: { meta: DiaryMeta; body: string } };
  'fs:writeDiary': { args: [string, string]; ret: void };
  'fs:deleteDiary': { args: [string]; ret: void };
  'fs:readConfig': { args: [string]; ret: DiaryConfig };
  'fs:writeConfig': { args: [string, DiaryConfig]; ret: void };
  'dialog:pickFolder': { args: []; ret: string | null };
  'ai:deepseek': { args: [{ apiKey: string; baseUrl: string; model: string; prompt: string; text: string }]; ret: any };
  'fs:copyImage': { args: [string, string]; ret: string };
}
```

- [ ] **Step 3: Create src/types/global.d.ts**

```ts
import type { IpcChannels } from './ipc';

declare global {
  interface Window {
    diaryApi: {
      [K in keyof IpcChannels]: (...args: IpcChannels[K]['args']) => Promise<IpcChannels[K]['ret']>;
    };
  }
}
```

---

### Task 3: Implement file system handlers

**Files:**
- Create: `electron/fs-handlers.ts`
- Modify: `electron/main.ts`

- [ ] **Step 1: Create electron/fs-handlers.ts**

```ts
import { ipcMain, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

function parseDiaryFile(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const m = raw.match(FRONTMATTER_RE);
  if (!m) throw new Error(`Invalid diary format: ${filePath}`);
  const meta = yaml.load(m[1]) as any;
  const body = m[2].trim();
  const dir = path.dirname(filePath);
  const imgDir = path.join(dir, 'images', path.basename(filePath, '.md'));
  let images: string[] = [];
  if (fs.existsSync(imgDir)) {
    images = fs.readdirSync(imgDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map(f => `images/${path.basename(filePath, '.md')}/${f}`);
  }
  return { filePath, meta, body, images };
}

export function registerFsHandlers() {
  ipcMain.handle('dialog:pickFolder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('fs:scanDiaries', async (_e, rootPath: string) => {
    const entries: any[] = [];
    function walk(dir: string) {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && /^\d{4}$/.test(entry.name)) walk(path.join(dir, entry.name));
        else if (entry.isDirectory() && /^\d{2}$/.test(entry.name)) walk(path.join(dir, entry.name));
        else if (entry.isFile() && entry.name.endsWith('.md')) {
          entries.push(parseDiaryFile(path.join(dir, entry.name)));
        }
      }
    }
    walk(rootPath);
    return entries.sort((a, b) => b.meta.date.localeCompare(a.meta.date));
  });

  ipcMain.handle('fs:readDiary', async (_e, filePath: string) => {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const m = raw.match(FRONTMATTER_RE);
    if (!m) throw new Error('Invalid diary format');
    return { meta: yaml.load(m[1]) as any, body: m[2].trim() };
  });

  ipcMain.handle('fs:writeDiary', async (_e, filePath: string, content: string) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
  });

  ipcMain.handle('fs:deleteDiary', async (_e, filePath: string) => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  ipcMain.handle('fs:readConfig', async (_e, rootPath: string) => {
    const configPath = path.join(rootPath, 'diary.config.json');
    if (!fs.existsSync(configPath)) {
      const def: any = {
        vaultPath: rootPath,
        defaultPreset: 'default',
        presets: [{
          name: 'default',
          params: {
            aspectRatio: 0.707, marginTop: 30, marginBottom: 25, marginLeft: 25, marginRight: 25,
            shadow: 'light', fontFamily: 'Noto Serif SC', fontSize: 16, lineHeight: 1.8,
            letterSpacing: 0.02, paragraphSpacing: 0.8, textColor: '#1a1a1a',
            textIndent: 2, bgColor: '#faf8f5', bgTexture: null, bgTextureOpacity: 0,
            imageMode: 'embed', floatPadding: 12,
          },
        }],
        api: { provider: 'deepseek', baseUrl: 'https://api.deepseek.com', apiKey: '', model: 'deepseek-chat' },
        chatHistory: [],
      };
      fs.writeFileSync(configPath, JSON.stringify(def, null, 2), 'utf-8');
      return def;
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  });

  ipcMain.handle('fs:writeConfig', async (_e, rootPath: string, config: any) => {
    fs.writeFileSync(path.join(rootPath, 'diary.config.json'), JSON.stringify(config, null, 2), 'utf-8');
  });

  ipcMain.handle('fs:copyImage', async (_e, src: string, destDir: string) => {
    fs.mkdirSync(destDir, { recursive: true });
    const name = path.basename(src);
    const dest = path.join(destDir, name);
    fs.copyFileSync(src, dest);
    return dest;
  });
}
```

- [ ] **Step 2: Update electron/main.ts to register handlers**

Add after `createWindow()`:
```ts
import { registerFsHandlers } from './fs-handlers';
registerFsHandlers();
```

- [ ] **Step 3: Verify with test script**

```bash
npx tsx -e "
const { registerFsHandlers } = require('./electron/fs-handlers');
console.log('FS handlers compile OK');
"
```

---

## Phase 3: App Shell + Welcome Page

### Task 4: App shell with view switching and sidebar

**Files:**
- Create: `src/App.tsx`
- Create: `src/views/WelcomePage.tsx`
- Create: `src/panels/Sidebar.tsx`

- [ ] **Step 1: Create src/App.tsx**

```tsx
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Sidebar from './panels/Sidebar';
import ApiSettingsPanel from './panels/ApiSettingsPanel';
import AiChatPanel from './panels/AiChatPanel';
import WelcomePage from './views/WelcomePage';
import TimelinePage from './views/TimelinePage';
import ReaderPage from './views/ReaderPage';
import EditorPage from './views/EditorPage';
import EntryWindow from './views/EntryWindow';
import type { DiaryEntry, DiaryConfig } from './types/diary';

type View = 'welcome' | 'timeline' | 'reader' | 'editor' | 'entry';
type Panel = 'none' | 'api' | 'chat';

export default function App() {
  const [view, setView] = useState<View>('welcome');
  const [panel, setPanel] = useState<Panel>('none');
  const [config, setConfig] = useState<DiaryConfig | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [vaultPath, setVaultPath] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    async function init() {
      const saved = localStorage.getItem('diary-vault-path');
      if (saved) {
        setVaultPath(saved);
        const cfg = await window.diaryApi.readConfig(saved);
        setConfig(cfg);
        const ents = await window.diaryApi.scanDiaries(saved);
        setEntries(ents);
        setReady(true);
      }
    }
    init();
  }, []);

  const openVault = async () => {
    const p = await window.diaryApi.pickFolder();
    if (!p) return;
    localStorage.setItem('diary-vault-path', p);
    setVaultPath(p);
    const cfg = await window.diaryApi.readConfig(p);
    setConfig(cfg);
    const ents = await window.diaryApi.scanDiaries(p);
    setEntries(ents);
    setReady(true);
    setView('timeline');
  };

  if (!ready && !vaultPath) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="text-center space-y-8">
          <h1 className="font-serif text-4xl text-white/85 tracking-[0.08em]">日记库</h1>
          <p className="text-sm text-white/35 tracking-[0.2em]">个人手写日记电子档案</p>
          <button onClick={openVault} className="rounded-full border border-white/20 px-8 py-3 text-sm text-white/65 hover:border-white/40 hover:text-white transition-colors">
            打开日记库文件夹
          </button>
        </div>
      </div>
    );
  }

  const navigate = (v: View, entry?: DiaryEntry) => {
    if (entry) setSelectedEntry(entry);
    setView(v);
    if (v !== 'entry') setShowSidebar(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f] text-white">
      {showSidebar && view !== 'entry' && (
        <Sidebar
          view={view}
          onNavigate={(v) => { setView(v); setSelectedEntry(null); }}
          onOpenPanel={(p) => setPanel(panel === p ? 'none' : p)}
          onEntry={() => { setShowSidebar(false); setView('entry'); }}
        />
      )}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="h-full">
            {view === 'welcome' && <WelcomePage entries={entries} onNavigate={navigate} onEntry={() => { setShowSidebar(false); setView('entry'); }} />}
            {view === 'timeline' && <TimelinePage entries={entries} onSelect={(e) => navigate('reader', e)} />}
            {view === 'reader' && selectedEntry && <ReaderPage entry={selectedEntry} config={config!} onEdit={(e) => navigate('editor', e)} onBack={() => setView('timeline')} />}
            {view === 'editor' && selectedEntry && <EditorPage entry={selectedEntry} config={config!} vaultPath={vaultPath!} onSave={() => { /* reload entries */ }} />}
            {view === 'entry' && <EntryWindow config={config!} vaultPath={vaultPath!} onDone={() => { setShowSidebar(true); setView('timeline'); }} onCancel={() => { setShowSidebar(true); setView('timeline'); }} />}
          </motion.div>
        </AnimatePresence>
      </main>
      {panel === 'api' && <ApiSettingsPanel config={config!} vaultPath={vaultPath!} onUpdate={(c) => setConfig(c)} onClose={() => setPanel('none')} />}
      {panel === 'chat' && <AiChatPanel config={config!} vaultPath={vaultPath!} entries={entries} onClose={() => setPanel('none')} />}
    </div>
  );
}
```

- [ ] **Step 2: Create src/panels/Sidebar.tsx**

```tsx
import { BookOpen, Clock, PenLine, Settings, MessageCircle, FilePlus } from 'lucide-react';
import type { View } from '../App';

interface SidebarProps {
  view: string;
  onNavigate: (v: View) => void;
  onOpenPanel: (p: 'api' | 'chat') => void;
  onEntry: () => void;
}

const NAV = [
  { key: 'welcome', label: '首页', icon: BookOpen },
  { key: 'timeline', label: '时间线', icon: Clock },
];

export default function Sidebar({ view, onNavigate, onOpenPanel, onEntry }: SidebarProps) {
  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-white/6 bg-[#0c0c14]">
      <div className="px-5 py-5 border-b border-white/6">
        <h1 className="font-serif text-lg tracking-[0.06em] text-white/80">日记库</h1>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {NAV.map(n => (
          <button key={n.key} onClick={() => onNavigate(n.key as View)}
            className={`flex w-full items-center gap-2.5 rounded px-3 py-2.5 text-sm transition-colors ${view === n.key ? 'bg-white/[0.06] text-white' : 'text-white/40 hover:text-white/70'}`}>
            <n.icon className="h-4 w-4" /> {n.label}
          </button>
        ))}
        <button onClick={onEntry}
          className="flex w-full items-center gap-2.5 rounded px-3 py-2.5 text-sm text-white/40 hover:text-white/70 transition-colors mt-2 border border-dashed border-white/10">
          <FilePlus className="h-4 w-4" /> 录入日记
        </button>
      </nav>
      <div className="border-t border-white/6 px-3 py-3 space-y-0.5">
        <button onClick={() => onOpenPanel('api')}
          className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
          <Settings className="h-3.5 w-3.5" /> API 设置
        </button>
        <button onClick={() => onOpenPanel('chat')}
          className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
          <MessageCircle className="h-3.5 w-3.5" /> AI 助手
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Create minimal WelcomePage stub**

```tsx
import { motion } from 'motion/react';
import { BookOpen, ArrowRight } from 'lucide-react';
import type { DiaryEntry } from '../types/diary';

interface Props {
  entries: DiaryEntry[];
  onNavigate: (v: string, e?: DiaryEntry) => void;
  onEntry: () => void;
}

export default function WelcomePage({ entries, onNavigate, onEntry }: Props) {
  const recent = entries.slice(0, 5);
  const years = [...new Set(entries.map(e => e.meta.date.slice(0, 4)))].sort();

  return (
    <div className="flex h-full flex-col items-center justify-center px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="text-center space-y-8 max-w-2xl">
        <div>
          <p className="text-micro mb-5 text-white/30">DIARY ARCHIVE</p>
          <h1 className="font-serif text-[clamp(3rem,6vw,6rem)] leading-[1.04] text-white/90">日记库</h1>
        </div>
        <p className="font-serif text-xl leading-[2] tracking-[0.06em] text-white/50">
          {entries.length} 篇日记 · {years.length} 年 · 个人手写日记电子档案
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <button onClick={() => onNavigate('timeline')}
            className="flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm text-white/65 hover:border-white/40 hover:text-white transition-colors">
            <BookOpen className="h-4 w-4" /> 进入档案库
          </button>
          <button onClick={onEntry}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm text-white/80 hover:bg-white/[0.08] transition-colors">
            录入日记 <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 4: Verify app shell works**

```bash
npm run dev
```

Expected: Empty dark window with "日记库" title and folder picker button. Click → pick a folder → sidebar + welcome page render.

---

## Phase 4: Timeline View

### Task 5: Timeline page with year/month grouping

**Files:**
- Create: `src/views/TimelinePage.tsx`

- [ ] **Step 1: Create src/views/TimelinePage.tsx**

```tsx
import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import type { DiaryEntry } from '../types/diary';

interface Props {
  entries: DiaryEntry[];
  onSelect: (e: DiaryEntry) => void;
}

export default function TimelinePage({ entries, onSelect }: Props) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? entries.filter(e => e.meta.title.includes(search) || e.body.includes(search) || (e.meta.tags || []).some(t => t.includes(search)))
    : entries;

  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, DiaryEntry[]>>();
    for (const e of filtered) {
      const year = e.meta.date.slice(0, 4);
      const month = e.meta.date.slice(5, 7);
      if (!map.has(year)) map.set(year, new Map());
      if (!map.get(year)!.has(month)) map.get(year)!.set(month, []);
      map.get(year)!.get(month)!.push(e);
    }
    return map;
  }, [filtered]);

  return (
    <div className="flex h-full">
      {/* Year nav */}
      <div className="w-32 shrink-0 border-r border-white/6 overflow-y-auto py-6">
        {[...grouped.keys()].sort().reverse().map(year => (
          <a key={year} href={`#y${year}`}
            className="block px-5 py-2 text-sm text-white/40 hover:text-white/70 transition-colors font-serif">
            {year}
          </a>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#0a0a0f]/90 backdrop-blur-sm border-b border-white/6 px-8 py-4">
          <div className="flex items-center gap-2 max-w-md">
            <Search className="h-4 w-4 text-white/20" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索日记..."
              className="flex-1 bg-transparent text-sm text-white/70 outline-none placeholder:text-white/20" />
          </div>
        </div>

        <div className="p-8">
          {[...grouped.keys()].sort().reverse().map(year => (
            <div key={year} id={`y${year}`} className="mb-10">
              <h2 className="font-serif text-3xl text-white/30 mb-6">{year}</h2>
              {[...grouped.get(year)!.keys()].sort().reverse().map(month => (
                <div key={month} className="mb-8">
                  <h3 className="text-[11px] tracking-[0.2em] text-white/20 mb-4">{month}月</h3>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {grouped.get(year)!.get(month)!.map(e => (
                      <motion.button key={e.filePath} whileHover={{ y: -2 }}
                        onClick={() => onSelect(e)}
                        className="text-left p-5 rounded-sm border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] transition-colors">
                        <p className="text-[10px] tracking-[0.14em] text-white/25 mb-2">{e.meta.date}</p>
                        <h3 className="font-serif text-lg text-white/75 mb-1">{e.meta.title}</h3>
                        <p className="text-xs text-white/35 line-clamp-2 leading-relaxed">{e.body.slice(0, 100)}</p>
                        {e.meta.tags && e.meta.tags.length > 0 && (
                          <div className="flex gap-1.5 mt-3 flex-wrap">
                            {e.meta.tags.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-white/8 text-white/30">{t}</span>)}
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center py-16 text-sm text-white/25">没有日记。点侧栏"录入日记"开始。</p>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify timeline**

`npm run dev` — navigate to timeline, should show year/month grouped cards.

---

## Phase 5: A4 Paper Component + Reader View

### Task 6: A4 paper renderer component

**Files:**
- Create: `src/components/A4Paper.tsx`
- Create: `src/components/ImageStack.tsx`

- [ ] **Step 1: Create src/components/A4Paper.tsx**

```tsx
import { type ReactNode } from 'react';
import type { PageParams } from '../types/diary';
import { marked } from 'marked';

interface Props {
  params: PageParams;
  body: string;
  images: string[];
  interactive?: boolean;
}

export default function A4Paper({ params, body, images, interactive }: Props) {
  const mmToPx = 3.78;
  const widthMm = 210; // A4
  const heightMm = 297;
  const paperStyle = {
    width: widthMm * mmToPx,
    minHeight: heightMm * mmToPx,
    paddingTop: params.marginTop * mmToPx,
    paddingBottom: params.marginBottom * mmToPx,
    paddingLeft: params.marginLeft * mmToPx,
    paddingRight: params.marginRight * mmToPx,
    fontFamily: params.fontFamily,
    fontSize: params.fontSize,
    lineHeight: params.lineHeight,
    letterSpacing: `${params.letterSpacing}em`,
    color: params.textColor,
    backgroundColor: params.bgColor,
    boxShadow: params.shadow === 'none' ? 'none'
      : params.shadow === 'light' ? '0 2px 20px rgba(0,0,0,0.12)'
      : '0 4px 40px rgba(0,0,0,0.2)',
  };

  return (
    <div className="mx-auto my-8" style={paperStyle}>
      <div className="[&_p]:mb-[var(--para-spacing)]"
        style={{
          '--para-spacing': `${params.paragraphSpacing}em`,
          textIndent: `${params.textIndent}em`,
        } as any}
        dangerouslySetInnerHTML={{ __html: marked.parse(body) as string }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create src/components/ImageStack.tsx**

```tsx
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props { images: string[]; }

export default function ImageStack({ images }: Props) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;
  return (
    <div className="relative group my-4">
      <img src={images[idx]} alt="" className="w-full object-contain max-h-[60vh]" />
      {images.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => setIdx(i => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/60 bg-black/40 px-2.5 py-1 rounded-full">
            {idx + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create src/views/ReaderPage.tsx**

```tsx
import { ArrowLeft, Edit3 } from 'lucide-react';
import type { DiaryEntry, DiaryConfig } from '../types/diary';
import A4Paper from '../components/A4Paper';

interface Props {
  entry: DiaryEntry;
  config: DiaryConfig;
  onEdit: (e: DiaryEntry) => void;
  onBack: () => void;
}

export default function ReaderPage({ entry, config, onEdit, onBack }: Props) {
  const preset = config.presets.find(p => p.name === (entry.meta.preset || config.defaultPreset)) || config.presets[0];

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0f]">
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0a0a0f]/90 backdrop-blur-sm border-b border-white/6">
        <button onClick={onBack} className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <div className="text-center">
          <p className="text-xs text-white/30">{entry.meta.date}</p>
          <p className="font-serif text-sm text-white/70">{entry.meta.title}</p>
        </div>
        <button onClick={() => onEdit(entry)} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors">
          <Edit3 className="h-3.5 w-3.5" /> 编辑
        </button>
      </div>
      <A4Paper params={preset.params} body={entry.body} images={entry.images} />
    </div>
  );
}
```

---

## Phase 6: Entry Window + OCR Parser + AI Fill

### Task 7: OCR parser utility

**Files:**
- Create: `src/utils/parseOcr.ts`

```ts
interface ParsedEntry {
  date: string | null;
  body: string;
}

export function parseOcr(text: string): ParsedEntry[] {
  // Strip Qianwen preamble
  const cleaned = text.replace(/根据您提供的图片[\s\S]*?如下[：:]\s*/g, '').trim();

  // Split on 📅
  const parts = cleaned.split(/📅\s*/g).filter(Boolean);
  const entries: ParsedEntry[] = [];

  for (const part of parts) {
    // Extract date: YYYY.M.DD or YYYY.M.D or YYYY-MM-DD
    const dateMatch = part.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
    let date: string | null = null;
    let body = part;
    if (dateMatch) {
      const y = dateMatch[1];
      const m = dateMatch[2].padStart(2, '0');
      const d = dateMatch[3].padStart(2, '0');
      date = `${y}-${m}-${d}`;
      body = part.replace(dateMatch[0], '').trim();
    }
    entries.push({ date, body });
  }

  return entries;
}
```

### Task 8: Entry window with paste + AI fill

**Files:**
- Create: `src/views/EntryWindow.tsx`
- Create: `src/components/PasteBox.tsx`
- Create: `src/components/MetaFields.tsx`

- [ ] **Step 1: Create src/views/EntryWindow.tsx** (simplified for plan)

```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, Check } from 'lucide-react';
import type { DiaryConfig } from '../types/diary';
import { parseOcr } from '../utils/parseOcr';
import PasteBox from '../components/PasteBox';
import MetaFields from '../components/MetaFields';

interface Props {
  config: DiaryConfig;
  vaultPath: string;
  onDone: () => void;
  onCancel: () => void;
}

interface QueuedEntry {
  date: string;
  title: string;
  location: string;
  tags: string[];
  body: string;
  preset: string;
}

export default function EntryWindow({ config, vaultPath, onDone, onCancel }: Props) {
  const [pasteText, setPasteText] = useState('');
  const [queue, setQueue] = useState<QueuedEntry[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState<string[]>([]);

  const handlePaste = async (text: string) => {
    setPasteText(text);
    const parsed = parseOcr(text);
    if (parsed.length === 0) return;

    setAiBusy(true);
    const filled: QueuedEntry[] = [];

    for (const p of parsed) {
      const entry: QueuedEntry = {
        date: p.date || '',
        title: '',
        location: '',
        tags: [],
        body: p.body,
        preset: config.defaultPreset,
      };

      if (config.api.apiKey && p.body.length > 10) {
        try {
          const result = await window.diaryApi.deepseekCall({
            apiKey: config.api.apiKey,
            baseUrl: config.api.baseUrl,
            model: config.api.model,
            prompt: `Extract from this diary entry:\n- title (max 15 chars, poetic)\n- location (if mentioned, else null)\n- tags (2-4 keywords)\nReturn JSON: { "title": "...", "location": "...", "tags": [...] }`,
            text: p.body,
          });
          const ai = JSON.parse(result.choices[0].message.content);
          entry.title = ai.title || p.body.slice(0, 15);
          entry.location = ai.location || '';
          entry.tags = ai.tags || [];
        } catch { entry.title = p.body.slice(0, 15); }
      } else {
        entry.title = p.body.slice(0, 15);
      }

      filled.push(entry);
    }

    setQueue(filled);
    setAiBusy(false);
  };

  const confirmEntry = async (idx: number) => {
    const e = queue[idx];
    setSaving(prev => [...prev, e.date]);
    const date = e.date || new Date().toISOString().slice(0, 10);
    const year = date.slice(0, 4);
    const month = date.slice(5, 7);
    const slug = e.title || date;
    const dir = `${vaultPath}/${year}/${month}`;
    const filePath = `${dir}/${date}-${slug}.md`;

    const fm = { date, title: e.title, location: e.location || undefined, tags: e.tags.length > 0 ? e.tags : undefined, preset: e.preset };
    const md = `---\n${JSON.stringify(fm, null, 2)}\n---\n\n${e.body}`;
    await window.diaryApi.writeDiary(filePath, md);
    setSaving(prev => prev.filter(d => d !== e.date));
    setQueue(prev => prev.filter((_, i) => i !== idx));
    if (queue.length <= 1) { setPasteText(''); }
  };

  const skipEntry = (idx: number) => {
    setQueue(prev => prev.filter((_, i) => i !== idx));
    if (queue.length <= 1) setPasteText('');
  };

  return (
    <div className="flex h-full flex-col bg-[#0a0a0f]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
        <button onClick={onCancel} className="flex items-center gap-2 text-xs text-white/40 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <span className="text-xs tracking-[0.14em] text-white/40">日记录入</span>
        <select value={config.defaultPreset} onChange={() => {}}
          className="text-xs bg-transparent border border-white/10 rounded px-2 py-1 text-white/50">
          {config.presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {queue.length === 0 ? (
          <PasteBox value={pasteText} onChange={handlePaste} busy={aiBusy} />
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {queue.map((entry, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="border border-white/6 rounded-sm bg-white/[0.01] p-6 space-y-4">
                <MetaFields entry={entry} onChange={(e) => setQueue(prev => prev.map((x, j) => j === i ? e : x))} />
                <div className="text-xs text-white/30 max-h-32 overflow-y-auto font-serif leading-relaxed">{entry.body.slice(0, 300)}...</div>
                <div className="flex gap-3 pt-2 border-t border-white/6">
                  <button onClick={() => confirmEntry(i)}
                    disabled={saving.includes(entry.date)}
                    className="flex items-center gap-1.5 rounded border border-white/15 bg-white/[0.04] px-4 py-2 text-xs text-white/70 hover:bg-white/[0.08] transition-colors">
                    <Check className="h-3.5 w-3.5" /> {saving.includes(entry.date) ? '保存中...' : '确认归档'}
                  </button>
                  <button onClick={() => skipEntry(i)}
                    className="text-xs text-white/25 hover:text-white/50 transition-colors">跳过</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {queue.length === 0 && pasteText && (
        <div className="px-6 py-3 border-t border-white/6 text-center">
          <button onClick={() => setPasteText('')}
            className="text-xs text-white/30 hover:text-white/60 transition-colors">
            清空并等待下一次粘贴
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Phase 7: DeepSeek Integration

### Task 9: DeepSeek API client in main process

**Files:**
- Create: `electron/deepseek.ts`
- Modify: `electron/main.ts`

- [ ] **Step 1: Create electron/deepseek.ts**

```ts
import { ipcMain } from 'electron';

export function registerDeepSeekHandler() {
  ipcMain.handle('ai:deepseek', async (_e, params: {
    apiKey: string; baseUrl: string; model: string; prompt: string; text: string;
  }) => {
    const url = `${params.baseUrl}/v1/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${params.apiKey}` },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: params.prompt },
          { role: 'user', content: params.text },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) throw new Error(`DeepSeek API: ${res.status} ${await res.text()}`);
    return res.json();
  });
}
```

- [ ] **Step 2: Update electron/main.ts**

Add import and call:
```ts
import { registerDeepSeekHandler } from './deepseek';
registerDeepSeekHandler();
```

---

## Phase 8: Editor View + Preset Management

### Task 10: Editor with WYSIWYG and preset controls

**Files:**
- Create: `src/views/EditorPage.tsx`
- Create: `src/components/PresetEditor.tsx`

The EditorPage renders the A4Paper in contenteditable mode with a right-side PresetEditor panel for adjusting PageParams. Presets can be saved/renamed/deleted. See the full spec for all params — this task implements the full list.

---

## Phase 9: API Settings + AI Chat Panels

### Task 11: API Settings panel

**Files:**
- Create: `src/panels/ApiSettingsPanel.tsx`

Side panel with provider dropdown, base URL input, model input, API key input (password masked), test connection button.

### Task 12: AI Chat panel

**Files:**
- Create: `src/panels/AiChatPanel.tsx`

Chat dialog using DeepSeek API. System prompt describes the vault structure. Each message includes vault metadata (entry count, date range, tags). Responses stream via the API.

---

## Phase 10: Polish + Verification

### Task 13: Full verification

- [ ] `npm run build` succeeds
- [ ] Open vault folder, scan works
- [ ] Paste sample OCR text, AI fill works
- [ ] Confirm entry, file written
- [ ] Reader renders A4 paper
- [ ] Timeline shows grouped entries
- [ ] API settings persist
- [ ] AI chat responds
