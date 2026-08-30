// 一日の結果から「自由間接話法」の日記を組み立てる。
// 数値ではなく、その日あなたが何を見せたかを一段落の文章にする。

export type DiaryInput = {
  dayNumber: number;
  weatherEn: string;
  weatherJa: string;
  completed: number;
  taskCount: number;
  reputation: number;
  guestMood: number;
  pianoPlayed: boolean;
};

export type DiaryProse = { en: string; ja: string };

// 訪問者がその日抱いた「印象」。評判と客の機嫌の重み付き平均。
function esteem(input: DiaryInput): number {
  return Math.round(input.reputation * 0.6 + input.guestMood * 0.4);
}

function dutiesClause(input: DiaryInput): DiaryProse {
  const { completed, taskCount } = input;
  if (completed >= taskCount) {
    return {
      en: 'Every principal duty had been seen to before the carriage turned in at the gates,',
      ja: '主だった務めはどれも、馬車が門を入るより前に片づいており、',
    };
  }
  if (completed >= taskCount - 1) {
    return {
      en: 'All but one small thing had been seen to before the visitors arrived,',
      ja: 'ひとつ些細なことを除けば、来訪者を迎えるまでに一通りは整っており、',
    };
  }
  if (completed <= 1) {
    return {
      en: 'More was left undone than the steward would willingly set down here,',
      ja: '執事がここに書き留めたいと思うより多くのことが手つかずのまま残り、',
    };
  }
  return {
    en: 'The house was in fair order, though not in the order it might have been,',
    ja: '館はまずまず整っていた——望みうる整い方には及ばぬにせよ——',
  };
}

function esteemClause(input: DiaryInput): DiaryProse {
  const score = esteem(input);
  if (score >= 85) {
    return {
      en: 'and Mrs. Reynolds’s account of her master wanted nothing in warmth. The party went away with the settled impression of a house—and of a man—better than report had made them.',
      ja: 'レイノルズ夫人が主人を語る言葉には温かみが少しも欠けていなかった。一行は、噂が伝えていたよりも good な館——そして人——という揺るがぬ印象を抱いて帰っていった。',
    };
  }
  if (score >= 72) {
    return {
      en: 'and the visitors were civil throughout. If they remarked any want of order, they were too well-bred to say so, and the prospect from the west front carried the day.',
      ja: '来訪者は終始礼儀正しかった。仮に何か不備に気づいたとしても、口にするには育ちが良すぎたし、西正面からの眺めがその日を救った。',
    };
  }
  return {
    en: 'and there was a coolness in the leave-taking that no fine prospect from the gallery could quite dispel. The steward is resolved that tomorrow shall go otherwise.',
    ja: 'それでも辞去の際にはどこか冷ややかなものが漂い、回廊からのどれほど見事な眺めもそれを拭いきれなかった。執事は、明日は違うようにと心に決めている。',
  };
}

function pianoClause(input: DiaryInput): DiaryProse {
  if (input.pianoPlayed) {
    return {
      en: ' In the evening Miss Darcy was prevailed upon to play, and the music room, being in good order, showed her to every advantage.',
      ja: ' 夕刻にはジョージアナ嬢が請われて演奏し、よく整えられた音楽室は彼女をこの上なく引き立てた。',
    };
  }
  return {
    en: ' The pianoforte stood closed; Miss Darcy could not be persuaded, and the evening was the quieter for it.',
    ja: ' ピアノフォルテは蓋を閉じたままだった。ジョージアナ嬢は説き伏せられず、夕べはその分だけ静かだった。',
  };
}

export function composeDiary(input: DiaryInput): DiaryProse {
  const duties = dutiesClause(input);
  const opinion = esteemClause(input);
  const piano = pianoClause(input);
  return {
    en: `The day came in with ${input.weatherEn.toLowerCase()}, and the house was awake before it. ${duties.en} ${opinion.en}${piano.en} The last light went from the west windows at the usual hour.`,
    ja: `その日は${input.weatherJa}とともに明け、館はそれより先に目を覚ましていた。${duties.ja}${opinion.ja}${piano.ja} 西の窓から最後の光が消えたのは、いつもの時刻だった。`,
  };
}
