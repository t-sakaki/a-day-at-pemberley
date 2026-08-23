import type { GuestTemplate, LocalizedText } from '../data/guests';
import { guests } from '../data/guests';

export type GuestState = GuestTemplate & { mood: number; arrived: boolean; line: LocalizedText };

export class GuestManager {
  private states: GuestState[] = [];

  reset(day: number) {
    const guest = guests[(day - 1) % guests.length];
    this.states = [{ ...guest, mood: 82, arrived: false, line: guest.arrivalLine }];
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