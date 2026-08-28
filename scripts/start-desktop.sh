#!/usr/bin/env bash
# MineHeal Launcher — быстрый запуск (Linux)
# Использование:  ./scripts/start-desktop.sh
set -e
cd "$(dirname "$0")/.."

echo
echo "============================================="
echo "  MineHeal Launcher — быстрый запуск (Linux)"
echo "============================================="
echo

# --- Проверка Node.js ---
if ! command -v node >/dev/null 2>&1; then
  echo "[ОШИБКА] Node.js не найден!"
  echo "  Ubuntu/Debian:  sudo apt install nodejs npm"
  echo "  Или скачайте LTS с https://nodejs.org"
  exit 1
fi
echo "[OK] Node.js $(node -v)"

# --- Шаг 1: зависимости ---
if [ ! -d node_modules ]; then
  echo "[1/4] Устанавливаю зависимости (npm install)..."
  npm install
else
  echo "[1/4] Зависимости уже установлены — пропускаю."
fi

# --- Шаг 2: Electron ---
if [ ! -d node_modules/electron ]; then
  echo "[2/4] Скачиваю Electron (один раз, ~100 МБ)..."
  npm install --no-save electron@28.3.3
else
  echo "[2/4] Electron уже установлен — пропускаю."
fi

# --- Шаг 3: сборка интерфейса ---
echo "[3/4] Собираю интерфейс (vite build)..."
npm run build

# --- Шаг 4: запуск ---
echo "[4/4] Запускаю лаунчер..."
echo
npx electron electron/main.cjs --no-sandbox
