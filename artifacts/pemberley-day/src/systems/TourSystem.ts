import type { LocalizedText } from '../data/guests';

// 原作『高慢と偏見』第43章の見学順路。レイノルズ夫人が一行を部屋から部屋へ案内する。
// 各部屋には「整い具合(readiness)」があり、時間とともに少しずつ下がる。
// あなた（執事）が近づいて整えるか、担当を割り当てた奉公人がいれば持ち直す。
// 一行が入室したその瞬間の整い具合が、夫人の賛辞かエリザベスの心内語を生む。

export type TourRoomId = 'gallery' | 'music' | 'window' | 'grounds';
export type ObservationBand = 'warm' | 'civil' | 'wanting';

export type TourRoom = {
  id: TourRoomId;
  name: LocalizedText;
  focus: string; // この文字列と一致する担当を持つ奉公人が受動的に整える
  point: { x: number; y: number };
};

export const tourRooms: TourRoom[] = [
  {
    id: 'gallery',
    focus: 'Portrait gallery',
    point: { x: -4, y: -4 },
    name: { en: 'The picture gallery', ja: '肖像画の間', fr: 'La galerie de portraits', de: 'Die Porträtgalerie', es: 'La galería de retratos', zh: '肖像画廊' },
  },
  {
    id: 'music',
    focus: 'Music room',
    point: { x: -8, y: 0 },
    name: { en: 'The music room', ja: '音楽室', fr: 'Le salon de musique', de: 'Das Musikzimmer', es: 'La sala de música', zh: '音乐室' },
  },
  {
    id: 'window',
    focus: 'Front hall',
    point: { x: 0, y: -5 },
    name: { en: 'The great west window', ja: '西の大窓', fr: 'La grande fenêtre ouest', de: 'Das große Westfenster', es: 'El gran ventanal del oeste', zh: '西面大窗' },
  },
  {
    id: 'grounds',
    focus: 'The grounds',
    point: { x: 6, y: 8 },
    name: { en: 'The lake walk', ja: '湖畔の道', fr: 'La promenade du lac', de: 'Der Seeweg', es: 'El paseo del lago', zh: '湖畔小径' },
  },
];

export type TourObservation = { roomId: TourRoomId; band: ObservationBand; line: LocalizedText };

export const observations: Record<TourRoomId, Record<ObservationBand, LocalizedText>> = {
  gallery: {
    warm: {
      en: 'Mrs. Reynolds lingers over her master’s likeness. “That is my master—and very like him. It was drawn when his father was living.”',
      ja: 'レイノルズ夫人は主人の肖像の前で足を止める。「これが旦那様です——本当によく似ております。お父上がご存命の頃に描かれたものです」',
      fr: 'Mme Reynolds s’attarde devant le portrait de son maître : « C’est mon maître — et tout à fait ressemblant. »',
      de: 'Mrs. Reynolds verweilt vor dem Bildnis ihres Herrn: „Das ist mein Herr – und ihm sehr ähnlich.“',
      es: 'La señora Reynolds se detiene ante el retrato de su señor: «Ese es mi señor, y muy parecido a él.»',
      zh: '雷诺兹太太在主人的画像前驻足：“那就是我的主人——画得很像。”',
    },
    civil: {
      en: 'Elizabeth studies the portrait longer than she means to, and thinks she has never seen the room show it to less advantage.',
      ja: 'エリザベスは思っていたより長くその肖像を見つめ、この部屋がこれほど絵を引き立てないのは初めてだと思う。',
      fr: 'Elizabeth observe le portrait plus longtemps qu’elle ne le voudrait, songeant que la pièce le met mal en valeur.',
      de: 'Elizabeth betrachtet das Bildnis länger als beabsichtigt und findet, der Raum tue ihm wenig Ehre an.',
      es: 'Elizabeth contempla el retrato más de lo que pretendía, y piensa que la sala no lo favorece.',
      zh: '伊丽莎白盯着那幅画像看得比自己想的还久，觉得这房间没能衬出它的好处。',
    },
    wanting: {
      en: 'A film of dust lies along the frames. Mrs. Reynolds passes on rather more quickly than she would wish.',
      ja: '額縁には薄く埃が積もっている。レイノルズ夫人は望むよりいくらか足早に次へ進む。',
      fr: 'Une pellicule de poussière couvre les cadres ; Mme Reynolds passe plus vite qu’elle ne le souhaiterait.',
      de: 'Ein Staubfilm liegt auf den Rahmen; Mrs. Reynolds geht rascher weiter, als ihr lieb ist.',
      es: 'Una capa de polvo cubre los marcos; la señora Reynolds sigue adelante más deprisa de lo que quisiera.',
      zh: '画框上蒙了一层薄灰，雷诺兹太太比她所愿更快地领着众人走过。',
    },
  },
  music: {
    warm: {
      en: 'The pianoforte stands open and tuned. “Miss Darcy will be glad of it,” says Mrs. Reynolds; “she is come only lately from town.”',
      ja: 'ピアノフォルテは蓋が開かれ、調律も済んでいる。「ジョージアナお嬢様がお喜びになります」とレイノルズ夫人。「つい先ごろ町からお戻りになったばかりで」',
      fr: 'Le pianoforte est ouvert et accordé. « Mademoiselle Darcy en sera charmée », dit Mme Reynolds.',
      de: 'Das Pianoforte steht offen und gestimmt. „Miss Darcy wird sich freuen“, sagt Mrs. Reynolds.',
      es: 'El pianoforte está abierto y afinado. «A la señorita Darcy le agradará», dice la señora Reynolds.',
      zh: '钢琴掀着盖，也调好了音。“达西小姐会高兴的，”雷诺兹太太说。',
    },
    civil: {
      en: 'Mrs. Gardiner remarks that it is a pretty room; Elizabeth notices the music left in some disorder on the stand.',
      ja: 'ガーディナー夫人が感じの良い部屋だと言う。エリザベスは譜面台に無造作に置かれた楽譜に目をとめる。',
      fr: 'Mme Gardiner trouve la pièce agréable ; Elizabeth remarque les partitions en désordre sur le pupitre.',
      de: 'Mrs. Gardiner findet den Raum hübsch; Elizabeth bemerkt die unordentlich liegenden Noten.',
      es: 'La señora Gardiner comenta que es una sala bonita; Elizabeth repara en las partituras desordenadas.',
      zh: '加德纳太太说这房间很雅致；伊丽莎白注意到谱架上凌乱的乐谱。',
    },
    wanting: {
      en: 'The room is cold and the instrument closed. Mrs. Reynolds does not press her party to stay in it.',
      ja: '部屋は冷え、楽器は閉じられている。レイノルズ夫人は一行にここへ留まるよう勧めはしない。',
      fr: 'La pièce est froide et l’instrument fermé ; Mme Reynolds n’insiste pas pour qu’on y demeure.',
      de: 'Der Raum ist kalt, das Instrument geschlossen; Mrs. Reynolds hält ihre Gäste nicht darin.',
      es: 'La sala está fría y el instrumento cerrado; la señora Reynolds no anima a quedarse.',
      zh: '房间冷清，琴盖紧闭；雷诺兹太太没有多留客人在此。',
    },
  },
  window: {
    warm: {
      en: 'They come to the window, and the whole prospect opens—river, wood, and hill. Elizabeth thinks that to be mistress of Pemberley might be something.',
      ja: '一行は窓辺に立つ。川、森、丘——景色がひらける。ペンバリーの女主人になるのも悪くない、とエリザベスは思う。',
      fr: 'Ils arrivent à la fenêtre ; toute la vue s’ouvre — rivière, bois, colline. Elizabeth songe qu’être maîtresse de Pemberley serait quelque chose.',
      de: 'Sie treten ans Fenster, und die ganze Aussicht öffnet sich – Fluss, Wald und Hügel. Elizabeth denkt, Herrin von Pemberley zu sein, wäre etwas.',
      es: 'Llegan a la ventana y se abre toda la vista: río, bosque y colina. Elizabeth piensa que ser señora de Pemberley sería algo.',
      zh: '他们走到窗前，整片景致豁然展开——河流、树林、山丘。伊丽莎白心想，做彭伯利的女主人也许是件了不起的事。',
    },
    civil: {
      en: 'The view carries the moment, though the glass wants cleaning and the sill has not been dusted.',
      ja: '眺めがその場を持たせる——もっとも硝子は磨かれておらず、窓台の埃も払われていない。',
      fr: 'La vue sauve l’instant, bien que la vitre soit sale et le rebord poussiéreux.',
      de: 'Die Aussicht trägt den Augenblick, obwohl das Glas ungeputzt und die Fensterbank verstaubt ist.',
      es: 'La vista salva el momento, aunque el cristal está sucio y el alféizar sin limpiar.',
      zh: '景色撑住了这一刻，尽管玻璃没擦、窗台也没掸过灰。',
    },
    wanting: {
      en: 'The shutters are half across the finest view in Derbyshire, and no one thinks to open them fully.',
      ja: 'ダービーシャー一の眺めを、鎧戸が半ば塞いでいる。誰もそれを開け放とうとは思いつかない。',
      fr: 'Les volets masquent à demi la plus belle vue du Derbyshire, et nul ne songe à les ouvrir.',
      de: 'Die Läden verdecken halb die schönste Aussicht Derbyshires, und niemand denkt daran, sie zu öffnen.',
      es: 'Los postigos tapan a medias la mejor vista de Derbyshire, y nadie piensa en abrirlos.',
      zh: '德比郡最好的景致被百叶窗遮去了一半，却没人想到把它们完全打开。',
    },
  },
  grounds: {
    warm: {
      en: 'The gardener leads them down to the water. The walk is trim, the banks are clear, and the party is in no hurry to turn back.',
      ja: '庭師が一行を水辺へと案内する。道は手入れが行き届き、岸辺も払われ、誰も引き返そうとはしない。',
      fr: 'Le jardinier les mène jusqu’à l’eau. L’allée est nette, les berges dégagées, et nul ne se presse de revenir.',
      de: 'Der Gärtner führt sie zum Wasser hinab. Der Weg ist gepflegt, die Ufer frei, und niemand eilt zurück.',
      es: 'El jardinero los lleva hasta el agua. El paseo está cuidado, las orillas despejadas, y nadie tiene prisa por volver.',
      zh: '园丁领着他们走到水边。小径修整齐洁，岸边清爽，众人都不急着往回走。',
    },
    civil: {
      en: 'The grounds please the eye at a distance; nearer to, a barrow and rake have been left across the path.',
      ja: '庭園は遠目には美しい。近づくと、小道に手押し車と熊手が置き去りにされている。',
      fr: 'Le parc plaît de loin ; de plus près, une brouette et un râteau barrent le chemin.',
      de: 'Das Gelände gefällt aus der Ferne; näher besehen liegen Schubkarre und Rechen quer über dem Weg.',
      es: 'Los jardines agradan de lejos; de cerca, una carretilla y un rastrillo cruzan el sendero.',
      zh: '园子远看悦目；走近了，小路上横着一辆手推车和一把耙子。',
    },
    wanting: {
      en: 'Rain has stood in the ruts and no one has been down to the boathouse in days. The walk is cut short.',
      ja: '轍には雨水がたまり、舟小屋へは何日も誰も下りていない。散策は早々に切り上げられる。',
      fr: 'La pluie stagne dans les ornières et nul n’est descendu au hangar à bateaux depuis des jours ; la promenade tourne court.',
      de: 'Regen steht in den Furchen, und seit Tagen war niemand am Bootshaus; der Spaziergang wird abgekürzt.',
      es: 'La lluvia se ha estancado en los surcos y nadie ha bajado al embarcadero en días; el paseo se acorta.',
      zh: '车辙里积着雨水，好几天没人下到船屋去了；散步草草收场。',
    },
  },
};

const START = 13 * 60; // 一行の到着＝13:00
const ROOM_INTERVAL = 18; // 各部屋の滞在（分）
const DECAY_PER_MIN = 0.16;
const TEND_GAIN = 15;
const STAFF_GAIN_PER_MIN = 0.3;

const INITIAL: Record<TourRoomId, number> = { gallery: 62, music: 54, window: 66, grounds: 58 };

function band(value: number): ObservationBand {
  return value >= 75 ? 'warm' : value >= 45 ? 'civil' : 'wanting';
}

export class TourSystem {
  readiness: Record<TourRoomId, number> = { ...INITIAL };
  shown: Partial<Record<TourRoomId, number>> = {};
  currentIndex = -1; // -1: 一行はまだ到着していない
  private settled = false;
  private impressionValue = 0;

  reset() {
    this.readiness = { ...INITIAL };
    this.shown = {};
    this.currentIndex = -1;
    this.settled = false;
    this.impressionValue = 0;
  }

  tend(id: TourRoomId) {
    this.readiness[id] = Math.min(100, this.readiness[id] + TEND_GAIN);
  }

  // 現在案内中の部屋（なければ null）
  get currentRoom(): TourRoom | null {
    return this.currentIndex >= 0 ? tourRooms[this.currentIndex] : null;
  }

  // 見学が終わり、印象が確定していれば 0-100 を返す
  get settledImpression(): number | null {
    return this.settled ? this.impressionValue : null;
  }

  // 各ゲーム内分に1回呼ぶ。一行が新しい部屋へ入ったら観察を返す。
  advance(minutes: number, staffFocuses: Record<string, string>, busyStaffIds: Set<string>): TourObservation | null {
    const currentRoomId = this.currentRoom?.id ?? null;
    for (const room of tourRooms) {
      if (room.id === currentRoomId) continue; // 案内中の部屋は「今まさに見られている」ので変化しない
      const tended = Object.entries(staffFocuses).some(([id, focus]) => focus === room.focus && !busyStaffIds.has(id));
      const delta = tended ? STAFF_GAIN_PER_MIN : -DECAY_PER_MIN;
      this.readiness[room.id] = Math.max(0, Math.min(100, this.readiness[room.id] + delta));
    }

    if (minutes < START) return null;

    const index = Math.min(tourRooms.length - 1, Math.floor((minutes - START) / ROOM_INTERVAL));
    if (index !== this.currentIndex) {
      this.currentIndex = index;
      const room = tourRooms[index];
      const value = Math.round(this.readiness[room.id]);
      this.shown[room.id] = value;
      const shownBand = band(value);
      return { roomId: room.id, band: shownBand, line: observations[room.id][shownBand] };
    }

    if (!this.settled && minutes >= START + ROOM_INTERVAL * tourRooms.length) {
      this.settled = true;
      const values = tourRooms.map(room => this.shown[room.id] ?? Math.round(this.readiness[room.id]));
      this.impressionValue = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    }
    return null;
  }
}
