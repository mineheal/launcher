import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import NewsTab from "./components/NewsTab";
import SettingsTab from "./components/SettingsTab";
import AccountsTab from "./components/AccountsTab";
import SkinPreview from "./components/SkinPreview";
import {
  Modal, ToastHost, type Toast,
  IconNews, IconGear, IconUsers, IconPlay, IconDownload, IconSpinner, IconCopy, IconCheck,
} from "./components/ui";
import {
  api, isDesktop, loadSettings, loadAccounts, loadSelectedId, loadInstalledFlag,
  persistAll, persistInstalled, makeAccount, offlineUuid,
  FORGE_MC_VERSION, type Account, type Settings, type SystemInfo, type TabId,
} from "./lib/core";
import { generateNick } from "./lib/nicks";

const LOGO_URL = "https://image.qwenlm.ai/generated-images/ef4f4dc8-7659-4978-b0bb-a2ec2ce2a54b/_result.png";

const NAV: { id: TabId; label: string; icon: (p: { size?: number }) => ReactNode }[] = [
  { id: "news", label: "Новости", icon: (p) => <IconNews {...p} /> },
  { id: "settings", label: "Настройки", icon: (p) => <IconGear {...p} /> },
  { id: "accounts", label: "Аккаунты", icon: (p) => <IconUsers {...p} /> },
];

/* шаги демо-установки для браузера */
const SIM_STEPS: { pct: number; stage: string; log: string }[] = [
  { pct: 6, stage: "Подготовка", log: "Проверка соединения с GitHub…" },
  { pct: 16, stage: "Подготовка", log: "Папка %APPDATA%\\.mineheal создана" },
  { pct: 26, stage: "Forge 1.12.2", log: "Скачивание forge-1.12.2-14.23.5.2859-installer.jar…" },
  { pct: 42, stage: "Forge 1.12.2", log: "Установщик Forge запущен (--installClient)" },
  { pct: 55, stage: "Forge 1.12.2", log: "Версия 1.12.2-forge14.23.5.2859 создана" },
  { pct: 64, stage: "Моды", log: "voicechat-forge-1.12.2-2.6.22.jar → mods/" },
  { pct: 73, stage: "Моды", log: "zume-1.2.2.jar → mods/" },
  { pct: 82, stage: "Ресурс-пак", log: "Russian-Localization.zip → resourcepacks/" },
  { pct: 92, stage: "Серверы", log: "servers.dat: MineHeal + MineHeal Mirror записаны" },
  { pct: 100, stage: "Готово", log: "Сборка установлена. Можно играть!" },
];

function Spores() {
  const spores = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: `${(i * 61) % 100}%`,
        size: 2 + ((i * 7) % 3),
        dur: 14 + ((i * 5) % 14),
        delay: -((i * 3.7) % 18),
        dx: ((i % 5) - 2) * 30,
        o: 0.25 + ((i * 13) % 40) / 100,
        gold: i % 4 === 0,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {spores.map((s, i) => (
        <span
          key={i}
          className="spore"
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            background: s.gold ? "rgba(240,179,74,0.8)" : "rgba(56,212,127,0.7)",
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
            "--dx": `${s.dx}px`,
            "--o": s.o,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabId>("news");
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [accounts, setAccounts] = useState<Account[]>(loadAccounts);
  const [selectedId, setSelectedId] = useState<string | null>(loadSelectedId);
  const [installed, setInstalled] = useState<boolean>(loadInstalledFlag);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({ totalRamGb: 16, platform: "web", arch: "x64", cpus: 8 });
  const [argsUnlocked, setArgsUnlocked] = useState(false);
  const [showInstallConfirm, setShowInstallConfirm] = useState(false);
  const [showArgsConfirm, setShowArgsConfirm] = useState(false);
  const [versionLabel, setVersionLabel] = useState<string | null>(null);
  const [skins, setSkins] = useState<Record<string, string | null>>({});
  const toastId = useRef(1);
  const simTimer = useRef<number | null>(null);
  const hadSavedSettings = useRef(!!localStorage.getItem("mh.settings.v1"));

  const toast = useCallback((kind: Toast["kind"], text: string) => {
    const id = toastId.current++;
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  /* ── инициализация ── */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // системная информация + RAM по умолчанию = половина
      let info: SystemInfo = { totalRamGb: 16, platform: "web", arch: "x64", cpus: 8 };
      if (isDesktop && api) {
        try { info = await api.systemInfo(); } catch { /* default */ }
      } else {
        const dm = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
        if (dm) info.totalRamGb = Math.max(2, Math.round(dm));
        info.platform = navigator.platform?.toLowerCase().includes("win") ? "win32" : navigator.platform?.toLowerCase().includes("linux") ? "linux" : "darwin";
      }
      if (cancelled) return;
      setSystemInfo(info);
      setSettings((s) => {
        if (!hadSavedSettings.current) return { ...s, ramGb: Math.max(1, Math.floor(info.totalRamGb / 2)) };
        return { ...s, ramGb: Math.min(s.ramGb, info.totalRamGb) };
      });

      // статус установки
      if (isDesktop && api) {
        try {
          const ok = await api.checkInstall();
          if (!cancelled) setInstalled(ok);
          const label = await api.getVersionLabel();
          if (!cancelled) setVersionLabel(label);
        } catch { /* ignore */ }
      }
    })();

    // события установки от Electron
    if (isDesktop && api) {
      api.onInstallEvent((e) => {
        if (e.stage) setStage(e.stage);
        if (typeof e.pct === "number" && e.pct >= 0) setProgress(e.pct);
        if (e.log) setLogs((l) => [...l.slice(-200), e.log!]);
        if (e.error) {
          setInstalling(false);
          toast("err", e.error);
        }
        if (e.done) {
          setInstalling(false);
          setInstalled(true);
          persistInstalled(true);
          toast("ok", "Сборка установлена! Жмите ИГРАТЬ.");
          api!.getVersionLabel().then((l) => l && setVersionLabel(l));
        }
      });
    }

    return () => { cancelled = true; if (simTimer.current) window.clearInterval(simTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* авто-создание случайного аккаунта при первом запуске */
  useEffect(() => {
    if (accounts.length === 0) {
      const acc = makeAccount("offline", generateNick());
      setAccounts([acc]);
      setSelectedId(acc.id);
      toast("ok", `Создан аккаунт ${acc.username} — ник всегда можно сменить`);
    } else if (!selectedId || !accounts.some((a) => a.id === selectedId)) {
      setSelectedId(accounts[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* подтягивание скинов Ely.By через Electron (обходит CORS) */
  useEffect(() => {
    if (!isDesktop || !api) return;
    for (const a of accounts) {
      if (a.type === "elyby" && !(a.username in skins)) {
        api.fetchSkin(a.username).then((url) => setSkins((s) => ({ ...s, [a.username]: url })));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  /* ── сохранение ── */
  useEffect(() => {
    persistAll(settings, accounts, selectedId);
  }, [settings, accounts, selectedId]);

  const selected = accounts.find((a) => a.id === selectedId) ?? accounts[0] ?? null;

  /* ── установка ── */
  const startInstall = useCallback(() => {
    setShowInstallConfirm(false);
    setInstalling(true);
    setProgress(0);
    setLogs([]);
    setStage("Подготовка");

    if (isDesktop && api) {
      api.installGame().catch((e) => {
        setInstalling(false);
        toast("err", `Установка прервана: ${e?.message ?? e}`);
      });
      return;
    }
    // браузер: симуляция процесса
    let i = 0;
    simTimer.current = window.setInterval(() => {
      const step = SIM_STEPS[i++];
      if (!step) return;
      setProgress(step.pct);
      setStage(step.stage);
      setLogs((l) => [...l, step.log]);
      if (i >= SIM_STEPS.length) {
        if (simTimer.current) window.clearInterval(simTimer.current);
        window.setTimeout(() => {
          setInstalling(false);
          setInstalled(true);
          persistInstalled(true);
          setVersionLabel(`${FORGE_MC_VERSION}-forge14.23.5.2859 (MineHeal Edition)`);
          toast("ok", "Сборка установлена! Жмите ИГРАТЬ.");
        }, 600);
      }
    }, 750);
  }, [toast]);

  /* ── запуск игры ── */
  const [launching, setLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [launchLog, setLaunchLog] = useState("");

  useEffect(() => {
    if (isDesktop && api) {
      api.onLaunchEvent((e) => {
        if (typeof e.pct === "number") setLaunchProgress(e.pct);
        if (e.log) setLaunchLog(e.log);
        if (e.done) {
          setLaunching(false);
          toast("ok", "Игра запущена. Удачной охоты!");
        }
      });
    }
  }, []);

  const play = useCallback(async () => {
    if (!selected) {
      toast("warn", "Сначала создайте аккаунт на вкладке «Аккаунты»");
      setTab("accounts");
      return;
    }
    if (!isDesktop || !api) {
      toast("warn", "Это веб-демо: настоящий запуск игры — в desktop-версии лаунчера");
      return;
    }
    setLaunching(true);
    setLaunchProgress(0);
    setLaunchLog("Подготовка запуска…");
    try {
      const res = await api.launchGame(settings, selected);
      if (!res.ok) {
        setLaunching(false);
        toast("err", res.message ?? "Не удалось запустить игру");
      }
    } catch (e) {
      setLaunching(false);
      toast("err", `Ошибка запуска: ${(e as Error).message}`);
    }
  }, [selected, settings, toast]);

  /* ── аккаунты ── */
  const addOffline = useCallback((nick: string) => {
    const acc = makeAccount("offline", nick);
    setAccounts((a) => [...a, acc]);
    setSelectedId(acc.id);
    toast("ok", `Аккаунт ${nick} создан`);
  }, [toast]);

  const addRandom = useCallback(() => {
    const acc = makeAccount("offline", generateNick());
    setAccounts((a) => [...a, acc]);
    setSelectedId(acc.id);
    toast("ok", `Судьба выбрала: ${acc.username}`);
  }, [toast]);

  const addElyBy = useCallback(async (username: string, password: string | null): Promise<{ ok: boolean; error?: string }> => {
    if (password !== null) {
      if (!isDesktop || !api) {
        return { ok: false, error: "Вход по паролю доступен в desktop-версии. Здесь можно привязать аккаунт по нику." };
      }
      const res = await api.elybyAuth(username, password);
      if (!res.ok) return { ok: false, error: res.error ?? "Ely.By отклонил вход" };
      const acc = makeAccount("elyby", res.username ?? username, res.uuid, res.accessToken);
      setAccounts((a) => [...a.filter((x) => x.username.toLowerCase() !== acc.username.toLowerCase()), acc]);
      setSelectedId(acc.id);
      toast("ok", `Ely.By-аккаунт ${acc.username} привязан`);
      return { ok: true };
    }
    const acc = makeAccount("elyby", username);
    setAccounts((a) => [...a.filter((x) => x.username.toLowerCase() !== acc.username.toLowerCase()), acc]);
    setSelectedId(acc.id);
    toast("ok", `Аккаунт ${username} привязан по нику — скин подтянется`);
    return { ok: true };
  }, [toast]);

  const deleteAccount = useCallback((id: string) => {
    setAccounts((list) => {
      const next = list.filter((a) => a.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
    toast("warn", "Аккаунт удалён");
  }, [selectedId, toast]);

  const rerollAccount = useCallback((id: string) => {
    const nick = generateNick();
    setAccounts((list) => list.map((a) => (a.id === id ? { ...a, username: nick, uuid: offlineUuid(nick) } : a)));
    toast("ok", `Новый ник: ${nick}`);
  }, [toast]);

  const copy = useCallback((text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => toast("ok", `«${text}» скопировано`),
      () => toast("err", "Не удалось скопировать")
    );
  }, [toast]);

  const skinUrlFor = useCallback(
    (a: Account): string | null => {
      if (a.type !== "elyby") return null;
      if (isDesktop) return skins[a.username] ?? null;
      return `https://skinsystem.ely.by/skins/${encodeURIComponent(a.username)}.png`;
    },
    [skins]
  );

  const patchSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const mainButton = installing ? (
    <button disabled className="btn-block flex items-center justify-center gap-2.5 w-full bg-pine-600 text-moss-300 px-6 py-4 text-base">
      <IconSpinner size={18} /> УСТАНОВКА {Math.round(progress)}%
    </button>
  ) : launching ? (
    <button disabled className="btn-block flex items-center justify-center gap-2.5 w-full bg-pine-600 text-moss-300 px-6 py-4 text-base">
      <IconSpinner size={18} /> ЗАПУСК {Math.round(launchProgress)}%
    </button>
  ) : installed ? (
    <button onClick={play} className="btn-block anim-play-glow flex items-center justify-center gap-2.5 w-full bg-emer-500 text-pine-950 px-6 py-4 text-lg">
      <IconPlay size={20} /> ИГРАТЬ
    </button>
  ) : (
    <button onClick={() => setShowInstallConfirm(true)} className="btn-block flex items-center justify-center gap-2.5 w-full bg-gold-500 text-pine-950 px-6 py-4 text-lg">
      <IconDownload size={20} /> УСТАНОВИТЬ
    </button>
  );

  return (
    <div className="h-full w-full flex bg-pine-950 text-mint-100 overflow-hidden relative">
      {/* ── фоновые слои ── */}
      <div className="absolute inset-0 bg-blocks pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(900px 500px at 78% -10%, rgba(47,191,113,0.13), transparent 60%), radial-gradient(700px 500px at 8% 110%, rgba(240,179,74,0.07), transparent 55%)" }} />
      <div className="absolute inset-0 noise-layer pointer-events-none" />
      <Spores />
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 140px rgba(0,0,0,0.65)" }} />

      {/* ── боковая панель ── */}
      <aside className="relative z-10 w-[248px] shrink-0 border-r border-pine-700 bg-pine-900/90 flex flex-col">
        <div className="grass-strip" />
        <div className="px-5 pt-5 pb-4 flex items-center gap-3">
          <div className="w-12 h-12 shrink-0 border-2 border-pine-600 bg-pine-800 overflow-hidden shadow-[0_4px_0_0_#0a130e]">
            <img src={LOGO_URL} alt="MineHeal" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
          </div>
          <div>
            <div className="font-display text-xl leading-none tracking-wide text-mint-50">
              MINE<span className="text-emer-400">HEAL</span>
            </div>
            <div className="text-[10px] font-semibold tracking-[0.22em] text-moss-500 mt-1.5">LAUNCHER · 1.0</div>
          </div>
        </div>

        <div className="px-4">
          <div className="border border-pine-700 bg-pine-850 px-3 py-2 flex items-center justify-between text-[11px]">
            <span className="text-moss-400 font-semibold tracking-wider">СБОРКА</span>
            <span className="font-mono text-emer-300">Forge {FORGE_MC_VERSION}</span>
          </div>
        </div>

        {/* навигация — по центру панели */}
        <nav className="flex-1 flex flex-col justify-center px-4 gap-1.5">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`group relative flex items-center gap-3.5 px-4 py-3.5 text-left transition-all duration-150 border ${
                tab === n.id
                  ? "bg-pine-700/80 border-emer-600/50 text-mint-50"
                  : "border-transparent text-moss-400 hover:text-mint-100 hover:bg-pine-800 hover:translate-x-1"
              }`}
            >
              <span className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-200 ${tab === n.id ? "bg-emer-400" : "bg-transparent group-hover:bg-pine-500"}`} />
              <span className={tab === n.id ? "text-emer-400" : ""}>{n.icon({ size: 19 })}</span>
              <span className="font-display text-sm tracking-wider">{n.label.toUpperCase()}</span>
              {n.id === "accounts" && accounts.length > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-pine-600 border border-pine-500 text-moss-300 px-1.5 py-0.5">{accounts.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* низ: аккаунт + главная кнопка */}
        <div className="px-4 pb-5 space-y-3">
          {selected && (
            <button
              onClick={() => setTab("accounts")}
              className="w-full flex items-center gap-3 border border-pine-600 bg-pine-850 px-3 py-2.5 hover:border-emer-600/50 transition-colors text-left"
              title="Выбранный аккаунт"
            >
              <div className="bg-pine-900 border border-pine-700 p-0.5 shrink-0">
                <SkinPreview skinDataUrl={skinUrlFor(selected)} nick={selected.username} scale={2} />
              </div>
              <div className="min-w-0">
                <div className="font-display text-xs text-mint-100 truncate">{selected.username}</div>
                <div className="text-[9px] font-bold tracking-widest text-moss-500">{selected.type === "elyby" ? "ELY.BY" : "ОФФЛАЙН"} · СМЕНИТЬ</div>
              </div>
            </button>
          )}
          {mainButton}
          <button
            onClick={() => copy("mc.minecraftmineheal.ru")}
            className="w-full flex items-center justify-between border border-pine-700 bg-pine-900 px-3 py-2 text-[10px] font-mono text-moss-400 hover:text-emer-300 hover:border-emer-600/40 transition-colors group"
            title="Скопировать IP сервера"
          >
            <span className="truncate">mc.minecraftmineheal.ru</span>
            <IconCopy size={12} className="opacity-50 group-hover:opacity-100" />
          </button>
        </div>
      </aside>

      {/* ── контент ── */}
      <main className="relative z-10 flex-1 min-w-0">
        <div key={tab} className="h-full anim-fade-up">
          {tab === "news" && (
            <NewsTab
              installed={installed}
              installing={installing}
              progress={progress}
              stage={stage}
              logs={logs}
              versionLabel={versionLabel}
              onInstallClick={() => setShowInstallConfirm(true)}
              onPlay={play}
            />
          )}
          {tab === "settings" && (
            <SettingsTab
              settings={settings}
              systemInfo={systemInfo}
              argsUnlocked={argsUnlocked}
              onRequestArgsUnlock={() => setShowArgsConfirm(true)}
              onChange={patchSettings}
              onOpenFolder={() => api?.openGameFolder()}
              onResetInstall={() => setShowInstallConfirm(true)}
              installed={installed}
            />
          )}
          {tab === "accounts" && (
            <AccountsTab
              accounts={accounts}
              selectedId={selectedId}
              skinUrl={skinUrlFor}
              onSelect={setSelectedId}
              onAddOffline={addOffline}
              onAddElyBy={addElyBy}
              onAddRandom={addRandom}
              onDelete={deleteAccount}
              onReroll={rerollAccount}
              onCopy={copy}
            />
          )}
        </div>
      </main>

      {/* ── модалка установки ── */}
      <Modal open={showInstallConfirm} title="ВНИМАНИЕ!" warning onClose={() => setShowInstallConfirm(false)}>
        <p className="text-sm text-moss-300 leading-relaxed">
          Вместе с игрой сейчас установятся требуемые модификации и пакеты для приятной игры!
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-moss-400">
          <li className="flex items-center gap-2"><IconCheck size={13} className="text-emer-400" /> Forge {FORGE_MC_VERSION} (рекомендованная версия)</li>
          <li className="flex items-center gap-2"><IconCheck size={13} className="text-emer-400" /> Simple Voice Chat + Zume (моды)</li>
          <li className="flex items-center gap-2"><IconCheck size={13} className="text-emer-400" /> Русский шрифт (ресурс-пак)</li>
          <li className="flex items-center gap-2"><IconCheck size={13} className="text-emer-400" /> Серверы MineHeal и MineHeal Mirror</li>
        </ul>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setShowInstallConfirm(false)} className="btn-block bg-pine-700 text-moss-300 px-6 py-2.5 text-xs">ОТМЕНА</button>
          <button onClick={startInstall} className="btn-block bg-emer-500 text-pine-950 px-6 py-2.5 text-xs inline-flex items-center gap-2">
            <IconDownload size={14} /> УСТАНОВИТЬ
          </button>
        </div>
      </Modal>

      {/* ── модалка Java-аргументов ── */}
      <Modal open={showArgsConfirm} title="ВНИМАНИЕ!" warning onClose={() => setShowArgsConfirm(false)}>
        <p className="text-sm text-moss-300 leading-relaxed">
          Данный аргумент очень важный, не стоит его менять, если вы не разбираетесь в этом!
        </p>
        <p className="text-xs text-moss-500 mt-2">Неверные флаги JVM могут уронить игру или съесть всю память компьютера.</p>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setShowArgsConfirm(false)} className="btn-block bg-pine-700 text-moss-300 px-6 py-2.5 text-xs">ОСТАВИТЬ КАК ЕСТЬ</button>
          <button
            onClick={() => { setArgsUnlocked(true); setShowArgsConfirm(false); toast("warn", "Аргументы разблокированы — вы предупреждены"); }}
            className="btn-block bg-ember-500 text-mint-50 px-6 py-2.5 text-xs"
          >
            ИЗМЕНИТЬ
          </button>
        </div>
      </Modal>

      <ToastHost toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
