import { app, BrowserWindow } from "electron";
import path from "path";
import url from "url";

let mainWindow: Electron.BrowserWindow | null;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 700,
        backgroundColor: "#f2f2f2",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            devTools: process.env.NODE_ENV !== "production",
            preload: path.join(__dirname, 'Preload.js'),
        },
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    mainWindow.webContents.on('crashed', (e) => {
        console.log(`crash catched`);
        console.error(e);
    });
    return mainWindow;
}

function createWindow() {

  if (process.env.NODE_ENV === "development") {
    const url = `http://localhost:${process.env.PORT || 8081}`;
    var waitOn = require('wait-on');
    console.log(`waiting ${url}`)
    waitOn({resources: [url], timeout: 30000})
      .then(() => createMainWindow().loadURL(url)
          .then(() => mainWindow!.webContents.openDevTools())
          .catch(err => {
              console.log(`error loading ${url}`, err);
              mainWindow?.close();
          }))
      .catch(console.error);
  } else {
    console.log(`load renderer/index.html`);

    createMainWindow()
    .loadURL(
        url.format({
            pathname: path.join(__dirname, "renderer/index.html"),
            protocol: "file:",
            slashes: true,
        })
    )
    .then(() => mainWindow!.webContents.openDevTools())
    .catch(err => {
        console.log(`error loading ${url}`, err);
        mainWindow?.close();
    });
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it"s common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});