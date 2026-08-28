import { hashSeed } from "./nicks";

/* ── типы ─────────────────────────────────────────────── */

export type TabId = "news" | "settings" | "accounts";

export type AccountType = "offline" | "elyby";

export interface Account {
  id: string;
  type: AccountType;
  username: string;
  uuid: string;
  accessToken: string;
  createdAt: number;
}

export interface Settings {
  ramGb: number;
  javaArgs: string;
  windowTitle: string;
  windowMode: "fullscreen" | "custom";
  windowWidth: number;
  windowHeight: number;
}

export interface SystemInfo {
  totalRamGb: number;
  platform: string;
  arch: string;
  cpus: number;
}

export interface InstallEvent {
  stage: string;
  pct: number;
  log?: string;
  done?: boolean;
  error?: string;
}

export interface LauncherAPI {
  systemInfo(): Promise<SystemInfo>;
  checkInstall(): Promise<boolean>;
  installGame(): Promise<void>;
  onInstallEvent(cb: (e: InstallEvent) => void): void;
  launchGame(s: Settings, a: Account): Promise<{ ok: boolean; message?: string }>;
  elybyAuth(username: string, password: string): Promise<{ ok: boolean; username?: string; uuid?: string; accessToken?: string; error?: string }>;
  fetchSkin(username: string): Promise<string | null>;
  saveState(data: { settings: Settings; accounts: Account[]; selectedId: string | null }): void;
  openGameFolder(): void;
  getVersionLabel(): Promise<string | null>;
}

declare global {
  interface Window { electronAPI?: LauncherAPI }
}

export const isDesktop = typeof window !== "undefined" && !!window.electronAPI;
export const api: LauncherAPI | null = typeof window !== "undefined" ? (window.electronAPI ?? null) : null;

/* ── константы сборки ─────────────────────────────────── */

export const FORGE_MC_VERSION = "1.12.2";
export const FORGE_VERSION = "14.23.5.2859";
export const GAME_FOLDER_NAME = ".mineheal";

export const SERVERS = [
  { name: "MineHeal", ip: "mc.minecraftmineheal.ru" },
  { name: "MineHeal Mirror", ip: "mineheal.aternos.me" },
];

export const BUNDLED_MODS = [
  {
    file: "voicechat-forge-1.12.2-2.6.22.jar",
    url: "https://github.com/mineheal/mineheal-mods/releases/download/ver1/voicechat-forge-1.12.2-2.6.22.jar",
    title: "Simple Voice Chat",
    desc: "Голосовой чат прямо в игре — говори с командой без Discord",
    kind: "mod" as const,
  },
  {
    file: "zume-1.2.2.jar",
    url: "https://github.com/mineheal/mineheal-mods/releases/download/ver1/zume-1.2.2.jar",
    title: "Zume",
    desc: "Плавный зум (приближение) на клавишу — следи за горизонтом",
    kind: "mod" as const,
  },
  {
    file: "Russian-Localization.zip",
    url: "https://github.com/mineheal/mineheal-mods/releases/download/ver1/Russian-Localization.zip",
    title: "Русский шрифт",
    desc: "Ресурс-пак: понятный русский шрифт вместо «кракозябр»",
    kind: "pack" as const,
  },
];

export const DEFAULT_JAVA_ARGS =
  "-XX:+UseG1GC -Dsun.rmi.dgc.server.gcInterval=2147483646 -XX:+UnlockExperimentalVMOptions -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M";

export const DEFAULT_SETTINGS: Settings = {
  ramGb: 4,
  javaArgs: DEFAULT_JAVA_ARGS,
  windowTitle: "MineHeal — Minecraft 1.12.2",
  windowMode: "custom",
  windowWidth: 1280,
  windowHeight: 720,
};

/* ── новости ──────────────────────────────────────────── */

export interface NewsItem {
  id: string;
  date: string;
  tag: string;
  tagColor: string;
  title: string;
  lead: string;
  body: string[];
  image?: string;
}

export const NEWS: NewsItem[] = [
  {
    id: "open",
    date: "Скоро",
    tag: "ОТКРЫТИЕ",
    tagColor: "#f0b34a",
    title: "MineHeal открывает свои врата",
    lead: "Ванильное выживание с душой: приваты, кланы, ивенты каждую субботу и живое комьюнити.",
    body: [
      "Мы строили этот сервер, чтобы на нём было приятно жить: без вайпов каждые два месяца, без pay-to-win и без токсичности. Основной адрес — mc.minecraftmineheal.ru, зеркало для тех, у кого капризный провайдер — mineheal.aternos.me.",
      "На старте вас ждут стартовый набор, клеймо новичка-целителя и квест на первое жильё. Ивент открытия — «Осада Крепости» — пройдёт в первые выходные после запуска.",
    ],
    image: "https://image.qwenlm.ai/generated-images/58892e63-34ef-4343-981c-b563616bd966/_result.png",
  },
  {
    id: "voice",
    date: "Обновление",
    tag: "ВОЙС-ЧАТ",
    tagColor: "#38d47f",
    title: "Голосовой чат теперь встроен в клиент",
    lead: "Simple Voice Chat для 1.12.2 — нажми кнопку и говори. Дистанция, шёпот и групповые каналы.",
    body: [
      "Мод уже включён в сборку лаунчера: ничего ставить вручную не нужно. Голос слышен на дистанции до 48 блоков, зажми клавишу — и скажись на всю округу.",
      "Работает и на зеркале. Наушники рекомендуются: позиционирование звука честное — крипер сзади звучит как крипер сзади.",
    ],
    image: "https://image.qwenlm.ai/generated-images/8aa88097-b46b-4955-949e-02bc1e5cc51b/_result.png",
  },
  {
    id: "zoom",
    date: "Обновление",
    tag: "КОМФОРТ",
    tagColor: "#6ee7a7",
    title: "Зум и читаемый русский шрифт",
    lead: "Zume приближает картинку одной клавишей, а ресурс-пак чинит русский шрифт в интерфейсе.",
    body: [
      "Zume — плавный зум с настраиваемой кратностью: высматривайте базу друга с другого берега реки (шутка, приваты у нас надёжные).",
      "Пак русской локализации подменяет пиксельный шрифт на разборчивый — чаты, книги и таблички теперь читаются без лупы.",
    ],
    image: "https://image.qwenlm.ai/generated-images/ab328599-530b-45a2-9ea7-2111e7b657e8/_result.png",
  },
  {
    id: "launcher",
    date: "Лаунчер",
    tag: "ГАЙД",
    tagColor: "#f0705c",
    title: "Как начать играть за 3 минуты",
    lead: "Установка → аккаунт → Играть. Всё ставится в %APPDATA%\\.mineheal и не трогает ваш обычный Minecraft.",
    body: [
      "1. Нажмите «Установить» — лаунчер сам скачает Forge 1.12.2, моды и ресурс-пак. 2. Создайте аккаунт на вкладке «Аккаунты» (подойдёт оффлайн-ник или ElyBy). 3. Жмите «Играть» — серверы MineHeal уже будут в списке.",
      "Сборка живёт в отдельной папке .mineheal: ваш ванильный клиент и другие лаунчеры останутся нетронутыми. Если удалить папку — лаунчер снова предложит «Установить».",
    ],
  },
];

/* ── хранилище ────────────────────────────────────────── */

const LS = {
  settings: "mh.settings.v1",
  accounts: "mh.accounts.v1",
  selected: "mh.selected.v1",
  installed: "mh.installed.v1",
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(LS.settings);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

export function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(LS.accounts);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function loadSelectedId(): string | null {
  return localStorage.getItem(LS.selected);
}

export function loadInstalledFlag(): boolean {
  return localStorage.getItem(LS.installed) === "1";
}

export function persistAll(settings: Settings, accounts: Account[], selectedId: string | null) {
  localStorage.setItem(LS.settings, JSON.stringify(settings));
  localStorage.setItem(LS.accounts, JSON.stringify(accounts));
  if (selectedId) localStorage.setItem(LS.selected, selectedId);
  api?.saveState({ settings, accounts, selectedId });
}

export function persistInstalled(flag: boolean) {
  localStorage.setItem(LS.installed, flag ? "1" : "0");
}

/* ── оффлайн-UUID (как делает vanilla-сервер) ─────────── */

export function offlineUuid(nick: string): string {
  const src = "OfflinePlayer:" + nick;
  const bytes = new Uint8Array(16);
  let h = hashSeed(src);
  for (let i = 0; i < 16; i++) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    bytes[i] = h & 0xff;
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x30; // version 3
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function makeAccount(type: AccountType, username: string, uuid?: string, accessToken?: string): Account {
  return {
    id: `${type}-${username}-${Date.now().toString(36)}`,
    type,
    username,
    uuid: uuid ?? offlineUuid(username),
    accessToken: accessToken ?? "0",
    createdAt: Date.now(),
  };
}

/* ── процедурный скин (для оффлайн-аккаунтов) ─────────── */

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SKIN_TONES = ["#e8b896", "#d29b6e", "#b97f52", "#8d5a3b", "#f0c8a0", "#c68a5f"];
const HAIR_COLORS = ["#2e2016", "#5a3a1e", "#1c1c22", "#8a5a24", "#a83232", "#d8d8d8", "#3a6e3a", "#2a4a7a"];
const SHIRT_COLORS = ["#2fbf71", "#3a7ad1", "#c23a26", "#7a4ac2", "#c2862a", "#3aa8a0", "#5b6270", "#2a8a4a"];

/** Рисует полный скин 64×64 на canvas и возвращает его. Детерминирован от ника. */
export function generateProceduralSkin(nick: string): HTMLCanvasElement {
  const rnd = mulberry(hashSeed(nick));
  const c = document.createElement("canvas");
  c.width = 64; c.height = 64;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;

  const tone = SKIN_TONES[Math.floor(rnd() * SKIN_TONES.length)];
  const hair = HAIR_COLORS[Math.floor(rnd() * HAIR_COLORS.length)];
  const shirt = SHIRT_COLORS[Math.floor(rnd() * SHIRT_COLORS.length)];
  const pants = HAIR_COLORS[Math.floor(rnd() * HAIR_COLORS.length)];
  const eye = rnd() < 0.5 ? "#3a6ed8" : "#3aa85a";

  const px = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col; g.fillRect(x, y, w, h);
  };
  const shade = (col: string, f: number) => {
    const n = parseInt(col.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 255) * f), gg = Math.min(255, ((n >> 8) & 255) * f), b = Math.min(255, (n & 255) * f);
    return `rgb(${r | 0},${gg | 0},${b | 0})`;
  };

  // голова (8,8)
  px(8, 8, 8, 8, tone);
  px(8, 8, 8, 2, hair);                       // чёлка
  px(8, 8, 1, 4, hair); px(15, 8, 1, 4, hair); // виски
  px(10, 12, 1, 1, "#fff"); px(11, 12, 1, 1, eye);   // левый глаз
  px(12, 12, 1, 1, "#fff"); px(13, 12, 1, 1, eye);   // правый глаз
  px(11, 14, 2, 1, shade(tone, 0.82));               // нос
  // стороны головы
  px(0, 8, 8, 8, shade(tone, 0.9));  px(16, 8, 8, 8, shade(tone, 0.9));
  px(8, 0, 8, 8, hair);              px(8, 16, 8, 8, shade(tone, 0.95));
  // слой шапки (40,8) — волосы
  px(40, 8, 8, 8, hair); px(32, 8, 8, 8, hair); px(48, 8, 8, 8, hair); px(40, 0, 8, 8, hair); px(40, 16, 8, 3, hair);

  // торс (20,20)
  px(20, 20, 8, 12, shirt);
  px(20, 20, 8, 1, shade(shirt, 0.8));
  px(16, 20, 4, 12, shade(shirt, 0.85)); px(28, 20, 4, 12, shade(shirt, 0.85)); // бока
  // руки (44,20)
  px(44, 20, 4, 12, shirt); px(44, 28, 4, 4, tone);
  px(40, 20, 4, 12, shade(shirt, 0.85)); px(40, 28, 4, 4, shade(tone, 0.85));
  px(48, 20, 4, 12, shade(shirt, 0.85)); px(48, 28, 4, 4, shade(tone, 0.85));
  px(52, 20, 4, 12, shade(shirt, 0.85)); px(52, 28, 4, 4, shade(tone, 0.85));
  px(44, 16, 4, 4, tone); px(48, 16, 4, 4, shade(tone, 0.85)); px(40, 16, 4, 4, shade(tone, 0.85)); px(52, 16, 4, 4, shade(tone, 0.85));
  // ноги (4,20)
  px(4, 20, 4, 12, pants); px(4, 29, 4, 3, "#3d3d45");
  px(0, 20, 4, 12, shade(pants, 0.85)); px(8, 20, 4, 12, shade(pants, 0.85)); px(12, 20, 4, 12, shade(pants, 0.85));
  px(0, 29, 4, 3, "#33333a"); px(8, 29, 4, 3, "#33333a"); px(12, 29, 4, 3, "#33333a");
  px(4, 16, 4, 4, shade(pants, 0.9)); px(0, 16, 4, 4, shade(pants, 0.8)); px(8, 16, 4, 4, shade(pants, 0.8)); px(12, 16, 4, 4, shade(pants, 0.8));

  return c;
}
