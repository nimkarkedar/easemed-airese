/**
 * Builds one self-contained HTML file of the app inside the iPhone 17 Pro frame,
 * for sharing as a link. Reuses the frame from public/iphone.html.
 * For day-to-day work use localhost instead: `npx expo start --web`, then /iphone.html.
 *
 *   npm run preview  →  preview-dist/index.html
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const tmp = join(root, '.preview-build');
const out = join(root, 'preview-dist');

rmSync(tmp, { recursive: true, force: true });
execSync(`npx expo export --platform web --output-dir ${tmp}`, {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_PREVIEW: '1', NODE_ENV: 'production' },
});

const jsDir = join(tmp, '_expo/static/js/web');
const bundle = readdirSync(jsDir)
  .filter((f) => f.endsWith('.js'))
  .map((f) => readFileSync(join(jsDir, f), 'utf8'))
  .join('\n')
  .replace(/<\/script/gi, '<\\/script');

const html = readFileSync(join(root, 'public/iphone.html'), 'utf8')
  .replace(
    '<iframe id="app" title="Airese app"></iframe>',
    '<div id="root" style="position:absolute;inset:0;display:flex;flex-direction:column;overflow:hidden"></div>',
  )
  .replace(
    "document.getElementById('app').src = small ? '/' : '/?frame=iphone';",
    'window.__AIRESE_PREVIEW_INSETS__ = small ? undefined : { top: 62, bottom: 34, left: 0, right: 0 };',
  )
  .replace('</body>', () => `<script>${bundle}</script>\n</body>`);

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);
rmSync(tmp, { recursive: true, force: true });
console.log(`\nPreview written to preview-dist/index.html (${(html.length / 1024).toFixed(0)} KB)`);
