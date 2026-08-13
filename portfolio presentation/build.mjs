// Inlines every image + the CV pdf into each *.src.html -> one self-contained *.html.
// Run: node "portfolio presentation/build.mjs"
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.pdf': 'application/pdf' };
// must contain a "/" so bare filenames (e.g. the download="..." attribute) are left alone
const ASSET = /(["'])([\w .\-]*(?:\/[\w .\-]+)+\.(?:png|jpe?g|pdf))\1/g;

// extra copies to write, for whatever gets deployed (vercel serves presentation/index.html at /presentation)
const DEPLOY = { 'Predrag-Jovanovic-Presentation.src.html': '../presentation/index.html' };

const sources = readdirSync(dir).filter(f => f.endsWith('.src.html'));
if (!sources.length) throw new Error('no *.src.html found');

for (const file of sources) {
  const src = readFileSync(resolve(dir, file), 'utf8');
  let n = 0;
  const out = src.replace(ASSET, (_, q, path) => {
    n++;
    return `${q}data:${MIME[extname(path).toLowerCase()]};base64,${readFileSync(resolve(dir, path)).toString('base64')}${q}`;
  });

  if (ASSET.test(out)) throw new Error(`un-inlined asset left in ${file}`);
  if (!n) throw new Error(`nothing was inlined in ${file}`);

  const dests = [file.replace('.src.html', '.html'), DEPLOY[file]].filter(Boolean);
  for (const d of dests) writeFileSync(resolve(dir, d), out);
  console.log(`${file}: inlined ${n} assets -> ${(out.length / 1e6).toFixed(2)} MB -> ${dests.join(', ')}`);
}
