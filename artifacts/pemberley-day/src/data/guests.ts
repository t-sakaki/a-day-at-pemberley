export type GuestPreference = 'quiet' | 'tea' | 'garden' | 'perfect order';
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

export const guests: GuestTemplate[] = [
  {
    id: 'lady-catherine',
    name: 'Lady Catherine',
    title: 'Unexpected caller',
    color: '#c9945e',
    preferences: ['quiet', 'tea', 'perfect order'],
    arrivalLine: { en: 'Lady Catherine has arrived at the front hall without notice.', ja: 'キャサリン夫人が予告なく玄関ホールへ到着しました。', fr: 'Lady Catherine est arrivée dans le vestibule sans prévenir.', de: 'Lady Catherine ist unangekündigt in der Eingangshalle eingetroffen.', es: 'Lady Catherine ha llegado al vestíbulo sin avisar.', zh: '凯瑟琳夫人未事先通知便抵达了前厅。' },
    complaintLine: { en: 'Lady Catherine has noticed the delay. She expects the house to be in perfect order.', ja: 'キャサリン夫人が遅れに気づきました。館が完璧に整っていることを望んでいます。', fr: 'Lady Catherine a remarqué le retard. Elle exige que la maison soit parfaitement en ordre.', de: 'Lady Catherine hat die Verzögerung bemerkt. Sie erwartet, dass das Haus vollkommen in Ordnung ist.', es: 'Lady Catherine ha notado el retraso. Espera que la casa esté en perfecto orden.', zh: '凯瑟琳夫人注意到了延误。她要求宅邸一切井然有序。' },
  },
  {
    id: 'mr-bingley',
    name: 'Mr. Bingley',
    title: 'Afternoon caller',
    color: '#9fb8a5',
    preferences: ['tea', 'garden'],
    arrivalLine: { en: 'Mr. Bingley’s carriage has turned into the front drive.', ja: 'ビングリー氏の馬車が正門を曲がりました。', fr: 'La voiture de M. Bingley vient de tourner dans l’allée principale.', de: 'Mr. Bingleys Kutsche biegt gerade in die Auffahrt ein.', es: 'El carruaje del señor Bingley ha entrado por la avenida principal.', zh: '宾利先生的马车驶入了前庭车道。' },
    complaintLine: { en: 'Mr. Bingley waits patiently, though the reception room is growing cold.', ja: 'ビングリー氏は辛抱強く待っていますが、応接間が冷えてきました。', fr: 'M. Bingley attend patiemment, mais le salon se refroidit.', de: 'Mr. Bingley wartet geduldig, obwohl der Empfangssalon immer kälter wird.', es: 'El señor Bingley espera pacientemente, aunque el salón se está enfriando.', zh: '宾利先生耐心地等候着，但接待室渐渐冷了下来。' },
  },
];