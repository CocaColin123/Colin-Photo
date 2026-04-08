export function assetUrl(input: string) {
  // 保持外链不变
  if (/^https?:\/\//i.test(input)) return input;

  // Vite 在 GitHub Pages 等子路径部署时，需要拼上 BASE_URL
  const base = import.meta.env.BASE_URL || '/';
  const trimmed = input.startsWith('/') ? input.slice(1) : input;
  const baseNorm = base.endsWith('/') ? base : `${base}/`;
  return `${baseNorm}${trimmed}`;
}

