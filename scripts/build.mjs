import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const projectDir = fileURLToPath(new URL('../', import.meta.url));
const sourcePath = fileURLToPath(new URL('../src/index.html', import.meta.url));
const outputDir = fileURLToPath(new URL('../www/', import.meta.url));
const html = await readFile(sourcePath, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);

if (!scriptMatch) {
  throw new Error('Could not find the game script in src/index.html');
}

await mkdir(outputDir, { recursive: true });
const audioDir = new URL('../www/audio/', import.meta.url);
await mkdir(audioDir, { recursive: true });
for (const track of ['littlestar.mp3', '小さな星.mp3']) {
  await copyFile(new URL(`../audio/${track}`, import.meta.url), new URL(track, audioDir));
}
await mkdir(new URL('../www/img/', import.meta.url), { recursive: true });
await copyFile(
  new URL('../img/cosmo-coin.png', import.meta.url),
  new URL('../www/img/cosmo-coin.png', import.meta.url)
);
const spriteDir = new URL('../www/img/characters/', import.meta.url);
await mkdir(spriteDir, { recursive: true });
for (const sprite of ['001.png', '002.png', '003.png', '004.png', '005.png']) {
  await copyFile(new URL(`../img/characters/${sprite}`, import.meta.url), new URL(sprite, spriteDir));
}

const appScript = `
import { Filesystem } from '@capacitor/filesystem';
import { Browser } from '@capacitor/browser';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Motion } from '@capacitor/motion';
import { Share } from '@capacitor/share';
import { registerPlugin } from '@capacitor/core';

const capacitor = window.Capacitor || (window.Capacitor = {});
capacitor.Plugins = {
  ...(capacitor.Plugins || {}),
  Browser,
  Filesystem,
  LocalNotifications,
  Motion,
  Share,
  CapacitorGameConnect: registerPlugin('CapacitorGameConnect')
};

${scriptMatch[1]}
`;

await build({
  stdin: {
    contents: appScript,
    resolveDir: projectDir,
    sourcefile: 'app.js',
    loader: 'js'
  },
  bundle: true,
  format: 'esm',
  target: ['safari15'],
  outfile: fileURLToPath(new URL('../www/app.js', import.meta.url))
});

const outputHtml = html.replace(
  scriptMatch[0],
  '<script type="module" src="./app.js"></script>'
);
await writeFile(fileURLToPath(new URL('../www/index.html', import.meta.url)), outputHtml);
