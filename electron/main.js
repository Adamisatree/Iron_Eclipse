const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let serverProc = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#0b0e12',
    title: '铁蚀战线 / Iron Eclipse v0.9.0',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'icon.png')
  });

  // In packaged app, server runs as child process
  const serverPath = path.join(__dirname, '../server/dist/index.js');
  try {
    serverProc = spawn(process.execPath, [serverPath], {
      env: { ...process.env, GAME_PORT: '27015' },
      stdio: 'inherit'
    });
  } catch(e) { console.error('Failed to spawn server', e); }

  // Load client
  const clientIndex = path.join(__dirname, '../client/dist/index.html');
  win.loadFile(clientIndex);

  // Open devtools in dev
  if (process.env.DEBUG) win.webContents.openDevTools();
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (serverProc) serverProc.kill();
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
