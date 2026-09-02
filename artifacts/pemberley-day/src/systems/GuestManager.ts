import type { GuestTemplate, LocalizedText } from '../data/guests';
import { guests } from '../data/guests';

export type GuestState = GuestTemplate & { mood: number; arrived: boolean; line: LocalizedText };

// 原作 ch.43–46 の三日間。日ごとにペンバリーへ現れる顔ぶれ。
// 1日目: ガーディナー夫妻に連れられたエリザベス（主人は留守のはず）。
// 2日目: 早く戻ったダーシー氏が妹ジョージアナと友人ビングリー氏を伴い引き合わせに。
// 3日目: ビングリー姉妹（キャロライン嬢・ハースト夫人）の気まずい訪問。
const DAY_CAST: string[][] = [
  ['the-gardiners', 'elizabeth-bennet'],
  ['the-gardiners', 'elizabeth-bennet', 'darcy', 'georgiana', 'bingley'],
  ['elizabeth-bennet', 'darcy', 'caroline', 'louisa'],
];

function template(id: string): GuestTemplate {
  return guests.find(guest => guest.id === id) ?? guests[0];
}

export class GuestManager {
  private states: GuestState[] = [];

  reset(day: number) {
    const cast = DAY_CAST[(day - 1) % DAY_CAST.length];
    this.states = cast.map(id => {
      const guest = template(id);
      return { ...guest, mood: 82, arrived: false, line: guest.arrivalLine };
    });
    return this.states;
  }

  arrive() {
    this.states = this.states.map(guest => ({ ...guest, arrived: true, line: guest.arrivalLine }));
    return this.states;
  }

  disappoint(amount = 8) {
    this.states = this.states.map(guest => ({ ...guest, mood: Math.max(0, guest.mood - amount), line: guest.complaintLine }));
    return this.states;
  }

  please(amount = 10) {
    this.states = this.states.map(guest => ({ ...guest, mood: Math.min(100, guest.mood + amount), line: guest.arrivalLine }));
    return this.states;
  }

  get current() {
    return this.states;
  }
}
