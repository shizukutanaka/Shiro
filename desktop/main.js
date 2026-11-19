"use strict";
/*
 * Shiro desktop app — the minimal Electron shell that hosts the existing
 * static app (index.html + app.js) in a window. The app itself is unchanged.
 *
 * The renderer gets no Node.js access (contextIsolation on, nodeIntegration
 * off, sandbox on) and there is no preload script. Navigation away from the
 * app page and new windows are refused, so the app keeps making no external
 * requests. In-page fragment changes (share links, #s=…) are not navigations
 * and keep working.
 */
const { app, BrowserWindow } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");

const PAGE = path.join(__dirname, "..", "index.html");
const PAGE_URL = pathToFileURL(PAGE).href;

const withoutHash = url => String(url).split("#")[0];

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 720,
    minHeight: 480,
    title: "Shiro",
    backgroundColor: "#14151a",
    icon: path.join(__dirname, "..", "icon-512.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, url) => {
    if (withoutHash(url) !== PAGE_URL) event.preventDefault();
  });
  win.webContents.on("will-redirect", (event, url) => {
    if (withoutHash(url) !== PAGE_URL) event.preventDefault();
  });

  win.loadFile(PAGE);
  return win;
}

app.on("web-contents-created", (_event, contents) => {
  contents.setWindowOpenHandler(() => ({ action: "deny" }));
  contents.on("will-attach-webview", event => event.preventDefault());
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
