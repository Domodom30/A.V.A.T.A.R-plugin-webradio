import * as path from 'node:path';
import fs from 'fs-extra';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

class webradioWindows {
  constructor() {
    this.webradioAlarmWindow = null;
    this.config = Config.modules.webradio;
    this.Locale = null;
  }

  /**
   * Ouvre la fenêtre d'alarme radio
   * Crée une nouvelle fenêtre si elle n'existe pas, sinon affiche celle existante
   * @returns {Promise<void>}
   */
  async openWindowAlarm() {
    if (this.webradioAlarmWindow) return this.webradioAlarmWindow.show();

    this.Locale = await Avatar.lang.getPak('webradio', Config.language);

    let style = {
      parent: Avatar.Interface.mainWindow(),
      frame: false,
      movable: true,
      resizable: true,
      minimizable: false,
      alwaysOnTop: false,
      show: false,
      width: 700,
      minWidth: 620,
      height: 490,
      minHeight: 210,
      icon: path.resolve(__dirname, '..', '..', 'assets', 'images', 'clock.png'),
      webPreferences: {
        preload: path.resolve(__dirname, '..', 'alarm', 'alarm-preload.js'),
      },
      title: 'Music Alarm Clock',
    };
    if (fs.existsSync(path.resolve(__dirname, '..', '..', 'assets', 'style.json'))) {
      const prop = fs.readJsonSync(path.resolve(__dirname, '..', 'alarm', 'style.json'), { throws: false });
      if (prop) {
        style.x = prop.x;
        style.y = prop.y;
      }
    }
    this.webradioAlarmWindow = await Avatar.Interface.BrowserWindow(style, path.resolve(__dirname, '..', 'alarm', 'alarm.html'), false);

    this.webradioAlarmWindow.once('ready-to-show', async () => {
      this.webradioAlarmWindow.show();

      const clients = await Avatar.getAllClients();
      const webradioCron = await this.readConfigCron();

      if (!webradioCron.time) {
        webradioCron.time = '* * * * * *';
      }
      this.webradioAlarmWindow.webContents.send('onInit-webradioAlarm', {
        clients: clients,
        cron: webradioCron,
      });

      if (Config.modules.webradio.devTools) {
        this.webradioAlarmWindow.webContents.openDevTools();
      }
    });

    Avatar.Interface.ipcMain().on('quit-alarm', () => {
      this.webradioAlarmWindow.destroy();
    });
    Avatar.Interface.ipcMain().handle('save-alarm', async (_event, arg) => {
      return await this.saveAlarmConfig(arg);
    });
    Avatar.Interface.ipcMain().handle('get-alarm', async (_event) => {
      return await this.getAlarmTimer();
    });
    Avatar.Interface.ipcMain().handle('alarm-msg', async (_event, arg) => {
      return this.Locale.get(arg);
    });
    this.webradioAlarmWindow.on('closed', () => {
      Avatar.Interface.ipcMain().removeHandler('alarm-msg');
      Avatar.Interface.ipcMain().removeHandler('save-alarm');
      Avatar.Interface.ipcMain().removeHandler('get-alarm');
      Avatar.Interface.ipcMain().removeAllListeners('quit-alarm');
      this.webradioAlarmWindow = null;
    });
  }

  launchWindow(data) {
    if (!data) {
      data = {};
    }
    if (!data.action) {
      data.action = {};
    }

    data.action.remote = true;

    if (!data.action.remote) {
      data.action.remote = true;

      // true = sur le serveur A.V.A.T.A.R, false = sur le client qui se trouve sur la même machine que le serveur
      const onServer = Config.modules.webradio.onServer;

      const client = Avatar.getTrueClient(data.toClient);
      const clientInfos = Avatar.Socket.getClient(client);
      const sameIP = Config.http.ip === clientInfos.ip;

      if (clientInfos.is_mobile) {
        Avatar.speak(data.Locale.get('alarm.noWindowSettings'), data.client);
        return;
      }

      if (!onServer || !sameIP) {
        Avatar.clientPlugin(client, 'webradio', { action: { command: 'launchWindowAlarm' } });
      } else {
        Avatar.speak(data.Locale.get('alarm.openWindowSettings'), data.client, () => {
          this.launchWindow(data);
        });
      }
    } else {
      this.openWindowAlarm(data);
    }
  }

  /**
   * Sauvegarde la configuration de l'alarme
   * @param {Object} alarmData - Données de l'alarme à sauvegarder
   * @returns {Promise<void>}
   */
  async saveAlarmConfig(values) {
    try {
      if (!values) {
        throw new Error('values must be a valid cron string');
      }
      const configPath = path.resolve(__dirname, '..', '..', 'webradio.prop');
      const config = await fs.readJson(configPath);
      config.cron.webradio.time = values.cron;
      config.cron.webradio.active = values.active;

      await fs.writeJson(configPath, config);
      return true;
    } catch (err) {
      console.error('webradio:', err.message || err.stack);
      return false;
    }
  }

  async readConfigCron() {
    const configPath = path.resolve(__dirname, '..', '..', 'webradio.prop');

    try {
      const data = fs.readFileSync(configPath, 'utf8');
      const dataJSON = JSON.parse(data);
      return dataJSON.cron.webradio;
    } catch (err) {
      error('Erreur lors de la lecture du fichier JSON :', err);
      return null;
    }
  }

  /**
   * Configure le timer pour l'alarme
   * @param {Object} alarmData - Données de l'alarme
   */
  async getAlarmTimer() {
    const configPath = path.resolve(__dirname, '..', '..', 'webradio.prop');
    const config = await fs.readJson(configPath);
    const cronParts = config.cron.webradio.time.split(' ');
    const minutes = cronParts[0];
    const hours = cronParts[1];
    const daysOfWeek = cronParts[4];

    return { minutes, hours, daysOfWeek };
  }

  async clearAlarmTimer() {
    try {
      const configPath = path.resolve(__dirname, '..', '..', 'webradio.prop');
      const config = await fs.readJson(configPath);
      config.cron.webradio.time = '* * * * * *';
      config.cron.webradio.active = false;

      await fs.writeJson(configPath, config);
      return true;
    } catch (err) {
      console.error('webradio:', err.message || err.stack);
      return false;
    }
  }
}

export const managerWindows = new webradioWindows();
