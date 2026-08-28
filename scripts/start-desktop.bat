@echo off
chcp 65001 >nul
title MineHeal Launcher — запуск
cd /d "%~dp0.."

echo.
echo =============================================
echo   MineHeal Launcher — быстрый запуск (Windows)
echo =============================================
echo.

:: --- Проверка Node.js ---
where node >nul 2>nul
if errorlevel 1 (
  echo [ОШИБКА] Node.js не найден в системе!
  echo.
  echo   1. Скачайте Node.js LTS: https://nodejs.org
  echo   2. Установите его (просто жмите "Далее").
  echo   3. Закройте это окно и запустите скрипт заново.
  echo.
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo [OK] Node.js %%v

:: --- Шаг 1: зависимости ---
if not exist node_modules (
  echo [1/4] Устанавливаю зависимости ^(npm install^)...
  call npm install
  if errorlevel 1 ( echo [ОШИБКА] npm install не удался. Проверьте интернет. & pause & exit /b 1 )
) else (
  echo [1/4] Зависимости уже установлены — пропускаю.
)

:: --- Шаг 2: Electron ---
if not exist node_modules\electron (
  echo [2/4] Скачиваю Electron ^(один раз, ~100 МБ^)...
  call npm install --no-save electron@28.3.3
  if errorlevel 1 ( echo [ОШИБКА] Не удалось скачать Electron. Проверьте интернет. & pause & exit /b 1 )
) else (
  echo [2/4] Electron уже установлен — пропускаю.
)

:: --- Шаг 3: сборка интерфейса ---
echo [3/4] Собираю интерфейс ^(vite build^)...
call npm run build
if errorlevel 1 ( echo [ОШИБКА] Сборка интерфейса не удалась. & pause & exit /b 1 )

:: --- Шаг 4: запуск ---
echo [4/4] Запускаю лаунчер...
echo.
call npx electron electron/main.cjs

echo.
echo Лаунчер закрыт.
pause
