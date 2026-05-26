const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Создаем окно нашей программы
  const win = new BrowserWindow({
    width: 1250,
    height: 850,
    title: "Shorts Studio",
    autoHideMenuBar: true, // Прячем верхнее текстовое меню (File, Edit и т.д.)
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Загружаем наш локальный сервер Next.js
  win.loadURL('http://localhost:3000');

  // Если захочешь открыть инструменты разработчика (Console), расскомментируй строку ниже:
  win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});