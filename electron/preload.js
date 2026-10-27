const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('ironEclipse', {
  version: '0.9.0',
  buildHash: 'd555555',
  platform: process.platform,
  arch: process.arch
});
