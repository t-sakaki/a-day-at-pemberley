/*
 * 事前生成ナレーションの音源を作る。
 *
 *   pnpm --filter @workspace/pemberley-day run vo
 *
 * 必要なもの:
 *   - piper（オフライン・無料の TTS）が PATH にあること
 *       uv tool install piper-tts --with pyopenjtalk
 *   - ffmpeg が PATH にあること
 *   - 音声モデル（.onnx と .onnx.json）を環境変数で渡す:
 *       PIPER_VOICE_EN=/path/to/en_GB-cori-high.onnx
 *       PIPER_VOICE_JA=/path/to/ja_JA-hi_fi_captain-medium.onnx
 *     モデルは https://huggingface.co/rhasspy/piper-voices から取得（無料）。
 *
 * src/audio/voiceLines.ts の全 id について public/vo/<lang>/<id>.mp3 を生成する。
 * public/vo/manifest.json にテキストのハッシュを記録し、変わっていない行は飛ばす。
 * 生成された MP3 はリポジトリにコミットする（実行時に piper は不要）。
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { voiceLines } from '../src/audio/voiceLines';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, '..');
const voDir = join(projectRoot, 'public', 'vo');
const manifestPath = join(voDir, 'manifest.json');

type Lang = 'en' | 'ja';
const LANGS: Lang[] = ['en', 'ja'];

const voiceModel: Record<Lang, string | undefined> = {
  en: process.env.PIPER_VOICE_EN,
  ja: process.env.PIPER_VOICE_JA,
};

// piper の話速。数値が大きいほどゆっくり。落ち着いた語りにする。
const lengthScale: Record<Lang, string> = { en: '1.06', ja: '1.04' };

// OpenJTalk が誤読する語を、合成に渡すテキストだけ差し替える（画面の表示テキストは変えない）。
// 新しい誤読が見つかったらここに足す。
const JA_READING_FIXES: Array<[RegExp, string]> = [
  [/館(?!内)/g, 'やかた'], // 「館」は やかた。「館内(かんない)」だけは残す
  [/肖像画の間/g, '肖像画のま'], // 「間」は ま。放置すると「あいだ」
  [/舟小屋/g, 'ふなごや'],
];

function forSpeech(text: string, lang: Lang): string {
  if (lang !== 'ja') return text;
  return JA_READING_FIXES.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);
}

function have(bin: string): boolean {
  try {
    execFileSync('sh', ['-c', `command -v ${bin}`], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function fail(message: string): never {
  console.error(`\n  generate-vo: ${message}\n`);
  process.exit(1);
}

if (!have('piper')) fail('piper が見つかりません。`uv tool install piper-tts --with pyopenjtalk` を実行してください。');
if (!have('ffmpeg')) fail('ffmpeg が見つかりません。');
for (const lang of LANGS) {
  const model = voiceModel[lang];
  if (!model) fail(`環境変数 PIPER_VOICE_${lang.toUpperCase()} に .onnx モデルのパスを指定してください。`);
  if (!existsSync(model)) fail(`モデルが見つかりません: ${model}`);
}

const manifest: Record<string, Partial<Record<Lang, string>>> = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : {};

const tmp = mkdtempSync(join(tmpdir(), 'pemberley-vo-'));
let made = 0;
let skipped = 0;

try {
  for (const [id, line] of Object.entries(voiceLines)) {
    for (const lang of LANGS) {
      const text = line[lang].trim();
      const speechText = forSpeech(text, lang);
      const hash = createHash('sha1').update(`${lengthScale[lang]}::${speechText}`).digest('hex').slice(0, 12);
      const outPath = join(voDir, lang, `${id}.mp3`);
      if (manifest[id]?.[lang] === hash && existsSync(outPath)) {
        skipped += 1;
        continue;
      }

      const wav = join(tmp, `${id}.${lang}.wav`);
      execFileSync('piper', ['-m', voiceModel[lang] as string, '-f', wav, '--length-scale', lengthScale[lang]], {
        input: speechText,
        stdio: ['pipe', 'ignore', 'inherit'],
      });

      mkdirSync(dirname(outPath), { recursive: true });
      execFileSync('ffmpeg', [
        '-y', '-loglevel', 'error',
        '-i', wav,
        // ラウドネス正規化＋末尾の無音を軽く整える
        '-af', 'silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_silence=0.2:start_threshold=-50dB,areverse,loudnorm=I=-18:TP=-2:LRA=11,aresample=44100',
        '-ac', '1',
        '-codec:a', 'libmp3lame', '-q:a', '6',
        outPath,
      ], { stdio: ['ignore', 'ignore', 'inherit'] });

      manifest[id] = { ...manifest[id], [lang]: hash };
      made += 1;
      process.stdout.write(`  ✓ ${lang}/${id}.mp3\n`);
    }
  }

  // voiceLines から消えた id の記録を掃除する（ファイルは手動で消す）。
  for (const id of Object.keys(manifest)) {
    if (!(id in voiceLines)) delete manifest[id];
  }

  mkdirSync(voDir, { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log(`\n  generate-vo: ${made} 生成 / ${skipped} 据え置き → ${voDir}\n`);
