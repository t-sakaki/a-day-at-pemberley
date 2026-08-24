// 発声専用のマネージャー
// 言語が 'ja' のときは UK English を先に発声し、終了後に日本語を連続発声する
// 言語が 'en' のときは UK English のみ発声する
// emergency オプションが true のときは速めの発声速度を使う

export class VoiceManager {
  private enabled: boolean = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      window.speechSynthesis?.cancel();
    }
  }

  /**
   * 発声する。言語が 'ja' のときは UK English を先に、その後日本語を連続発声する。
   * 言語が 'en' のときは UK English のみ発声する。
   * emergency が true のときは速めの発声速度を使う。
   */
  speak(
    english: string,
    japanese: string,
    language: 'en' | 'ja' | 'fr' | 'de' | 'es' | 'zh',
    userRate: number = 0.9,
    options: { emergency?: boolean; pitch?: number } = {}
  ) {
    if (!this.enabled) return;
    if (!('speechSynthesis' in window)) return;
    const synthesis = window.speechSynthesis as SpeechSynthesis | undefined;
    if (!synthesis) return;

    synthesis.cancel();

    const isEmergency = options.emergency ?? false;
    const rate = isEmergency ? Math.max(userRate * 1.4, 1.2) : userRate;
    const pitch = options.pitch ?? 1;

    const speakOne = (text: string, lang: string, rate: number, pitch: number): SpeechSynthesisUtterance | null => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      const voices = synthesis.getVoices();
      const selected = voices.find(v => v.lang.toLowerCase() === lang.toLowerCase());
      if (selected) utterance.voice = selected;
      synthesis.speak(utterance);
      return utterance;
    };

    // UK English を必ず先に発声
    const enUtterance = speakOne(english, 'en-GB', rate, pitch);
    if (!enUtterance) return;

    // 言語が日本語なら、英語終了後に日本語を連続発声
    if (language === 'ja') {
      enUtterance.onend = () => {
        const jaUtterance = speakOne(japanese, 'ja-JP', rate, pitch);
        if (jaUtterance) {
          jaUtterance.onend = () => {};
          jaUtterance.onerror = () => {};
        }
      };
      enUtterance.onerror = () => {
        // 英語発声に失敗しても日本語は発声する
        speakOne(japanese, 'ja-JP', rate, pitch);
      };
    }
  }
}
