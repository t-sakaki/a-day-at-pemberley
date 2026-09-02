export type GuestPreference = 'quiet' | 'tea' | 'garden' | 'perfect order' | 'portraits' | 'music';
export type LocalizedText = { en: string; ja: string; fr: string; de: string; es: string; zh: string };

// en / ja のみ用意し、対応外の言語は英語にフォールバックする短縮ヘルパー。
function bi(en: string, ja: string): LocalizedText {
  return { en, ja, fr: en, de: en, es: en, zh: en };
}

export type GuestTemplate = {
  id: string;
  name: string;
  nameJa: string;
  title: string;
  titleJa: string;
  color: string;
  preferences: GuestPreference[];
  arrivalLine: LocalizedText;
  complaintLine: LocalizedText;
};

// 原作『高慢と偏見』第43章：ペンバリーを訪れる一行。
// ガーディナー夫妻に連れられ、主人は留守と聞いてエリザベスも同行する。
export const guests: GuestTemplate[] = [
  {
    id: 'the-gardiners',
    name: 'Mr. & Mrs. Gardiner',
    nameJa: 'ガーディナー夫妻',
    title: 'A travelling party from Gracechurch Street',
    titleJa: 'グレイスチャーチ街からの旅の一行',
    color: '#9fb8a5',
    preferences: ['garden', 'portraits', 'quiet'],
    arrivalLine: {
      en: 'The Gardiners’ hired carriage has turned in at the lodge; they have asked whether the house may be seen.',
      ja: 'ガーディナー夫妻の貸し馬車が門番小屋を入りました。館を拝見できるか、と尋ねています。',
      fr: 'La voiture de louage des Gardiner a franchi la loge ; ils demandent si l’on peut visiter la maison.',
      de: 'Die Mietkutsche der Gardiners ist am Pförtnerhaus eingebogen; sie fragen, ob das Haus besichtigt werden darf.',
      es: 'El carruaje alquilado de los Gardiner ha entrado por la casa del guarda; preguntan si se puede ver la casa.',
      zh: '加德纳夫妇租来的马车已驶入门房，他们询问是否可以参观宅邸。',
    },
    complaintLine: {
      en: 'Mrs. Gardiner waits in the hall, admiring the prospect, though the housekeeper has been kept some time from her round.',
      ja: 'ガーディナー夫人は玄関で眺めに見入りながら待っていますが、家政婦は案内をしばらく待たされています。',
      fr: 'Mme Gardiner attend dans le vestibule, admirant la vue, mais la gouvernante est retenue depuis un moment.',
      de: 'Mrs. Gardiner wartet in der Halle und bewundert die Aussicht, doch die Haushälterin wird schon eine Weile von ihrem Rundgang abgehalten.',
      es: 'La señora Gardiner espera en el vestíbulo admirando las vistas, aunque el ama de llaves lleva un rato sin poder comenzar su recorrido.',
      zh: '加德纳太太在门厅里等候，欣赏着景致，但女管家已被耽搁了一会儿，无法开始导览。',
    },
  },
  {
    id: 'elizabeth-bennet',
    name: 'Miss Elizabeth Bennet',
    nameJa: 'エリザベス・ベネット嬢',
    title: 'A visitor from Hertfordshire',
    titleJa: 'ハートフォードシャーからの来訪者',
    color: '#c98b6a',
    preferences: ['portraits', 'garden', 'perfect order'],
    arrivalLine: {
      en: 'Miss Bennet has come in with her aunt and uncle, on the understanding that the family is away from home.',
      ja: 'ベネット嬢が叔父叔母とともに入ってきました。ご一家は留守、と聞いた上でのことです。',
      fr: 'Mlle Bennet est entrée avec son oncle et sa tante, croyant la famille absente.',
      de: 'Miss Bennet ist mit ihrem Onkel und ihrer Tante eingetreten, in der Annahme, die Familie sei verreist.',
      es: 'La señorita Bennet ha entrado con sus tíos, en el entendido de que la familia está fuera.',
      zh: '贝内特小姐随姨父姨母进来了，她以为主人一家外出。',
    },
    complaintLine: {
      en: 'Miss Bennet says little, but her eye moves over every want of care in the room, and misses nothing.',
      ja: 'ベネット嬢は多くを語りませんが、その視線は部屋の行き届かぬ点をひとつずつ辿り、何も見逃しません。',
      fr: 'Mlle Bennet dit peu, mais son regard relève chaque négligence de la pièce et ne manque rien.',
      de: 'Miss Bennet sagt wenig, doch ihr Blick wandert über jede Nachlässigkeit im Raum und entgeht ihr nichts.',
      es: 'La señorita Bennet habla poco, pero su mirada recorre cada descuido de la sala y no se le escapa nada.',
      zh: '贝内特小姐话不多，但她的目光扫过房间里每一处照料不周之处，什么都没有漏过。',
    },
  },
  // --- ダーシー氏の早い帰館以降に現れる一行（2日目・3日目） ---
  {
    id: 'darcy',
    name: 'Mr. Darcy',
    nameJa: 'ダーシー氏',
    title: 'The master of Pemberley, returned a day early',
    titleJa: 'ペンバリーの主人、予定より一日早い帰館',
    color: '#3f4a63',
    preferences: ['perfect order', 'quiet', 'portraits'],
    arrivalLine: bi(
      'Mr. Darcy is come home before he was looked for, and has gone straight down to the visitors on the lawn.',
      'ダーシー氏が予定より早くお戻りになり、そのまま芝生の来客のもとへ向かわれました。',
    ),
    complaintLine: bi(
      'Mr. Darcy says little and stands very upright; he is watching how the house shows itself today.',
      'ダーシー氏は口数少なく、背筋を伸ばして立っておられます。館の見え方をじっと見ておいでです。',
    ),
  },
  {
    id: 'georgiana',
    name: 'Miss Darcy',
    nameJa: 'ジョージアナ・ダーシー嬢',
    title: 'Mr. Darcy’s sister, uneasy in company',
    titleJa: 'ダーシー氏の妹、人前を苦手にしている',
    color: '#c98b9e',
    preferences: ['music', 'quiet', 'tea'],
    arrivalLine: bi(
      'Miss Darcy has been brought to be introduced; she keeps close to her brother and speaks in a low voice.',
      'ジョージアナ嬢が引き合わされにお越しです。兄君のそばを離れず、小さな声でお話しになります。',
    ),
    complaintLine: bi(
      'Miss Darcy has drawn back towards the window; the room is louder than she would wish.',
      'ジョージアナ嬢が窓辺へ下がってしまわれました。お望みより部屋が賑やかなのです。',
    ),
  },
  {
    id: 'bingley',
    name: 'Mr. Bingley',
    nameJa: 'ビングリー氏',
    title: 'Mr. Darcy’s friend, lately of Netherfield',
    titleJa: 'ダーシー氏の友人、先ごろまでネザーフィールドの主',
    color: '#c8a15c',
    preferences: ['garden', 'tea'],
    arrivalLine: bi(
      'Mr. Bingley has come with the Darcys in the best of humours, asking warmly after every one of the party.',
      'ビングリー氏がダーシー家とともに、すこぶるご機嫌でお越しです。一行のどなたのことも温かくお尋ねになります。',
    ),
    complaintLine: bi(
      'Mr. Bingley is as agreeable as ever, though he glances more than once at the clock.',
      'ビングリー氏は相変わらず愛想よくしておられますが、時計を二度ならず見ておいでです。',
    ),
  },
  {
    id: 'caroline',
    name: 'Miss Bingley',
    nameJa: 'キャロライン・ビングリー嬢',
    title: 'Mr. Bingley’s sister',
    titleJa: 'ビングリー氏の妹',
    color: '#6f8f7a',
    preferences: ['perfect order', 'portraits'],
    arrivalLine: bi(
      'Miss Bingley has called with her sister; she takes in the room at a glance and says how charmingly it is kept.',
      'キャロライン嬢が姉君とともにお訪ねです。ひと目で部屋を見渡し、なんと見事に整えられていること、と仰います。',
    ),
    complaintLine: bi(
      'Miss Bingley’s compliments have turned very particular; she has found the one vase that is out of place.',
      'キャロライン嬢のお褒めがひどく細かくなってきました。ただ一つ置き所の悪い花瓶を見つけ出されたのです。',
    ),
  },
  {
    id: 'louisa',
    name: 'Mrs. Hurst',
    nameJa: 'ハースト夫人',
    title: 'Mr. Bingley’s elder sister',
    titleJa: 'ビングリー氏の姉',
    color: '#9a7f96',
    preferences: ['tea', 'quiet'],
    arrivalLine: bi(
      'Mrs. Hurst follows her sister in, agreeing with whatever is said and asking whether tea will be long.',
      'ハースト夫人が妹君に続いて入ってこられます。何にでも相槌を打たれ、お茶はまだかとお尋ねです。',
    ),
    complaintLine: bi(
      'Mrs. Hurst has grown quiet and a little cool; the visit has lasted longer than she expected.',
      'ハースト夫人が静かに、少しよそよそしくなられました。訪問がお思いより長引いているのです。',
    ),
  },
];
