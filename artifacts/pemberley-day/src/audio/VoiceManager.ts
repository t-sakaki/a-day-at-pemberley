// 事前生成した MP3 を再生する読み上げマネージャー。
// Web Speech API は使わないので、LINE 内ブラウザなど WebView でも鳴る。
// 音源は public/vo/<lang>/<id>.mp3（scripts/generate-vo が Piper で生成）。
// 言語が 'ja' のときは英語 → 日本語の順に続けて再生する（従来の挙動を踏襲）。
// 対応外の言語（fr/de/es/zh）は英語音声を再生する（本文の英語フォールバックに合わせる）。

// 対応言語は en と ja。それ以外は英語音声で読み上げる。

export class VoiceManager {
  private enabled = true;
  private base: string;
  private current: HTMLAudioElement | null = null;
  private token = 0;

  constructor(base: string = (import.meta.env.BASE_URL || '/')) {
    this.base = base.replace(/\/+$/, '');
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  stop() {
    this.token += 1;
    if (this.current) {
      this.current.pause();
      this.current.onended = null;
      this.current.onerror = null;
      this.current.src = '';
      this.current = null;
    }
  }

  /** 台詞 id を言語に応じて再生する。存在しない音源は黙って無視する。 */
  play(id: string, language: string) {
    if (!this.enabled || typeof Audio === 'undefined') return;
    this.stop();
    const mine = this.token;
    const en = `${this.base}/vo/en/${encodeURIComponent(id)}.mp3`;
    if (language === 'ja') {
      this.playOne(en, mine, () => this.playOne(`${this.base}/vo/ja/${encodeURIComponent(id)}.mp3`, mine));
    } else {
      this.playOne(en, mine);
    }
  }

  /** 複数の台詞を続けて読み上げる（日記の朗読など）。 */
  playSequence(ids: string[], language: string) {
    if (!this.enabled || ids.length === 0) return;
    const queue = [...ids];
    const next = () => {
      const id = queue.shift();
      if (id === undefined) return;
      const mine = this.token;
      const en = `${this.base}/vo/en/${encodeURIComponent(id)}.mp3`;
      const afterEn = language === 'ja'
        ? () => this.playOne(`${this.base}/vo/ja/${encodeURIComponent(id)}.mp3`, mine, next)
        : next;
      this.playOne(en, mine, afterEn);
    };
    this.stop();
    next();
  }

  private playOne(url: string, token: number, onended?: () => void) {
    if (token !== this.token) return;
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.onended = () => {
      if (token === this.token && this.enabled) onended?.();
    };
    audio.onerror = () => {
      // 音源が無い / 読み込めない場合は次へ進むか、静かに終える。
      if (token === this.token && this.enabled) onended?.();
    };
    this.current = audio;
    void audio.play().catch(() => undefined);
  }
}
