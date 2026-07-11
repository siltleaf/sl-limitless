const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let win;
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
let settings = { corner: 0, fontSize: 18 };

if (fs.existsSync(settingsPath)) {
    try { settings = JSON.parse(fs.readFileSync(settingsPath)); } catch (e) {}
}

function saveSettings() {
    fs.writeFileSync(settingsPath, JSON.stringify(settings));
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (win) {
            if (win.isMinimized()) win.restore();
            win.focus();
        }
    });
}

function getPosition(corner) {
    const display = screen.getPrimaryDisplay();
    const { workArea, bounds } = display;
    // Tightened window size to 400x300 to prevent "middle screen" feel
    const winW = 400, winH = 300; 
    const margin = 5;

    switch(corner) {
        case 0: return { x: bounds.width - winW - margin, y: margin }; 
        case 1: return { x: bounds.width - winW - margin, y: workArea.height - winH - margin }; 
        case 2: return { x: margin, y: workArea.height - winH - margin }; 
        case 3: return { x: margin, y: margin }; 
    }
}

function createWindow() {
    const pos = getPosition(settings.corner);

    win = new BrowserWindow({
        width: 400, height: 300,
        x: pos.x, y: pos.y,
        frame: false, transparent: true, alwaysOnTop: true, resizable: false,
        skipTaskbar: true, backgroundColor: '#00000000',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, sandbox: false
        }
    });

    // Use __dirname for reliable pathing in both unpacked and portable modes
    win.loadFile(path.join(__dirname, 'index.html'));
    win.setIgnoreMouseEvents(true, { forward: true });

    globalShortcut.register('Alt+Shift+M', () => {
        settings.corner = (settings.corner + 1) % 4;
        const newPos = getPosition(settings.corner);
        win.setPosition(newPos.x, newPos.y);
        win.webContents.send('corner-changed', settings.corner);
        saveSettings();
    });

    globalShortcut.register('Alt+Shift+Up', () => {
        settings.fontSize++;
        win.webContents.send('change-size', 1);
        saveSettings();
    });

    globalShortcut.register('Alt+Shift+Down', () => {
        settings.fontSize--;
        win.webContents.send('change-size', -1);
        saveSettings();
    });

    globalShortcut.register('Alt+Shift+X', () => app.quit());

    win.webContents.on('did-finish-load', () => {
        win.webContents.send('init-settings', settings);
    });
}

app.whenReady().then(createWindow);
app.on('will-quit', () => globalShortcut.unregisterAll());