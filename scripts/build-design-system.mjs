/**
 * Builds the public design system page from the source, so it never drifts from the code:
 * colours, type, spacing, corners and motion are read from src/theme; icons from Icon.tsx;
 * each component's description from its doc comment, and where it's used from the screens.
 *
 *   node scripts/build-design-system.mjs  →  preview-dist/design-system/index.html (+ img/)
 *
 * Runs as part of `npm run preview`, so it's published to GitHub Pages with the prototype:
 * https://nimkarkedar.github.io/easemed-airese/design-system/
 * Also refreshes design-system/img/ (logos on a Midnight tile) used by design-system/README.md.
 */
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'preview-dist/design-system');
const REPO = 'https://github.com/nimkarkedar/easemed-airese/blob/main';
const read = (p) => readFileSync(join(root, p), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- Read the source ----------

const tokens = read('src/theme/tokens.ts');
const block = (name) => tokens.match(new RegExp(`(?:const|export const) ${name} = \\{([\\s\\S]*?)\\n\\}`))[1];

// Palette: name: '#hex', // what it's for
const palette = [...block('palette').matchAll(/(\w+): '(#[0-9A-Fa-f]{6})', \/\/ (.*)/g)].map(([, name, hex, note]) => ({ name, hex, note: note.trim() }));
const hexOf = Object.fromEntries(palette.map((p) => [p.name, p.hex]));

// Roles and other colours: name: palette.x | 'literal', // note
const colorLines = [...block('colors').matchAll(/^\s+(\w+): (palette\.\w+|'[^']+'),?(?: \/\/ (.*))?$/gm)].map(([, name, v, note]) => ({
  name,
  value: v.startsWith('palette.') ? hexOf[v.slice(8)] : v.slice(1, -1),
  ref: v.startsWith('palette.') ? v.slice(8) : null,
  note: (note ?? '').trim(),
}));
const loudness = [...tokens.matchAll(/export const loudness = \{([^}]*)\}/g)][0][1].split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.match(/(\w+): '(#\w+)'/)).map(([, n, hex]) => ({ name: n, hex }));
const gradients = [...block('gradients').matchAll(/(\w+): \[([\s\S]*?)\]/g)].map(([, name, body]) => ({
  name,
  stops: [...body.matchAll(/offset: ([\d.]+), color: (palette\.\w+|'#\w+')/g)].map(([, o, c]) => ({ offset: Number(o), color: c.startsWith('palette.') ? hexOf[c.slice(8)] : c.slice(1, -1) })),
}));
const numbers = (name) => [...block(name).matchAll(/(\w+): (\d+),(?: \/\/ (.*))?/g)].map(([, n, v, note]) => ({ name: n, value: Number(v), note: (note ?? '').trim() }));
const space = numbers('space');
const radius = numbers('radius');
const typeScale = [...tokens.matchAll(/^\s+(\w+): \{ \.\.\.font\('(\d+)'\), fontSize: (\d+), lineHeight: (\d+) \},? \/\/ (.*)$/gm)].map(([, name, weight, size, lh, note]) => ({
  name,
  weight: Number(weight),
  size: Number(size),
  lh: Number(lh),
  note: note.trim(),
}));

const motionSrc = read('src/theme/motion.ts');
const preset = (name) => {
  const b = motionSrc.match(new RegExp(`${name}: \\{([\\s\\S]*?)\\n  \\}`))[1];
  const curve = (k) => b.match(new RegExp(`${k}: Easing\\.bezier\\(([^)]*)\\)`))[1];
  return { name, duration: Number(b.match(/duration: (\d+)/)[1]), easeOut: curve('easeOut'), easeIn: curve('easeIn'), easeInOut: curve('easeInOut') };
};
const presets = [preset('slow'), preset('fast')];
const ambient = Number(motionSrc.match(/ambient: \{ duration: (\d+)/)[1]);
const attention = motionSrc.match(/attention: \{ duration: (\d+), rest: (\d+)/);
const stagger = Number(motionSrc.match(/stagger: (\d+)/)[1]);

const iconSrc = read('src/components/Icon.tsx');
const icons = [...iconSrc.matchAll(/^\s+(\w+): '([Mm][^']+)'/gm)].map(([, name, d]) => ({ name, d }));

// Components: first doc comment, exports, and the screens that render them.
const files = [];
const walk = (d) => readdirSync(join(root, d)).forEach((f) => (statSync(join(root, d, f)).isDirectory() ? walk(join(d, f)) : /\.tsx?$/.test(f) && files.push(join(d, f))));
['src', 'preview'].forEach(walk);
const sources = Object.fromEntries(files.map((f) => [f, read(f)]));
const docOf = (src, name) => {
  // The doc comment right above the export, else the file's first one.
  const at = src.search(new RegExp(`export (?:function|const) ${name}\\b`));
  const before = at > 0 ? src.slice(0, at) : src;
  const docs = [...before.matchAll(/\/\*\*([\s\S]*?)\*\//g)];
  const raw = docs.length ? docs[docs.length - 1][1] : '';
  return raw
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .trim();
};
const usedIn = (name) =>
  [
    ...new Set(
      Object.entries(sources)
        .filter(([f, s]) => !f.endsWith(`/${name}.tsx`) && new RegExp(`<${name}[\\s/>]`).test(s))
        .map(([f]) => basename(f).replace(/\.tsx?$/, '').replace(/Screen$/, '').replace(/^_layout.*/, 'Root layout').replace(/^index$/, 'Preview')),
    ),
  ];

const GROUPS = [
  ['Foundations', [['AppText'], ['Icon'], ['Logo']]],
  ['Page structure and templates', [['PageTitle'], ['DetailPage'], ['AmbientGradient'], ['TabBar'], ['Screen']]],
  ['Buttons and controls', [['Button'], ['IconButton'], ['InfoButton'], ['Avatar'], ['ToggleChip', 'ToggleChip'], ['ChipGroup', 'ToggleChip'], ['SettingSwitch', 'SettingRows'], ['SegmentedControl']]],
  ['Forms and rows', [['FormGroup', 'Form'], ['FormInput', 'Form'], ['FormDivider', 'Form'], ['SettingRow', 'SettingRows'], ['SettingsCard'], ['SettingsRow', 'SettingsCard']]],
  ['Cards', [['Card'], ['InsightCard'], ['DataCard'], ['BigNumber', 'DataCard'], ['ScoreTile']]],
  ['Sheets and feedback', [['BottomSheet'], ['ExplainSheet'], ['LargeSheet'], ['PermissionSheet'], ['Toast'], ['SystemAlertHost']]],
  ['Recording', [['RecordDial'], ['ListeningRing']]],
  ['Data visualisation', [['SnoringChart'], ['NightTimeline'], ['ScoreRing'], ['BenchmarkScale'], ['HourlyBars'], ['LoudnessBars'], ['RecentNightsChart'], ['ComparisonIndicator']]],
  ['Audio', [['ClipPlayer'], ['AudioSnippet']]],
  ['Recording Details parts', [['CareCTA'], ['PrivacyFooter']]],
];
const components = GROUPS.map(([group, items]) => ({
  group,
  items: items.map(([name, file = name]) => {
    const path = `src/components/${file}.tsx`;
    const src = sources[path] ?? '';
    return { name, path, doc: docOf(src, name), used: usedIn(name) };
  }),
}));

// Logo: white paths; drawn in currentColor so the page can tint it.
const logo = (file) => read(`assets/brand/${file}`).replace(/fill="white"/g, 'fill="currentColor"').replace(/<svg /, '<svg aria-hidden="true" ');

// ---------- Copy images ----------

mkdirSync(join(out, 'img'), { recursive: true });
const IMAGES = ['onboarding/1-hear.jpg', 'onboarding/2-private.jpg', 'onboarding/3-pattern.jpg', 'permissions/microphone.png', 'permissions/notifications.png', 'icon.png', 'android-icon-foreground.png', 'splash-icon.png'];
for (const img of IMAGES) copyFileSync(join(root, 'assets', img), join(out, 'img', basename(img)));

// Logos on a Midnight tile for the README (white logos vanish on GitHub's light theme).
mkdirSync(join(root, 'design-system/img'), { recursive: true });
const tile = (file, w, h, pad) => {
  const svg = read(`assets/brand/${file}`);
  const [, vw, vh] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${Number(vw) + pad * 2} ${Number(vh) + pad * 2}"><rect width="100%" height="100%" rx="${pad / 2}" fill="#0B1020"/><g transform="translate(${pad} ${pad})">${inner}</g></svg>`;
};
writeFileSync(join(root, 'design-system/img/logo-stacked.svg'), tile('airese-logo.svg', 160, 160, 24));
const hv = read('assets/brand/airese-logo-hori.svg').match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
writeFileSync(join(root, 'design-system/img/logo-horizontal.svg'), tile('airese-logo-hori.svg', 260, Math.round((260 * (Number(hv[2]) + 48)) / (Number(hv[1]) + 48)), 24));

// ---------- Page ----------

const contrast = (hex) => {
  const lum = (h) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const a = lum(hex);
  const b = lum('#0B1020');
  return ((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(1);
};

const swatch = (value, label, note, extra = '') => `
  <figure class="swatch">
    <div class="chip" style="background:${esc(value)}"></div>
    <figcaption><b>${esc(label)}</b><code>${esc(value)}</code>${extra}<span>${esc(note)}</span></figcaption>
  </figure>`;

const roles = colorLines.filter((c) => !hexOf[c.name] || c.name !== c.ref);
const nav = [
  ['colour', 'Colour'],
  ['type', 'Typography'],
  ['space', 'Spacing and corners'],
  ['motion', 'Motion'],
  ['icons', 'Icons'],
  ['brand', 'Brand assets'],
  ['components', 'Components'],
  ['patterns', 'Patterns'],
  ['a11y', 'Accessibility'],
];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Airese Design System</title>
<meta name="description" content="Tokens, type, motion, icons, brand assets and React Native components used to build Airese.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap" rel="stylesheet">
<style>
  :root { --night:#05070F; --midnight:#0B1020; --deep:#19294E; --mist:#B3BDD3; --moon:#EEF1F7; --breath:#9DB4FF; --lamp:#F4B65F; --line:rgba(179,189,211,.18); }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
  body { margin:0; background:var(--midnight); color:var(--moon); font:400 16px/1.6 Montserrat, system-ui, sans-serif; }
  a { color:var(--breath); }
  a:focus-visible, summary:focus-visible { outline:2px solid var(--breath); outline-offset:3px; border-radius:4px; }
  code { font:13px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; color:var(--mist); }
  h1,h2,h3 { font-weight:600; margin:0; }
  h1 { font-size:40px; line-height:1.15; }
  h2 { font-size:28px; line-height:1.25; margin-bottom:8px; }
  h3 { font-size:20px; line-height:1.4; margin:40px 0 12px; }
  p { margin:0 0 12px; }
  .muted { color:var(--mist); }
  .wrap { max-width:1120px; margin:0 auto; padding:0 16px; }
  header.top { padding:56px 0 40px; border-bottom:1px solid var(--line); }
  header.top .brand { display:flex; align-items:center; gap:20px; margin-bottom:28px; color:var(--moon); }
  header.top .brand svg { width:64px; height:auto; }
  header.top .lead { font-size:18px; max-width:720px; color:var(--mist); }
  .links { display:flex; flex-wrap:wrap; gap:8px 20px; margin-top:20px; font-size:14px; }
  nav.toc { position:sticky; top:0; z-index:5; background:rgba(11,16,32,.92); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border-bottom:1px solid var(--line); }
  nav.toc ul { list-style:none; margin:0; padding:0 16px; display:flex; gap:4px; overflow-x:auto; max-width:1120px; margin:0 auto; scrollbar-width:none; }
  nav.toc a { display:block; padding:12px 12px; min-height:44px; color:var(--mist); text-decoration:none; font-size:14px; white-space:nowrap; }
  nav.toc a:hover { color:var(--moon); }
  section { padding:64px 0 24px; border-bottom:1px solid var(--line); scroll-margin-top:48px; }
  .rules { display:grid; gap:12px; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); margin-top:24px; }
  .rule { background:var(--deep); border-radius:16px; padding:16px 20px; font-size:14px; }
  .rule b { display:block; font-size:16px; margin-bottom:4px; }
  .grid { display:grid; gap:16px; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); }
  .swatch { margin:0; background:var(--deep); border-radius:16px; overflow:hidden; }
  .swatch .chip { height:88px; border-bottom:1px solid var(--line); }
  .swatch figcaption { padding:12px 16px 16px; display:flex; flex-direction:column; gap:2px; font-size:14px; }
  .swatch figcaption span { color:var(--mist); }
  .swatch .ratio { font-size:12px; color:var(--mist); }
  .ramp { display:flex; border-radius:12px; overflow:hidden; height:56px; margin:8px 0 12px; }
  .ramp div { flex:1; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  th, td { text-align:left; padding:12px 12px; border-bottom:1px solid var(--line); vertical-align:top; }
  th { color:var(--mist); font-weight:400; font-size:12px; text-transform:uppercase; letter-spacing:1px; }
  .scroll { overflow-x:auto; }
  .specimen td:first-child { white-space:nowrap; }
  .space-bar { height:16px; background:var(--breath); border-radius:4px; }
  .radius-box { width:72px; height:72px; background:var(--deep); border:1px solid var(--breath); }
  .demo { display:flex; align-items:center; gap:16px; }
  .track { position:relative; height:44px; background:var(--deep); border-radius:999px; flex:1; overflow:hidden; }
  .dot { position:absolute; top:8px; left:8px; width:28px; height:28px; border-radius:50%; background:var(--breath); }
  .demo button { min-height:44px; padding:0 20px; border-radius:999px; border:0; background:var(--breath); color:var(--midnight); font:400 16px Montserrat, sans-serif; cursor:pointer; }
  .icons { display:grid; gap:8px; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); }
  .icon { background:var(--deep); border-radius:12px; padding:16px 8px 12px; text-align:center; }
  .icon svg { width:32px; height:32px; fill:var(--moon); }
  .icon code { display:block; margin-top:8px; font-size:11.5px; word-break:break-all; }
  .logos { display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); }
  .logo-tile { border-radius:16px; padding:40px 24px; display:flex; align-items:center; justify-content:center; min-height:200px; }
  .logo-tile svg { width:100%; height:auto; display:block; }
  .images { display:grid; gap:16px; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); }
  .images figure { margin:0; }
  .images img { width:100%; border-radius:16px; display:block; background:var(--deep); }
  .images figcaption { font-size:14px; color:var(--mist); margin-top:8px; }
  .comp-group { margin-top:40px; }
  .comps { display:grid; gap:12px; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); }
  details.comp { background:var(--deep); border-radius:16px; padding:0 20px; }
  details.comp summary { cursor:pointer; list-style:none; padding:16px 0; min-height:44px; display:flex; justify-content:space-between; gap:12px; align-items:baseline; }
  details.comp summary::-webkit-details-marker { display:none; }
  details.comp summary b { font-size:16px; }
  details.comp summary span { font-size:12px; color:var(--mist); text-align:right; }
  details.comp[open] summary { border-bottom:1px solid var(--line); }
  details.comp pre { white-space:pre-wrap; font:14px/1.6 Montserrat, sans-serif; color:var(--moon); margin:12px 0; }
  details.comp .meta { font-size:13px; color:var(--mist); padding-bottom:16px; }
  .tag { display:inline-block; font-size:12px; padding:2px 10px; border-radius:999px; background:rgba(244,182,95,.12); color:var(--lamp); margin-left:6px; }
  footer { padding:56px 0 72px; text-align:center; color:var(--mist); font-size:14px; }
  footer svg { width:48px; height:auto; color:var(--mist); display:block; margin:0 auto 16px; }
  @media (max-width:600px) { h1 { font-size:32px; } h2 { font-size:24px; } section { padding:48px 0 16px; } .comps { grid-template-columns:1fr; } }
</style>
</head>
<body>
<header class="top">
  <div class="wrap">
    <div class="brand">${logo('airese-logo.svg')}<div><div class="muted" style="font-size:14px">Airese by Easmed · powered by The Air Station</div><h1>Design system</h1></div></div>
    <p class="lead">Everything used to build the Airese app: colour, type, spacing, motion, icons, brand assets and every React Native component. Generated from the code, so it always matches what ships.</p>
    <div class="links">
      <a href="../">Open the prototype</a>
      <a href="${REPO}/docs/BRAND.md">Brand brief</a>
      <a href="${REPO}/docs/PRD.md">Product requirements</a>
      <a href="https://github.com/nimkarkedar/easemed-airese/tree/main/design-system">This page on GitHub</a>
      <a href="${REPO}/src/theme/tokens.ts">tokens.ts</a>
    </div>
    <div class="rules">
      <div class="rule"><b>Tokens only</b>Screens use tokens and components. No hard-coded colours, sizes, timings or curves.</div>
      <div class="rule"><b>One text, one icon</b>Text goes through <code>AppText</code>; icons through <code>Icon</code>.</div>
      <div class="rule"><b>Two motion presets</b>Every animation uses <code>slow</code> or <code>fast</code>. Reduce Motion is respected.</div>
      <div class="rule"><b>WCAG 2.2 AAA</b>7:1 text, 44 pt targets, nothing under 12 pt, colour never the only cue.</div>
    </div>
  </div>
</header>

<nav class="toc" aria-label="Sections"><ul>${nav.map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`).join('')}</ul></nav>

<main class="wrap">

<section id="colour">
  <h2>Colour</h2>
  <p class="muted">“Night, with one warm light.” A dark UI for use in bed, with one warm accent used sparingly. Red is for form errors only, never for sleep data. Contrast ratios (for colours used as text or marks) are against Midnight.</p>
  <h3>Palette</h3>
  <div class="grid">${palette.map((p) => swatch(p.hex, p.name[0].toUpperCase() + p.name.slice(1), p.note, Number(contrast(p.hex)) >= 3 ? `<span class="ratio">${contrast(p.hex)}:1 on Midnight</span>` : '')).join('')}</div>
  <h3>Roles and special colours</h3>
  <p class="muted">What screens use. Each role points at a palette colour or a fixed value.</p>
  <div class="grid">${roles.map((c) => swatch(c.value, c.name, c.note || (c.ref ? `= ${c.ref}` : ''))).join('')}</div>
  <h3>Loudness ramp</h3>
  <p class="muted">One hue, light to deep, so louder reads as stronger. Magnitude, so never a rainbow, and never red. Used for the snoring chart’s fill and the intensity split.</p>
  <div class="ramp" role="img" aria-label="Loudness ramp from light to very loud">${loudness.map((l) => `<div style="background:${l.hex}"></div>`).join('')}</div>
  <div class="grid">${loudness.map((l) => swatch(l.hex, l.name, '')).join('')}</div>
  <h3>Gradients</h3>
  <div class="grid">${gradients
    .map((g) =>
      swatch(
        `linear-gradient(180deg, ${g.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ')})`,
        g.name,
        g.name === 'splash' ? 'Splash, Home and Recording backgrounds; the record button' : 'The verdict card on Recording Details',
      ),
    )
    .join('')}</div>
  <h3>Status marks</h3>
  <div class="scroll"><table><thead><tr><th>Night</th><th>Icon</th><th>Colour</th></tr></thead><tbody>
    <tr><td>Ordinary</td><td><code>check_circle</code></td><td>Dew</td></tr>
    <tr><td>Unusual</td><td><code>trending_up</code></td><td>Lamp</td></tr>
    <tr><td>Repeated pattern</td><td><code>visibility</code></td><td>Lamp</td></tr>
    <tr><td>First night, other</td><td><code>bedtime</code></td><td>Mist</td></tr>
  </tbody></table></div>
</section>

<section id="type">
  <h2>Typography</h2>
  <p class="muted">Montserrat. Two weights in use, regular (400) and semibold (600). Steps of about 1.25. Nothing smaller than 12. Reading text at 1.5× line height or more. Scales with the system text size up to 200%.</p>
  <div class="scroll"><table class="specimen"><thead><tr><th>Variant</th><th>Sample</th><th>Size / line</th><th>Weight</th><th>Use</th></tr></thead><tbody>
  ${typeScale.map((t) => `<tr><td><code>${t.name}</code></td><td style="font-size:${t.size}px;line-height:${t.lh}px;font-weight:${t.weight}">You snored for 42 minutes</td><td>${t.size} / ${t.lh}</td><td>${t.weight}</td><td class="muted">${esc(t.note)}</td></tr>`).join('')}
  </tbody></table></div>
  <p class="muted" style="margin-top:16px">Big numbers are one size and weight with no small units; durations are compact (“7h 36m”). Times use tabular figures. Form group titles are uppercase with 1 pt letter spacing.</p>
</section>

<section id="space">
  <h2>Spacing and corners</h2>
  <h3>Spacing (4-pt grid)</h3>
  <div class="scroll"><table><tbody>${space.map((s) => `<tr><td style="width:120px"><code>space.${s.name}</code></td><td style="width:60px">${s.value}</td><td><div class="space-bar" style="width:${s.value * 4}px"></div></td><td class="muted">${esc(s.note)}</td></tr>`).join('')}</tbody></table></div>
  <h3>Corners</h3>
  <div class="grid">${radius.map((r) => `<figure class="swatch" style="padding:20px;display:flex;gap:16px;align-items:center"><div class="radius-box" style="border-radius:${Math.min(r.value, 36)}px"></div><figcaption style="padding:0"><b>radius.${r.name}</b><code>${r.value}</code><span>${esc(r.note)}</span></figcaption></figure>`).join('')}</div>
  <h3>Layout</h3>
  <div class="scroll"><table><tbody>
    <tr><td>Screen edge</td><td>20 (<code>space.gutter</code>, <code>PAGE_SIDE</code>)</td></tr>
    <tr><td>Touch target</td><td>44 pt minimum: buttons 48, icon buttons 56, setting rows 64</td></tr>
    <tr><td>Sticky top bar</td><td>44 pt below the status bar (<code>DetailPage</code>)</td></tr>
    <tr><td>Tab bar clearance</td><td>96 pt (<code>TAB_BAR_CLEARANCE</code>)</td></tr>
    <tr><td>Depth</td><td>Flat: colour, not shadows. Exceptions: a soft Breath glow on the record button and verdict card, frosted bars behind sticky titles.</td></tr>
  </tbody></table></div>
</section>

<section id="motion">
  <h2>Motion</h2>
  <p class="muted">Two presets, one feel: like settling down for the night. Nothing snaps, bounces or overshoots. Swipes and scrolls follow the finger. Press play to see each curve.</p>
  <div class="scroll"><table><thead><tr><th>Preset</th><th>Duration</th><th>easeOut (arriving)</th><th>easeIn (leaving)</th><th>easeInOut (between)</th></tr></thead><tbody>
  ${presets.map((p) => `<tr><td><code>motion.${p.name}</code></td><td>${p.duration} ms</td><td><code>${p.easeOut}</code></td><td><code>${p.easeIn}</code></td><td><code>${p.easeInOut}</code></td></tr>`).join('')}
  </tbody></table></div>
  <div style="display:grid;gap:12px;margin-top:20px">
  ${presets
    .flatMap((p) =>
      ['easeOut', 'easeInOut'].map(
        (k) => `<div class="demo"><button type="button" data-d="${p.duration}" data-e="cubic-bezier(${p[k]})" aria-label="Play ${p.name} ${k}">${p.name} · ${k}</button><div class="track"><div class="dot"></div></div></div>`,
      ),
    )
    .join('')}
  </div>
  <h3>Helpers</h3>
  <div class="scroll"><table><tbody>
    <tr><td><code>motion.ambient</code></td><td>${ambient} ms, sine in-out</td><td class="muted">Background life: the gradient drift, the record button’s breathing</td></tr>
    <tr><td><code>motion.attention</code></td><td>${attention[1]} ms, then ${attention[2]} ms rest</td><td class="muted">A light that runs once round the record ring to invite a tap</td></tr>
    <tr><td><code>motion.stagger</code></td><td>${stagger} ms</td><td class="muted">Offset between steps, so things arrive in sequence</td></tr>
  </tbody></table></div>
  <p class="muted" style="margin-top:16px">Reduce Motion: slides become fades, loops hold still, charts are drawn at once, the recording clock’s colon stops blinking.</p>
</section>

<section id="icons">
  <h2>Icons</h2>
  <p class="muted">Material Symbols (Material 3), Outlined, weight 400, through the <code>Icon</code> component only. <code>_fill</code> names are the filled variant for selected states. ${icons.length} in use. The native tab bar uses SF Symbols on iOS (<code>house</code>, <code>waveform</code>) and Material on Android.</p>
  <div class="icons">${icons.map((i) => `<div class="icon"><svg viewBox="0 -960 960 960" aria-hidden="true"><path d="${i.d}"/></svg><code>${i.name}</code></div>`).join('')}</div>
</section>

<section id="brand">
  <h2>Brand assets</h2>
  <h3>Logo</h3>
  <div class="logos">
    <div class="logo-tile" style="background:var(--midnight);border:1px solid var(--line);color:var(--moon)"><div style="width:110px">${logo('airese-logo.svg')}</div></div>
    <div class="logo-tile" style="background:linear-gradient(180deg,#0B1020,#1C3470 50%,#225ED8);color:#fff"><div style="width:110px">${logo('airese-logo.svg')}</div></div>
    <div class="logo-tile" style="background:var(--midnight);border:1px solid var(--line);color:var(--mist)"><div style="width:240px">${logo('airese-logo-hori.svg')}</div></div>
  </div>
  <p class="muted" style="margin-top:12px">Stacked logo in Moon, white on the splash gradient, and Mist in quiet footers (44–52 pt wide, with “Powered by The Air Station”). The horizontal logo isn’t used in the app yet. Files: <a href="${REPO}/assets/brand/airese-logo.svg">airese-logo.svg</a>, <a href="${REPO}/assets/brand/airese-logo-hori.svg">airese-logo-hori.svg</a>.</p>
  <h3>App icon and splash <span class="tag">placeholder</span></h3>
  <p class="muted">These are still Expo’s default template images, not Airese artwork. They need replacing with the Airese mark before release (the animated splash screen itself already uses the real logo).</p>
  <div class="images">
    <figure><img src="img/icon.png" alt="App icon (Expo placeholder)"><figcaption>App icon · placeholder</figcaption></figure>
    <figure><img src="img/android-icon-foreground.png" alt="Android adaptive icon (Expo placeholder)" style="background:#2E3A5A"><figcaption>Android adaptive icon on Airese navy #2E3A5A · placeholder</figcaption></figure>
    <figure><img src="img/splash-icon.png" alt="Splash icon (Expo placeholder)"><figcaption>Splash icon · placeholder</figcaption></figure>
  </div>
  <h3>Illustrations</h3>
  <div class="images">
    <figure><img src="img/1-hear.jpg" alt="" loading="lazy"><figcaption>Onboarding 1: Know your sleep</figcaption></figure>
    <figure><img src="img/2-private.jpg" alt="" loading="lazy"><figcaption>Onboarding 2: Completely private</figcaption></figure>
    <figure><img src="img/3-pattern.jpg" alt="" loading="lazy"><figcaption>Onboarding 3: Actionable insights</figcaption></figure>
    <figure><img src="img/microphone.png" alt="" loading="lazy"><figcaption>Microphone permission</figcaption></figure>
    <figure><img src="img/notifications.png" alt="" loading="lazy"><figcaption>Notifications permission</figcaption></figure>
  </div>
  <p class="muted" style="margin-top:12px">Imagery: black and white, deep blue, real. People asleep in a dim room, toned blue, with an occasional warm bedside lamp. No stock-photo cheer, no sci-fi glow.</p>
  <h3>Fonts</h3>
  <p>Montserrat 400, 500, 600, 700 via <code>@expo-google-fonts/montserrat</code>; only 400 and 600 are used by the type scale.</p>
</section>

<section id="components">
  <h2>Components</h2>
  <p class="muted">${components.reduce((n, g) => n + g.items.length, 0)} React Native components in <code>src/components/</code>, imported from <code>'../components'</code>. Open one for how it behaves (from its doc comment) and where it’s used.</p>
  ${components
    .map(
      (g) => `<div class="comp-group"><h3>${g.group}</h3><div class="comps">${g.items
        .map(
          (c) => `<details class="comp"><summary><b>${c.name}${c.used.length ? '' : '<span class="tag">not used</span>'}</b><span>${c.used.length ? esc(c.used.slice(0, 3).join(', ')) + (c.used.length > 3 ? ` +${c.used.length - 3}` : '') : ''}</span></summary>
          <pre>${esc(c.doc || '—')}</pre>
          <div class="meta">Used in: ${c.used.length ? esc(c.used.join(', ')) : 'nothing yet'}<br><a href="${REPO}/${c.path}">${c.path}</a></div></details>`,
        )
        .join('')}</div></div>`,
    )
    .join('')}
</section>

<section id="patterns">
  <h2>Patterns</h2>
  <div class="scroll"><table><tbody>
    <tr><td>Levels of detail</td><td>The page → a small explanation sheet for “why?” → a large sheet for “more” on a card. Dismissing returns to exactly where the user was.</td></tr>
    <tr><td>Pages from a row</td><td><code>DetailPage</code>: the system push on device; slides itself in on web. Back names where it goes.</td></tr>
    <tr><td>Grouped settings</td><td><code>FormGroup</code> cards holding inputs, rows or switches, separated by hairlines.</td></tr>
    <tr><td>Edit with a draft</td><td>Edits are local until Save (sticky footer); Back discards them. Checked on leaving a field and again on Save.</td></tr>
    <tr><td>Confirm, then confirm it happened</td><td>A bottom sheet naming what will happen and the action, with Cancel. Then a toast.</td></tr>
    <tr><td>Permissions</td><td>Ask in onboarding, never a wall; ask again in context with <code>PermissionSheet</code>, which switches to “Open Settings” once the system won’t ask again.</td></tr>
    <tr><td>Empty states</td><td>An icon, one heading, one sentence that says what to do.</td></tr>
    <tr><td>Charts</td><td>A sentence above every chart. Legends with shapes for two or more series. A text alternative for each. Grow in once with the slow preset.</td></tr>
    <tr><td>Numbers</td><td>One big number, no small units. Levels are words, never colour alone.</td></tr>
    <tr><td>Brand presence</td><td>Quiet: the logo in Mist with “Powered by The Air Station” at the end of Profile and Our centres, and under the next-step button on Recording Details.</td></tr>
  </tbody></table></div>
</section>

<section id="a11y">
  <h2>Accessibility</h2>
  <div class="rules">
    <div class="rule"><b>Contrast</b>7:1 for text. Moon and Mist pass on Midnight and Deep; Midnight on Breath is 9.4:1. Data marks 3:1.</div>
    <div class="rule"><b>Targets</b>44 pt minimum for every control.</div>
    <div class="rule"><b>Text size</b>Nothing under 12 pt; scales to 200%.</div>
    <div class="rule"><b>Not colour alone</b>Words for levels, shapes for chart events, legends.</div>
    <div class="rule"><b>Gestures</b>Every gesture has a one-finger alternative (zoom buttons for pinch). Charts are adjustable for screen readers.</div>
    <div class="rule"><b>Motion</b>Reduce Motion respected everywhere.</div>
  </div>
</section>

</main>

<footer>
  ${logo('airese-logo.svg')}
  Powered by The Air Station<br>
  <span style="font-size:12px">Generated from the source on ${new Date().toISOString().slice(0, 10)}</span>
</footer>

<script>
  // Motion demos: move the dot with the real preset's duration and curve (skipped with Reduce Motion).
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.demo button').forEach((b) => b.addEventListener('click', () => {
    const dot = b.nextElementSibling.firstElementChild;
    const end = b.nextElementSibling.clientWidth - 44;
    const at = dot.dataset.at === '1';
    if (still) { dot.style.transform = 'translateX(' + (at ? 0 : end) + 'px)'; dot.dataset.at = at ? '0' : '1'; return; }
    dot.animate([{ transform: 'translateX(' + (at ? end : 0) + 'px)' }, { transform: 'translateX(' + (at ? 0 : end) + 'px)' }], { duration: +b.dataset.d, easing: b.dataset.e, fill: 'forwards' });
    dot.dataset.at = at ? '0' : '1';
  }));
</script>
</body>
</html>`;

writeFileSync(join(out, 'index.html'), html);
console.log(`Design system written to preview-dist/design-system/index.html (${(html.length / 1024).toFixed(0)} KB, ${icons.length} icons, ${components.reduce((n, g) => n + g.items.length, 0)} components)`);
