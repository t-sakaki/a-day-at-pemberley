import type { LocalizedText } from '../data/guests';

export type EmergencyType = 'spill' | 'guest_arrival' | 'sick' | 'dog' | 'dinner_rush';
export type EmergencySeverity = 'urgent' | 'high' | 'watch';
export type EmergencyStatus = 'active' | 'escalated' | 'resolved';

export type EmergencyEvent = {
  id: string;
  type: EmergencyType;
  status: EmergencyStatus;
  severity: EmergencySeverity;
  location: LocalizedText;
  point: { x: number; y: number };
  startedAt: number;
  deadline: number;
  dialogue: LocalizedText;
  escalationDialogue: LocalizedText;
  followOnType?: EmergencyType;
  parentId?: string;
  escalatedAt?: number;
  assignedStaffId?: string;
};

type EmergencyTemplate = Omit<EmergencyEvent, 'id' | 'status' | 'startedAt' | 'deadline'> & { duration: number };

export const templates: Record<EmergencyType, EmergencyTemplate> = {
  spill: { type: 'spill', severity: 'urgent', location: { en: 'Morning rooms', ja: 'Morning rooms', fr: 'Salons du matin', de: 'Morgenräume', es: 'Salas de la mañana', zh: '晨间房间' }, point: { x: -3, y: -2 }, duration: 32, dialogue: { en: 'A spill needs immediate attention in the morning rooms.', ja: '朝の部屋でこぼれたものをすぐに片付ける必要があります。', fr: 'Un liquide renversé doit être nettoyé immédiatement dans les salons du matin.', de: 'In den Morgenräumen muss eine verschüttete Flüssigkeit sofort beseitigt werden.', es: 'Hay que atender de inmediato un derrame en las salas de la mañana.', zh: '晨间房间有洒出的液体，需要立即处理。' }, escalationDialogue: { en: 'The spill is spreading through the morning rooms.', ja: 'こぼれたものが朝の部屋へ広がっています。', fr: 'Le liquide renversé se répand dans les salons du matin.', de: 'Die verschüttete Flüssigkeit breitet sich in den Morgenräumen aus.', es: 'El derrame se está extendiendo por las salas de la mañana.', zh: '洒出的液体正在晨间房间蔓延。' } },
  guest_arrival: { type: 'guest_arrival', severity: 'high', location: { en: 'Front hall', ja: 'Front hall', fr: 'Vestibule', de: 'Eingangshalle', es: 'Vestíbulo', zh: '前厅' }, point: { x: 0, y: 0 }, duration: 24, dialogue: { en: 'An unannounced guest is waiting at the front hall.', ja: '予告のない客人が玄関ホールで待っています。', fr: 'Un invité inattendu attend dans le vestibule.', de: 'Ein unangekündigter Gast wartet in der Eingangshalle.', es: 'Un invitado inesperado espera en el vestíbulo.', zh: '一位未事先通知的客人正在前厅等候。' }, escalationDialogue: { en: 'The waiting guest has begun to notice the delay.', ja: '待っている客人が遅れに気づき始めました。', fr: 'L’invité qui attend commence à remarquer le retard.', de: 'Der wartende Gast bemerkt allmählich die Verzögerung.', es: 'El invitado que espera empieza a notar el retraso.', zh: '等候的客人开始注意到延误。' } },
  sick: { type: 'sick', severity: 'urgent', location: { en: 'Servants’ corridor', ja: '使用人通路', fr: 'Couloir des domestiques', de: 'Dienstbotenkorridor', es: 'Pasillo de servicio', zh: '仆人走廊' }, point: { x: -7, y: 1 }, duration: 20, followOnType: 'dinner_rush', dialogue: { en: 'A footman has fallen ill in the servants’ corridor; a physician is needed.', ja: '使用人通路で従僕が具合を悪くしました。医師が必要です。', fr: 'Un valet est tombé malade dans le couloir des domestiques ; un médecin est nécessaire.', de: 'Ein Diener ist im Dienstbotenkorridor erkrankt; ein Arzt wird benötigt.', es: 'Un lacayo ha enfermado en el pasillo de servicio; se necesita un médico.', zh: '一名男仆在仆人走廊病倒了，需要医生。' }, escalationDialogue: { en: 'The footman’s illness is worsening and the evening staff are short-handed.', ja: '従僕の具合が悪化し、夕刻の使用人が足りません。', fr: 'L’état du valet s’aggrave et le personnel du soir manque de bras.', de: 'Der Zustand des Dieners verschlechtert sich, und am Abend fehlen Arbeitskräfte.', es: 'El estado del lacayo empeora y falta personal para la tarde.', zh: '男仆的病情正在恶化，晚班人手不足。' } },
  dog: { type: 'dog', severity: 'high', location: { en: 'South lawn', ja: '南の芝生', fr: 'Pelouse sud', de: 'Südrasen', es: 'Césped sur', zh: '南草坪' }, point: { x: 5, y: 5 }, duration: 26, followOnType: 'spill', dialogue: { en: 'The hound has slipped its lead on the south lawn and is heading for the house.', ja: '猟犬が南の芝生でリードを外し、館へ向かっています。', fr: 'Le chien a échappé à sa laisse sur la pelouse sud et se dirige vers la maison.', de: 'Der Jagdhund hat sich auf dem Südrasen losgerissen und läuft zum Haus.', es: 'El sabueso se ha soltado en el césped sur y se dirige a la casa.', zh: '猎犬在南草坪挣脱了牵引绳，正朝宅邸跑去。' }, escalationDialogue: { en: 'The loose hound has overturned a tray by the south lawn.', ja: '逃げた猟犬が南の芝生で盆をひっくり返しました。', fr: 'Le chien en liberté a renversé un plateau près de la pelouse sud.', de: 'Der entlaufene Jagdhund hat am Südrasen ein Tablett umgestoßen.', es: 'El sabueso suelto ha volcado una bandeja junto al césped sur.', zh: '逃脱的猎犬在南草坪旁打翻了托盘。' } },
  dinner_rush: { type: 'dinner_rush', severity: 'high', location: { en: 'Kitchen passage', ja: '厨房通路', fr: 'Passage de la cuisine', de: 'Küchenpassage', es: 'Pasillo de la cocina', zh: '厨房通道' }, point: { x: 4, y: -1 }, duration: 22, followOnType: 'guest_arrival', dialogue: { en: 'Dinner service is running behind in the kitchen passage; the first course is due soon.', ja: '厨房通路で夕食の支度が遅れています。最初の料理の時間が迫っています。', fr: 'Le service du dîner prend du retard dans le passage de la cuisine ; le premier plat va bientôt être servi.', de: 'Der Abendservice kommt in der Küchenpassage in Verzug; der erste Gang wird bald erwartet.', es: 'El servicio de la cena se retrasa en el pasillo de la cocina; el primer plato llegará pronto.', zh: '厨房通道的晚餐服务落后了，第一道菜很快就要上桌。' }, escalationDialogue: { en: 'Dinner service is in danger of missing the guests’ seating time.', ja: '夕食の支度が客人の着席時間に間に合わない恐れがあります。', fr: 'Le service du dîner risque de ne pas être prêt à l’heure où les invités s’installent.', de: 'Der Abendservice droht zur Sitzzeit der Gäste nicht bereit zu sein.', es: 'El servicio de la cena corre el riesgo de no estar listo a la hora de sentarse los invitados.', zh: '晚餐服务可能赶不上客人入席的时间。' } },
};

export class EventSystem {
  private events: EmergencyEvent[] = [];
  private sequence = 0;

  reset() {
    this.events = [];
    this.sequence = 0;
    return this.events;
  }

  spawn(type: EmergencyType, now: number, parentId?: string) {
    if (this.events.some(event => event.type === type && event.status !== 'resolved')) return this.events;
    if (this.active.length >= 3) return this.events;
    const template = templates[type];
    const { duration, ...eventTemplate } = template;
    this.events = [...this.events, { ...eventTemplate, id: `${type}-${++this.sequence}`, status: 'active', startedAt: now, deadline: now + duration, ...(parentId ? { parentId } : {}) }];
    return this.events;
  }

  advance(now: number) {
    const escalated: EmergencyEvent[] = [];
    this.events = this.events.map(event => {
      if (event.status === 'active' && now >= event.deadline) {
        const updated = { ...event, status: 'escalated' as const, severity: 'urgent' as const, escalatedAt: now, deadline: now + 18 };
        escalated.push(updated);
        return updated;
      }
      return event;
    });
    escalated.forEach(event => {
      if (event.followOnType) this.spawn(event.followOnType, now, event.id);
    });
    return this.events;
  }

  resolve(id: string, now: number) {
    this.events = this.events.map(event => event.id === id ? { ...event, status: 'resolved', deadline: now } : event);
    return this.events;
  }

  assign(id: string, staffId: string) {
    this.events = this.events.map(event => event.id === id && event.status !== 'resolved' ? { ...event, assignedStaffId: staffId } : event);
    return this.events;
  }

  get active() {
    return this.events.filter(event => event.status !== 'resolved');
  }
}