import { useEffect, useRef, useState } from "react";
import { NEWS, BUNDLED_MODS, FORGE_MC_VERSION, type NewsItem } from "../lib/core";
import { IconDownload, IconPlay, IconChevron, IconCheck, IconFont, IconSpinner, IconRefresh, IconSword } from "./ui";

const modIcon = (kind: string) =>
  kind === "mod" ? <IconSword size={16} /> : <IconFont size={16} />;

function NewsImage({ src, className }: { src?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`${className} grid place-items-center bg-blocks bg-pine-800`}>
        <IconSword size={38} className="text-pine-500" />
      </div>
    );
  }
  return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={`${className} object-cover`} />;
}

function FeaturedCard({ item, open, onToggle }: { item: NewsItem; open: boolean; onToggle: () => void }) {
  return (
    <article
      onClick={onToggle}
      className="kenburns group relative overflow-hidden border border-pine-600 bg-pine-850 cursor-pointer transition-transform duration-200 hover:border-emer-600/60"
    >
      <div className="relative h-56 overflow-hidden">
        <NewsImage src={item.image} className="w-full h-full transition-transform duration-700 group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-pine-950 via-pine-950/40 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2 py-0.5 text-[11px] font-bold tracking-widest bg-pine-950/80 border" style={{ color: item.tagColor, borderColor: item.tagColor + "66" }}>
            {item.tag}
          </span>
          <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider bg-pine-950/80 border border-pine-600 text-moss-300">{item.date}</span>
        </div>
      </div>
      <div className="relative px-5 pb-5 -mt-14">
        <h2 className="font-display text-2xl leading-snug text-mint-50 group-hover:text-emer-300 transition-colors">{item.title}</h2>
        <p className="mt-2 text-sm text-moss-300 leading-relaxed">{item.lead}</p>
        {open && (
          <div className="anim-fade-up mt-3 space-y-3 border-t border-pine-700 pt-3">
            {item.body.map((p, i) => (
              <p key={i} className="text-sm text-moss-300 leading-relaxed">{p}</p>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emer-400 tracking-wide">
          {open ? "СВЕРНУТЬ" : "ЧИТАТЬ ДАЛЬШЕ"}
          <IconChevron size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </div>
    </article>
  );
}

function NewsRow({ item, open, onToggle }: { item: NewsItem; open: boolean; onToggle: () => void }) {
  return (
    <article
      onClick={onToggle}
      className={`group flex gap-4 border bg-pine-850 cursor-pointer transition-all duration-200 hover:translate-x-1 ${
        open ? "border-emer-600/60" : "border-pine-600 hover:border-pine-500"
      }`}
    >
      <div className="w-32 shrink-0 overflow-hidden hidden sm:block">
        <NewsImage src={item.image} className="w-full h-full" />
      </div>
      <div className="py-3 pr-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold tracking-widest" style={{ color: item.tagColor }}>{item.tag}</span>
          <span className="text-[10px] tracking-wider text-moss-500">{item.date}</span>
        </div>
        <h3 className="font-display text-base mt-1 text-mint-100 group-hover:text-emer-300 transition-colors leading-snug">{item.title}</h3>
        <p className="text-xs text-moss-400 mt-1 leading-relaxed">{item.lead}</p>
        {open && (
          <div className="anim-fade-up mt-2.5 space-y-2.5 border-t border-pine-700 pt-2.5">
            {item.body.map((p, i) => (
              <p key={i} className="text-xs text-moss-300 leading-relaxed">{p}</p>
            ))}
          </div>
        )}
      </div>
      <div className="self-center pr-3 text-moss-500">
        <IconChevron size={16} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </div>
    </article>
  );
}

interface Props {
  installed: boolean;
  installing: boolean;
  progress: number;
  stage: string;
  logs: string[];
  versionLabel: string | null;
  onInstallClick: () => void;
  onPlay: () => void;
}

export default function NewsTab({ installed, installing, progress, stage, logs, versionLabel, onInstallClick, onPlay }: Props) {
  const [openId, setOpenId] = useState<string | null>("open");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));
  const [featured, ...rest] = NEWS;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-7 pt-6 pb-4 min-h-0">
        <header className="flex items-end justify-between mb-5">
          <div>
            <div className="text-[11px] font-bold tracking-[0.3em] text-emer-400">СВОДКИ СЕРВЕРА</div>
            <h1 className="font-display text-3xl text-mint-50 mt-1">Новости MineHeal</h1>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-moss-400 border border-pine-600 bg-pine-850 px-3 py-2">
            <span className="w-2 h-2 bg-emer-400 animate-pulse" />
            онлайн: 128 / 500
          </div>
        </header>

        <FeaturedCard item={featured} open={openId === featured.id} onToggle={() => toggle(featured.id)} />

        <div className="mt-4 space-y-3">
          {rest.map((n) => (
            <NewsRow key={n.id} item={n} open={openId === n.id} onToggle={() => toggle(n.id)} />
          ))}
        </div>

        <div className="h-4" />
      </div>

      {/* ── нижняя панель установки ── */}
      <div className="shrink-0 border-t border-pine-600 bg-pine-900/95 px-7 py-4">
        {installing ? (
          <div className="anim-fade-in">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-display tracking-wide text-emer-300 flex items-center gap-2">
                <IconSpinner size={14} /> {stage || "Установка…"}
              </span>
              <span className="font-mono text-moss-300">{Math.round(progress)}%</span>
            </div>
            <div className="h-4 border border-pine-600 bg-pine-950 overflow-hidden">
              <div
                className="h-full bg-emer-500 progress-stripes transition-[width] duration-300 ease-out"
                style={{ width: `${Math.max(2, progress)}%` }}
              />
            </div>
            <div
              ref={logRef}
              className="mt-3 h-24 overflow-y-auto bg-pine-950 border border-pine-700 px-3 py-2 font-mono text-[11px] leading-relaxed text-emer-300/90"
            >
              {logs.map((l, i) => (
                <div key={i} className="log-line">
                  <span className="text-moss-500">»</span> {l}
                </div>
              ))}
              <span className="caret-blink text-emer-400">▮</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 shrink-0 grid place-items-center bg-pine-800 border border-pine-600 text-emer-400">
                <IconSword size={24} />
              </div>
              <div className="min-w-0">
                <div className="font-display text-sm text-mint-100 tracking-wide">
                  Forge {FORGE_MC_VERSION} <span className="text-moss-500">·</span> <span className="text-emer-400">MineHeal Edition</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {BUNDLED_MODS.map((m) => (
                    <span
                      key={m.file}
                      title={m.desc}
                      className="inline-flex items-center gap-1.5 text-[11px] text-moss-300 border border-pine-600 bg-pine-850 px-2 py-0.5 cursor-help"
                    >
                      <span className="text-emer-400">{modIcon(m.kind)}</span>
                      {m.title}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {installed && (
                <button
                  onClick={onInstallClick}
                  title="Переустановить сборку"
                  className="p-2.5 border border-pine-600 text-moss-400 hover:text-gold-400 hover:border-gold-600 transition-colors"
                >
                  <IconRefresh size={17} />
                </button>
              )}
              {installed ? (
                <button
                  onClick={onPlay}
                  className="btn-block anim-play-glow relative overflow-hidden shine-once flex items-center gap-3 bg-emer-500 text-pine-950 px-10 py-3.5 text-lg"
                >
                  <IconPlay size={20} /> ИГРАТЬ
                </button>
              ) : (
                <button
                  onClick={onInstallClick}
                  className="btn-block relative overflow-hidden shine-once flex items-center gap-3 bg-gold-500 text-pine-950 px-9 py-3.5 text-lg"
                >
                  <IconDownload size={20} /> УСТАНОВИТЬ
                </button>
              )}
            </div>

            {installed && versionLabel && (
              <div className="w-full -mt-1 flex items-center gap-1.5 text-[11px] text-moss-500">
                <IconCheck size={12} className="text-emer-400" />
                установлено: <span className="font-mono text-moss-300">{versionLabel}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
