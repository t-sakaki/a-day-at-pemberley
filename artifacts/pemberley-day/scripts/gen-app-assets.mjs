// Generates placeholder source art for @capacitor/assets from the existing
// og-image. Replace resources/*.png with real key art before store submission.
import { createRequire } from 'node:module';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
// sharp is only present as a transitive dep of @capacitor/assets in the pnpm store.
const sharp = require(
  require.resolve('sharp', {
    paths: [
      path.resolve(
        import.meta.dirname,
        '../../../node_modules/.pnpm/sharp@0.32.6/node_modules',
      ),
    ],
  }),
);

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'public', 'og-image.jpg');
const out = path.join(root, 'resources');
mkdirSync(out, { recursive: true });

const BG = { r: 0x1e, g: 0x2c, b: 0x32, alpha: 1 };

// Icon: 1024² center-crop of the artwork.
await sharp(src)
  .resize(1024, 1024, { fit: 'cover', position: 'attention' })
  .png()
  .toFile(path.join(out, 'icon.png'));

// Splash: artwork centred on the brand ground, 2732².
for (const name of ['splash.png', 'splash-dark.png']) {
  const art = await sharp(src)
    .resize(1600, 840, { fit: 'inside' })
    .toBuffer();
  await sharp({
    create: { width: 2732, height: 2732, channels: 4, background: BG },
  })
    .composite([{ input: art, gravity: 'center' }])
    .png()
    .toFile(path.join(out, name));
}

console.log('wrote resources/icon.png, splash.png, splash-dark.png');
