/* MineHeal Launcher — preload: безопасный мост renderer ↔ main */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  systemInfo: () => ipcRenderer.invoke("system-info"),
  checkInstall: () => ipcRenderer.invoke("check-install"),
  installGame: () => ipcRenderer.invoke("install-game"),
  onInstallEvent: (cb) => {
    ipcRenderer.removeAllListeners("install-event");
    ipcRenderer.on("install-event", (_e, data) => cb(data));
  },
  launchGame: (settings, account) => ipcRenderer.invoke("launch-game", settings, account),
  elybyAuth: (username, password) => ipcRenderer.invoke("elyby-auth", username, password),
  fetchSkin: (username) => ipcRenderer.invoke("fetch-skin", username),
  saveState: (data) => ipcRenderer.send("save-state", data),
  openGameFolder: () => ipcRenderer.invoke("open-folder"),
  getVersionLabel: () => ipcRenderer.invoke("get-version-label"),
});
