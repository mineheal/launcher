import { useState } from "react";
import { generateNick, isValidNick } from "../lib/nicks";
import type { Account } from "../lib/core";
import SkinPreview from "./SkinPreview";
import { Modal, IconPlus, IconTrash, IconDice, IconCopy, IconLink, IconUsers, IconSpinner, IconHeart } from "./ui";

function TypeBadge({ type }: { type: Account["type"] }) {
  return (
    <span
      className={`text-[9px] font-bold tracking-widest px-1.5 py-0.5 border ${
        type === "elyby" ? "text-emer-300 border-emer-600/60 bg-emer-500/10" : "text-moss-300 border-pine-500 bg-pine-700/60"
      }`}
    >
      {type === "elyby" ? "ELY.BY" : "ОФФЛАЙН"}
    </span>
  );
}

interface Props {
  accounts: Account[];
  selectedId: string | null;
  skinUrl: (a: Account) => string | null;
  onSelect: (id: string) => void;
  onAddOffline: (nick: string) => void;
  onAddElyBy: (username: string, password: string | null) => Promise<{ ok: boolean; error?: string }>;
  onAddRandom: () => void;
  onDelete: (id: string) => void;
  onReroll: (id: string) => void;
  onCopy: (text: string) => void;
}

export default function AccountsTab({ accounts, selectedId, skinUrl, onSelect, onAddOffline, onAddElyBy, onAddRandom, onDelete, onReroll, onCopy }: Props) {
  const [showOffline, setShowOffline] = useState(false);
  const [showElyby, setShowElyby] = useState(false);
  const [nick, setNick] = useState(generateNick());
  const [elyUser, setElyUser] = useState("");
  const [elyPass, setElyPass] = useState("");
  const [elyBusy, setElyBusy] = useState(false);
  const [elyError, setElyError] = useState<string | null>(null);

  const selected = accounts.find((a) => a.id === selectedId) ?? accounts[0] ?? null;
  const nickValid = isValidNick(nick);

  const submitOffline = () => {
    if (!nickValid) return;
    onAddOffline(nick.trim());
    setShowOffline(false);
    setNick(generateNick());
  };

  const submitElyby = async (passwordMode: boolean) => {
    if (!elyUser.trim() || !isValidNick(elyUser.trim())) {
      setElyError("Введите корректный ник Ely.By (3–16 символов, латиница)");
      return;
    }
    setElyBusy(true);
    setElyError(null);
    const res = await onAddElyBy(elyUser.trim(), passwordMode ? elyPass : null);
    setElyBusy(false);
    if (res.ok) {
      setShowElyby(false);
      setElyUser(""); setElyPass(""); setElyError(null);
    } else {
      setElyError(res.error ?? "Не удалось войти");
    }
  };

  return (
    <div className="h-full overflow-y-auto px-7 pt-6 pb-8">
      <header className="mb-5 flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] font-bold tracking-[0.3em] text-emer-400">КТО В ДОМЕ ХОЗЯИН</div>
          <h1 className="font-display text-3xl text-mint-50 mt-1">Аккаунты</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setNick(generateNick()); setShowOffline(true); }} className="btn-block bg-pine-700 text-mint-100 px-4 py-2.5 text-xs inline-flex items-center gap-2">
            <IconPlus size={14} /> ОФФЛАЙН
          </button>
          <button onClick={() => { setElyError(null); setShowElyby(true); }} className="btn-block bg-emer-600 text-mint-50 px-4 py-2.5 text-xs inline-flex items-center gap-2">
            <IconLink size={14} /> ELY.BY
          </button>
        </div>
      </header>

      {accounts.length === 0 ? (
        <div className="panel max-w-xl py-14 text-center">
          <IconUsers size={40} className="text-pine-500 mx-auto" />
          <h2 className="font-display text-xl text-mint-100 mt-4">Пока никого нет</h2>
          <p className="text-sm text-moss-400 mt-2 max-w-sm mx-auto">
            Создайте оффлайн-аккаунт или привяжите Ely.By — а можете довериться судьбе и получить героя со случайным ником.
          </p>
          <button onClick={onAddRandom} className="btn-block mt-6 bg-gold-500 text-pine-950 px-8 py-3 text-sm inline-flex items-center gap-2.5">
            <IconDice size={18} /> СОЗДАТЬ СЛУЧАЙНОГО ГЕРОЯ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 max-w-4xl">
          {/* список */}
          <div className="space-y-2.5">
            {accounts.map((a) => (
              <div
                key={a.id}
                onClick={() => onSelect(a.id)}
                className={`group flex items-center gap-4 border cursor-pointer transition-all duration-150 px-3.5 py-3 ${
                  a.id === selectedId
                    ? "border-emer-500 bg-emer-500/8 translate-x-1 shadow-[0_0_24px_-10px_rgba(56,212,127,0.6)]"
                    : "border-pine-600 bg-pine-850 hover:border-pine-500 hover:translate-x-1"
                }`}
              >
                <div className="shrink-0 bg-pine-900 border border-pine-700 p-1">
                  <SkinPreview skinDataUrl={skinUrl(a)} nick={a.username} scale={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-base text-mint-100 truncate">{a.username}</span>
                    <TypeBadge type={a.type} />
                  </div>
                  <div className="font-mono text-[10px] text-moss-500 truncate mt-1">{a.uuid}</div>
                </div>
                {a.id === selectedId && <IconHeart size={16} className="text-ember-500 shrink-0 anim-bob" />}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(a.id); }}
                  className="opacity-0 group-hover:opacity-100 text-moss-500 hover:text-ember-400 transition-all p-1.5"
                  title="Удалить аккаунт"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            ))}
            <p className="text-[11px] text-moss-500 pt-1">
              Аккаунтов: {accounts.length}. Выбранный аккаунт используется для входа на сервер.
            </p>
          </div>

          {/* превью */}
          {selected && (
            <div className="panel p-5 flex flex-col items-center lg:sticky lg:top-0 h-fit">
              <div className="text-[10px] font-bold tracking-[0.25em] text-moss-500 mb-3">ПРЕДПРОСМОТР СКИНА</div>
              <div className="relative anim-bob" key={selected.id + selected.username}>
                <SkinPreview skinDataUrl={skinUrl(selected)} nick={selected.username} scale={8} />
                <div className="absolute -inset-4 -z-10 bg-emer-500/10 blur-2xl" />
              </div>
              <div className="font-display text-lg text-mint-100 mt-4">{selected.username}</div>
              <TypeBadge type={selected.type} />
              <div className="w-full mt-5 grid grid-cols-2 gap-2">
                <button onClick={() => onCopy(selected.username)} className="btn-block bg-pine-700 text-mint-100 px-3 py-2.5 text-[11px] inline-flex items-center justify-center gap-1.5">
                  <IconCopy size={13} /> НИК
                </button>
                {selected.type === "offline" ? (
                  <button onClick={() => onReroll(selected.id)} className="btn-block bg-gold-500 text-pine-950 px-3 py-2.5 text-[11px] inline-flex items-center justify-center gap-1.5">
                    <IconDice size={13} /> СЛУЧАЙНЫЙ
                  </button>
                ) : (
                  <button onClick={() => onCopy(selected.uuid)} className="btn-block bg-pine-700 text-mint-100 px-3 py-2.5 text-[11px] inline-flex items-center justify-center gap-1.5">
                    <IconCopy size={13} /> UUID
                  </button>
                )}
              </div>
              <button
                onClick={() => onDelete(selected.id)}
                className="mt-2 w-full border border-pine-600 text-moss-500 hover:text-ember-400 hover:border-ember-600 transition-colors px-3 py-2 text-[11px] inline-flex items-center justify-center gap-1.5"
              >
                <IconTrash size={13} /> УДАЛИТЬ АККАУНТ
              </button>
            </div>
          )}
        </div>
      )}

      {/* модалка оффлайн */}
      <Modal open={showOffline} title="Новый оффлайн-аккаунт" onClose={() => setShowOffline(false)}>
        <p className="text-sm text-moss-300 mb-4">Ник для игры без лицензии. Скин сгенерируется автоматически — его всегда можно сменить кубиком.</p>
        <div className="flex gap-2 items-stretch">
          <div className="flex-1">
            <input
              className={`field font-mono ${nick.length > 0 && !nickValid ? "border-ember-500" : ""}`}
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitOffline()}
              maxLength={16}
              autoFocus
              spellCheck={false}
            />
            {nick.length > 0 && !nickValid && (
              <p className="text-[11px] text-ember-400 mt-1.5">3–16 символов: латиница, цифры и «_»</p>
            )}
          </div>
          <button
            onClick={() => setNick(generateNick())}
            title="Сгенерировать случайный ник"
            className="btn-block bg-gold-500 text-pine-950 px-3.5 inline-flex items-center"
          >
            <IconDice size={18} />
          </button>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <div className="bg-pine-950 border border-pine-700 p-1.5">
            <SkinPreview nick={nickValid ? nick : "Steve"} scale={3} />
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setShowOffline(false)} className="btn-block bg-pine-700 text-moss-300 px-5 py-2.5 text-xs">ОТМЕНА</button>
            <button onClick={submitOffline} disabled={!nickValid} className="btn-block bg-emer-500 text-pine-950 px-5 py-2.5 text-xs">СОЗДАТЬ</button>
          </div>
        </div>
      </Modal>

      {/* модалка ElyBy */}
      <Modal open={showElyby} title="Привязать Ely.By" onClose={() => !elyBusy && setShowElyby(false)}>
        <p className="text-sm text-moss-300 mb-4">
          Войдите через Ely.By — подтянутся ваш настоящий скин и плащ, а заходить сможете на лицензионные серверы.
        </p>
        <div className="space-y-3">
          <input className="field" placeholder="Ник или e-mail Ely.By" value={elyUser} onChange={(e) => setElyUser(e.target.value)} autoFocus spellCheck={false} />
          <input
            className="field" type="password" placeholder="Пароль" value={elyPass}
            onChange={(e) => setElyPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !elyBusy && submitElyby(true)}
          />
          {elyError && (
            <p className="text-[11px] text-ember-400 border border-ember-600/50 bg-ember-500/10 px-3 py-2">{elyError}</p>
          )}
        </div>
        <div className="flex items-center gap-2 mt-5">
          <button onClick={() => setShowElyby(false)} disabled={elyBusy} className="btn-block bg-pine-700 text-moss-300 px-5 py-2.5 text-xs">ОТМЕНА</button>
          <button
            onClick={() => submitElyby(true)}
            disabled={elyBusy}
            className="btn-block bg-emer-500 text-pine-950 px-5 py-2.5 text-xs inline-flex items-center gap-2"
          >
            {elyBusy && <IconSpinner size={13} />} ВОЙТИ
          </button>
          <button
            onClick={() => submitElyby(false)}
            disabled={elyBusy}
            className="ml-auto text-[11px] text-moss-400 hover:text-emer-300 underline underline-offset-4 transition-colors"
            title="Добавить аккаунт Ely.By только по нику — скин подтянется, вход без пароля"
          >
            привязать только по нику
          </button>
        </div>
      </Modal>
    </div>
  );
}
