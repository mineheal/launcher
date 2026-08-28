# MineHeal Launcher

Лаунчер сервера **MineHeal** на Electron + React. Устанавливает спец-сборку **Forge 1.12.2**
в отдельную папку `%APPDATA%\.mineheal` (обычный Minecraft не трогается), ставит моды
(войс-чат, зум, русский шрифт), прописывает серверы **MineHeal** и **MineHeal Mirror** в
`servers.dat` и запускает игру с настройками пользователя.

---

## Содержание

1. [Что нужно установить ДО начала](#1-что-нужно-установить-до-начала)
2. [Скачивание кода](#2-скачивание-кода)
3. [Быстрый запуск — один клик](#3-быстрый-запуск-один-клик)
4. [Запуск вручную, шаг за шагом](#4-запуск-вручную-шаг-за-шагом)
5. [Просто посмотреть интерфейс в браузере](#5-просто-посмотреть-интерфейс-в-браузере)
6. [Режим разработки (Electron + горячая перезагрузка)](#6-режим-разработки-electron--горячая-перезагрузка)
7. [Собрать установщик (.exe / AppImage) у себя на ПК](#7-собрать-установщик-exe--appimage-у-себя-на-пк)
8. [Автоматический релиз через GitHub Actions (тег 1.0)](#8-автоматический-релиз-через-github-actions-тег-10)
9. [Частые проблемы и решения](#9-частые-проблемы-и-решения)
10. [Где живёт игра и как всё удалить](#10-где-живёт-игра-и-как-всё-удалить)
11. [Структура проекта](#11-структура-проекта)

---

## 1. Что нужно установить ДО начала

Вам понадобится **только Node.js**. Всё остальное (Electron, Java для игры) скачается само.

### Windows

1. Откройте **https://nodejs.org**
2. Скачайте версию **LTS** (зелёная кнопка слева, например «20.x.x LTS»)
3. Запустите скачанный `.msi` и жмите *Next → Next → Install* (ничего менять не нужно)
4. **Проверьте**: откройте PowerShell или cmd и введите:
   ```
   node -v
   ```
   Должно напечатать что-то вроде `v20.11.0` (главное — 18 или выше).

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install nodejs npm git
node -v    # нужно v18 или выше; если старее — ставьте с nodejs.org или через nvm
```

Также Electron на Linux требует системные библиотеки (один раз):

```bash
sudo apt install libnss3 libatk-bridge2.0-0 libgtk-3-0 libgbm1 libasound2
```

> **Java ставить НЕ нужно** — если её нет в системе, лаунчер сам скачает Temurin JRE 8
> при установке игры.

## 2. Скачивание кода

**Вариант А — через Git** (в папке, где хотите хранить проект):

```bash
git clone https://github.com/<ваш-логин>/mineheal-launcher.git
cd mineheal-launcher
```

**Вариант Б — архивом:** на странице репозитория нажмите *Code → Download ZIP*,
распакуйте архив и откройте терминал в этой папке.

## 3. Быстрый запуск — один клик

В папке `scripts/` лежат готовые скрипты. Они сами проверяют Node.js, ставят зависимости,
скачивают Electron, собирают интерфейс и запускают лаунчер.

- **Windows:** просто **дважды кликните** по файлу
  ```
  scripts\start-desktop.bat
  ```
- **Linux:** в терминале, в папке проекта:
  ```bash
  chmod +x scripts/start-desktop.sh    # один раз, чтобы разрешить запуск
  ./scripts/start-desktop.sh
  ```

Первый запуск занимает 3–7 минут (качаются зависимости и Electron ~100 МБ).
Повторные запуски — несколько секунд.

## 4. Запуск вручную, шаг за шагом

Если хотите понимать каждую команду — вот они по порядку. Выполняйте в терминале,
**находясь в папке проекта**.

### Шаг 1. Установить зависимости проекта

```bash
npm install
```

Что делает: скачивает React, Vite, Tailwind и прочее в папку `node_modules`. Один раз.

### Шаг 2. Установить Electron (его нет в обычных зависимостях)

```bash
npm install --no-save electron@28.3.3
```

Что делает: скачивает сам «движок» десктоп-приложения (~100 МБ). Один раз.
Флаг `--no-save` нужен, чтобы не менять `package.json`.

### Шаг 3. Собрать интерфейс лаунчера

```bash
npm run build
```

Что делает: компилирует React-интерфейс в папку `dist/`. Именно её Electron показывает
в своём окне. **Перед каждым запуском после изменений в коде** повторяйте этот шаг
(или используйте режим разработки из раздела 6).

### Шаг 4. Запустить лаунчер

- **Windows (PowerShell / cmd):**
  ```bash
  npx electron electron/main.cjs
  ```
- **Linux:**
  ```bash
  npx electron electron/main.cjs --no-sandbox
  ```

Откроется окно лаунчера. Дальше — кнопка **УСТАНОВИТЬ** на вкладке «Новости».

> Короткая шпаргалка (после первичной установки достаточно 2 команд):
> ```bash
> npm run build
> npx electron electron/main.cjs
> ```

## 5. Просто посмотреть интерфейс в браузере

Если Electron пока не нужен и хочется только пощупать интерфейс:

```bash
npm run dev
```

Откройте в браузере адрес, который напечатает Vite (обычно **http://localhost:5173**).
Интерфейс полностью кликабелен, но работает в **демо-режиме**: установка и запуск игры
симулируются (реально это умеет только Electron-версия, т.к. браузеру запрещено ставить
программы).

Остановить — `Ctrl+C` в терминале.

## 6. Режим разработки (Electron + горячая перезагрузка)

Для правок кода с мгновенным обновлением окна лаунчера:

**Терминал 1** — поднимаем dev-сервер:
```bash
npm run dev
```

**Терминал 2** — запускаем Electron, указав ему адрес dev-сервера:

- Windows, **PowerShell**:
  ```powershell
  $env:MINEHEAL_DEV_URL="http://localhost:5173"; npx electron electron/main.cjs
  ```
- Windows, **cmd**:
  ```bat
  set MINEHEAL_DEV_URL=http://localhost:5173 && npx electron electron/main.cjs
  ```
- **Linux / macOS**:
  ```bash
  MINEHEAL_DEV_URL=http://localhost:5173 npx electron electron/main.cjs --no-sandbox
  ```

Теперь изменения в `src/` мгновенно появляются в окне лаунчера.

## 7. Собрать установщик (.exe / AppImage) у себя на ПК

Понадобится `electron-builder` (один раз):

```bash
npm install --no-save electron-builder@24.13.3
```

Затем (интерфейс должен быть собран — `npm run build`):

- **Windows → установщик .exe + Portable (x64):**
  ```bash
  npx electron-builder --config electron-builder.yml --win --x64
  ```
- **Linux → AppImage / deb / rpm (x64):**
  ```bash
  npx electron-builder --config electron-builder.yml --linux --x64
  ```
  (для сборки rpm дополнительно: `sudo apt install rpm`)

Готовые файлы появятся в папке **`release/`** — их уже можно раздавать игрокам.

## 8. Автоматический релиз через GitHub Actions (тег 1.0)

Всё уже настроено в файле `.github/workflows/build.yml` — **ничего донастраивать не нужно**,
никакие ключи/секреты не требуются (GitHub выдаёт токен сам).

1. Залейте проект на GitHub (если ещё не сделано):
   ```bash
   git init
   git add .
   git commit -m "MineHeal Launcher 1.0"
   git branch -M main
   git remote add origin https://github.com/<ваш-логин>/mineheal-launcher.git
   git push -u origin main
   ```
2. **Создайте тег `1.0` и отправьте его** — это триггер сборки:
   ```bash
   git tag 1.0
   git push origin 1.0
   ```
3. Откройте на GitHub вкладку **Actions** — там побежит сборка «Build & Release»
   (обычно 10–15 минут: отдельно Windows и Linux).
4. Когда jobs позеленеют, зайдите в **Releases** (справа на странице репозитория) —
   там будет релиз **«MineHeal Launcher 1.0»** с файлами:

   | Платформа | Файлы |
   | --- | --- |
   | Windows 10/11 (x64) | `MineHeal-Setup-1.0.0-x64.exe` (установщик) и `…-Portable.exe` (без установки) |
   | Linux x64 | `AppImage`, `deb`, `rpm` |
   | Linux arm64 | `AppImage`, `deb`, `rpm` |

   Архитектура x32 не собирается — минималка Windows 10 x64.

**Альтернатива без тега:** на GitHub откройте *Actions → Build & Release → Run workflow*.

## 9. Частые проблемы и решения

| Проблема | Решение |
| --- | --- |
| `npm install` падает с `ECONNRESET` / таймаутом | Проблема с сетью. Повторите, либо: `npm config set registry https://registry.npmmirror.com` и снова `npm install` |
| Electron не скачивается (ошибка при `npm install electron`) | Скачивание бинарника блокируется. Помогает зеркало: **PowerShell:** `$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"; npm install --no-save electron@28.3.3` · **cmd:** `set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ && npm install --no-save electron@28.3.3` · **Linux:** `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npm install --no-save electron@28.3.3` |
| `npx electron` пишет «command not found» / ничего не делает | Electron не установлен — выполните шаг 2 из раздела 4 |
| Окно Electron открылось, а внутри **белый/чёрный экран** | Вы забыли `npm run build` (нет папки `dist/`). Соберите и запустите заново |
| `node -v` показывает `v16` или ниже | Обновите Node.js с https://nodejs.org (LTS) |
| Linux: окно не открывается, ошибки про `libnss3` / `libgtk` | Поставьте библиотеки из раздела 1 и запускайте с `--no-sandbox` |
| Лаунчер говорит «игра установлена», а вы её удалили | Удалите папку `%APPDATA%\.mineheal` целиком — кнопка снова станет «УСТАНОВИТЬ» |
| Установка игры зависает | Скорее всего медленный доступ к `maven.minecraftforge.net` / Mojang. Подождите, прогресс пишется в логе под кнопкой; после обрыва просто нажмите «УСТАНОВИТЬ» ещё раз — докачает |

## 10. Где живёт игра и как всё удалить

- **Windows:** `%APPDATA%\.mineheal`
  (в проводнике: `Win+R` → введите `%APPDATA%\.mineheal` → Enter)
- **Linux:** `~/.config/.mineheal`

Внутри: `runtime/` (Java), `versions/1.12.2-forge…/`, `mods/` (войс-чат, зум),
`resourcepacks/Russian-Localization.zip`, `servers.dat` (серверы MineHeal),
`launcher_profiles.json` и т.д.

**Полное удаление игры:** закройте лаунчер и удалите папку `.mineheal` — при следующем
входе лаунчер снова предложит установку. Сам лаунчер удаляется как обычная программа
(Параметры → Приложения), если ставили через `.exe`.

## 11. Структура проекта

```
scripts/                 — готовые скрипты запуска (start-desktop.bat / .sh)
electron/main.cjs        — главный процесс Electron: установка Forge, модов, servers.dat,
                           скачивание Java, ассетов/библиотек и запуск игры
electron/preload.cjs     — безопасный мост IPC (contextBridge) между окном и системой
electron-builder.yml     — описание пакетов: NSIS/Portable (Windows), AppImage/deb/rpm (Linux)
.github/workflows/       — GitHub Actions: автосборка в Release с тегом 1.0
src/
  App.tsx                — оболочка лаунчера: левая панель, кнопка УСТАНОВИТЬ/ИГРАТЬ
  components/
    NewsTab.tsx          — новости + панель установки сборки
    SettingsTab.tsx      — RAM, Java-аргументы, название окна, полноэкранный режим
    AccountsTab.tsx      — оффлайн- и Ely.By-аккаунты, скины, генератор ников
    SkinPreview.tsx      — canvas-предпросмотр скина (полный рост, слои hat/оверлей)
    ui.tsx               — иконки (inline SVG), модалки, тосты, переключатели
  lib/
    core.ts              — типы, хранилище, API-мост к Electron, новости, моды
    nicks.ts             — генератор случайных ников «как Grow»
```

### Что происходит при нажатии «УСТАНОВИТЬ»

1. Модалка: **ВНИМАНИЕ!** «Вместе с игрой сейчас установятся требуемые модификации и
   пакеты для приятной игры!» → *Отмена / Установить*.
2. Поиск Java в системе; если нет — скачивается **Temurin JRE 8** в `.mineheal/runtime`.
3. Скачивается официальный установщик `forge-1.12.2-14.23.5.2859-installer.jar` и
   выполняется с ключом `--installClient %APPDATA%\.mineheal`.
4. Скачиваются моды и ресурс-пак:
   - `mods/voicechat-forge-1.12.2-2.6.22.jar` — войс-чат
   - `mods/zume-1.2.2.jar` — зум (приближение)
   - `resourcepacks/Russian-Localization.zip` — русский шрифт
5. Пишется `servers.dat` (NBT, без сжатия):
   - **MineHeal** → `mc.minecraftmineheal.ru`
   - **MineHeal Mirror** → `mineheal.aternos.me`
6. При первом запуске докачиваются `client.jar`, библиотеки и ассеты (с прогресс-баром),
   затем стартует игра: `-Xmx<RAM>G`, ваши Java-аргументы, `--fullscreen` или
   `--width/--height`, свой заголовок окна.
