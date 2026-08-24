// 発声用の英日バイリンガルメッセージ集
// 言語が 'en' のときは UK English のみ、'ja' のときは UK English → 日本語の順で発声する

export type VoiceStatic = {
  en: string;
  ja: string;
};

export type VoiceTemplate = {
  en: (ctx: Record<string, string>) => string;
  ja: (ctx: Record<string, string>) => string;
};

// 静的メッセージ（差し替え不要）
export const voiceStatic: Record<string, VoiceStatic> = {
  gameStart: {
    en: "Good morning. The house awaits your direction.",
    ja: "おはようございます。館はあなたの指示を待っています。",
  },
  bellRing: {
    en: "The household bell has been rung.",
    ja: "館の鐘を鳴らしました。",
  },
  diarySaved: {
    en: "The last light has gone from the west windows. Your account has been placed safely in the household diary.",
    ja: "西の窓から最後の光が消えました。あなたの記録は館の日記に大切に保管されました。",
  },
};

// テンプレートメッセージ（コンテキスト差し替え）
export const voiceTemplates: Record<string, VoiceTemplate> = {
  emergencyResolved: {
    en: ({ location }) => `${location} emergency resolved.`,
    ja: ({ location }) => `${location}の緊急事態を解決しました。`,
  },
  staffDispatch: {
    en: ({ person, location }) => `${person} dispatched to ${location}.`,
    ja: ({ person, location }) => `${person}を${location}へ派遣しました。`,
  },
  staffArrival: {
    en: ({ person }) => `${person} has arrived at the scene.`,
    ja: ({ person }) => `${person}が現場に到着しました。`,
  },
  taskComplete: {
    en: ({ task }) => `${task} marked complete. The household is in good order.`,
    ja: ({ task }) => `${task}を完了しました。館は良い調子です。`,
  },
};
