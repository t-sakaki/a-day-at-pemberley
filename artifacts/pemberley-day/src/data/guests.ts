export type GuestPreference = 'quiet' | 'tea' | 'garden' | 'perfect order' | 'portraits' | 'music';
export type LocalizedText = { en: string; ja: string; fr: string; de: string; es: string; zh: string };

export type GuestTemplate = {
  id: string;
  name: string;
  title: string;
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
    title: 'A travelling party from Gracechurch Street',
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
    title: 'A visitor from Hertfordshire',
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
];
