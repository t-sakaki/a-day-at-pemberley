import type { LocalizedText } from './guests';
import type { TourRoomId } from '../systems/TourSystem';

// 朝、執事の机に置かれた書簡。どれも一日が本格的に始まる前に返事を要する。
// 選んだ答えがその日の館の段取り（部屋の下ごしらえ・人手・評判）を少しずつ決める。

export type DayModifier = {
  tourBias?: Partial<Record<TourRoomId, number>>; // 見学部屋の整い具合に加算
  reputation?: number;
  staffMorale?: number;
  absentStaffId?: string; // この奉公人は今日、受動的な部屋の手入れをしない
  note: LocalizedText; // 選択時に出来事の記録へ加える一文
};

export type LetterOption = { label: LocalizedText; modifier: DayModifier };

export type Letter = {
  id: string;
  from: LocalizedText;
  body: LocalizedText;
  options: [LetterOption, LetterOption];
  /** 差出人の肖像（src/data/portraits の id）。無ければ描き顔 */
  portraitId?: string;
};

export const letters: Letter[] = [
  {
    id: 'darcy',
    portraitId: 'darcy',
    from: {
      en: 'Mr. Darcy, by last night’s post',
      ja: 'ダーシー氏（昨夜の便）',
      fr: 'M. Darcy, par le courrier d’hier soir',
      de: 'Mr. Darcy, mit der gestrigen Abendpost',
      es: 'El señor Darcy, por el correo de anoche',
      zh: '达西先生（昨夜信使送到）',
    },
    body: {
      en: 'I may reach Pemberley a day before I am looked for. My sister is uneasy in company; see that her music room and the rooms my guests will pass want for nothing.',
      ja: '予定より一日早くペンバリーに着くかもしれない。妹は人前を苦手にしている。彼女の音楽室と、客人が通る部屋に不足のないようにしてほしい。',
      fr: 'Je puis arriver à Pemberley un jour plus tôt que prévu. Ma sœur est mal à l’aise en société ; veillez à ce que son salon de musique et les pièces où passeront mes invités ne manquent de rien.',
      de: 'Ich könnte Pemberley einen Tag früher erreichen als erwartet. Meine Schwester ist in Gesellschaft unsicher; sorgen Sie dafür, dass ihr Musikzimmer und die Räume, die meine Gäste durchschreiten, an nichts fehlen.',
      es: 'Puede que llegue a Pemberley un día antes de lo previsto. Mi hermana se siente incómoda en compañía; procure que su sala de música y las estancias por las que pasarán mis invitados no carezcan de nada.',
      zh: '我可能比预期早一天抵达彭伯利。舍妹怯于应酬，请务必让她的音乐室以及宾客将经过的房间一应俱全。',
    },
    options: [
      {
        label: { en: 'See first to Miss Darcy’s music room', ja: 'まずジョージアナ嬢の音楽室を', fr: 'S’occuper d’abord du salon de musique', de: 'Zuerst das Musikzimmer herrichten', es: 'Atender primero la sala de música', zh: '先照料达西小姐的音乐室' },
        modifier: {
          tourBias: { music: 14 },
          note: {
            en: 'Sarah is set to the music room before all else; the instrument is aired and tuned.',
            ja: 'サラをまず音楽室へ。楽器の風を通し、調律をさせる。',
            fr: 'Sarah est envoyée au salon de musique avant tout ; l’instrument est aéré et accordé.',
            de: 'Sarah wird vor allem anderen ins Musikzimmer geschickt; das Instrument wird gelüftet und gestimmt.',
            es: 'Se destina a Sarah a la sala de música antes que a nada; se airea y afina el instrumento.',
            zh: '先派萨拉去音乐室；乐器通风、调音。',
          },
        },
      },
      {
        label: { en: 'See first to the rooms the visitors pass', ja: 'まず客人が通る部屋を', fr: 'S’occuper d’abord des pièces de passage', de: 'Zuerst die Durchgangsräume herrichten', es: 'Atender primero las estancias de paso', zh: '先照料宾客经过的房间' },
        modifier: {
          tourBias: { gallery: 9, window: 9 },
          note: {
            en: 'The gallery and the west front are gone over first; Miss Darcy’s room must wait its turn.',
            ja: '肖像画の間と西正面をまず手入れする。ジョージアナ嬢の部屋は順番を待つことになる。',
            fr: 'La galerie et la façade ouest sont faites en premier ; la chambre de Mlle Darcy attendra son tour.',
            de: 'Galerie und Westfront werden zuerst hergerichtet; Miss Darcys Zimmer muss warten.',
            es: 'La galería y la fachada oeste se repasan primero; la habitación de la señorita Darcy esperará su turno.',
            zh: '先收拾画廊和西面正厅；达西小姐的房间只能等一等。',
          },
        },
      },
    ],
  },
  {
    id: 'poulterer',
    from: {
      en: 'The poulterer at Lambton',
      ja: 'ランバトンの鳥肉屋',
      fr: 'Le volailler de Lambton',
      de: 'Der Geflügelhändler in Lambton',
      es: 'El avicultor de Lambton',
      zh: '兰顿的家禽商',
    },
    body: {
      en: 'The account stands a quarter unpaid. A haunch of venison waits at the inn against a man being sent for it this morning.',
      ja: '勘定はこの四半期分が未払いのままです。鹿の腿肉が一本、宿に取り置いてあります。今朝のうちに人をよこしていただければ。',
      fr: 'Le compte reste impayé depuis un trimestre. Un cuissot de venaison attend à l’auberge qu’on envoie quelqu’un le chercher ce matin.',
      de: 'Die Rechnung ist seit einem Vierteljahr offen. Eine Wildkeule wartet im Gasthaus darauf, dass heute Vormittag jemand sie abholt.',
      es: 'La cuenta lleva un trimestre sin pagar. Una pierna de venado espera en la posada a que se envíe a alguien a recogerla esta mañana.',
      zh: '这一季的账款尚未结清。一条鹿腿肉存在客栈，等着今早派人去取。',
    },
    options: [
      {
        label: { en: 'Send John with the cart and settle it', ja: 'ジョンを荷車で行かせ、清算する', fr: 'Envoyer John avec la charrette et régler', de: 'John mit dem Karren schicken und begleichen', es: 'Enviar a John con el carro y saldarla', zh: '派约翰赶车去取并结账' },
        modifier: {
          absentStaffId: 'john',
          staffMorale: 4,
          note: {
            en: 'John takes the cart to Lambton; the account is paid, and the kitchen will not want for the table.',
            ja: 'ジョンが荷車でランバトンへ。勘定は払われ、厨房は食卓に困らずに済む。',
            fr: 'John mène la charrette à Lambton ; le compte est réglé et la cuisine ne manquera de rien pour la table.',
            de: 'John fährt mit dem Karren nach Lambton; die Rechnung ist bezahlt, und die Küche wird für die Tafel nicht darben.',
            es: 'John lleva el carro a Lambton; la cuenta queda pagada y la cocina no carecerá de nada para la mesa.',
            zh: '约翰赶车去兰顿；账已结清，厨房备餐无虞。',
          },
        },
      },
      {
        label: { en: 'Let it wait until the visitors have gone', ja: '客人が帰るまで待たせる', fr: 'Attendre le départ des visiteurs', de: 'Warten, bis die Besucher fort sind', es: 'Que espere hasta que se vayan las visitas', zh: '等访客走后再说' },
        modifier: {
          staffMorale: -3,
          note: {
            en: 'John keeps to the hall; the poulterer is put off, and the kitchen grumbles a little over the dinner.',
            ja: 'ジョンは玄関に留まる。鳥肉屋は後回しにされ、厨房は夕食のことで少し不平を言う。',
            fr: 'John reste dans le vestibule ; le volailler est éconduit et la cuisine ronchonne un peu pour le dîner.',
            de: 'John bleibt in der Halle; der Händler wird vertröstet, und die Küche murrt ein wenig über das Abendessen.',
            es: 'John se queda en el vestíbulo; se da largas al avicultor y la cocina refunfuña un poco por la cena.',
            zh: '约翰留在门厅；家禽商被推脱，厨房为晚饭略有怨言。',
          },
        },
      },
    ],
  },
  {
    id: 'lady-catherine',
    portraitId: 'lady-catherine',
    from: {
      en: 'Lady Catherine de Bourgh, Rosings Park',
      ja: 'キャサリン・ド・バーグ夫人（ロージングズ・パーク）',
      fr: 'Lady Catherine de Bourgh, Rosings Park',
      de: 'Lady Catherine de Bourgh, Rosings Park',
      es: 'Lady Catherine de Bourgh, Rosings Park',
      zh: '凯瑟琳·德·包尔夫人（罗辛斯庄园）',
    },
    body: {
      en: 'You will send the Pemberley head gardener to Rosings for three days to set my succession-houses in order. I do not expect to be refused.',
      ja: 'ペンバリーの庭師頭を三日間ロージングズへよこしなさい。温室の手入れをさせます。断られるとは思っていません。',
      fr: 'Vous enverrez le jardinier en chef de Pemberley à Rosings pour trois jours afin de remettre mes serres en état. Je ne m’attends pas à un refus.',
      de: 'Sie werden den Obergärtner von Pemberley für drei Tage nach Rosings schicken, um meine Treibhäuser in Ordnung zu bringen. Eine Absage erwarte ich nicht.',
      es: 'Enviará al jardinero jefe de Pemberley a Rosings durante tres días para poner en orden mis invernaderos. No espero una negativa.',
      zh: '你须将彭伯利的园艺总管派往罗辛斯三天，整顿我的温室。我不指望被拒绝。',
    },
    options: [
      {
        label: { en: 'Comply. Send Mr. Adams to Rosings', ja: '従う。アダムズをロージングズへ', fr: 'Obtempérer. Envoyer M. Adams à Rosings', de: 'Nachgeben. Mr. Adams nach Rosings schicken', es: 'Ceder. Enviar al señor Adams a Rosings', zh: '照办，派亚当斯去罗辛斯' },
        modifier: {
          absentStaffId: 'mr-adams',
          reputation: 1,
          note: {
            en: 'Mr. Adams is sent to Rosings; Lady Catherine is not crossed, but the lake walk must shift for itself today.',
            ja: 'アダムズをロージングズへ送る。キャサリン夫人の機嫌は損なわれないが、湖畔の道は今日、自力でしのぐほかない。',
            fr: 'M. Adams part pour Rosings ; Lady Catherine n’est pas contrariée, mais la promenade du lac devra se débrouiller seule aujourd’hui.',
            de: 'Mr. Adams wird nach Rosings geschickt; Lady Catherine ist nicht verstimmt, doch der Seeweg muss heute für sich selbst sorgen.',
            es: 'El señor Adams parte hacia Rosings; Lady Catherine no se ofende, pero hoy el paseo del lago tendrá que arreglárselas solo.',
            zh: '亚当斯被派往罗辛斯；凯瑟琳夫人不致动怒，但湖畔小径今天只能自求多福。',
          },
        },
      },
      {
        label: { en: 'Reply that he cannot be spared this week', ja: '今週は手が離せぬと返事する', fr: 'Répondre qu’on ne peut se passer de lui cette semaine', de: 'Antworten, dass er diese Woche unabkömmlich ist', es: 'Responder que esta semana no se puede prescindir de él', zh: '回复本周实在抽不开身' },
        modifier: {
          reputation: -2,
          note: {
            en: 'A civil refusal is sent to Rosings. One may be sure it will be remembered.',
            ja: 'ロージングズへ丁重な断りを送る。忘れられずに覚えられていることは、まず間違いない。',
            fr: 'Un refus courtois est envoyé à Rosings. On peut être sûr qu’il s’en souviendra.',
            de: 'Eine höfliche Absage geht nach Rosings. Man darf sicher sein, dass man sich daran erinnern wird.',
            es: 'Se envía una negativa cortés a Rosings. Puede tenerse por seguro que se recordará.',
            zh: '一封措辞得体的回绝送往罗辛斯。这事必定会被记在心里。',
          },
        },
      },
    ],
  },
];
