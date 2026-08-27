/* ═══════════════════════════════════════════════════════════════
   MineHeal Launcher — Electron main process
   Устанавливает Forge 1.12.2 в %APPDATA%/.mineheal (не трогая
   обычный Minecraft), ставит моды, пишет servers.dat и запускает
   игру с настройками пользователя (RAM, аргументы, окно).
   ═══════════════════════════════════════════════════════════════ */
const { app, BrowserWindow, ipcMain, shell, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const https = require("https");
const http = require("http");
const crypto = require("crypto");
const { spawn } = require("child_process");
const AdmZip = require("adm-zip");

/* ── константы ─────────────────────────────────────────────────── */
const MC_VERSION = "1.12.2";
const FORGE_VERSION = "14.23.5.2859";
const FORGE_ID_FRAGMENT = "forge";
const FORGE_INSTALLER_URL = `https://maven.minecraftforge.net/net/minecraftforge/forge/${MC_VERSION}-${FORGE_VERSION}/forge-${MC_VERSION}-${FORGE_VERSION}-installer.jar`;
const VERSION_MANIFEST_URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
const ELYBY_AUTH_URL = "https://authserver.ely.by/authenticate";
const ELYBY_SKIN_URL = (nick) => `https://skinsystem.ely.by/skins/${encodeURIComponent(nick)}.png`;

const MODS = [
  { file: "voicechat-forge-1.12.2-2.6.22.jar", url: "https://github.com/mineheal/mineheal-mods/releases/download/ver1/voicechat-forge-1.12.2-2.6.22.jar", dest: "mods" },
  { file: "zume-1.2.2.jar", url: "https://github.com/mineheal/mineheal-mods/releases/download/ver1/zume-1.2.2.jar", dest: "mods" },
  { file: "Russian-Localization.zip", url: "https://github.com/mineheal/mineheal-mods/releases/download/ver1/Russian-Localization.zip", dest: "resourcepacks" },
];

const SERVERS = [
  { name: "MineHeal", ip: "mc.minecraftmineheal.ru" },
  { name: "MineHeal Mirror", ip: "mineheal.aternos.me" },
];

/* ── пути ──────────────────────────────────────────────────────── */
const ROOT = path.join(app.getPath("appData"), ".mineheal");
const VERSIONS = path.join(ROOT, "versions");
const LIBRARIES = path.join(ROOT, "libraries");
const ASSETS = path.join(ROOT, "assets");
const NATIVES = path.join(ROOT, "natives");
const RUNTIME = path.join(ROOT, "runtime");
const STATE_FILE = path.join(ROOT, "mineheal.json");

const mkdirp = (p) => fs.promises.mkdir(p, { recursive: true });
const exists = (p) => fs.existsSync(p);

/* ── локальный HTTP-сервер для папки dist/ ─────────────────────── */
// Vite собирает интерфейс с абсолютными путями (/assets/…), а по file://
// браузер ищет их в корне диска → пустой белый экран. Поэтому отдаём dist
// через http://127.0.0.1 на случайном свободном порту. Заодно это решает
// CORS для запросов к authserver.ely.by и skinsystem.ely.by.
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function startDistServer() {
  const distDir = path.join(__dirname, "..", "dist");
  const server = http.createServer((req, res) => {
    try {
      let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      if (urlPath === "/") urlPath = "/index.html";
      let file = path.normalize(path.join(distDir, urlPath));
      // защита от выхода за пределы dist/
      if (!file.startsWith(distDir + path.sep) && file !== distDir) {
        file = path.join(distDir, "index.html");
      }
      // SPA fallback: несуществующий путь отдаём как index.html
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        file = path.join(distDir, "index.html");
      }
      res.writeHead(200, {
        "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      fs.createReadStream(file).pipe(res);
    } catch {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Внутренняя ошибка сервера лаунчера");
    }
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      resolve(`http://127.0.0.1:${server.address().port}/index.html`);
    });
    server.on("error", reject);
  });
}

/* ── окно ──────────────────────────────────────────────────────── */
let win = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => win && win.focus());
  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    const devUrl = process.env.MINEHEAL_DEV_URL;
    const uiUrl = devUrl || (await startDistServer());
    win = new BrowserWindow({
      width: 1240,
      height: 780,
      minWidth: 1024,
      minHeight: 640,
      backgroundColor: "#0a100d",
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        spellcheck: false,
        // разрешаем прямые запросы к API ElyBy (у них нет CORS-заголовков
        // для произвольных origin); приложение локальное и доверенное
        webSecurity: false,
      },
    });
    win.loadURL(uiUrl);
    // любые внешние ссылки (GitHub и т.п.) — в системном браузере
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:/i.test(url)) shell.openExternal(url);
      return { action: "deny" };
    });
  });
  app.on("window-all-closed", () => app.quit());
}

const emitInstall = (e) => { if (win) win.webContents.send("install-event", e); };
const emitLaunch = (e) => { if (win) win.webContents.send("launch-event", e); };

/* ── сеть ──────────────────────────────────────────────────────── */
function request(url, { method = "GET", body = null, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("http:") ? http : https;
    const req = mod.request(url, { method, headers }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        return resolve(request(new URL(res.headers.location, url).toString(), { method, body, headers }));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks), headers: res.headers }));
    });
    req.on("error", reject);
    req.setTimeout(60000, () => { req.destroy(new Error("Таймаут соединения")); });
    if (body) req.write(body);
    req.end();
  });
}

const getJson = async (url) => {
  const res = await request(url);
  if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${url}`);
  return JSON.parse(res.body.toString("utf8"));
};

function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("http:") ? http : https;
    const follow = (u, hops) => {
      const req = mod.get(u, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume();
          if (hops > 6) return reject(new Error("Слишком много редиректов"));
          return follow(new URL(res.headers.location, u).toString(), hops + 1);
        }
        if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}: ${u}`)); }
        const total = Number(res.headers["content-length"]) || 0;
        let got = 0;
        const out = fs.createWriteStream(dest);
        res.on("data", (c) => {
          got += c.length;
          if (onProgress && total) onProgress(got, total);
        });
        res.pipe(out);
        out.on("finish", () => out.close(() => resolve(dest)));
        out.on("error", reject);
      });
      req.on("error", reject);
      req.setTimeout(120000, () => req.destroy(new Error("Таймаут загрузки")));
    };
    follow(url, 0);
  });
}

async function downloadWithRetry(url, dest, onProgress, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await downloadFile(url, dest, onProgress);
    } catch (e) {
      lastErr = e;
      if (exists(dest)) fs.rmSync(dest, { force: true });
    }
  }
  throw lastErr;
}

/* ── NBT: servers.dat (без сжатия, как любит Minecraft) ────────── */
function nbtString(s) {
  const b = Buffer.from(s, "utf8");
  return Buffer.concat([Buffer.from([(b.length >> 8) & 255, b.length & 255]), b]);
}
function buildServersDat(servers) {
  const int32 = (n) => { const b = Buffer.alloc(4); b.writeInt32BE(n, 0); return b; };
  const p = [];
  p.push(Buffer.from([0x0a]), nbtString(""));                 // корневой compound ""
  p.push(Buffer.from([0x09]), nbtString("servers"));          // TAG_List "servers"
  p.push(Buffer.from([0x0a]), int32(servers.length));         // тип compound, длина
  for (const s of servers) {
    p.push(Buffer.from([0x08]), nbtString("name"), nbtString(s.name));
    p.push(Buffer.from([0x08]), nbtString("ip"), nbtString(s.ip));
    p.push(Buffer.from([0x01]), nbtString("acceptTextures"), Buffer.from([0x01]));
    p.push(Buffer.from([0x00]));                              // конец элемента
  }
  p.push(Buffer.from([0x00]));                                // конец корня
  return Buffer.concat(p);
}

/* ── Java: поиск или скачивание Temurin JRE 8 ──────────────────── */
function findSystemJava() {
  const exe = process.platform === "win32" ? "java.exe" : "java";
  const candidates = [
    process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, "bin", exe) : null,
    ...(process.env.PATH || "").split(path.delimiter).map((d) => path.join(d, exe)),
    "C:\\Program Files\\Eclipse Adoptium", "C:\\Program Files\\Java", "C:\\Program Files\\Amazon Corretto",
    "C:\\Program Files\\Zulu", "C:\\Program Files\\BellSoft\\LibericaJRE",
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
      if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
        const inner = fs.readdirSync(c).map((d) => path.join(c, d, "bin", exe)).find((f) => fs.existsSync(f));
        if (inner) return inner;
      }
    } catch { /* skip */ }
  }
  return null;
}

async function ensureJava(log) {
  const found = findSystemJava();
  if (found) { log(`Java найдена: ${found}`); return found; }
  log("Java не найдена — скачиваем Temurin JRE 8…");
  const osName = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "mac" : "linux";
  const arch = process.arch === "arm64" ? "aarch64" : "x64";
  const meta = await getJson(
    `https://api.adoptium.net/v3/assets/latest/8/hotspot?architecture=${arch}&image_type=jre&os=${osName}`
  );
  const asset = meta[0] && meta[0].binary;
  if (!asset) throw new Error("Не удалось найти JRE для вашей системы");
  const jreDir = path.join(RUNTIME, `jre8-${arch}`);
  const marker = path.join(jreDir, "bin", process.platform === "win32" ? "java.exe" : "java");
  if (exists(marker)) { log("Берём ранее скачанную JRE"); return marker; }
  await mkdirp(jreDir);
  const archive = path.join(RUNTIME, `jre8-${arch}${asset.installer ? ".zip" : asset.package.name.endsWith(".zip") ? ".zip" : ".tar.gz"}`);
  let lastPct = 0;
  await downloadWithRetry(asset.package.link, archive, (got, total) => {
    const pct = Math.round((got / total) * 100);
    if (pct >= lastPct + 10) { lastPct = pct; log(`JRE: ${pct}%`); }
  });
  log("Распаковка JRE…");
  const zip = new AdmZip(archive);
  zip.extractAllTo(RUNTIME, true);
  // Adoptium распаковывается в jdk8uXXX-jre — находим bin/java
  const bin = fs.readdirSync(RUNTIME)
    .map((d) => path.join(RUNTIME, d, "bin", process.platform === "win32" ? "java.exe" : "java"))
    .find((f) => fs.existsSync(f));
  fs.rmSync(archive, { force: true });
  if (!bin) throw new Error("JRE скачалась, но java не найдена после распаковки");
  if (process.platform !== "win32") fs.chmodSync(bin, 0o755);
  log("JRE 8 готова");
  return bin;
}

/* ── состояние установки ───────────────────────────────────────── */
function findForgeVersionDir() {
  if (!exists(VERSIONS)) return null;
  const dirs = fs.readdirSync(VERSIONS).filter((d) => d.includes(FORGE_ID_FRAGMENT) && d.startsWith(MC_VERSION));
  for (const d of dirs) {
    if (exists(path.join(VERSIONS, d, `${d}.json`))) return d;
  }
  return null;
}

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch { return {}; }
}
function writeState(patch) {
  const s = { ...readState(), ...patch };
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
}

/* ── IPC: информация о системе ─────────────────────────────────── */
ipcMain.handle("system-info", () => ({
  totalRamGb: Math.max(2, Math.round(os.totalmem() / 1024 ** 3)),
  platform: process.platform,
  arch: process.arch,
  cpus: os.cpus().length,
}));

ipcMain.handle("check-install", () => !!findForgeVersionDir() && MODS.every((m) => exists(path.join(ROOT, m.dest, m.file))));
ipcMain.handle("get-version-label", () => findForgeVersionDir());
ipcMain.handle("open-folder", async () => { await mkdirp(ROOT); shell.openPath(ROOT); });
ipcMain.on("save-state", (_e, data) => { try { mkdirp(ROOT).then(() => writeState({ ui: data })); } catch { /* noop */ } });

/* ── IPC: установка сборки ─────────────────────────────────────── */
ipcMain.handle("install-game", async () => {
  try {
    await mkdirp(ROOT);
    const log = (m) => emitInstall({ stage: "", pct: -1, log: m });

    emitInstall({ stage: "Подготовка", pct: 3, log: `Папка игры: ${ROOT}` });
    const java = await ensureJava(log);

    emitInstall({ stage: "Forge 1.12.2", pct: 14, log: "Скачивание установщика Forge…" });
    const installer = path.join(ROOT, "forge-installer.jar");
    let lastPct = 0;
    await downloadWithRetry(FORGE_INSTALLER_URL, installer, (got, total) => {
      const pct = Math.round((got / total) * 100);
      if (pct >= lastPct + 15) { lastPct = pct; emitInstall({ stage: "Forge 1.12.2", pct: 14 + pct * 0.2, log: `forge-installer.jar: ${pct}%` }); }
    });

    emitInstall({ stage: "Forge 1.12.2", pct: 38, log: "Запуск установщика Forge (--installClient)…" });
    await new Promise((resolve, reject) => {
      const p = spawn(java, ["-jar", installer, "--installClient", ROOT], { cwd: ROOT });
      p.stdout.on("data", (d) => String(d).trim().split("\n").slice(-1).forEach((l) => log(`forge: ${l}`)));
      p.stderr.on("data", (d) => String(d).trim().split("\n").slice(-1).forEach((l) => log(`forge: ${l}`)));
      p.on("error", reject);
      p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`Установщик Forge завершился с кодом ${code}`))));
    });
    fs.rmSync(installer, { force: true });

    const forgeDir = findForgeVersionDir();
    if (!forgeDir) throw new Error("Forge установился, но версия не найдена в versions/");
    emitInstall({ stage: "Forge 1.12.2", pct: 55, log: `Создана версия: ${forgeDir}` });

    for (let i = 0; i < MODS.length; i++) {
      const m = MODS[i];
      const destDir = path.join(ROOT, m.dest);
      await mkdirp(destDir);
      emitInstall({ stage: m.dest === "mods" ? "Моды" : "Ресурс-пак", pct: 60 + i * 9, log: `${m.file} → ${m.dest}/` });
      await downloadWithRetry(m.url, path.join(destDir, m.file));
    }

    emitInstall({ stage: "Серверы", pct: 90, log: "Запись servers.dat (MineHeal + Mirror)…" });
    fs.writeFileSync(path.join(ROOT, "servers.dat"), buildServersDat(SERVERS));

    writeState({ installed: true, version: forgeDir, installedAt: Date.now() });
    emitInstall({ stage: "Готово", pct: 100, log: "Установка завершена!", done: true });
  } catch (e) {
    emitInstall({ stage: "", pct: 0, error: `Ошибка установки: ${e.message}` });
    throw e;
  }
});

/* ── подготовка к запуску игры ─────────────────────────────────── */
const osName = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "osx" : "linux";

function libAllowed(lib) {
  if (!lib.rules) return true;
  let allowed = false;
  for (const r of lib.rules) {
    let match = true;
    if (r.os) {
      if (r.os.name && r.os.name !== osName) match = false;
      if (r.os.version && !new RegExp(r.os.version).test(os.release())) match = false;
      if (r.os.arch && (r.os.arch === "x86") === os.arch().includes("64")) match = false;
    }
    if (match) allowed = r.action === "allow";
  }
  return allowed;
}

function mavenPath(name) {
  const [group, artifact, version] = name.split(":");
  return `${group.replace(/\./g, "/")}/${artifact}/${version}/${artifact}-${version}.jar`;
}

async function ensureLibraries(libs, log) {
  const cp = [];
  const archBits = os.arch().includes("64") ? "64" : "32";
  for (const lib of libs) {
    if (!libAllowed(lib)) continue;
    const base = lib.downloads && lib.downloads.artifact;
    const relPath = base ? base.path : mavenPath(lib.name);
    const url = base && base.url ? base.url : lib.url ? lib.url + mavenPath(lib.name) : null;
    if (!relPath || !url) continue;
    const local = path.join(LIBRARIES, relPath);
    if (!exists(local)) {
      await mkdirp(path.dirname(local));
      log(`lib: ${relPath}`);
      await downloadWithRetry(url, local).catch((e) => log(`! не удалось скачать ${relPath}: ${e.message}`));
    }
    if (exists(local)) cp.push(local);

    // natives (LWJGL и т.п.)
    if (lib.natives && lib.natives[osName]) {
      const classifier = lib.natives[osName].replace("${arch}", archBits);
      const nat = lib.downloads && lib.downloads.classifiers && lib.downloads.classifiers[classifier];
      const natUrl = nat ? nat.url : lib.url ? `${lib.url}${mavenPath(lib.name).replace(".jar", `-${classifier}.jar`)}` : null;
      if (natUrl) {
        await mkdirp(NATIVES);
        const natJar = path.join(NATIVES, `${lib.name.replace(/[:]/g, "_")}-${classifier}.jar`);
        if (!exists(natJar)) {
          await downloadWithRetry(natUrl, natJar).catch(() => null);
          if (exists(natJar)) {
            try {
              const zip = new AdmZip(natJar);
              zip.getEntries().forEach((en) => {
                if (!en.isDirectory && !en.entryName.startsWith("META-INF")) zip.extractEntryTo(en, NATIVES, false, true);
              });
            } catch { /* ignore */ }
          }
        }
      }
    }
  }
  return cp;
}

async function ensureAssets(parent, log, onPct) {
  const idxDir = path.join(ASSETS, "indexes");
  await mkdirp(idxDir);
  const idxFile = path.join(idxDir, `${parent.assetIndex.id}.json`);
  if (!exists(idxFile)) {
    log("Скачивание индекса ассетов…");
    await downloadWithRetry(parent.assetIndex.url, idxFile);
  }
  const index = JSON.parse(fs.readFileSync(idxFile, "utf8"));
  const objects = Object.values(index.objects);
  const missing = objects.filter((o) => !exists(path.join(ASSETS, "objects", o.hash.slice(0, 2), o.hash)));
  log(`Ассеты: ${objects.length - missing.length}/${objects.length} на месте, докачиваем ${missing.length}…`);
  let done = 0;
  const queue = missing.slice();
  const workers = Array.from({ length: 10 }, async () => {
    while (queue.length) {
      const o = queue.shift();
      const dir = path.join(ASSETS, "objects", o.hash.slice(0, 2));
      await mkdirp(dir);
      try {
        await downloadWithRetry(`https://resources.download.minecraft.net/${o.hash.slice(0, 2)}/${o.hash}`, path.join(dir, o.hash), null, 2);
      } catch { /* пропускаем необязательное */ }
      done++;
      if (done % 50 === 0 || done === missing.length) {
        onPct(Math.round((done / Math.max(1, missing.length)) * 100));
      }
    }
  });
  await Promise.all(workers);
}

function splitArgs(str) {
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(str))) out.push(m[1] ?? m[2] ?? m[3]);
  return out.filter((a) => a && a.length);
}

function offlineUuidOf(nick) {
  const h = crypto.createHash("md5").update("OfflinePlayer:" + nick).digest();
  h[6] = (h[6] & 0x0f) | 0x30;
  h[8] = (h[8] & 0x3f) | 0x80;
  const hex = h.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/* ── IPC: запуск игры ──────────────────────────────────────────── */
ipcMain.handle("launch-game", async (_e, settings, account) => {
  const log = (m) => emitLaunch({ log: m });
  try {
    const forgeDir = findForgeVersionDir();
    if (!forgeDir) return { ok: false, message: "Сборка не установлена — нажмите «Установить»." };

    const java = await ensureJava(log);
    const versionJson = JSON.parse(fs.readFileSync(path.join(VERSIONS, forgeDir, `${forgeDir}.json`), "utf8"));
    const parentId = versionJson.inheritsFrom || MC_VERSION;

    // ванильный JSON (кэш)
    const parentFile = path.join(VERSIONS, parentId, `${parentId}.json`);
    if (!exists(parentFile)) {
      log("Получение ванильного манифеста 1.12.2…");
      const manifest = await getJson(VERSION_MANIFEST_URL);
      const entry = manifest.versions.find((v) => v.id === parentId);
      if (!entry) throw new Error(`Версия ${parentId} не найдена в манифесте Mojang`);
      await mkdirp(path.join(VERSIONS, parentId));
      fs.writeFileSync(parentFile, JSON.stringify(await getJson(entry.url)));
    }
    const parent = JSON.parse(fs.readFileSync(parentFile, "utf8"));

    // клиентский jar
    const clientJar = path.join(VERSIONS, parentId, `${parentId}.jar`);
    if (!exists(clientJar)) {
      log("Скачивание client.jar…");
      emitLaunch({ pct: 2 });
      await downloadWithRetry(parent.downloads.client.url, clientJar, (g, t) => emitLaunch({ pct: 2 + Math.round((g / t) * 13) }));
    }

    // библиотеки: forge-список первым, затем ванильный
    emitLaunch({ pct: 16, log: "Проверка библиотек…" });
    const cp = await ensureLibraries([...(versionJson.libraries || []), ...(parent.libraries || [])], log);
    cp.push(clientJar);

    emitLaunch({ pct: 30, log: "Проверка ассетов…" });
    await ensureAssets(parent, log, (p) => emitLaunch({ pct: 30 + Math.round(p * 0.6) }));

    // аргументы игры
    const template = versionJson.minecraftArguments || parent.minecraftArguments || "";
    const map = {
      auth_player_name: account.username,
      version_name: forgeDir,
      game_directory: ROOT,
      assets_root: ASSETS,
      assets_index_name: parent.assetIndex.id,
      auth_uuid: account.uuid || offlineUuidOf(account.username),
      auth_access_token: account.accessToken || "0",
      user_properties: "{}",
      user_type: account.type === "elyby" && account.accessToken !== "0" ? "mojang" : "legacy",
      version_type: "MineHeal",
    };
    const gameArgs = splitArgs(template.replace(/\$\{(\w+)\}/g, (_, k) => (k in map ? map[k] : "")));

    // окно игры
    if (settings.windowMode === "fullscreen") gameArgs.push("--fullscreen");
    else {
      gameArgs.push("--width", String(settings.windowWidth || 1280), "--height", String(settings.windowHeight || 720));
    }

    const ram = Math.max(1, settings.ramGb || 4);
    const javaArgs = [
      `-Xmx${ram}G`,
      `-Xms${Math.max(1, Math.floor(ram / 2))}G`,
      ...splitArgs(settings.javaArgs || ""),
      `-Djava.library.path=${NATIVES}`,
      `-Dminecraft.client.jar=${clientJar}`,
      `-Dme.mineheal.windowTitle=${settings.windowTitle || "MineHeal"}`,
      "-Dfml.ignoreInvalidMinecraftCertificates=true",
      "-Dfml.ignorePatchDiscrepancies=true",
      "-cp", cp.join(path.delimiter),
      versionJson.mainClass || "net.minecraft.launchwrapper.Launch",
      ...gameArgs,
    ];

    emitLaunch({ pct: 96, log: "Запуск Minecraft…" });
    const logFile = path.join(ROOT, "latest-launch.log");
    const out = fs.createWriteStream(logFile);
    const child = spawn(java, javaArgs, { cwd: ROOT, detached: true });
    child.stdout.pipe(out);
    child.stderr.pipe(out);
    child.stdout.on("data", (d) => String(d).trim().split("\n").slice(-1).forEach(log));
    child.stderr.on("data", (d) => String(d).trim().split("\n").slice(-1).forEach((l) => log(`[err] ${l}`)));
    child.on("error", (err) => emitLaunch({ log: `Java не запустилась: ${err.message}` }));
    child.unref();

    emitLaunch({ pct: 100, log: "Игра запущена", done: true });
    return { ok: true };
  } catch (e) {
    log(`Ошибка: ${e.message}`);
    return { ok: false, message: e.message };
  }
});

/* ── IPC: Ely.By ───────────────────────────────────────────────── */
ipcMain.handle("elyby-auth", async (_e, username, password) => {
  try {
    const res = await request(ELYBY_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent: { name: "Minecraft", version: 1 },
        username,
        password,
        clientToken: crypto.randomUUID(),
        requestUser: true,
      }),
    });
    const data = JSON.parse(res.body.toString("utf8"));
    if (res.status !== 200 || !data.accessToken) {
      return { ok: false, error: (data.errorMessage || data.error || "Неверный логин или пароль") };
    }
    return {
      ok: true,
      username: (data.user && (data.user.username || (data.selectedProfile && data.selectedProfile.name))) || username,
      uuid: data.selectedProfile && data.selectedProfile.id,
      accessToken: data.accessToken,
    };
  } catch (e) {
    return { ok: false, error: `Сеть недоступна: ${e.message}` };
  }
});

ipcMain.handle("fetch-skin", async (_e, username) => {
  try {
    const res = await request(ELYBY_SKIN_URL(username));
    if (res.status !== 200) return null;
    const type = (res.headers["content-type"] || "image/png").split(";")[0];
    return `data:${type};base64,${res.body.toString("base64")}`;
  } catch {
    return null;
  }
});
