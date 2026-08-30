import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Bell, BookOpen, ChevronRight, CloudRain, Clock3, Menu, RotateCcw, Settings, Sparkles, Users, Volume2, VolumeX, Wind, X } from 'lucide-react';
import { AudioManager } from './audio/AudioManager';
import { VoiceManager } from './audio/VoiceManager';
import { voiceStatic, voiceTemplates } from './data/voice';
import { EventSystem, type EmergencyEvent } from './systems/EventSystem';
import { GuestManager, type GuestState } from './systems/GuestManager';
import type { LocalizedText } from './data/guests';
import { WatercolorPass } from './visuals/WatercolorPass';
import { WatercolorMaterial } from './visuals/WatercolorMaterial';
import { PaperTextureGenerator, type GeneratedPaperTexture } from './visuals/PaperTextureGenerator';
import { AtmosphericFog } from './visuals/AtmosphericFog';
import { composeDiary, type DiaryProse } from './narrative/diary';
import { TourSystem, tourRooms, type TourRoomId } from './systems/TourSystem';
import { letters, type DayModifier } from './data/letters';

type Phase = 'title' | 'game';
type Point = { x: number; y: number };
type Staff = { id: string; name: string; role: string; initials: string; color: string; home: Point; focus: string };
type BilingualMessage = { en: string; ja: string };
type EventTone = 'arrival' | 'warning' | 'report' | 'walk';
type DiaryEntry = { date: string; complete: number; reputation: number; day?: number; prose?: DiaryProse };

const languages = [
  { name: 'English (UK)', native: 'English', code: 'en' },
  { name: '日本語', native: '日本語', code: 'ja' },
  { name: 'Français', native: 'Français', code: 'fr' },
  { name: 'Deutsch', native: 'Deutsch', code: 'de' },
  { name: 'Español', native: 'Español', code: 'es' },
  { name: '中文', native: '中文', code: 'zh' },
];

type Language = (typeof languages)[number]['code'];

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function Dialog({ open, triggerRef, onClose, className = '', label, children }: {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  className?: string;
  label: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const getFocusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
    const focusable = getFocusable();
    focusable[0]?.focus();

    const containFocus = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const currentFocusable = getFocusable();
      if (currentFocusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = currentFocusable[0];
      const last = currentFocusable[currentFocusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener('keydown', containFocus);
    return () => {
      dialog.removeEventListener('keydown', containFocus);
      if (triggerRef.current) triggerRef.current.focus();
    };
  }, [open, triggerRef]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={dialogRef}
        className={`modal fade-up ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={event => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    eyebrow: 'A household operations game', subtitle: 'Every room has a rhythm. Every guest has a preference. Keep the house in good order before the last light leaves the lake.', begin: 'Begin the day', options: 'Options', settings: 'Settings', language: 'Language', close: 'Close', save: 'Save settings', correspondence: 'House preferences', languageHint: 'Choose the language for your ledger, notices and diary.', titleLine: 'At first light, the house is yours.', season: 'Season', weather: 'Weather', clock: 'House clock', grounds: 'Pemberley grounds', view: 'Steward’s view', move: 'move', run: 'run', adjust: 'adjust view', interact: 'interact', desk: 'Steward’s desk', day: 'Day 01', order: 'Today’s order', ring: 'Ring household bell', closeDay: 'Close day & write diary', household: 'Household', onDuty: 'on duty', staffRoutes: 'Staff routes', reputation: 'Elizabeth’s good opinion', goodOrder: 'Rising · the visitors are well pleased', eventLog: 'Event log', taskDone: 'marked complete', bellNotice: 'The household bell has been rung · 15 minutes advanced', nothing: 'Nothing here requires your attention. Try the east wing or south grounds.', noticeTask: 'Task recorded', focus: 'Focus', sound: 'Ambient bell and room sounds', voice: 'Spoken notices', diary: 'The Pemberley diary · evening', diaryTitle: 'A well-managed day', return: 'Return to grounds', another: 'Begin another day', diaryText: 'The last light has gone from the west windows. Your account has been placed safely in the household diary.', lastDiary: 'Last diary entry', diaryDate: 'Date', diaryTasks: 'Duties completed', diaryReputation: 'Reputation', openDiary: 'Read the diary', morning: 'Inspect the morning rooms', kitchen: 'Confirm breakfast service', garden: 'Review the kitchen garden', arrival: 'Prepare for afternoon callers', housekeeping: 'Housekeeping', guests: 'Guests', groundsFocus: 'Grounds', diaryComplete: 'The house ran with uncommon grace today; every duty was seen to.', diaryPartial: 'The household held its course. {complete} of {tasks} principal duties were seen to before evening.', privateAccount: 'Steward’s private account', diaryHistory: 'Diary history', tour: 'The visitors’ tour', tourWaiting: 'The house waits. The party is expected at one o’clock.', tourShowing: 'Being shown', tend: 'Set the room in order', correspondenceTitle: 'The morning post', correspondenceIntro: 'Three letters were on the desk before you. Each wants an answer before the day is well begun.', beginWork: 'Begin the day’s work',
  },
  ja: {
    eyebrow: '領地運営シミュレーション', subtitle: '部屋にはそれぞれのリズムがあり、客人にはそれぞれの好みがあります。湖から最後の光が消える前に、館を整えましょう。', begin: '一日を始める', options: 'オプション', settings: '設定', language: '言語', close: '閉じる', save: '設定を保存', correspondence: '館の設定', languageHint: '帳簿、通知、日記で使う言語を選択します。', titleLine: '夜明けとともに、この館はあなたのものです。', season: '季節', weather: '天候', clock: '館の時計', grounds: 'ペンバリー領地', view: '執事の視点', move: '移動', run: '走る', adjust: '視点変更', interact: '調べる', desk: '執事の机', day: '1日目', order: '本日の予定', ring: '館の鐘を鳴らす', closeDay: '一日を閉じて日記を書く', household: '使用人', onDuty: '名が勤務中', staffRoutes: '使用人の巡回', reputation: 'エリザベスの好意', goodOrder: '上向き · 来訪者は好意的', eventLog: '出来事の記録', taskDone: '完了に記録しました', bellNotice: '館の鐘を鳴らしました · 15分経過', nothing: 'ここに必要な仕事はありません。東棟か南の庭へ向かいましょう。', noticeTask: '仕事を記録しました', focus: '担当', sound: '鐘と部屋の環境音', voice: '音声通知', diary: 'ペンバリーの日記 · 夕刻', diaryTitle: 'よく管理された一日', return: '領地へ戻る', another: '新しい一日を始める', diaryText: '西の窓から最後の光が消えました。あなたの記録は館の日記に大切に保管されました。', lastDiary: '最後の日記', diaryDate: '日付', diaryTasks: '完了した仕事', diaryReputation: '評判', openDiary: '日記を読む', morning: '朝の部屋を点検する', kitchen: '朝食の準備を確認する', garden: '菜園を見回る', arrival: '午後の来客に備える', housekeeping: '家事', guests: '来客', groundsFocus: '庭の管理', diaryComplete: '館は格別の優雅さをもって今日の務めを終えました。', diaryPartial: '館はその務めを保ちました。夕刻までに{complete}件の主な仕事を確認しました。', privateAccount: '— 執事の私的な記録', diaryHistory: '日記の履歴', tour: '一行の館内見学', tourWaiting: '館は支度を整えて待っています。一行の到着は午後一時の予定です。', tourShowing: '案内中', tend: '部屋を整える', correspondenceTitle: '朝の便り', correspondenceIntro: '机には三通の手紙が置かれていました。どれも一日が本格的に始まる前に返事を要します。', beginWork: '一日の仕事にかかる',
  },
  fr: {
    eyebrow: 'Jeu de gestion d’une maison', subtitle: 'Chaque pièce a son rythme, chaque invité ses préférences. Gardez la maison en ordre avant que la dernière lumière ne quitte le lac.', begin: 'Commencer la journée', options: 'Options', settings: 'Paramètres', language: 'Langue', close: 'Fermer', save: 'Enregistrer les paramètres', correspondence: 'Préférences de la maison', languageHint: 'Choisissez la langue de votre registre, des avis et du journal.', titleLine: 'À la première lueur, la maison vous appartient.', season: 'Saison', weather: 'Météo', clock: 'Horloge de la maison', grounds: 'Domaine de Pemberley', view: 'Vue de l’intendant', move: 'déplacer', run: 'courir', adjust: 'ajuster la vue', interact: 'interagir', desk: 'Bureau de l’intendant', day: 'Jour 01', order: 'Ordre du jour', ring: 'Sonner la cloche de la maison', closeDay: 'Clore la journée et écrire au journal', household: 'Maison', onDuty: 'en service', staffRoutes: 'Rondes du personnel', reputation: 'Réputation de la maison', goodOrder: 'Bon ordre · +2 depuis l’aube', eventLog: 'Journal des événements', taskDone: 'tâche accomplie', bellNotice: 'La cloche a sonné · 15 minutes ont passé', nothing: 'Rien ici ne requiert votre attention. Essayez l’aile est ou les jardins du sud.', noticeTask: 'Tâche enregistrée', focus: 'Affectation', sound: 'Sons ambiants de cloche et de pièces', voice: 'Avis parlés', diary: 'Le journal de Pemberley · soir', diaryTitle: 'Une journée bien menée', return: 'Retour au domaine', another: 'Commencer une autre journée', diaryText: 'La dernière lumière a quitté les fenêtres de l’ouest. Votre compte rendu a été placé en sécurité dans le journal de la maison.', lastDiary: 'Dernière entrée du journal', diaryDate: 'Date', diaryTasks: 'Tâches accomplies', diaryReputation: 'Réputation', openDiary: 'Lire le journal', morning: 'Inspecter les pièces du matin', kitchen: 'Confirmer le service du petit-déjeuner', garden: 'Inspecter le potager', arrival: 'Préparer la venue des visiteurs', housekeeping: 'Intendance', guests: 'Invités', groundsFocus: 'Domaine', diaryComplete: 'La maison a fonctionné avec une grâce rare aujourd’hui ; toutes les tâches ont été accomplies.', diaryPartial: 'La maison a suivi son cours. {complete} tâches principales sur {tasks} ont été vérifiées avant le soir.', privateAccount: '— Compte rendu privé de l’intendant', diaryHistory: 'Historique du journal', tour: 'La visite des invités', tourWaiting: 'La maison attend. Le groupe est attendu à une heure.', tourShowing: 'En visite', tend: 'Mettre la pièce en ordre', correspondenceTitle: 'Le courrier du matin', correspondenceIntro: 'Trois lettres vous attendaient sur le bureau. Chacune veut une réponse avant que la journée ne soit bien commencée.', beginWork: 'Commencer le travail du jour',
  },
  de: {
    eyebrow: 'Ein Spiel zur Haushaltsführung', subtitle: 'Jeder Raum hat seinen Rhythmus, jeder Gast seine Wünsche. Halten Sie das Haus in Ordnung, bevor das letzte Licht den See verlässt.', begin: 'Tag beginnen', options: 'Optionen', settings: 'Einstellungen', language: 'Sprache', close: 'Schließen', save: 'Einstellungen speichern', correspondence: 'Hauspräferenzen', languageHint: 'Wählen Sie die Sprache für Ihr Haushaltsbuch, Ihre Hinweise und Ihr Tagebuch.', titleLine: 'Im ersten Licht gehört das Haus Ihnen.', season: 'Jahreszeit', weather: 'Wetter', clock: 'Hausuhr', grounds: 'Pemberley-Anwesen', view: 'Blick des Verwalters', move: 'bewegen', run: 'laufen', adjust: 'Ansicht anpassen', interact: 'interagieren', desk: 'Schreibtisch des Verwalters', day: 'Tag 01', order: 'Heutige Aufgaben', ring: 'Hausglocke läuten', closeDay: 'Tag beenden und Tagebuch schreiben', household: 'Haushalt', onDuty: 'im Dienst', staffRoutes: 'Routen des Personals', reputation: 'Ansehen des Hauses', goodOrder: 'Gute Ordnung · +2 seit Tagesanbruch', eventLog: 'Ereignisprotokoll', taskDone: 'als erledigt markiert', bellNotice: 'Die Hausglocke wurde geläutet · 15 Minuten vergangen', nothing: 'Hier braucht nichts Ihre Aufmerksamkeit. Versuchen Sie es im Ostflügel oder im Südgarten.', noticeTask: 'Aufgabe aufgezeichnet', focus: 'Zuständigkeit', sound: 'Stimmungsvolle Glocken- und Raumgeräusche', voice: 'Gesprochene Hinweise', diary: 'Das Pemberley-Tagebuch · Abend', diaryTitle: 'Ein wohlgeführter Tag', return: 'Zum Anwesen zurückkehren', another: 'Einen weiteren Tag beginnen', diaryText: 'Das letzte Licht ist aus den westlichen Fenstern gewichen. Ihr Bericht wurde sicher im Haushaltstagebuch abgelegt.', lastDiary: 'Letzter Tagebucheintrag', diaryDate: 'Datum', diaryTasks: 'Erledigte Aufgaben', diaryReputation: 'Ansehen', openDiary: 'Tagebuch lesen', morning: 'Die Morgenräume prüfen', kitchen: 'Frühstücksservice bestätigen', garden: 'Küchengarten prüfen', arrival: 'Auf die Nachmittagsgäste vorbereiten', housekeeping: 'Haushalt', guests: 'Gäste', groundsFocus: 'Anwesen', diaryComplete: 'Das Haus erfüllte heute jede Pflicht mit ungewöhnlicher Anmut; alle Aufgaben wurden erledigt.', diaryPartial: 'Der Haushalt hielt seinen Kurs. Vor dem Abend wurden {complete} von {tasks} Hauptaufgaben erledigt.', privateAccount: '— Privater Bericht des Verwalters', diaryHistory: 'Tagebuchverlauf', tour: 'Der Rundgang der Besucher', tourWaiting: 'Das Haus wartet. Die Gesellschaft wird um ein Uhr erwartet.', tourShowing: 'Wird gezeigt', tend: 'Den Raum herrichten', correspondenceTitle: 'Die Morgenpost', correspondenceIntro: 'Drei Briefe lagen vor Ihnen auf dem Schreibtisch. Jeder verlangt eine Antwort, ehe der Tag recht begonnen hat.', beginWork: 'Das Tagewerk beginnen',
  },
  es: {
    eyebrow: 'Un juego de gestión doméstica', subtitle: 'Cada habitación tiene su ritmo y cada huésped sus preferencias. Mantén la casa en orden antes de que la última luz abandone el lago.', begin: 'Comenzar el día', options: 'Opciones', settings: 'Ajustes', language: 'Idioma', close: 'Cerrar', save: 'Guardar ajustes', correspondence: 'Preferencias de la casa', languageHint: 'Elige el idioma del registro, los avisos y el diario.', titleLine: 'Con la primera luz, la casa es tuya.', season: 'Estación', weather: 'Tiempo', clock: 'Reloj de la casa', grounds: 'Terrenos de Pemberley', view: 'Vista del administrador', move: 'mover', run: 'correr', adjust: 'ajustar vista', interact: 'interactuar', desk: 'Escritorio del administrador', day: 'Día 01', order: 'Orden de hoy', ring: 'Tocar la campana de la casa', closeDay: 'Cerrar el día y escribir en el diario', household: 'Casa', onDuty: 'de servicio', staffRoutes: 'Rutas del personal', reputation: 'Reputación de la casa', goodOrder: 'Buen orden · +2 desde el amanecer', eventLog: 'Registro de eventos', taskDone: 'marcada como completada', bellNotice: 'La campana ha sonado · han pasado 15 minutos', nothing: 'Nada aquí requiere tu atención. Prueba en el ala este o en los jardines del sur.', noticeTask: 'Tarea registrada', focus: 'Encargo', sound: 'Sonidos ambientales de campanas y habitaciones', voice: 'Avisos hablados', diary: 'El diario de Pemberley · tarde', diaryTitle: 'Un día bien administrado', return: 'Volver a los terrenos', another: 'Comenzar otro día', diaryText: 'La última luz se ha marchado de las ventanas del oeste. Tu informe se ha guardado a salvo en el diario de la casa.', lastDiary: 'Última entrada del diario', diaryDate: 'Fecha', diaryTasks: 'Tareas completadas', diaryReputation: 'Reputación', openDiary: 'Leer el diario', morning: 'Inspeccionar las salas de la mañana', kitchen: 'Confirmar el servicio del desayuno', garden: 'Revisar el huerto', arrival: 'Prepararse para las visitas de la tarde', housekeeping: 'Tareas domésticas', guests: 'Invitados', groundsFocus: 'Terrenos', diaryComplete: 'Hoy la casa funcionó con una gracia excepcional; todas las tareas fueron atendidas.', diaryPartial: 'La casa mantuvo el rumbo. Antes de la tarde se atendieron {complete} de {tasks} tareas principales.', privateAccount: '— Informe privado del administrador', diaryHistory: 'Historial del diario', tour: 'La visita de los huéspedes', tourWaiting: 'La casa espera. Se aguarda al grupo a la una.', tourShowing: 'En visita', tend: 'Poner la sala en orden', correspondenceTitle: 'El correo de la mañana', correspondenceIntro: 'Había tres cartas en el escritorio antes que tú. Cada una quiere respuesta antes de que el día esté bien empezado.', beginWork: 'Comenzar la labor del día',
  },
  zh: {
    eyebrow: '庄园管理游戏', subtitle: '每个房间都有自己的节奏，每位客人都有自己的偏好。在湖畔最后一缕光线消失前，让宅邸保持井然有序。', begin: '开始一天', options: '选项', settings: '设置', language: '语言', close: '关闭', save: '保存设置', correspondence: '宅邸偏好', languageHint: '选择账簿、通知和日记使用的语言。', titleLine: '晨光初现时，这座宅邸属于你。', season: '季节', weather: '天气', clock: '宅邸时钟', grounds: '彭伯利庄园', view: '管家的视角', move: '移动', run: '奔跑', adjust: '调整视角', interact: '互动', desk: '管家书桌', day: '第01天', order: '今日安排', ring: '敲响宅邸钟声', closeDay: '结束一天并写日记', household: '宅邸人员', onDuty: '人值班', staffRoutes: '人员巡查', reputation: '宅邸声誉', goodOrder: '秩序良好 · 自黎明起+2', eventLog: '事件记录', taskDone: '已标记完成', bellNotice: '宅邸钟声已响 · 时间推进15分钟', nothing: '这里没有需要你处理的事。可以前往东翼或南侧花园。', noticeTask: '任务已记录', focus: '职责', sound: '钟声与房间环境音', voice: '语音通知', diary: '彭伯利日记 · 夜晚', diaryTitle: '井然有序的一天', return: '返回庄园', another: '开始新的一天', diaryText: '西侧窗外的最后一缕光线已经消失。你的记录已妥善存入宅邸日记。', lastDiary: '最近的日记', diaryDate: '日期', diaryTasks: '完成的职责', diaryReputation: '声誉', openDiary: '阅读日记', morning: '检查早晨的房间', kitchen: '确认早餐服务', garden: '查看厨房花园', arrival: '准备迎接午后访客', housekeeping: '家务', guests: '客人', groundsFocus: '庄园', diaryComplete: '今天宅邸运转得格外优雅；每项职责都已妥善完成。', diaryPartial: '宅邸维持着应有的秩序。傍晚前已完成{tasks}项主要职责中的{complete}项。', privateAccount: '— 管家的私人记录', diaryHistory: '日记历史', tour: '访客的参观', tourWaiting: '宅邸已备好，正在等候。一行预计午后一时到达。', tourShowing: '参观中', tend: '整理房间', correspondenceTitle: '晨间信件', correspondenceIntro: '书桌上早已放着三封信。每一封都要在这一天真正开始之前得到答复。', beginWork: '开始一天的事务',
  },
};

function detectLanguage(): Language {
  const supported = languages.map(item => item.code);
  const preferred = [...(navigator.languages || []), navigator.language || 'en'];
  return preferred.map(value => value.toLowerCase().split('-')[0]).find(value => supported.includes(value as Language)) as Language || 'en';
}

function readDiaryEntries(): DiaryEntry[] {
  try {
    const saved = localStorage.getItem('pemberley-diary');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    const entries = Array.isArray(parsed) ? parsed : [parsed];
    return entries.filter((entry): entry is DiaryEntry =>
      entry && typeof entry.date === 'string' && typeof entry.complete === 'number' && typeof entry.reputation === 'number'
    ).map(entry => ({
      date: entry.date,
      complete: entry.complete,
      reputation: entry.reputation,
      ...(typeof entry.day === 'number' ? { day: entry.day } : {}),
      ...(entry.prose && typeof entry.prose.en === 'string' && typeof entry.prose.ja === 'string' ? { prose: { en: entry.prose.en, ja: entry.prose.ja } } : {}),
    }));
  } catch {
    return [];
  }
}

// ペンバリーの奉公人。あなた（執事）の下で働く顔ぶれ。
// Mrs. Reynolds は原作の家政婦で、来訪者を館内に案内し主人を誇らしげに語る。
const staff: Staff[] = [
  { id: 'mrs-reynolds', name: 'Mrs. Reynolds', role: 'Housekeeper', initials: 'MR', color: '#d8a56b', home: { x: -4, y: -1 }, focus: 'Portrait gallery' },
  { id: 'john', name: 'John', role: 'First footman', initials: 'JN', color: '#b8a77e', home: { x: 2, y: -5 }, focus: 'Front hall' },
  { id: 'sarah', name: 'Sarah', role: 'Housemaid', initials: 'SA', color: '#c7846a', home: { x: -7, y: 5 }, focus: 'Music room' },
  { id: 'mr-adams', name: 'Mr. Adams', role: 'Head gardener', initials: 'AD', color: '#83a989', home: { x: 9, y: 6 }, focus: 'The grounds' },
  { id: 'thomas', name: 'Thomas', role: 'Groom', initials: 'TH', color: '#9fb8a5', home: { x: 5, y: 2 }, focus: 'Stables' },
];

const initialLogs = [
  { time: '07:35', text: 'The west bell has called the household to order.' },
  { time: '07:22', text: 'A fine mist rests upon the lake. Roads remain passable.' },
  { time: '06:58', text: 'Kitchen fire lit. Breakfast service is under way.' },
];

const seasons = [
  { en: 'Spring · 1812', ja: '春 · 1812' },
  { en: 'Midsummer · 1812', ja: '盛夏 · 1812' },
  { en: 'Michaelmas · 1812', ja: 'ミカエル祭 · 1812' },
  { en: 'Winter · 1812', ja: '冬 · 1812' },
];
const weatherBySeason = [
  [{ en: 'Pearl-grey drizzle', ja: '真珠色の霧雨' }, { en: 'Bright showers', ja: '明るい通り雨' }, { en: 'Soft mist', ja: 'やわらかな霧' }, { en: 'Airing clouds', ja: '風に流れる雲' }],
  [{ en: 'Warm rain', ja: '暖かな雨' }, { en: 'Clear and warm', ja: '晴れて暖かい日' }, { en: 'Hazy sun', ja: '霞んだ陽射し' }, { en: 'Thunder beyond the hills', ja: '丘の向こうの雷雨' }],
  [{ en: 'Misty rain', ja: '霧雨' }, { en: 'Clear autumn light', ja: '澄んだ秋の光' }, { en: 'Low cloud', ja: '低い雲' }, { en: 'West wind', ja: '西風' }],
  [{ en: 'Frost and pale sun', ja: '霜と淡い陽射し' }, { en: 'Fine snow', ja: '細かな雪' }, { en: 'Iron-grey sky', ja: '鉄色の空' }, { en: 'Dry north wind', ja: '乾いた北風' }],
];

// Four times of day × four seasonal moods × four weather moods = 64 distinct walks.
const walkScenes: BilingualMessage[][] = [
  [
    { en: 'At first light, the lake keeps the rose of dawn between its reeds.', ja: '夜明け、湖は葦の間に薔薇色の光をたたえている。' },
    { en: 'The morning path smells of wet earth and the promise of primroses.', ja: '朝の小道には濡れた土と桜草の気配が漂う。' },
    { en: 'A lark rises above the east meadow as the household wakes.', ja: '館が目覚めるころ、東の牧草地からひばりが舞い上がる。' },
    { en: 'The first carriage track is silvered, though the lawns remain firm beneath it.', ja: '最初の車道は銀色に濡れているが、芝はしっかりしている。' },
  ],
  [
    { en: 'By midmorning, rain pearls on the yew and leaves the gravel shining.', ja: '午前半ば、雨粒がイチイを飾り、砂利道を輝かせている。' },
    { en: 'A shaft of sun finds the fountain; even the sparrows seem unhurried.', ja: '陽射しが噴水を照らし、雀さえ急ぐ様子がない。' },
    { en: 'The mist lifts from the lower lawn, revealing the lake one silver inch at a time.', ja: '霧が南の芝からほどけ、湖が銀色に少しずつ姿を現す。' },
    { en: 'The west wind carries the scent of cut grass towards the orangery.', ja: '西風が刈った芝の香りを温室へ運んでいる。' },
  ],
  [
    { en: 'At noon, the kitchen garden hums with bees beneath its damp leaves.', ja: '正午、菜園では濡れた葉の下を蜂が忙しく飛び交う。' },
    { en: 'The long border holds the noon heat, and the stone bench is warm to the hand.', ja: '長い花壇が昼の熱を抱え、石のベンチは手に温かい。' },
    { en: 'Cloud-shadow crosses the south lawn like a quiet procession.', ja: '雲の影が静かな行列のように南の芝を横切る。' },
    { en: 'The lake path is brisk underfoot; a good day to check the boathouse latch.', ja: '湖畔の道は足元が軽やかだ。舟小屋の掛け金を確かめる日和である。' },
  ],
  [
    { en: 'In the afternoon, the lilacs release their last fragrance along the terrace.', ja: '午後、テラス沿いでライラックが最後の香りを放っている。' },
    { en: 'The warm air settles over the rose walk, making every bench inviting.', ja: '暖かな空気が薔薇園に降り、どのベンチも人を誘っている。' },
    { en: 'The house windows catch the fading light while swallows turn over the lawn.', ja: '館の窓が夕暮れを受け、燕が芝の上で旋回している。' },
    { en: 'The last light draws a copper line along the gravel before evening service.', ja: '夕刻の給仕前、最後の光が砂利道に銅色の線を引いている。' },
  ],
];
const walkSeasonNotes: BilingualMessage[][] = [
  [{ en: 'Primroses nod beside the path.', ja: '小道のそばで桜草がうなずいている。' }, { en: 'The herb beds are full of new green.', ja: '薬草壇は新しい緑で満ちている。' }, { en: 'A nest stirs in the hawthorn.', ja: 'サンザシの巣で雛が動いた。' }, { en: 'The stream runs clear after rain.', ja: '雨上がりの小川は澄んでいる。' }],
  [{ en: 'Bees work the lavender border.', ja: '蜂がラベンダーの縁を働き回っている。' }, { en: 'The lime trees hold a deep green shade.', ja: '菩提樹が濃い緑の陰を落としている。' }, { en: 'Cicadas murmur beyond the wall.', ja: '壁の向こうで蝉がかすかに鳴いている。' }, { en: 'The orchard fruit is nearly ready.', ja: '果樹園の実りはもうすぐだ。' }],
  [{ en: 'Leaves gather in the ha-ha.', ja: '空堀に落ち葉が集まっている。' }, { en: 'The first apples scent the orchard.', ja: '初摘みの林檎が果樹園を香らせる。' }, { en: 'Ferns bronze beneath the trees.', ja: '木々の下でシダが銅色に変わっている。' }, { en: 'The lake reflects a russet bank.', ja: '湖面が赤褐色の岸辺を映している。' }],
  [{ en: 'Frost rims the fountain basin.', ja: '噴水の水盤を霜が縁取っている。' }, { en: 'Rooks call from the bare elms.', ja: '葉を落としたニレからミヤマガラスが鳴く。' }, { en: 'The pond wears a thin skin of ice.', ja: '池に薄い氷が張っている。' }, { en: 'Smoke lies low above the village.', ja: '村の上に煙が低くたなびいている。' }],
];

function chooseWalk(minutes: number, seasonIndex: number, weatherIndex: number): BilingualMessage {
  const period = minutes < 10 * 60 ? 0 : minutes < 12 * 60 ? 1 : minutes < 14 * 60 ? 2 : 3;
  const scene = walkScenes[period][(seasonIndex * 4 + weatherIndex) % 4];
  const note = walkSeasonNotes[seasonIndex][(weatherIndex + period) % 4];
  return { en: `${scene.en} ${note.en}`, ja: `${scene.ja} ${note.ja}` };
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function speak(text: string, enabled: boolean, language: Language = 'en', rate = 0.9, pitch = 1) {
  if (enabled && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function') {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const locale = language === 'ja' ? 'ja-JP' : language === 'fr' ? 'fr-FR' : language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : language === 'zh' ? 'zh-CN' : 'en-GB';
    utterance.lang = locale;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(candidate => candidate.lang.toLowerCase() === locale.toLowerCase())
      ?? voices.find(candidate => candidate.lang.toLowerCase().startsWith(`${language}-`));
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    window.speechSynthesis.speak(utterance);
  }
}



const emergencyCopy: Record<Language, {
  emergencies: string; calm: string; timeLeft: string; resolve: string; dispatch: string;
  guestMood: string; staffMorale: string; preferences: string; assigned: string; unassigned: string;
  urgent: string; high: string; watch: string;
  spill: string; guest_arrival: string; sick: string; dog: string; dinner_rush: string;
  escalated: string; reputation: string; duties: string;
}> = {
  en: {
    emergencies: 'Urgent events', calm: 'The household is calm.', timeLeft: 'min left', resolve: 'Resolve', dispatch: 'Dispatch',
    guestMood: 'Guest mood', staffMorale: 'Staff morale', preferences: 'Prefers', assigned: 'Assigned', unassigned: 'Unassigned',
    urgent: 'Urgent', high: 'High', watch: 'Watch',
    spill: 'A spill needs immediate attention.', guest_arrival: 'An unannounced guest is waiting at the hall.',
    sick: 'A member of staff has fallen ill.', dog: 'A loose hound is making trouble.', dinner_rush: 'Dinner service is falling behind.',
    escalated: 'The situation has worsened.', reputation: 'Good opinion', duties: 'Ledger duties',
  },
  ja: {
    emergencies: '緊急の出来事', calm: '館は穏やかです。', timeLeft: '分', resolve: '解決', dispatch: '派遣',
    guestMood: '客人の機嫌', staffMorale: '使用人の士気', preferences: '好み', assigned: '担当', unassigned: '未割当',
    urgent: '緊急', high: '高', watch: '注意',
    spill: 'こぼれたものをすぐに片付ける必要があります。', guest_arrival: '予告のない客人が玄関で待っています。',
    sick: '使用人が具合を悪くしました。', dog: '逃げた猟犬が騒ぎを起こしています。', dinner_rush: '夕食の支度が遅れています。',
    escalated: '事態が悪化しました。', reputation: '好意', duties: '帳簿の仕事',
  },
  fr: {
    emergencies: 'Événements urgents', calm: 'La maison est calme.', timeLeft: 'min restantes', resolve: 'Résoudre', dispatch: 'Envoyer',
    guestMood: 'Humeur des invités', staffMorale: 'Moral du personnel', preferences: 'Préférences', assigned: 'Assigné', unassigned: 'Non assigné',
    urgent: 'Urgent', high: 'Élevé', watch: 'Surveillance',
    spill: 'Un liquide renversé doit être nettoyé immédiatement.', guest_arrival: 'Un invité inattendu attend dans le vestibule.',
    sick: 'Un membre du personnel est tombé malade.', dog: 'Un chien en liberté sème le trouble.', dinner_rush: 'Le service du dîner prend du retard.',
    escalated: 'La situation s’est aggravée.', reputation: 'Réputation', duties: 'Tâches du registre',
  },
  de: {
    emergencies: 'Dringende Ereignisse', calm: 'Im Haushalt herrscht Ruhe.', timeLeft: 'Min. übrig', resolve: 'Lösen', dispatch: 'Schicken',
    guestMood: 'Gästestimmung', staffMorale: 'Moral des Personals', preferences: 'Bevorzugt', assigned: 'Zugewiesen', unassigned: 'Nicht zugewiesen',
    urgent: 'Dringend', high: 'Hoch', watch: 'Beobachten',
    spill: 'Eine verschüttete Flüssigkeit muss sofort beseitigt werden.', guest_arrival: 'Ein unangekündigter Gast wartet in der Eingangshalle.',
    sick: 'Ein Mitglied des Personals ist erkrankt.', dog: 'Ein freilaufender Jagdhund sorgt für Unruhe.', dinner_rush: 'Der Abendservice gerät in Verzug.',
    escalated: 'Die Lage hat sich verschlechtert.', reputation: 'Ansehen', duties: 'Aufgaben im Register',
  },
  es: {
    emergencies: 'Situaciones urgentes', calm: 'La casa está tranquila.', timeLeft: 'min restantes', resolve: 'Resolver', dispatch: 'Enviar',
    guestMood: 'Ánimo de los invitados', staffMorale: 'Moral del personal', preferences: 'Prefiere', assigned: 'Asignado', unassigned: 'Sin asignar',
    urgent: 'Urgente', high: 'Alta', watch: 'Vigilar',
    spill: 'Hay que atender de inmediato un derrame.', guest_arrival: 'Un invitado inesperado espera en el vestíbulo.',
    sick: 'Un miembro del personal ha enfermado.', dog: 'Un sabueso suelto está causando problemas.', dinner_rush: 'El servicio de la cena se está retrasando.',
    escalated: 'La situación ha empeorado.', reputation: 'Reputación', duties: 'Tareas del registro',
  },
  zh: {
    emergencies: '紧急事件', calm: '宅邸一切平静。', timeLeft: '分钟剩余', resolve: '解决', dispatch: '派遣',
    guestMood: '客人心情', staffMorale: '员工士气', preferences: '偏好', assigned: '已分配', unassigned: '未分配',
    urgent: '紧急', high: '高', watch: '留意',
    spill: '有洒出的液体需要立即处理。', guest_arrival: '一位未事先通知的客人正在前厅等候。',
    sick: '一名员工病倒了。', dog: '一只逃脱的猎犬正在惹麻烦。', dinner_rush: '晚餐服务进度落后了。',
    escalated: '情况已经恶化。', reputation: '声誉', duties: '账簿职责',
  },
} as const;

function localized(text: LocalizedText, language: Language) {
  return text[language as keyof LocalizedText] || text.en;
}

function EstateCanvas({ mode, player, onNotice, onWalk, staffDestinations, emergencyActive, onStaffArrival }: { mode: 'title' | 'game'; player: Point; onNotice?: (text: string) => void; onWalk?: () => void; staffDestinations?: Record<string, Point>; emergencyActive?: boolean; onStaffArrival?: (staffId: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomRef = useRef(mode === 'title' ? 1.04 : 1);
  const hoverRef = useRef<Point>({ x: 0, y: 0 });
  const staffMotionRef = useRef<Record<string, Point>>({});
  const arrivedRef = useRef<Set<string>>(new Set());
  const paperTextureRef = useRef<GeneratedPaperTexture | null>(null);
  const fogRef = useRef<AtmosphericFog>(new AtmosphericFog());
  const propsRef = useRef({ mode, player, staffDestinations, emergencyActive, onStaffArrival, onNotice, onWalk });
  propsRef.current = { mode, player, staffDestinations, emergencyActive, onStaffArrival, onNotice, onWalk };

  // 形状ごとの水彩素材：エッジの柔らかさ・ウォッシュ強さを一律で適用
  const materialRef = useRef<WatercolorMaterial>(new WatercolorMaterial({
    edgeSoftness: 0.6,
    washStrength: 0.16,
    addBleed: true,
    tonalSteps: 0,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    let frame = 0;
    let resizeRaf = 0;
    const resize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        if (!canvas) return;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const newWidth = Math.floor(rect.width * ratio);
        const newHeight = Math.floor(rect.height * ratio);
        if (canvas.width !== newWidth || canvas.height !== newHeight) {
          canvas.width = newWidth;
          canvas.height = newHeight;
        }
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    // 紙テクスチャは1回だけ生成して使い回す（毎フレーム生成を避ける）
    if (!paperTextureRef.current) {
      paperTextureRef.current = PaperTextureGenerator.generate({ size: 512 });
    }

    const draw = (now: number) => {
      const currentProps = propsRef.current;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) { frame = requestAnimationFrame(draw); return; }
      const t = now / 1000;
      context.clearRect(0, 0, w, h);
      const cx = w * (currentProps.mode === 'title' ? .52 : .5);
      const cy = h * (currentProps.mode === 'title' ? .56 : .54);
      const scale = Math.min(w / 44, h / 28) * zoomRef.current;
      const project = (x: number, y: number, z = 0) => ({
        x: cx + (x - y) * Math.cos(Math.PI / 6) * scale,
        y: cy + (x + y) * Math.sin(Math.PI / 6) * scale * .58 - z * scale * .9,
      });
      const poly = (points: Point[], fill: string, stroke?: string) => {
        context.beginPath();
        points.forEach((p, index) => index === 0 ? context.moveTo(p.x, p.y) : context.lineTo(p.x, p.y));
        context.closePath();
        context.fillStyle = fill;
        context.fill();
        if (stroke) {
          context.strokeStyle = stroke;
          context.lineWidth = 1;
          context.stroke();
          // 水彩の縁のにじみ（WatercolorMaterial経由）
          materialRef.current.applyEdgeSoftening(context, points, fill);
        }
      };
      const line = (points: Point[], stroke: string, width = 1) => {
        context.beginPath();
        points.forEach((p, index) => index === 0 ? context.moveTo(p.x, p.y) : context.lineTo(p.x, p.y));
        context.strokeStyle = stroke;
        context.lineWidth = width;
        context.stroke();
      };
      // lawn and terraces
      poly([project(-14, -8), project(14, -8), project(14, 14), project(-14, 14)], '#53684a');
      poly([project(-12, -7), project(12, -7), project(12, 12), project(-12, 12)], '#617957');
      poly([project(-9, -5), project(9, -5), project(9, 9), project(-9, 9)], '#6e8963');
      // lake
      context.fillStyle = '#4c6c70';
      context.beginPath();
      const l1 = project(-11, 7);
      const l2 = project(-4, 13);
      context.ellipse((l1.x + l2.x) / 2, (l1.y + l2.y) / 2, scale * 3.8, scale * 1.5, -.15, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#618488';
      context.beginPath();
      context.ellipse((l1.x + l2.x) / 2 + 6, (l1.y + l2.y) / 2 - 2, scale * 2.8, scale * 1.05, -.12, 0, Math.PI * 2);
      context.fill();
      // gravel paths
      poly([project(-2, -5), project(2, -5), project(2, 11), project(-2, 11)], '#baa687');
      poly([project(-8, 1), project(8, 1), project(8, 3.2), project(-8, 3.2)], '#b49f7e');
      poly([project(-7, 8), project(7, 8), project(7, 9.6), project(-7, 9.6)], '#a89474');
      // main hall
      poly([project(-5.5, 1.4), project(4.4, 1.4), project(4.4, 1.9), project(-5.5, 1.9)], '#8b7d6b');
      poly([project(-5.5, -3.4, 5.2), project(4.4, -3.4, 5.2), project(4.4, -3.4, 0), project(-5.5, -3.4, 0)], '#b8a878');
      poly([project(-5.5, -3.4, 5.2), project(-.5, -6, 5.2), project(4.4, -3.4, 5.2)], '#5a5a5a', '#6a5a4a');
      poly([project(-.5, -6, 5.2), project(-.5, -6, 6.3), project(4.4, -3.4, 6.3), project(4.4, -3.4, 5.2)], '#5a5a5a');
      // wings
      poly([project(-8.3, -2.3, 0), project(-5.5, -2.3, 0), project(-5.5, 1.2, 0), project(-8.3, 1.2, 0)], '#cbb78f', '#806b56');
      poly([project(4.4, -2.3, 0), project(7.1, -2.3, 0), project(7.1, 1.2, 0), project(4.4, 1.2, 0)], '#cbb78f', '#806b56');
      poly([project(-8.5, -2.3, 3.9), project(-6.9, -3.2, 4.5), project(-5.5, -2.3, 3.9)], '#514847');
      poly([project(4.4, -2.3, 3.9), project(5.8, -3.2, 4.5), project(7.2, -2.3, 3.9)], '#514847');
      // windows and door
      for (let i = 0; i < 5; i++) {
        const p = project(-4.8 + i * 2.25, -3.48, 2.4);
        context.fillStyle = '#4c7372'; context.fillRect(p.x - scale * .25, p.y - scale * .38, scale * .5, scale * .75);
        context.strokeStyle = '#d6c29c'; context.strokeRect(p.x - scale * .25, p.y - scale * .38, scale * .5, scale * .75);
      }
      const door = project(-.5, -3.58, 1.25);
      context.fillStyle = '#755246'; context.fillRect(door.x - scale * .3, door.y - scale * .6, scale * .6, scale * 1.25);
      // conservatory
      poly([project(-11, 2.2, 0), project(-7.1, 2.2, 0), project(-7.1, 4.2, 0), project(-11, 4.2, 0)], '#c9bc91', '#7d916f');
      for (let i = -10.6; i < -7; i += .8) line([project(i, 2.2, 0), project(i, 2.2, 2)], '#799485', 1);
      // small fountain
      const fountain = project(-2.5, 5.4, .1);
      context.fillStyle = '#819895'; context.beginPath(); context.ellipse(fountain.x, fountain.y, scale * 1.1, scale * .4, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#c3d0bd'; context.beginPath(); context.arc(fountain.x, fountain.y - scale * .35, scale * .13, 0, Math.PI * 2); context.fill();
      // trees framing the playable grounds
      const oldTree = project(-12, 1, 0);
      context.strokeStyle = '#6b4c2e'; context.lineWidth = Math.max(3, scale * .16);
      line([oldTree, { x: oldTree.x - scale * .42, y: oldTree.y - scale * 1.6 }, { x: oldTree.x + scale * .1, y: oldTree.y - scale * 2.35 }], '#6b4c2e', Math.max(3, scale * .16));
      context.fillStyle = '#4a5d3f';
      for (let j = 0; j < 6; j++) { context.beginPath(); context.arc(oldTree.x + Math.sin(j * 2.1) * scale * .7, oldTree.y - scale * (1.55 + (j % 3) * .28), scale * (.55 + (j % 2) * .15), 0, Math.PI * 2); context.fill(); }
      for (let i = 0; i < 13; i++) {
        const angle = i * 2.4;
        const x = Math.cos(angle) * 14 + (i % 3) * 1.3;
        const y = Math.sin(angle) * 10 + 3;
        const p = project(x, y, .5);
        context.fillStyle = i % 3 === 0 ? '#2f5649' : '#3d6851';
        context.beginPath(); context.arc(p.x, p.y, scale * (1 + (i % 2) * .22), 0, Math.PI * 2); context.fill();
        context.fillStyle = '#674e3e'; context.fillRect(p.x - 1, p.y + scale * .45, 2, scale * .65);
      }
      // animated staff figures
      staff.forEach((person, i) => {
        const destination = currentProps.staffDestinations?.[person.id];
        const current = staffMotionRef.current[person.id] ?? { ...person.home };
        const speed = currentProps.emergencyActive ? 18 : 9;
        if (destination) {
          const distance = Math.hypot(destination.x - current.x, destination.y - current.y);
          if (distance > 0.08) {
            const step = Math.min(distance, speed / 60);
            current.x += ((destination.x - current.x) / distance) * step;
            current.y += ((destination.y - current.y) / distance) * step;
            arrivedRef.current.delete(person.id);
          } else if (!arrivedRef.current.has(person.id)) {
            arrivedRef.current.add(person.id);
            currentProps.onStaffArrival?.(person.id);
          }
        } else {
          const roaming = { x: person.home.x + Math.sin(t * (.23 + i * .03) + i) * (1.3 + i * .12), y: person.home.y + Math.cos(t * (.19 + i * .02) + i) * .8 };
          current.x += (roaming.x - current.x) * .04;
          current.y += (roaming.y - current.y) * .04;
          arrivedRef.current.delete(person.id);
        }
        staffMotionRef.current[person.id] = current;
        const moving = { x: current.x, y: current.y };
        const p = project(moving.x, moving.y, .7);
        context.fillStyle = 'rgba(18,34,32,.35)'; context.beginPath(); context.ellipse(p.x, p.y + scale * .25, scale * .35, scale * .14, 0, 0, Math.PI * 2); context.fill();
        const bob = destination && currentProps.emergencyActive ? Math.sin(t * Math.PI * 20) * scale * .1 : 0;
        context.fillStyle = person.color; context.beginPath(); context.arc(p.x, p.y - scale * .16 + bob, scale * .24, 0, Math.PI * 2); context.fill();
        context.fillStyle = '#eadcc0'; context.fillRect(p.x - scale * .16, p.y + scale * .05 + bob, scale * .32, scale * .4);
        if (currentProps.mode === 'game') { context.fillStyle = '#ecdfc3'; context.font = '9px Manrope'; context.textAlign = 'center'; context.fillText(person.initials, p.x, p.y - scale * .52); }
      });
      if (currentProps.mode === 'game') {
        const pp = project(currentProps.player.x, currentProps.player.y, .8);
        context.fillStyle = 'rgba(226,189,137,.26)'; context.beginPath(); context.arc(pp.x, pp.y, scale * .72, 0, Math.PI * 2); context.fill();
        context.fillStyle = '#e2bd89'; context.beginPath(); context.arc(pp.x, pp.y - scale * .25, scale * .24, 0, Math.PI * 2); context.fill();
        context.fillStyle = '#31554c'; context.fillRect(pp.x - scale * .18, pp.y, scale * .36, scale * .55);
      }
      // atmospheric drizzle lines
      if (currentProps.mode === 'game') for (let i = 0; i < 30; i++) {
        const rx = (i * 97 + now / 35) % w;
        const ry = (i * 53 + now / 22) % h;
        line([{ x: rx, y: ry }, { x: rx - 3, y: ry + 9 }], 'rgba(218,225,205,.13)', 1);
      }
      // Watercolour composite pass（WatercolorPass 経由で一元管理）
      // ウォッシュ / 紙ざわり / 霞み / ヴィネットをまとめて適用
      const gameHour = (now / 1000 / 60) % 24; // アニメーション時刻から1日周期で算出
      fogRef.current.update(gameHour, 1 / 60);
      WatercolorPass.apply(
        context,
        w,
        h,
        {
          mode: 'day',
          washStrength: 0.18,
          grainStrength: 1.0,
          tonalSteps: 0,
          vignetteStrength: 0.4,
          atmosphericStrength: 0.25,
          airAbsorptionColor: fogRef.current.getAirAbsorptionColor(),
        },
        paperTextureRef.current ?? undefined,
      );
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(resizeRaf); observer.disconnect(); };
  }, []);

  const onWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    zoomRef.current = Math.max(.72, Math.min(1.42, zoomRef.current + (event.deltaY > 0 ? -.07 : .07)));
  };

  const onClick = () => propsRef.current.mode === 'game' ? propsRef.current.onWalk?.() : propsRef.current.onNotice?.('The estate grounds are quiet. Choose a task or walk towards a marked colleague.');
  return <canvas ref={canvasRef} className="estate-canvas" onWheel={onWheel} onClick={onClick} aria-label="Playable illustrated 3D view of Pemberley estate" />;
}

function TitleScreen({ language, setLanguage, onStart, diaryEntries, onOpenDiary, diaryTriggerRef, taskCount }: { language: Language; setLanguage: (value: Language) => void; onStart: () => void; diaryEntries: DiaryEntry[]; onOpenDiary: () => void; diaryTriggerRef: RefObject<HTMLButtonElement | null>; taskCount: number }) {
  const t = (key: string) => translations[language][key] || translations.en[key] || key;
  const diaryEntry = diaryEntries[diaryEntries.length - 1];
  return (
    <main className="title-screen fade-up">
      <section className="title-copy">
        <div>
          <div className="crest"><span>P</span></div>
          <div className="eyebrow" style={{ color: '#a36b48' }}>{t('eyebrow')}</div>
          <h1 className="title-title">A Day at<br />Pemberley</h1>
          <div className="title-jp">ペンバリーの一日</div>
          <div className="title-rule" />
          <p className="title-intro">{t('subtitle')}</p>
           <button className="start-button" onClick={onStart}>{t('begin')} <ChevronRight size={17} /></button>
           {diaryEntry && <div className="diary-summary">
            <div className="eyebrow" style={{ color: '#a36b48' }}>{t('lastDiary')}</div>
            <strong>{diaryEntry.date}</strong>
            <div className="diary-summary-stats"><span>{t('diaryTasks')}: {diaryEntry.complete}/{taskCount}</span><span>{t('diaryReputation')}: {diaryEntry.reputation}</span></div>
             <button ref={diaryTriggerRef} className="diary-read-button" onClick={onOpenDiary}><BookOpen size={13} /> {t('openDiary')}{diaryEntries.length > 1 ? ` · ${diaryEntries.length}` : ''}</button>
          </div>}
          <div className="title-options">
            <Settings size={14} />
            <select aria-label={t('language')} value={language} onChange={event => setLanguage(event.target.value as Language)}>
              {languages.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
            </select>
          </div>
        </div>
        <div className="title-footer"><span className="mono">A Regency household / 1812</span><span className="mono">v1.0.0</span></div>
      </section>
      <section className="title-art">
        <EstateCanvas mode="title" player={{ x: 0, y: 0 }} />
        <div className="art-caption"><strong>{t('titleLine')}</strong><small>Derbyshire · Michaelmas season</small></div>
      </section>
    </main>
  );
}

function DiaryModal({ entry, language, taskCount, onReset, onClose, triggerRef, entries, onSelectEntry }: { entry: DiaryEntry; language: Language; taskCount: number; onReset: () => void; onClose: () => void; triggerRef: RefObject<HTMLElement | null>; entries?: DiaryEntry[]; onSelectEntry?: (entry: DiaryEntry) => void }) {
  const t = (key: string) => translations[language][key] || translations.en[key] || key;
  const copy = emergencyCopy[language];
  const firstHistoryEntryRef = useRef<HTMLButtonElement>(null);
  const account = entry.prose
    ? (language === 'ja' ? entry.prose.ja : entry.prose.en)
    : entry.complete === taskCount
      ? t('diaryComplete')
      : t('diaryPartial').replace('{complete}', String(entry.complete)).replace('{tasks}', String(taskCount));
  return <Dialog open triggerRef={triggerRef} onClose={onClose} className="diary-modal" label={t('diaryTitle')}>
    <div className="eyebrow" style={{ color: '#a36b48' }}>{t('diary')}</div><h2 id="diary-title">{t('diaryTitle')}</h2><p>{t('diaryText')}</p>{entries && entries.length > 1 && <div className="diary-history" aria-label={t('diaryHistory')}>{entries.slice().reverse().map((savedEntry, index) => <button ref={index === 0 ? firstHistoryEntryRef : undefined} key={`${savedEntry.date}-${savedEntry.day ?? index}`} className={`diary-history-item ${savedEntry === entry ? 'active' : ''}`} onClick={() => onSelectEntry?.(savedEntry)}><span>{savedEntry.date}</span><small>{savedEntry.complete}/{taskCount} · {t('reputation')} {savedEntry.reputation}</small></button>)}</div>}<div className="diary-entry">“{account}”<br /><span style={{ color: '#9c795e', fontSize: 10 }}>{t('privateAccount')}</span></div><div className="diary-stats"><span><Sparkles size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />{t('reputation')} {entry.reputation}</span><span><BookOpen size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />{entry.complete}/{taskCount}</span></div><div className="modal-actions"><button onClick={onReset}><RotateCcw size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />{t('another')}</button><button className="primary" onClick={onClose}>{t('return')}</button></div>
  </Dialog>;
}

function App() {
  const [phase, setPhase] = useState<Phase>('title');
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('pemberley-language') as Language | null;
    return saved && languages.some(item => item.code === saved) ? saved : detectLanguage();
  });
  const t = (key: string) => translations[language][key] || translations.en[key] || key;
  const copy = emergencyCopy[language];
  useEffect(() => { localStorage.setItem('pemberley-language', language); }, [language]);
  const [player, setPlayer] = useState<Point>({ x: 0, y: 7 });
  const playerRef = useRef<Point>({ x: 0, y: 7 });
  const keysRef = useRef<Record<string, boolean>>({});
  const joystickRef = useRef<Point>({ x: 0, y: 0 });
  const audioRef = useRef<AudioManager | null>(null);
  const voiceRef = useRef<VoiceManager | null>(null);
  const [minutes, setMinutes] = useState(7 * 60 + 35);
  const [dayNumber, setDayNumber] = useState(1);
  const [completed, setCompleted] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState(staff[0].id);
  const [focuses, setFocuses] = useState<Record<string, string>>(() => Object.fromEntries(staff.map(item => [item.id, item.focus])));
  const [logs, setLogs] = useState(initialLogs);
  const [reputation, setReputation] = useState(74);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(readDiaryEntries);
  const [selectedDiaryEntry, setSelectedDiaryEntry] = useState<DiaryEntry | null>(null);
  const [notice, setNotice] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const diaryTriggerRef = useRef<HTMLButtonElement>(null);
  const [sound, setSound] = useState(true);
  const [tts, setTts] = useState(false);
  const [voiceRate, setVoiceRate] = useState(0.9);
  const [pianoOpen, setPianoOpen] = useState(false);
  const pianoTriggerRef = useRef<HTMLButtonElement>(null);
  const [pianoScore, setPianoScore] = useState(0);
  const [lettersOpen, setLettersOpen] = useState(false);
  const lettersTriggerRef = useRef<HTMLButtonElement>(null);
  const [letterChoices, setLetterChoices] = useState<Record<string, 0 | 1>>({});
  const [absentStaff, setAbsentStaff] = useState<string[]>([]);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [roomFade, setRoomFade] = useState(false);
  const eventSystemRef = useRef(new EventSystem());
  const guestManagerRef = useRef(new GuestManager());
  const tourSystemRef = useRef(new TourSystem());
  const [tourReadiness, setTourReadiness] = useState<Record<TourRoomId, number>>(() => ({ ...tourSystemRef.current.readiness }));
  const [tourRoomId, setTourRoomId] = useState<TourRoomId | null>(null);
  const tourProcessedRef = useRef(-1);
  const tourSettledRef = useRef(false);
  const [emergencies, setEmergencies] = useState<EmergencyEvent[]>([]);
  const [guestStates, setGuestStates] = useState<GuestState[]>([]);
  const [staffMorale, setStaffMorale] = useState(86);
  const seasonIndex = (dayNumber - 1) % seasons.length;
  const weatherIndex = Math.floor(minutes / 90) % 4;
  const season = seasons[seasonIndex];
  const weather = weatherBySeason[seasonIndex][weatherIndex];
  const firedEventsRef = useRef<Set<string>>(new Set());
  const emergencySpawnedRef = useRef<Set<string>>(new Set());
  const skipEventTimelineRef = useRef(false);
  const skipEmergencyTimelineRef = useRef(false);
  const roomTransitionRef = useRef(false);
  const roomEntryLatchRef = useRef(false);

  useEffect(() => {
    if (phase === 'game' && guestStates.length === 0) setGuestStates(guestManagerRef.current.reset(dayNumber));
  }, [phase, dayNumber, guestStates.length]);

  useEffect(() => {
    audioRef.current ??= new AudioManager();
    audioRef.current.setEnabled(sound);
    if (phase === 'game') audioRef.current.start();
    return () => { audioRef.current?.dispose(); audioRef.current = null; };
  }, [phase]);
  useEffect(() => { audioRef.current?.setEnabled(sound); }, [sound]);
  useEffect(() => {
    voiceRef.current ??= new VoiceManager();
    voiceRef.current.setEnabled(tts);
    return () => { voiceRef.current?.setEnabled(false); window.speechSynthesis?.cancel(); };
  }, []);
  useEffect(() => { voiceRef.current?.setEnabled(tts); }, [tts]);
  useEffect(() => {
    if (phase !== 'game') return;
    audioRef.current?.update({
      minutes,
      rainy: true,
      gardenDistance: Math.hypot(player.x - 8, player.y - 9),
      houseDistance: Math.hypot(player.x, player.y),
    });
  }, [minutes, phase, player]);

  const tasks = useMemo(() => [
    { id: 'morning', title: t('morning'), meta: language === 'ja' ? '東棟 · 08:00' : 'East wing · 08:00' },
    { id: 'kitchen', title: t('kitchen'), meta: language === 'ja' ? '台所 · 08:30' : 'Kitchen · 08:30' },
    { id: 'garden', title: t('garden'), meta: language === 'ja' ? '南の庭 · 10:15' : 'South grounds · 10:15' },
    { id: 'arrival', title: t('arrival'), meta: language === 'ja' ? '玄関ホール · 13:00' : 'Front hall · 13:00' },
  ], [language]);
  const selected = staff.find(person => person.id === selectedStaff) || staff[0];
  const nearby = useMemo(() => {
    const candidates = [
      { label: 'morning', text: t('morning'), point: { x: -3, y: -2 } },
      { label: 'kitchen', text: t('kitchen'), point: { x: 7, y: 2 } },
      { label: 'garden', text: t('garden'), point: { x: 8, y: 9 } },
      { label: 'arrival', text: t('arrival'), point: { x: 0, y: 0 } },
    ];
    const hit = candidates.find(item => Math.hypot(item.point.x - player.x, item.point.y - player.y) < 3.3);
    return hit || null;
  }, [player]);
  const nearbyEmergency = useMemo(() => emergencies.find(event => Math.hypot(event.point.x - player.x, event.point.y - player.y) < 3.3) || null, [emergencies, player]);
  const nearbyRoom = useMemo(() => tourRooms.find(room => Math.hypot(room.point.x - player.x, room.point.y - player.y) < 3) || null, [player]);
  const tourLiveRef = useRef({ focuses, emergencies, absentStaff });
  tourLiveRef.current = { focuses, emergencies, absentStaff };
  const addLog = useCallback((text: string) => {
    setLogs(current => [{ time: formatTime(minutes), text }, ...current].slice(0, 7));
  }, [minutes]);
  const notify = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(current => current === text ? '' : current), 3000);
  }, []);
  const resolveEmergency = useCallback((event: EmergencyEvent) => {
    eventSystemRef.current.resolve(event.id, minutes);
    setEmergencies(eventSystemRef.current.active);
    setReputation(value => Math.min(100, value + (event.status === 'escalated' ? 1 : 3)));
    setStaffMorale(value => Math.min(100, value + 2));
    if (event.type === 'guest_arrival') setGuestStates(guestManagerRef.current.please());
    const location = localized(event.location, language);
    const text = language === 'ja' ? `${location}の緊急事態を解決しました。` : language === 'fr' ? `Urgence résolue : ${location}.` : language === 'de' ? `Notfall gelöst: ${location}.` : language === 'es' ? `Emergencia resuelta: ${location}.` : language === 'zh' ? `已解决${location}的紧急事件。` : `${location} emergency resolved.`;
    addLog(text); notify(text); speak(text, tts, language, voiceRate); audioRef.current?.eventTone('report');
  }, [addLog, language, minutes, notify, tts, voiceRate]);
  const dispatchStaff = useCallback((event: EmergencyEvent, person: Staff) => {
    eventSystemRef.current.assign(event.id, person.id);
    setEmergencies([...eventSystemRef.current.active]);
    const location = localized(event.location, language);
    setFocuses(current => ({ ...current, [person.id]: location }));
    const text = language === 'ja' ? `${person.name}を${location}へ派遣しました。` : language === 'fr' ? `${person.name} envoyé(e) à ${location}.` : language === 'de' ? `${person.name} wurde nach ${location} geschickt.` : language === 'es' ? `${person.name} enviado/a a ${location}.` : language === 'zh' ? `已将${person.name}派往${location}。` : `${person.name} dispatched to ${location}.`;
    addLog(text); notify(text); audioRef.current?.eventTone('walk');
  }, [addLog, language, notify]);
  const staffDestinations = useMemo(() => Object.fromEntries(
    emergencies.filter(event => event.assignedStaffId).map(event => [event.assignedStaffId, event.point]),
  ) as Record<string, Point>, [emergencies]);
  const handleStaffArrival = useCallback((staffId: string) => {
    const person = staff.find(item => item.id === staffId);
    if (!person) return;
    const text = language === 'ja' ? `${person.name}が現場に到着しました。` : language === 'fr' ? `${person.name} est arrivé sur place.` : language === 'de' ? `${person.name} ist am Einsatzort eingetroffen.` : language === 'es' ? `${person.name} ha llegado al lugar.` : language === 'zh' ? `${person.name}已抵达现场。` : `${person.name} has arrived at the scene.`;
    notify(text);
    addLog(text);
    audioRef.current?.staffArrived();
  }, [addLog, language, notify]);
  const announce = useCallback((message: BilingualMessage | LocalizedText, tone: EventTone) => {
    const text = localized(message as LocalizedText, language);
    addLog(text);
    notify(text);
    speak(text, tts, language, voiceRate, tone === 'warning' ? 1.12 : 1);
    audioRef.current?.eventTone(tone);
  }, [addLog, language, notify, tts, voiceRate]);

  useEffect(() => {
    if (phase !== 'game') return;
    if (skipEventTimelineRef.current) {
      skipEventTimelineRef.current = false;
      return;
    }
    const events: Array<{ id: string; at: number; shouldFire?: boolean; message: BilingualMessage; tone: EventTone }> = [
      { id: 'morning-report', at: 9 * 60 + 30, message: { en: 'Mrs. Reynolds reports: the portrait gallery is ready to be shown, but the music room still wants attention.', ja: 'レイノルズ夫人の報告です。肖像画の間はご案内できますが、音楽室にはまだ手入れが必要です。' }, tone: 'report' },
      { id: 'gardiners-arrival', at: 13 * 60, message: { en: 'A travelling party has asked at the door whether the house may be seen. Mrs. Reynolds is ready to lead them through.', ja: '旅の一行が、館を拝見できるかと戸口で尋ねています。レイノルズ夫人が館内をご案内する用意をしています。' }, tone: 'arrival' },
      { id: 'elizabeth-observes', at: 13 * 60 + 30, shouldFire: reputation < 78 || completed.length < 2, message: { en: 'One of the visitors—a young lady from Hertfordshire—lets her eye rest a moment too long on a room not quite in order.', ja: '来訪者のひとり——ハートフォードシャーの若い令嬢——が、十分に整っていない部屋にわずかに長く視線をとどめました。' }, tone: 'warning' },
      { id: 'evening-report', at: 15 * 60 + 30, message: { en: 'Thomas reports: the visitors have walked down to the lake, and the grounds are showing at their best.', ja: 'トマスの報告です。来訪者たちは湖へ下りていき、庭園は最も美しい姿を見せています。' }, tone: 'report' },
    ];
    events.forEach(event => {
      if (minutes >= event.at && !firedEventsRef.current.has(event.id) && event.shouldFire !== false) {
        firedEventsRef.current.add(event.id);
        announce(event.message, event.tone);
      }
    });
  }, [announce, completed.length, minutes, phase, reputation]);

  useEffect(() => {
    if (phase !== 'game') return;
    if (skipEmergencyTimelineRef.current) {
      skipEmergencyTimelineRef.current = false;
      return;
    }
    const system = eventSystemRef.current;
    const before = system.active;
    const scheduledEmergencies: Array<{ type: EmergencyEvent['type']; at: number }> = [
      { type: 'spill', at: 8 * 60 + 45 }, { type: 'sick', at: 10 * 60 + 15 },
      { type: 'dog', at: 11 * 60 + 30 }, { type: 'dinner_rush', at: 16 * 60 },
    ];
    scheduledEmergencies.forEach(({ type, at }) => {
      if (minutes >= at && !emergencySpawnedRef.current.has(type)) {
        emergencySpawnedRef.current.add(type);
        system.spawn(type, minutes);
        const event = system.active.find(candidate => candidate.type === type);
        if (event) announce(event.dialogue, type === 'sick' ? 'warning' : 'arrival');
      }
    });
    if (minutes >= 13 * 60) {
      const shouldSpawnArrival = !emergencySpawnedRef.current.has('guest_arrival');
      if (shouldSpawnArrival) {
        emergencySpawnedRef.current.add('guest_arrival');
        system.spawn('guest_arrival', minutes);
        if (system.active.some(event => event.type === 'guest_arrival')) {
          setGuestStates(guestManagerRef.current.arrive());
          const guest = guestManagerRef.current.current[0];
          if (guest) announce(guest.arrivalLine, 'arrival');
        }
      }
    }
    const next = system.advance(minutes);
    const active = system.active;
    setEmergencies(active);
    const escalated = active.find(event => event.status === 'escalated' && !before.some(previous => previous.id === event.id && previous.status === 'escalated'));
    if (escalated) {
      setReputation(value => Math.max(0, value - 4));
      setStaffMorale(value => Math.max(0, value - 6));
      if (escalated.type === 'guest_arrival') setGuestStates(guestManagerRef.current.disappoint());
      announce(escalated.escalationDialogue, 'warning');
      const followOn = active.find(event => event.parentId === escalated.id);
      if (followOn) announce(followOn.dialogue, 'warning');
    }
  }, [announce, minutes, phase]);

  const tendRoom = useCallback((roomId: TourRoomId) => {
    const tour = tourSystemRef.current;
    const room = tourRooms.find(item => item.id === roomId);
    if (!room) return;
    if (tour.readiness[roomId] >= 99) {
      notify(language === 'ja' ? `${localized(room.name, language)}はすでに整っています。` : `${localized(room.name, language)} is already in good order.`);
      return;
    }
    tour.tend(roomId);
    setTourReadiness({ ...tour.readiness });
    setMinutes(value => Math.min(value + 5, 17 * 60 + 30));
    const text = language === 'ja'
      ? `${localized(room.name, language)}を整えました。`
      : `${localized(room.name, language)} set a little more in order.`;
    addLog(text);
    notify(text);
    speak(text, tts, language, voiceRate);
    audioRef.current?.eventTone('report');
  }, [addLog, notify, language, tts, voiceRate]);

  const answerLetter = useCallback((letterId: string, optionIndex: 0 | 1) => {
    const letter = letters.find(item => item.id === letterId);
    if (!letter || letterChoices[letterId] !== undefined) return;
    const modifier: DayModifier = letter.options[optionIndex].modifier;
    setLetterChoices(current => ({ ...current, [letterId]: optionIndex }));
    if (modifier.tourBias) {
      const tour = tourSystemRef.current;
      (Object.entries(modifier.tourBias) as [TourRoomId, number][]).forEach(([roomId, amount]) => {
        tour.readiness[roomId] = Math.max(0, Math.min(100, tour.readiness[roomId] + amount));
      });
      setTourReadiness({ ...tour.readiness });
    }
    if (modifier.reputation) setReputation(value => Math.max(0, Math.min(100, value + modifier.reputation!)));
    if (modifier.staffMorale) setStaffMorale(value => Math.max(0, Math.min(100, value + modifier.staffMorale!)));
    if (modifier.absentStaffId) setAbsentStaff(current => current.includes(modifier.absentStaffId!) ? current : [...current, modifier.absentStaffId!]);
    const note = localized(modifier.note, language);
    addLog(note);
    notify(note);
    speak(note, tts, language, voiceRate);
    audioRef.current?.eventTone('report');
  }, [addLog, notify, language, letterChoices, tts, voiceRate]);

  // 見学順路：各ゲーム内分に一度だけ進める（focuses/emergencies の変化で二重に進めない）
  useEffect(() => {
    if (phase !== 'game') return;
    if (tourProcessedRef.current === minutes) return;
    tourProcessedRef.current = minutes;
    const tour = tourSystemRef.current;
    const { focuses: liveFocuses, emergencies: liveEmergencies, absentStaff: liveAbsent } = tourLiveRef.current;
    const busy = new Set([
      ...liveEmergencies.filter(event => event.assignedStaffId).map(event => event.assignedStaffId as string),
      ...liveAbsent,
    ]);
    const observation = tour.advance(minutes, liveFocuses, busy);
    setTourReadiness({ ...tour.readiness });
    setTourRoomId(tour.currentRoom?.id ?? null);
    if (observation) announce(observation.line, observation.band === 'wanting' ? 'warning' : 'report');
    const impression = tour.settledImpression;
    if (impression !== null && !tourSettledRef.current) {
      tourSettledRef.current = true;
      const delta = Math.max(-6, Math.min(8, Math.round((impression - 60) / 5)));
      setReputation(value => Math.max(0, Math.min(100, value + delta)));
      setGuestStates(impression >= 60
        ? guestManagerRef.current.please(Math.max(1, Math.round((impression - 55) / 6)))
        : guestManagerRef.current.disappoint(Math.max(1, Math.round((60 - impression) / 5))));
    }
  }, [announce, minutes, phase]);

  useEffect(() => {
    if (phase !== 'game') return;
    const onKey = (event: KeyboardEvent) => {
      keysRef.current[event.key.toLowerCase()] = event.type === 'keydown';
      if (event.key.toLowerCase() === 'e' && event.type === 'keydown') {
        if (nearbyEmergency) {
          resolveEmergency(nearbyEmergency);
        } else if (nearbyRoom) {
          tendRoom(nearbyRoom.id);
        } else if (nearby) {
          setCompleted(current => current.includes(nearby.label) ? current : [...current, nearby.label]);
          setReputation(value => Math.min(100, value + (completed.includes(nearby.label) ? 0 : 2)));
          addLog(`${nearby.text} marked complete. The household is in good order.`);
          notify(`Task recorded · ${nearby.text}`);
           speak(nearby.text, tts, language);
        } else {
          notify('Nothing here requires your attention. Try the east wing or south grounds.');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    let raf = 0;
    let last = performance.now();
    const move = (now: number) => {
      const delta = Math.min((now - last) / 1000, .05); last = now;
      const keys = keysRef.current;
       const speed = 6 * (keys.shift || emergencies.length > 0 ? 1.5 : 1);
      const next = { ...playerRef.current };
      if (keys.w || keys.arrowup) next.y -= speed * delta;
      if (keys.s || keys.arrowdown) next.y += speed * delta;
      if (keys.a || keys.arrowleft) next.x -= speed * delta;
      if (keys.d || keys.arrowright) next.x += speed * delta;
       next.x += joystickRef.current.x * speed * delta;
       next.y += joystickRef.current.y * speed * delta;
      next.x = Math.max(-14, Math.min(14, next.x)); next.y = Math.max(-9, Math.min(14, next.y));
        const atHouseEntrance = next.y <= -2.7 && Math.abs(next.x) < 2.5;
        const enteringHouse = playerRef.current.y > -2.7 && atHouseEntrance;
        if (!atHouseEntrance) roomEntryLatchRef.current = false;
        if (enteringHouse && !roomTransitionRef.current && !roomEntryLatchRef.current) {
          roomEntryLatchRef.current = true;
         roomTransitionRef.current = true;
         setRoomFade(true);
         window.setTimeout(() => {
           playerRef.current = { ...playerRef.current, y: playerRef.current.y - 1.5 };
           setPlayer(playerRef.current);
         }, 150);
         window.setTimeout(() => { roomTransitionRef.current = false; setRoomFade(false); }, 300);
       }
      if (next.x !== playerRef.current.x || next.y !== playerRef.current.y) {
        playerRef.current = next;
        setPlayer(next);
      }
      raf = requestAnimationFrame(move);
    };
    raf = requestAnimationFrame(move);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); };
  }, [phase, nearby, nearbyEmergency, nearbyRoom, tendRoom, addLog, notify, resolveEmergency, tts, completed, emergencies.length]);

  useEffect(() => {
    if (phase !== 'game') return;
    const clock = window.setInterval(() => setMinutes(value => value >= 17 * 60 + 30 ? value : value + 1), 1000);
    return () => window.clearInterval(clock);
  }, [phase]);

  const startGame = () => {
    eventSystemRef.current.reset();
    emergencySpawnedRef.current.clear();
    setEmergencies([]);
    setGuestStates(guestManagerRef.current.reset(dayNumber));
    setStaffMorale(86);
    tourSystemRef.current.reset();
    setTourReadiness({ ...tourSystemRef.current.readiness });
    setTourRoomId(null);
    tourProcessedRef.current = -1;
    tourSettledRef.current = false;
    setLetterChoices({});
    setAbsentStaff([]);
    setLettersOpen(false);
    setPhase('game');
    addLog('The steward has entered the grounds. A full day lies ahead.');
    addLog(localized({ en: 'The morning post is on the desk; three letters want an answer.', ja: '朝の便が机にあります。三通の手紙が返事を待っています。', fr: 'Le courrier du matin est sur le bureau ; trois lettres attendent une réponse.', de: 'Die Morgenpost liegt auf dem Schreibtisch; drei Briefe erwarten Antwort.', es: 'El correo de la mañana está en el escritorio; tres cartas esperan respuesta.', zh: '晨间信件已放在书桌上；三封信等待回复。' }, language));
     speak(language === 'ja' ? 'おはようございます。館はあなたの指示を待っています。' : 'Good morning. The house awaits your direction.', tts, language);
  };
  const takeWalk = () => {
    const walk = chooseWalk(minutes, seasonIndex, weatherIndex);
    announce(walk, 'walk');
  };
  const ringBell = () => {
    setMinutes(value => Math.min(value + 15, 17 * 60 + 30));
    setReputation(value => Math.min(100, value + 1));
    addLog('The west bell rings clearly across the grounds. Staff adjust their routes.');
    notify('The household bell has been rung · 15 minutes advanced');
    speak(language === 'ja' ? '館の鐘を鳴らしました。' : 'The household bell has been rung.', tts, language, voiceRate);
    audioRef.current?.ringBell();
  };
  const interact = () => {
    if (nearbyEmergency) {
      resolveEmergency(nearbyEmergency);
      return;
    }
    if (nearbyRoom) {
      tendRoom(nearbyRoom.id);
      return;
    }
    if (!nearby) {
      notify(language === 'ja' ? 'ここには今、必要な仕事はありません。' : 'Nothing here requires your attention.');
      return;
    }
    setCompleted(current => current.includes(nearby.label) ? current : [...current, nearby.label]);
    setReputation(value => Math.min(100, value + (completed.includes(nearby.label) ? 0 : 2)));
    addLog(`${nearby.text} marked complete. The household is in good order.`);
    notify(`Task recorded · ${nearby.text}`);
    speak(nearby.text, tts, language, voiceRate);
  };
  const finishDay = () => {
    const prose = composeDiary({
      dayNumber,
      weatherEn: weather.en,
      weatherJa: weather.ja,
      completed: completed.length,
      taskCount: tasks.length,
      reputation,
      guestMood: guestStates[0]?.mood ?? 82,
      pianoPlayed: pianoScore > 0,
      tourImpression: tourSystemRef.current.settledImpression ?? undefined,
    });
    const entry = { date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), complete: completed.length, reputation, day: dayNumber, prose };
    const nextEntries = [...diaryEntries, entry];
    localStorage.setItem('pemberley-diary', JSON.stringify(nextEntries));
    setDiaryEntries(nextEntries);
    setSelectedDiaryEntry(entry);
    setDiaryOpen(true);
  };
  function resetDay() {
      skipEventTimelineRef.current = true;
      skipEmergencyTimelineRef.current = true;
      eventSystemRef.current.reset(); emergencySpawnedRef.current.clear(); setEmergencies([]); setGuestStates(guestManagerRef.current.reset(dayNumber + 1)); setStaffMorale(86);
      tourSystemRef.current.reset(); setTourReadiness({ ...tourSystemRef.current.readiness }); setTourRoomId(null); tourProcessedRef.current = -1; tourSettledRef.current = false;
      setLetterChoices({}); setAbsentStaff([]); setLettersOpen(false);
     setMinutes(7 * 60 + 35); setDayNumber(value => value + 1); setCompleted([]); setReputation(74); setLogs(initialLogs); setPlayer({ x: 0, y: 7 }); playerRef.current = { x: 0, y: 7 }; firedEventsRef.current.clear(); setDiaryOpen(false); notify('A new morning has been prepared.');
  }

  if (phase === 'title') return <div className="pemberley-app"><div className="grain" /><TitleScreen language={language} setLanguage={setLanguage} onStart={startGame} diaryEntries={diaryEntries} onOpenDiary={() => { setSelectedDiaryEntry(diaryEntries[diaryEntries.length - 1]); setDiaryOpen(true); }} diaryTriggerRef={diaryTriggerRef} taskCount={4} />{diaryEntries.length > 0 && diaryOpen && <DiaryModal triggerRef={diaryTriggerRef} entry={selectedDiaryEntry || diaryEntries[diaryEntries.length - 1]} entries={diaryEntries} onSelectEntry={setSelectedDiaryEntry} language={language} taskCount={4} onReset={resetDay} onClose={() => setDiaryOpen(false)} />}</div>;

  return (
    <div className="pemberley-app game-shell">
      <div className="grain" />
      <header className="game-header">
        <div className="brand-mini"><div className="brand-mini-mark"><span>P</span></div><div><b>A Day at Pemberley</b><small>Household ledger · Derbyshire</small></div></div>
        <div className="header-stats">
           <div className="stat"><label>{t('season')}</label><b>{language === 'ja' ? season.ja : season.en}</b></div>
           <div className="stat"><label>{t('weather')}</label><b><CloudRain size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />{language === 'ja' ? weather.ja : weather.en}</b></div>
           <div className="stat"><label>{t('clock')}</label><b><Clock3 size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />{formatTime(minutes)}</b></div>
        </div>
        <div className="header-actions">
          <button className="icon-button" aria-label="Open staff panel" onClick={() => setRightOpen(value => !value)}><Users size={17} /></button>
          <button className="icon-button" aria-label="Toggle sound" onClick={() => setSound(value => !value)}>{sound ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
          <button ref={settingsTriggerRef} className="icon-button" aria-label="Open settings" onClick={() => setSettingsOpen(true)}><Settings size={17} /></button>
        </div>
      </header>
      <div className="game-body">
        <aside className={`panel left-panel ${leftOpen ? 'open' : ''}`}>
           <div className="panel-title"><strong>{t('desk')}</strong><span>{t('day')}</span></div>
           <div className="day-card"><div className="eyebrow" style={{ color: '#adc2aa' }}>{language === 'ja' ? '木曜日 · 10月17日' : 'Thursday · 17 October'}</div><div className="day-number">{formatTime(minutes)}</div><p>{language === 'ja' ? '朝の仕事 · 湖に霧' : 'Morning duties · mist on the lake'}</p><div className="progress"><i style={{ width: `${Math.max(4, (minutes - 455) / 7.2)}%` }} /></div></div>
           <button ref={lettersTriggerRef} className={`letters-button ${Object.keys(letterChoices).length < letters.length ? 'unread' : ''}`} onClick={() => setLettersOpen(true)}>
             <BookOpen size={14} /> {t('correspondenceTitle')} · {Object.keys(letterChoices).length}/{letters.length}
           </button>
           <div className="section-label emergency-heading">{copy.emergencies} · {Math.min(3, emergencies.length)}/3</div>
           <div className="emergency-list">
             {emergencies.slice(0, 3).map(event => {
               const remaining = Math.max(0, event.deadline - minutes);
               const duration = event.status === 'escalated' ? 18 : Math.max(1, event.deadline - event.startedAt);
               const assigned = staff.find(person => person.id === event.assignedStaffId);
               return <article className={`emergency-card ${event.status}`} key={event.id}>
                 <div className="emergency-card-top"><span className={`severity severity-${event.severity}`}>{copy[event.severity]}</span><span className="mono">{remaining} {copy.timeLeft}</span></div>
                 <strong>{copy[event.type]}</strong>
                 <small>{localized(event.location, language)} · {event.status === 'escalated' ? copy.escalated : `${Math.round((remaining / duration) * 100)}%`}</small>
                 <div className="progress emergency-progress"><i style={{ width: `${Math.max(0, Math.min(100, (remaining / duration) * 100))}%` }} /></div>
                 <div className="emergency-actions">
                   <button onClick={() => resolveEmergency(event)}>{copy.resolve}</button>
                   <span>{assigned ? `${copy.assigned}: ${assigned.name}` : copy.unassigned}</span>
                 </div>
               </article>;
             })}
           </div>
           {!emergencies.length && <p className="calm-note">{copy.calm}</p>}
           <div className="section-label">{t('tour')}{tourRoomId ? ` · ${localized(tourRooms.find(room => room.id === tourRoomId)!.name, language)}` : ''}</div>
           <div className="tour-rooms">
             {tourRooms.map(room => {
               const value = Math.round(tourReadiness[room.id]);
               const showing = tourRoomId === room.id;
               return <div className={`tour-room ${showing ? 'showing' : ''}`} key={room.id}>
                 <div className="tour-room-top"><b>{localized(room.name, language)}</b><span className="mono">{showing ? t('tourShowing') : `${value}%`}</span></div>
                 <div className="progress"><i style={{ width: `${value}%` }} /></div>
               </div>;
             })}
           </div>
           {tourRoomId === null && <p className="tour-wait">{t('tourWaiting')}</p>}
           <div className="section-label">{copy.duties} · {completed.length}/{tasks.length}</div>
           {tasks.map(task => <label className={`task ${completed.includes(task.id) ? 'done' : ''}`} key={task.id}><input type="checkbox" aria-label={task.title} checked={completed.includes(task.id)} onChange={() => { setCompleted(current => current.includes(task.id) ? current.filter(id => id !== task.id) : [...current, task.id]); addLog(`${task.title} was ${completed.includes(task.id) ? 'returned to the ledger' : 'marked complete'}.`); }} /><span><b>{task.title}</b>{task.meta}</span></label>)}
           <button className="bell-button" onClick={ringBell}><Bell size={15} /> {t('ring')}</button>
           <button className="outline-button" style={{ width: '100%', marginTop: 9, color: '#c8d5c8', borderColor: '#526b62' }} onClick={finishDay}><BookOpen size={14} style={{ verticalAlign: 'middle', marginRight: 7 }} /> {t('closeDay')}</button>
        </aside>
        <main className="view-wrap" onClick={() => setLeftOpen(false)}>
           <div className="view-hud"><div className="location-badge"><strong>{t('grounds')}</strong><span>{t('view')} · {languages.find(item => item.code === language)?.name}</span></div><div className="controls-badge">W A S D &nbsp; {t('move')} · Shift &nbsp; {t('run')}<br />Mouse wheel &nbsp; {t('adjust')} · E &nbsp; {t('interact')}</div></div>
           <EstateCanvas mode="game" player={player} onNotice={notify} onWalk={takeWalk} staffDestinations={staffDestinations} emergencyActive={emergencies.length > 0} onStaffArrival={handleStaffArrival} />
           {roomFade && <div className="room-transition" aria-hidden="true" />}
           {nearbyEmergency ? <div className="interaction-prompt"><kbd>E</kbd>{copy.resolve}</div> : nearbyRoom ? <div className="interaction-prompt"><kbd>E</kbd>{t('tend')} · {localized(nearbyRoom.name, language)}</div> : nearby && <div className="interaction-prompt"><kbd>E</kbd>{nearby.text}</div>}
            <div className="touch-joystick" aria-label="Movement joystick" onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => { if (event.buttons === 0) return; const rect = event.currentTarget.getBoundingClientRect(); const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2); const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2); const length = Math.hypot(dx, dy) || 1; const scale = Math.min(1, 1 / length); joystickRef.current = { x: dx * scale, y: dy * scale }; }} onPointerUp={() => { joystickRef.current = { x: 0, y: 0 }; }} onPointerCancel={() => { joystickRef.current = { x: 0, y: 0 }; }}><span /></div>
           <button className="touch-action" onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); }} onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); interact(); }} aria-label={t('interact')}>E</button>
           <button ref={pianoTriggerRef} className="piano-launch" onClick={() => { setPianoOpen(true); audioRef.current?.start(); }} aria-label="Open piano">♫</button>
          <div className="minimap"><div className="minimap-inner"><div className="mini-lake" /><div className="mini-house" /><div className="mini-player" style={{ left: `${50 + player.x * 2.2}%`, top: `${42 + player.y * 2.2}%` }} />{staff.map((item, i) => <span key={item.id} style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: item.color, left: `${47 + item.home.x * 2.2}%`, top: `${43 + item.home.y * 2.2}%` }} />)}</div></div>
          <button className="icon-button" style={{ position: 'absolute', zIndex: 4, bottom: 18, left: 17, background: 'rgba(27,45,47,.8)' }} onClick={(event) => { event.stopPropagation(); setLeftOpen(value => !value); }} aria-label="Open task panel"><Menu size={17} /></button>
        </main>
        <aside className={`panel right-panel ${rightOpen ? 'open' : ''}`}>
           <div className="panel-title"><strong>{t('household')}</strong><span>5 {t('onDuty')}</span></div>
           <div className="reputation"><div className="rep-ring"><b>{reputation}</b></div><div><strong>{t('reputation')}</strong><small>{t('goodOrder')}</small></div></div>
           <div className="section-label">{t('staffRoutes')}</div>
            <div className="status-meters"><div><span>{copy.guestMood}</span><b>{guestStates[0]?.mood ?? 82}%</b></div><div><span>{copy.staffMorale}</span><b>{staffMorale}%</b></div></div>
            {guestStates.map(guest => <div className="guest-card" key={guest.id}><div><strong>{guest.name}</strong><small>{guest.title}</small></div><b>{guest.mood}%</b><p>“{localized(guest.line, language)}”</p><small>{copy.preferences}: {guest.preferences.join(' · ')}</small></div>)}
            {staff.map(person => <div key={person.id} className={`staff-card ${selectedStaff === person.id ? 'selected' : ''}`} onClick={() => setSelectedStaff(person.id)}><div className="staff-row"><div className="avatar" style={{ background: person.color }}>{person.initials}</div><div><strong>{person.name}</strong><small>{person.role}</small></div><i className="status-dot" /></div>{selectedStaff === person.id && <div className="focus-row">{emergencies.slice(0, 3).map(event => <button key={event.id} className="focus-btn" onClick={(clickEvent) => { clickEvent.stopPropagation(); dispatchStaff(event, person); }}>{copy.dispatch} · {localized(event.location, language)}</button>)}{!emergencies.length && tourRooms.map(room => <button key={room.id} className={`focus-btn ${focuses[person.id] === room.focus ? 'active' : ''}`} onClick={(event) => { event.stopPropagation(); setFocuses(current => ({ ...current, [person.id]: room.focus })); notify(`${person.name} · ${localized(room.name, language)}`); }}>{localized(room.name, language)}</button>)}</div>}</div>)}
           <div className="section-label">{t('eventLog')}</div>
          <ul className="log">{logs.map((item, i) => <li key={`${item.time}-${i}`}><time>{item.time}</time>{item.text}</li>)}</ul>
          <div style={{ color: '#87a095', fontSize: 10, marginTop: 16, lineHeight: 1.6 }}><Wind size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Wind from the west · lake path is slick</div>
        </aside>
      </div>
      {notice && <div className="toast-note">{notice}</div>}
        <Dialog open={settingsOpen} triggerRef={settingsTriggerRef} onClose={() => setSettingsOpen(false)} label={t('settings')}>
          <button className="icon-button" style={{ float: 'right', color: '#31554c' }} onClick={() => setSettingsOpen(false)} aria-label={t('close')}><X size={17} /></button><div className="eyebrow" style={{ color: '#a36b48' }}>{t('correspondence')}</div><h2>{t('settings')}</h2><p>{language === 'ja' ? '一日の音や表示を整えます。進行状況はこのブラウザに保存されます。' : 'Adjust the sensory details of your day. Your progress is kept in this browser.'}</p><div style={{ marginTop: 24, borderTop: '1px solid #cdbc9e' }}><label style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #cdbc9e', fontSize: 12 }}>{t('language')} <select value={language} onChange={event => setLanguage(event.target.value as Language)}>{languages.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label><label style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #cdbc9e', fontSize: 12 }}>{t('sound')} <input type="checkbox" checked={sound} onChange={event => setSound(event.target.checked)} /></label><label style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #cdbc9e', fontSize: 12 }}>{t('voice')} <input type="checkbox" checked={tts} onChange={event => setTts(event.target.checked)} /></label><label className="range-setting">{language === 'ja' ? '音声速度' : 'Voice speed'} <input type="range" min="0.5" max="2" step="0.1" value={voiceRate} onChange={event => setVoiceRate(Number(event.target.value))} /><output>{voiceRate.toFixed(1)}×</output></label></div><div className="modal-actions"><button onClick={() => setSettingsOpen(false)}>{t('save')}</button></div>
        </Dialog>
        {diaryEntries.length > 0 && diaryOpen && <DiaryModal triggerRef={diaryTriggerRef} entry={selectedDiaryEntry || diaryEntries[diaryEntries.length - 1]} entries={diaryEntries} onSelectEntry={setSelectedDiaryEntry} language={language} taskCount={tasks.length} onReset={resetDay} onClose={() => { setDiaryOpen(false); setPhase('title'); }} />}
        <Dialog open={pianoOpen} triggerRef={pianoTriggerRef} onClose={() => setPianoOpen(false)} className="piano-modal" label={language === 'ja' ? '夕べの小さな演奏' : 'A little evening air'}>
          <div className="eyebrow" style={{ color: '#a36b48' }}>The parlour piano</div><h2>{language === 'ja' ? '夕べの小さな演奏' : 'A little evening air'}</h2><p>{language === 'ja' ? '4つの鍵盤で、ペンバリーの旋律を奏でましょう。' : 'Play a gentle Regency phrase on the four keys.'}</p><div className="piano-keys">{['C', 'D', 'E', 'G'].map((note, index) => <button key={note} onClick={() => { setPianoScore(score => score + 1); audioRef.current?.playPianoNote(index); }}><span>{note}</span></button>)}</div><div className="piano-score">{language === 'ja' ? `演奏した音符: ${pianoScore}` : `Notes played: ${pianoScore}`}</div><div className="modal-actions"><button className="primary" onClick={() => setPianoOpen(false)}>{t('close')}</button></div>
        </Dialog>
        <Dialog open={lettersOpen} triggerRef={lettersTriggerRef} onClose={() => setLettersOpen(false)} className="letters-modal" label={t('correspondenceTitle')}>
          <button className="icon-button" style={{ float: 'right', color: '#31554c' }} onClick={() => setLettersOpen(false)} aria-label={t('close')}><X size={17} /></button>
          <div className="eyebrow" style={{ color: '#a36b48' }}>{t('desk')}</div>
          <h2>{t('correspondenceTitle')}</h2>
          <p>{t('correspondenceIntro')}</p>
          <div className="letter-list">
            {letters.map(letter => {
              const chosen = letterChoices[letter.id];
              return <article className={`letter-card ${chosen !== undefined ? 'answered' : ''}`} key={letter.id}>
                <div className="letter-from">{localized(letter.from, language)}</div>
                <p className="letter-body">{localized(letter.body, language)}</p>
                <div className="letter-options">
                  {letter.options.map((option, index) => (
                    <button
                      key={index}
                      className={`letter-option ${chosen === index ? 'chosen' : ''}`}
                      disabled={chosen !== undefined}
                      onClick={() => answerLetter(letter.id, index as 0 | 1)}
                    >
                      {localized(option.label, language)}
                    </button>
                  ))}
                </div>
                {chosen !== undefined && <p className="letter-note">{localized(letter.options[chosen].modifier.note, language)}</p>}
              </article>;
            })}
          </div>
          <div className="modal-actions"><button className="primary" onClick={() => setLettersOpen(false)}>{Object.keys(letterChoices).length < letters.length ? t('close') : t('beginWork')}</button></div>
        </Dialog>
    </div>
  );
}

export default App;