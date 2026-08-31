// 事前生成する読み上げ台詞の一覧（＝音源の単一の出所）。
// できるだけゲーム本体のデータ（手紙・見学の観察・緊急・来客）から直接引く。
// scripts/generate-vo がこの一覧を読んで public/vo/<lang>/<id>.mp3 を作り、
// 実行時は VoiceManager が同じ id で該当 MP3 を再生する。ズレが起きない。

import { guests } from '../data/guests';
import { letters } from '../data/letters';
import { templates as emergencyTemplates } from '../systems/EventSystem';
import { observations as tourObservations, tourRooms } from '../systems/TourSystem';

export type VoiceLine = { en: string; ja: string };

const bilingual = (text: { en: string; ja: string }): VoiceLine => ({ en: text.en, ja: text.ja });

// App.tsx の時限イベントと同じ文面（読み上げ用に id を付けて一元化）。
export const timedEventLines = {
  'morning-report': {
    en: 'Mrs. Reynolds reports: the portrait gallery is ready to be shown, but the music room still wants attention.',
    ja: 'レイノルズ夫人の報告です。肖像画の間はご案内できますが、音楽室にはまだ手入れが必要です。',
  },
  'gardiners-arrival': {
    en: 'A travelling party has asked at the door whether the house may be seen. Mrs. Reynolds is ready to lead them through.',
    ja: '旅の一行が、館を拝見できるかと戸口で尋ねています。レイノルズ夫人が館内をご案内する用意をしています。',
  },
  'elizabeth-observes': {
    en: 'One of the visitors—a young lady from Hertfordshire—lets her eye rest a moment too long on a room not quite in order.',
    ja: '来訪者のひとり——ハートフォードシャーの若い令嬢——が、十分に整っていない部屋にわずかに長く視線をとどめました。',
  },
  'evening-report': {
    en: 'Thomas reports: the visitors have walked down to the lake, and the grounds are showing at their best.',
    ja: 'トマスの報告です。来訪者たちは湖へ下りていき、庭園は最も美しい姿を見せています。',
  },
} satisfies Record<string, VoiceLine>;

export const voiceLines: Record<string, VoiceLine> = {
  // 一日の節目
  'title-line': { en: 'At first light, the house is yours.', ja: '夜明けとともに、この館はあなたのものです。' },
  'day-start': { en: 'Good morning. The house awaits your direction.', ja: 'おはようございます。館はあなたの指示を待っています。' },
  'morning-post': {
    en: 'The morning post is on the desk; three letters want an answer.',
    ja: '朝の便りが机にあります。三通の手紙が返事を待っています。',
  },
  'bell-rung': { en: 'The household bell has been rung.', ja: '館の鐘を鳴らしました。' },

  ...timedEventLines,

  // 朝の書簡：本文・差出人・両案の結果の一文
  ...Object.fromEntries(
    letters.flatMap(letter => [
      [`letter-${letter.id}-from`, bilingual(letter.from)],
      [`letter-${letter.id}`, bilingual(letter.body)],
      [`letter-${letter.id}-0`, bilingual(letter.options[0].modifier.note)],
      [`letter-${letter.id}-1`, bilingual(letter.options[1].modifier.note)],
    ]),
  ),

  // 来客の到着・不満の台詞
  ...Object.fromEntries(
    guests.flatMap(guest => [
      [`guest-${guest.id}-arrival`, bilingual(guest.arrivalLine)],
      [`guest-${guest.id}-complaint`, bilingual(guest.complaintLine)],
    ]),
  ),

  // 緊急の出来事：発生時・悪化時
  ...Object.fromEntries(
    Object.entries(emergencyTemplates).flatMap(([type, template]) => [
      [`emergency-${type}`, bilingual(template.dialogue)],
      [`emergency-${type}-escalated`, bilingual(template.escalationDialogue)],
    ]),
  ),

  // 見学順路の観察（部屋 × 整い具合の3段階）
  ...Object.fromEntries(
    tourRooms.flatMap(room =>
      (['warm', 'civil', 'wanting'] as const).map(band => [
        `tour-${room.id}-${band}`,
        bilingual(tourObservations[room.id][band]),
      ]),
    ),
  ),
};

export type VoiceLineId = string;

export const voiceLineIds: string[] = Object.keys(voiceLines);
