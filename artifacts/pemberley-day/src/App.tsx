import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, BookOpen, ChevronRight, CloudRain, Clock3, Menu, RotateCcw, Settings, Sparkles, Users, Volume2, VolumeX, Wind, X } from 'lucide-react';

type Phase = 'title' | 'game';
type Point = { x: number; y: number };
type Staff = { id: string; name: string; role: string; initials: string; color: string; home: Point; focus: string };

const languages = [
  { name: 'English (UK)', native: 'English', code: 'en' },
  { name: '日本語', native: '日本語', code: 'ja' },
  { name: 'Français', native: 'Français', code: 'fr' },
  { name: 'Deutsch', native: 'Deutsch', code: 'de' },
  { name: 'Español', native: 'Español', code: 'es' },
  { name: '中文', native: '中文', code: 'zh' },
];

type Language = (typeof languages)[number]['code'];

const translations: Record<Language, Record<string, string>> = {
  en: {
    eyebrow: 'A household operations game', subtitle: 'Every room has a rhythm. Every guest has a preference. Keep the house in good order before the last light leaves the lake.', begin: 'Begin the day', options: 'Options', settings: 'Settings', language: 'Language', close: 'Close', save: 'Save settings', correspondence: 'House preferences', languageHint: 'Choose the language for your ledger, notices and diary.', titleLine: 'At first light, the house is yours.', season: 'Season', weather: 'Weather', clock: 'House clock', grounds: 'Pemberley grounds', view: 'Steward’s view', move: 'move', run: 'run', adjust: 'adjust view', interact: 'interact', desk: 'Steward’s desk', day: 'Day 01', order: 'Today’s order', ring: 'Ring household bell', closeDay: 'Close day & write diary', household: 'Household', onDuty: 'on duty', staffRoutes: 'Staff routes', reputation: 'House reputation', goodOrder: 'Good order · +2 since dawn', eventLog: 'Event log', taskDone: 'marked complete', bellNotice: 'The household bell has been rung · 15 minutes advanced', nothing: 'Nothing here requires your attention. Try the east wing or south grounds.', noticeTask: 'Task recorded', focus: 'Focus', sound: 'Ambient bell and room sounds', voice: 'Spoken notices', diary: 'The Pemberley diary · evening', diaryTitle: 'A well-managed day', return: 'Return to grounds', another: 'Begin another day', diaryText: 'The last light has gone from the west windows. Your account has been placed safely in the household diary.', morning: 'Inspect the morning rooms', kitchen: 'Confirm breakfast service', garden: 'Review the kitchen garden', arrival: 'Prepare for afternoon callers', housekeeping: 'Housekeeping', guests: 'Guests', groundsFocus: 'Grounds',
  },
  ja: {
    eyebrow: '領地運営シミュレーション', subtitle: '部屋にはそれぞれのリズムがあり、客人にはそれぞれの好みがあります。湖から最後の光が消える前に、館を整えましょう。', begin: '一日を始める', options: 'オプション', settings: '設定', language: '言語', close: '閉じる', save: '設定を保存', correspondence: '館の設定', languageHint: '帳簿、通知、日記で使う言語を選択します。', titleLine: '夜明けとともに、この館はあなたのものです。', season: '季節', weather: '天候', clock: '館の時計', grounds: 'ペンバリー領地', view: '執事の視点', move: '移動', run: '走る', adjust: '視点変更', interact: '調べる', desk: '執事の机', day: '1日目', order: '本日の予定', ring: '館の鐘を鳴らす', closeDay: '一日を閉じて日記を書く', household: '使用人', onDuty: '名が勤務中', staffRoutes: '使用人の巡回', reputation: '館の評判', goodOrder: '良好 · 夜明けから+2', eventLog: '出来事の記録', taskDone: '完了に記録しました', bellNotice: '館の鐘を鳴らしました · 15分経過', nothing: 'ここに必要な仕事はありません。東棟か南の庭へ向かいましょう。', noticeTask: '仕事を記録しました', focus: '担当', sound: '鐘と部屋の環境音', voice: '音声通知', diary: 'ペンバリーの日記 · 夕刻', diaryTitle: 'よく管理された一日', return: '領地へ戻る', another: '新しい一日を始める', diaryText: '西の窓から最後の光が消えました。あなたの記録は館の日記に大切に保管されました。', morning: '朝の部屋を点検する', kitchen: '朝食の準備を確認する', garden: '菜園を見回る', arrival: '午後の来客に備える', housekeeping: '家事', guests: '来客', groundsFocus: '庭の管理',
  },
  fr: {}, de: {}, es: {}, zh: {},
};

function detectLanguage(): Language {
  const supported = languages.map(item => item.code);
  const preferred = [...(navigator.languages || []), navigator.language || 'en'];
  return preferred.map(value => value.toLowerCase().split('-')[0]).find(value => supported.includes(value as Language)) as Language || 'en';
}

const staff: Staff[] = [
  { id: 'mrs-bennet', name: 'Mrs. Bennet', role: 'Housekeeper', initials: 'MB', color: '#d8a56b', home: { x: -4, y: -1 }, focus: 'Morning rooms' },
  { id: 'mr-reynolds', name: 'Mr. Reynolds', role: 'Land Steward', initials: 'MR', color: '#9fb8a5', home: { x: 5, y: 2 }, focus: 'South lawn' },
  { id: 'lucy', name: 'Lucy Steele', role: 'Under-parlourmaid', initials: 'LS', color: '#c7846a', home: { x: -7, y: 5 }, focus: 'Housekeeping' },
  { id: 'william', name: 'William Collins', role: 'Footman', initials: 'WC', color: '#b8a77e', home: { x: 2, y: -5 }, focus: 'Receiving guests' },
  { id: 'mrs-gardiner', name: 'Mrs. Gardiner', role: 'Head gardener', initials: 'MG', color: '#83a989', home: { x: 9, y: 6 }, focus: 'Kitchen garden' },
];

const initialLogs = [
  { time: '07:35', text: 'The west bell has called the household to order.' },
  { time: '07:22', text: 'A fine mist rests upon the lake. Roads remain passable.' },
  { time: '06:58', text: 'Kitchen fire lit. Breakfast service is under way.' },
];

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function speak(text: string, enabled: boolean, language: Language = 'en') {
  if (enabled && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'ja' ? 'ja-JP' : language === 'fr' ? 'fr-FR' : language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : language === 'zh' ? 'zh-CN' : 'en-GB';
    window.speechSynthesis.speak(utterance);
  }
}

function EstateCanvas({ mode, player, onNotice }: { mode: 'title' | 'game'; player: Point; onNotice?: (text: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomRef = useRef(mode === 'title' ? 1.04 : 1);
  const hoverRef = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    let frame = 0;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const draw = (now: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const t = now / 1000;
      context.clearRect(0, 0, w, h);
      const sky = context.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, mode === 'title' ? '#5e756d' : '#4b6860');
      sky.addColorStop(.52, mode === 'title' ? '#a58b70' : '#78907b');
      sky.addColorStop(1, '#314e49');
      context.fillStyle = sky;
      context.fillRect(0, 0, w, h);

      const scale = Math.min(w, h) / 31 * zoomRef.current;
      const cameraX = mode === 'game' ? player.x : Math.sin(t * .06) * .7;
      const cameraY = mode === 'game' ? player.y : Math.cos(t * .05) * .45;
      const project = (x: number, y: number, z = 0): Point => ({
        x: w / 2 + (x - y - cameraX + cameraY) * scale * .74,
        y: h * .49 + (x + y - cameraX - cameraY) * scale * .35 - z * scale,
      });
      const poly = (points: Point[], fill: string, stroke?: string) => {
        context.beginPath();
        points.forEach((p, i) => i ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y));
        context.closePath();
        context.fillStyle = fill;
        context.fill();
        if (stroke) { context.strokeStyle = stroke; context.lineWidth = 1; context.stroke(); }
      };
      const line = (points: Point[], stroke: string, width = 1) => {
        context.beginPath();
        points.forEach((p, i) => i ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y));
        context.strokeStyle = stroke; context.lineWidth = width; context.stroke();
      };

      // distant hills and the lake establish an estate horizon
      poly([project(-22, -13, 0), project(2, -13, 0), project(8, -8, 0), project(-22, -5, 0)], '#3e6053');
      poly([project(4, -16, 0), project(22, -14, 0), project(22, 1, 0), project(9, -2, 0)], '#3b5a51');
      poly([project(12, 3, 0), project(22, 0, 0), project(22, 15, 0), project(10, 13, 0)], '#537883', '#759396');
      poly([project(12, 5, 0), project(21, 2, 0), project(21, 4, 0), project(12, 7, 0)], 'rgba(198,190,147,.22)');
      // estate ground
      poly([project(-20, -12), project(20, -12), project(20, 18), project(-20, 18)], '#54735b');
      for (let i = -18; i < 18; i += 2) line([project(i, -10), project(i + 14, 16)], 'rgba(224,202,153,.07)', 1);
      for (let i = -10; i < 17; i += 2) line([project(-18, i), project(18, i - 4)], 'rgba(31,65,53,.09)', 1);
      // paths
      line([project(-1, 13), project(-1, 3), project(0, 0)], '#bfad82', 6);
      line([project(-11, 5), project(-1, 3)], '#b9a67d', 3);
      line([project(1, 1), project(9, 8)], '#b9a67d', 3);
      // kitchen garden beds
      for (let i = 0; i < 4; i++) {
        const x = 7 + i * 1.8;
        poly([project(x, 8), project(x + 1.1, 7.5), project(x + 1.1, 11), project(x, 11.5)], '#416a4d', '#8aa26e');
        for (let j = 0; j < 3; j++) line([project(x + .2, 8.2 + j), project(x + .85, 8.05 + j)], '#b2b878', 1);
      }
      // orchard
      for (let i = 0; i < 8; i++) {
        const x = -10 + (i % 4) * 2.2;
        const y = 8 + Math.floor(i / 4) * 2.1;
        const p = project(x, y, .4);
        context.fillStyle = i % 2 ? '#355c4c' : '#426b50';
        context.beginPath(); context.arc(p.x, p.y, scale * .6, 0, Math.PI * 2); context.fill();
        context.fillStyle = '#715b43'; context.fillRect(p.x - 1, p.y + scale * .25, 2, scale * .55);
      }
      // main house, layered for a convincing isometric elevation
      const base = project(-4.5, -3.2, 0);
      poly([project(-5.5, -3.4), project(4.4, -3.4), project(4.4, 1.4), project(-5.5, 1.4)], '#d6c29c', '#8f795c');
      poly([project(-5.5, 1.4), project(4.4, 1.4), project(4.4, 1.9), project(-5.5, 1.9)], '#856d59');
      poly([project(-5.5, -3.4, 5.2), project(4.4, -3.4, 5.2), project(4.4, -3.4, 0), project(-5.5, -3.4, 0)], '#b9a682');
      poly([project(-5.5, -3.4, 5.2), project(-.5, -6, 5.2), project(4.4, -3.4, 5.2)], '#5c5049', '#342f31');
      poly([project(-.5, -6, 5.2), project(-.5, -6, 6.3), project(4.4, -3.4, 6.3), project(4.4, -3.4, 5.2)], '#403e3d');
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
        const moving = { x: person.home.x + Math.sin(t * (.23 + i * .03) + i) * (1.3 + i * .12), y: person.home.y + Math.cos(t * (.19 + i * .02) + i) * .8 };
        const p = project(moving.x, moving.y, .7);
        context.fillStyle = 'rgba(18,34,32,.35)'; context.beginPath(); context.ellipse(p.x, p.y + scale * .25, scale * .35, scale * .14, 0, 0, Math.PI * 2); context.fill();
        context.fillStyle = person.color; context.beginPath(); context.arc(p.x, p.y - scale * .16, scale * .24, 0, Math.PI * 2); context.fill();
        context.fillStyle = '#eadcc0'; context.fillRect(p.x - scale * .16, p.y + scale * .05, scale * .32, scale * .4);
        if (mode === 'game') { context.fillStyle = '#ecdfc3'; context.font = '9px Manrope'; context.textAlign = 'center'; context.fillText(person.initials, p.x, p.y - scale * .52); }
      });
      if (mode === 'game') {
        const pp = project(player.x, player.y, .8);
        context.fillStyle = 'rgba(226,189,137,.26)'; context.beginPath(); context.arc(pp.x, pp.y, scale * .72, 0, Math.PI * 2); context.fill();
        context.fillStyle = '#e2bd89'; context.beginPath(); context.arc(pp.x, pp.y - scale * .25, scale * .24, 0, Math.PI * 2); context.fill();
        context.fillStyle = '#31554c'; context.fillRect(pp.x - scale * .18, pp.y, scale * .36, scale * .55);
      }
      // atmospheric drizzle lines
      if (mode === 'game') for (let i = 0; i < 30; i++) {
        const rx = (i * 97 + now / 35) % w;
        const ry = (i * 53 + now / 22) % h;
        line([{ x: rx, y: ry }, { x: rx - 3, y: ry + 9 }], 'rgba(218,225,205,.13)', 1);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [mode, player]);

  const onWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    zoomRef.current = Math.max(.72, Math.min(1.42, zoomRef.current + (event.deltaY > 0 ? -.07 : .07)));
  };

  const onClick = () => onNotice?.('The estate grounds are quiet. Choose a task or walk towards a marked colleague.');
  return <canvas ref={canvasRef} className="estate-canvas" onWheel={onWheel} onClick={onClick} aria-label="Playable illustrated 3D view of Pemberley estate" />;
}

function TitleScreen({ language, setLanguage, onStart }: { language: Language; setLanguage: (value: Language) => void; onStart: () => void }) {
  const t = (key: string) => translations[language][key] || translations.en[key] || key;
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

function App() {
  const [phase, setPhase] = useState<Phase>('title');
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('pemberley-language') as Language | null;
    return saved && languages.some(item => item.code === saved) ? saved : detectLanguage();
  });
  const t = (key: string) => translations[language][key] || translations.en[key] || key;
  useEffect(() => { localStorage.setItem('pemberley-language', language); }, [language]);
  const [player, setPlayer] = useState<Point>({ x: 0, y: 7 });
  const playerRef = useRef<Point>({ x: 0, y: 7 });
  const keysRef = useRef<Record<string, boolean>>({});
  const [minutes, setMinutes] = useState(7 * 60 + 35);
  const [completed, setCompleted] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState(staff[0].id);
  const [focuses, setFocuses] = useState<Record<string, string>>(() => Object.fromEntries(staff.map(item => [item.id, item.focus])));
  const [logs, setLogs] = useState(initialLogs);
  const [reputation, setReputation] = useState(74);
  const [notice, setNotice] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [sound, setSound] = useState(true);
  const [tts, setTts] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

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

  const addLog = useCallback((text: string) => {
    setLogs(current => [{ time: formatTime(minutes), text }, ...current].slice(0, 7));
  }, [minutes]);
  const notify = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(current => current === text ? '' : current), 3000);
  }, []);

  useEffect(() => {
    if (phase !== 'game') return;
    const onKey = (event: KeyboardEvent) => {
      keysRef.current[event.key.toLowerCase()] = event.type === 'keydown';
      if (event.key.toLowerCase() === 'e' && event.type === 'keydown') {
        if (nearby) {
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
      const speed = keys.shift ? 6 : 3;
      const next = { ...playerRef.current };
      if (keys.w || keys.arrowup) next.y -= speed * delta;
      if (keys.s || keys.arrowdown) next.y += speed * delta;
      if (keys.a || keys.arrowleft) next.x -= speed * delta;
      if (keys.d || keys.arrowright) next.x += speed * delta;
      next.x = Math.max(-14, Math.min(14, next.x)); next.y = Math.max(-9, Math.min(14, next.y));
      if (next.x !== playerRef.current.x || next.y !== playerRef.current.y) {
        playerRef.current = next;
        setPlayer(next);
      }
      raf = requestAnimationFrame(move);
    };
    raf = requestAnimationFrame(move);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); };
  }, [phase, nearby, addLog, notify, tts, completed]);

  useEffect(() => {
    if (phase !== 'game') return;
    const clock = window.setInterval(() => setMinutes(value => value >= 17 * 60 + 30 ? value : value + 1), 1000);
    return () => window.clearInterval(clock);
  }, [phase]);

  const startGame = () => {
    setPhase('game');
    addLog('The steward has entered the grounds. A full day lies ahead.');
     speak(language === 'ja' ? 'おはようございます。館はあなたの指示を待っています。' : 'Good morning. The house awaits your direction.', tts, language);
  };
  const ringBell = () => {
    setMinutes(value => Math.min(value + 15, 17 * 60 + 30));
    setReputation(value => Math.min(100, value + 1));
    addLog('The west bell rings clearly across the grounds. Staff adjust their routes.');
    notify('The household bell has been rung · 15 minutes advanced');
     speak(language === 'ja' ? '館の鐘を鳴らしました。' : 'The household bell has been rung.', tts, language);
    if (sound) {
      const audio = new AudioContext();
      const osc = audio.createOscillator(); const gain = audio.createGain();
      osc.frequency.value = 392; gain.gain.value = .08; osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime + .35);
    }
  };
  const finishDay = () => {
    const entry = { date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), complete: completed.length, reputation };
    localStorage.setItem('pemberley-diary', JSON.stringify(entry));
    setDiaryOpen(true);
  };
  const resetDay = () => {
    setMinutes(7 * 60 + 35); setCompleted([]); setReputation(74); setLogs(initialLogs); setPlayer({ x: 0, y: 7 }); playerRef.current = { x: 0, y: 7 }; setDiaryOpen(false); notify('A new morning has been prepared.');
  };

  if (phase === 'title') return <div className="pemberley-app"><div className="grain" /><TitleScreen language={language} setLanguage={setLanguage} onStart={startGame} /></div>;

  return (
    <div className="pemberley-app game-shell">
      <div className="grain" />
      <header className="game-header">
        <div className="brand-mini"><div className="brand-mini-mark"><span>P</span></div><div><b>A Day at Pemberley</b><small>Household ledger · Derbyshire</small></div></div>
        <div className="header-stats">
           <div className="stat"><label>{t('season')}</label><b>Michaelmas · 1812</b></div>
           <div className="stat"><label>{t('weather')}</label><b><CloudRain size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />{language === 'ja' ? '霧雨' : 'Misty rain'}</b></div>
           <div className="stat"><label>{t('clock')}</label><b><Clock3 size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />{formatTime(minutes)}</b></div>
        </div>
        <div className="header-actions">
          <button className="icon-button" aria-label="Open staff panel" onClick={() => setRightOpen(value => !value)}><Users size={17} /></button>
          <button className="icon-button" aria-label="Toggle sound" onClick={() => setSound(value => !value)}>{sound ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
          <button className="icon-button" aria-label="Open settings" onClick={() => setSettingsOpen(true)}><Settings size={17} /></button>
        </div>
      </header>
      <div className="game-body">
        <aside className={`panel left-panel ${leftOpen ? 'open' : ''}`}>
           <div className="panel-title"><strong>{t('desk')}</strong><span>{t('day')}</span></div>
           <div className="day-card"><div className="eyebrow" style={{ color: '#adc2aa' }}>{language === 'ja' ? '木曜日 · 10月17日' : 'Thursday · 17 October'}</div><div className="day-number">{formatTime(minutes)}</div><p>{language === 'ja' ? '朝の仕事 · 湖に霧' : 'Morning duties · mist on the lake'}</p><div className="progress"><i style={{ width: `${Math.max(4, (minutes - 455) / 7.2)}%` }} /></div></div>
           <div className="section-label">{t('order')} · {completed.length}/{tasks.length}</div>
          {tasks.map(task => <label className={`task ${completed.includes(task.id) ? 'done' : ''}`} key={task.id}><input type="checkbox" checked={completed.includes(task.id)} onChange={() => { setCompleted(current => current.includes(task.id) ? current.filter(id => id !== task.id) : [...current, task.id]); addLog(`${task.title} was ${completed.includes(task.id) ? 'returned to the ledger' : 'marked complete'}.`); }} /><span><b>{task.title}</b>{task.meta}</span></label>)}
           <button className="bell-button" onClick={ringBell}><Bell size={15} /> {t('ring')}</button>
           <button className="outline-button" style={{ width: '100%', marginTop: 9, color: '#c8d5c8', borderColor: '#526b62' }} onClick={finishDay}><BookOpen size={14} style={{ verticalAlign: 'middle', marginRight: 7 }} /> {t('closeDay')}</button>
        </aside>
        <main className="view-wrap" onClick={() => setLeftOpen(false)}>
           <div className="view-hud"><div className="location-badge"><strong>{t('grounds')}</strong><span>{t('view')} · {languages.find(item => item.code === language)?.name}</span></div><div className="controls-badge">W A S D &nbsp; {t('move')} · Shift &nbsp; {t('run')}<br />Mouse wheel &nbsp; {t('adjust')} · E &nbsp; {t('interact')}</div></div>
          <EstateCanvas mode="game" player={player} onNotice={notify} />
          {nearby && <div className="interaction-prompt"><kbd>E</kbd>{nearby.text}</div>}
          <div className="minimap"><div className="minimap-inner"><div className="mini-lake" /><div className="mini-house" /><div className="mini-player" style={{ left: `${50 + player.x * 2.2}%`, top: `${42 + player.y * 2.2}%` }} />{staff.map((item, i) => <span key={item.id} style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: item.color, left: `${47 + item.home.x * 2.2}%`, top: `${43 + item.home.y * 2.2}%` }} />)}</div></div>
          <button className="icon-button" style={{ position: 'absolute', zIndex: 4, bottom: 18, left: 17, background: 'rgba(27,45,47,.8)' }} onClick={(event) => { event.stopPropagation(); setLeftOpen(value => !value); }} aria-label="Open task panel"><Menu size={17} /></button>
        </main>
        <aside className={`panel right-panel ${rightOpen ? 'open' : ''}`}>
           <div className="panel-title"><strong>{t('household')}</strong><span>5 {t('onDuty')}</span></div>
           <div className="reputation"><div className="rep-ring"><b>{reputation}</b></div><div><strong>{t('reputation')}</strong><small>{t('goodOrder')}</small></div></div>
           <div className="section-label">{t('staffRoutes')}</div>
           {staff.map(person => <div key={person.id} className={`staff-card ${selectedStaff === person.id ? 'selected' : ''}`} onClick={() => setSelectedStaff(person.id)}><div className="staff-row"><div className="avatar" style={{ background: person.color }}>{person.initials}</div><div><strong>{person.name}</strong><small>{person.role}</small></div><i className="status-dot" /></div>{selectedStaff === person.id && <div className="focus-row">{['housekeeping', 'guests', 'groundsFocus'].map(focus => <button key={focus} className={`focus-btn ${focuses[person.id] === focus ? 'active' : ''}`} onClick={(event) => { event.stopPropagation(); setFocuses(current => ({ ...current, [person.id]: focus })); notify(`${person.name} · ${t(focus)}`); }}>{t(focus)}</button>)}</div>}</div>)}
           <div className="section-label">{t('eventLog')}</div>
          <ul className="log">{logs.map((item, i) => <li key={`${item.time}-${i}`}><time>{item.time}</time>{item.text}</li>)}</ul>
          <div style={{ color: '#87a095', fontSize: 10, marginTop: 16, lineHeight: 1.6 }}><Wind size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Wind from the west · lake path is slick</div>
        </aside>
      </div>
      {notice && <div className="toast-note">{notice}</div>}
       {settingsOpen && <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}><section className="modal fade-up" onClick={event => event.stopPropagation()}><button className="icon-button" style={{ float: 'right', color: '#31554c' }} onClick={() => setSettingsOpen(false)} aria-label={t('close')}><X size={17} /></button><div className="eyebrow" style={{ color: '#a36b48' }}>{t('correspondence')}</div><h2>{t('settings')}</h2><p>{language === 'ja' ? '一日の音や表示を整えます。進行状況はこのブラウザに保存されます。' : 'Adjust the sensory details of your day. Your progress is kept in this browser.'}</p><div style={{ marginTop: 24, borderTop: '1px solid #cdbc9e' }}><label style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #cdbc9e', fontSize: 12 }}>{t('language')} <select value={language} onChange={event => setLanguage(event.target.value as Language)}>{languages.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label><label style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #cdbc9e', fontSize: 12 }}>{t('sound')} <input type="checkbox" checked={sound} onChange={event => setSound(event.target.checked)} /></label><label style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #cdbc9e', fontSize: 12 }}>{t('voice')} <input type="checkbox" checked={tts} onChange={event => setTts(event.target.checked)} /></label></div><div className="modal-actions"><button onClick={() => setSettingsOpen(false)}>{t('save')}</button></div></section></div>}
       {diaryOpen && <div className="modal-backdrop"><section className="modal fade-up"><div className="eyebrow" style={{ color: '#a36b48' }}>{t('diary')}</div><h2>{t('diaryTitle')}</h2><p>{t('diaryText')}</p><div className="diary-entry">“{completed.length === tasks.length ? (language === 'ja' ? '館は格別の優雅さをもって今日の務めを終えました。' : 'The house ran with uncommon grace today; every duty was seen to.') : (language === 'ja' ? `館はその務めを保ちました。夕刻までに${completed.length}件の主な仕事を確認しました。` : `The household held its course. ${completed.length} of ${tasks.length} principal duties were seen to before evening.`)}”<br /><span style={{ color: '#9c795e', fontSize: 10 }}>— Steward's private account</span></div><div style={{ display: 'flex', gap: 18, font: '11px var(--app-font-mono)', color: '#64746b' }}><span><Sparkles size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />{t('reputation')} {reputation}</span><span><BookOpen size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />{completed.length}/{tasks.length}</span></div><div className="modal-actions"><button onClick={resetDay}><RotateCcw size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />{t('another')}</button><button className="primary" onClick={() => setDiaryOpen(false)}>{t('return')}</button></div></section></div>}
    </div>
  );
}

export default App;