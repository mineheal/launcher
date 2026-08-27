import type { CSSProperties, ReactNode } from "react";
import { GAME_FOLDER_NAME, DEFAULT_JAVA_ARGS, type Settings, type SystemInfo } from "../lib/core";
import { isDesktop } from "../lib/core";
import { IconRam, IconTerminal, IconMonitor, IconFolder, IconLock, IconRefresh, IconCheck } from "./ui";
import { Segmented } from "./ui";

function Section({ icon, title, hint, children }: { icon: ReactNode; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="panel">
      <header className="flex items-center gap-3 px-5 py-3.5 border-b border-pine-700">
        <span className="text-emer-400">{icon}</span>
        <div>
          <h3 className="font-display text-sm tracking-wide text-mint-100">{title}</h3>
          {hint && <p className="text-[11px] text-moss-500 mt-0.5">{hint}</p>}
        </div>
      </header>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </section>
  );
}

interface Props {
  settings: Settings;
  systemInfo: SystemInfo;
  argsUnlocked: boolean;
  onRequestArgsUnlock: () => void;
  onChange: (patch: Partial<Settings>) => void;
  onOpenFolder: () => void;
  onResetInstall: () => void;
  installed: boolean;
}

export default function SettingsTab({ settings, systemInfo, argsUnlocked, onRequestArgsUnlock, onChange, onOpenFolder, onResetInstall, installed }: Props) {
  const maxRam = Math.max(2, systemInfo.totalRamGb);
  const fill = ((settings.ramGb - 1) / (maxRam - 1)) * 100;
  const homeish = systemInfo.platform === "win32" ? "%APPDATA%" : "~/.config";

  return (
    <div className="h-full overflow-y-auto px-7 pt-6 pb-8">
      <header className="mb-5">
        <div className="text-[11px] font-bold tracking-[0.3em] text-emer-400">ПОД КАПОТОМ</div>
        <h1 className="font-display text-3xl text-mint-50 mt-1">Настройки</h1>
        <p className="text-sm text-moss-400 mt-1">
          Система: <span className="font-mono text-moss-300">{systemInfo.totalRamGb} ГБ RAM · {systemInfo.cpus} потоков · {systemInfo.platform}/{systemInfo.arch}</span>
        </p>
      </header>

      <div className="space-y-4 max-w-3xl">
        <Section icon={<IconRam size={18} />} title="Оперативная память" hint={`Определено ${systemInfo.totalRamGb} ГБ — по умолчанию выставлена ровно половина`}>
          <div className="flex items-center gap-5">
            <input
              type="range"
              min={1}
              max={maxRam}
              step={1}
              value={Math.min(settings.ramGb, maxRam)}
              onChange={(e) => onChange({ ramGb: Number(e.target.value) })}
              className="ram-range flex-1"
              style={{ "--fill": `${fill}%` } as CSSProperties}
            />
            <div className="w-28 shrink-0 border border-pine-600 bg-pine-950 px-3 py-2 text-center">
              <span className="font-display text-xl text-gold-400">{settings.ramGb}</span>
              <span className="text-xs text-moss-400 ml-1">ГБ</span>
              <div className="text-[10px] text-moss-500 font-mono">из {systemInfo.totalRamGb} ГБ</div>
            </div>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-moss-500 -mt-1">
            <span>1 ГБ</span>
            <span>{Math.round(maxRam / 2)} ГБ</span>
            <span>{maxRam} ГБ</span>
          </div>
          {settings.ramGb > systemInfo.totalRamGb - 2 && (
            <p className="text-[11px] text-gold-400/90 border border-gold-600/40 bg-gold-500/5 px-3 py-2">
              Оставьте системе хотя бы 2 ГБ, иначе Windows начнёт задыхаться вместе с игрой.
            </p>
          )}
        </Section>

        <Section icon={<IconTerminal size={18} />} title="Java-аргументы запуска" hint="Дополнительные флаги JVM, подставляются перед аргументами игры">
          <div className="relative">
            <input
              className="field font-mono text-xs pr-10"
              value={settings.javaArgs}
              readOnly={!argsUnlocked}
              onChange={(e) => onChange({ javaArgs: e.target.value })}
              onClick={() => { if (!argsUnlocked) onRequestArgsUnlock(); }}
              placeholder="-XX:+UseG1GC …"
              spellCheck={false}
            />
            {!argsUnlocked ? (
              <button
                onClick={onRequestArgsUnlock}
                title="Поле защищено"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-moss-500 hover:text-gold-400 transition-colors"
              >
                <IconLock size={16} />
              </button>
            ) : (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emer-400"><IconCheck size={15} /></span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className={argsUnlocked ? "text-emer-400" : "text-moss-500"}>
              {argsUnlocked ? "Редактирование разрешено — правьте на свой страх и риск." : "Поле заблокировано от случайных правок."}
            </span>
            {settings.javaArgs !== DEFAULT_JAVA_ARGS && (
              <button
                onClick={() => onChange({ javaArgs: DEFAULT_JAVA_ARGS })}
                className="ml-auto inline-flex items-center gap-1.5 text-moss-400 hover:text-gold-400 transition-colors border border-pine-600 px-2 py-1 hover:border-gold-600"
              >
                <IconRefresh size={12} /> Вернуть стандартные
              </button>
            )}
          </div>
        </Section>

        <Section icon={<IconMonitor size={18} />} title="Окно игры" hint="Название окна и режим отображения Minecraft">
          <div>
            <label className="block text-[11px] font-semibold tracking-wider text-moss-400 mb-1.5">НАЗВАНИЕ ОКНА MINECRAFT</label>
            <input
              className="field"
              value={settings.windowTitle}
              maxLength={64}
              onChange={(e) => onChange({ windowTitle: e.target.value })}
              placeholder="MineHeal — Minecraft 1.12.2"
            />
            <p className="text-[11px] text-moss-500 mt-1.5">
              Отображается в заголовке окна игры <span className="text-moss-400 border border-pine-600 px-1.5 py-0.5 font-mono text-[10px]">{settings.windowTitle || "—"}</span>
            </p>
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wider text-moss-400 mb-1.5">РЕЖИМ ОКНА</label>
            <Segmented
              value={settings.windowMode}
              onChange={(v) => onChange({ windowMode: v })}
              options={[
                { value: "fullscreen", label: "Полный экран" },
                { value: "custom", label: "Своё разрешение" },
              ]}
            />
            {settings.windowMode === "custom" && (
              <div className="anim-fade-up mt-3 flex items-center gap-2">
                <input
                  type="number" min={640} max={7680} className="field w-28 text-center font-mono"
                  value={settings.windowWidth}
                  onChange={(e) => onChange({ windowWidth: Math.max(640, Number(e.target.value) || 1280) })}
                />
                <span className="text-moss-500 font-display">×</span>
                <input
                  type="number" min={480} max={4320} className="field w-28 text-center font-mono"
                  value={settings.windowHeight}
                  onChange={(e) => onChange({ windowHeight: Math.max(480, Number(e.target.value) || 720) })}
                />
                <span className="text-[11px] text-moss-500 ml-2">пикселей</span>
              </div>
            )}
          </div>
        </Section>

        <Section icon={<IconFolder size={18} />} title="Файлы сборки" hint="Игра живёт отдельно от вашего обычного Minecraft">
          <div className="flex items-center gap-3 flex-wrap">
            <code className="flex-1 min-w-[220px] font-mono text-xs text-moss-300 bg-pine-950 border border-pine-700 px-3 py-2.5">
              {homeish}/{GAME_FOLDER_NAME}
            </code>
            {isDesktop && (
              <button
                onClick={onOpenFolder}
                className="btn-block bg-pine-700 text-mint-100 px-4 py-2.5 text-xs inline-flex items-center gap-2"
              >
                <IconFolder size={14} /> ОТКРЫТЬ ПАПКУ
              </button>
            )}
            {installed && (
              <button
                onClick={onResetInstall}
                className="btn-block bg-pine-700 text-ember-400 px-4 py-2.5 text-xs inline-flex items-center gap-2"
              >
                <IconRefresh size={14} /> ПЕРЕУСТАНОВИТЬ
              </button>
            )}
          </div>
          {!isDesktop && (
            <p className="text-[11px] text-moss-500">Вы в веб-демо: реальная установка и запуск работают в desktop-версии лаунчера.</p>
          )}
        </Section>
      </div>
    </div>
  );
}
