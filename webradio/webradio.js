import * as path from 'node:path';
import fs from 'fs-extra';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import { radioPlayer } from './lib/services/player.js';
import { managerWindows } from './lib/services/windows.js';
import { musicMapping } from './lib/services/helpers.js';

import * as webradioLib from './lib/webradio.js';
await webradioLib.init();

import * as widgetLib from '../../../widgetLibrairy.js';
const Widget = await widgetLib.init();

await radioPlayer.init();
await musicMapping.init();

let periphInfo = [];
let Locale, currentwidgetState, WebRadioWindow, selectRadio;

const widgetFolder = path.resolve(__dirname, 'assets/widget');
const widgetImgFolder = path.resolve(__dirname, 'assets/images/widget');

export async function onClose(widgets) {
  if (Config.modules.webradio.widget.display === true) {
    await Widget.initVar(widgetFolder, widgetImgFolder, null, Config.modules.webradio);
    if (widgets) await Widget.saveWidgets(widgets);
  }

  radioPlayer.saveSettings(false);
}

export async function init() {
  if (!(await Avatar.lang.addPluginPak('webradio'))) {
    return error('webradio: unable to load language pak files');
  }

  Locale = await Avatar.lang.getPak('webradio', Config.language);
  if (!Locale) {
    return error(`webradio: Unable to find the '${Config.language}' language pak.`);
  }

  periphInfo.push({
    Buttons: [
      {
        name: 'webradio',
        value_type: 'button',
        usage_name: 'Button',
        periph_id: '444555',
        notes: 'Open webradio',
      },
    ],
  });
}

export async function cron() {
  if (Config.cron.webradio.active) {
    radioPlayer.openWebRadioWindow();
  }
}

export async function action(data, callback) {
  try {
    // Table of actions
    const tblCommand = {
      play: () => radioPlayer.play(data, false),
      playLast: () => radioPlayer.play(data, false, true),
      playGroup: () => radioPlayer.play(data, true),
      stop: () => radioPlayer.stop(data, false),
      stopGroup: () => radioPlayer.stop(data, false),
      // Fonctions permettant d'utiliser Avatar.clientPlugin()
      launchWindowClient: () => musicMapping.launchWindowClient(data, searchRadio),
      launchWindowAlarm: () => managerWindows.launchWindow(data),
    };

    info('webradio:', data.action.command, L.get('plugin.from'), data.client, L.get('plugin.to'), data.toClient);

    tblCommand[data.action.command]();
  } catch (err) {
    if (data.client) Avatar.Speech.end(data.client);
    if (err.message) error(err.message);
  }
  callback();
}

export async function getWidgetsOnLoad() {
  if (Config.modules.webradio.widget.display === true) {
    await Widget.initVar(widgetFolder, widgetImgFolder, null, Config.modules.webradio);
    let widgets = await Widget.getWidgets();
    return { plugin: 'webradio', widgets: widgets, Config: Config.modules.webradio };
  }
}

export async function readyToShow() {
  if (fs.existsSync(path.resolve(__dirname, 'assets', 'style.json'))) {
    let prop = fs.readJsonSync(path.resolve(__dirname, 'assets', 'style.json'), {
      throws: false,
    });

    currentwidgetState = prop.start;

    if (currentwidgetState) radioPlayer.openWebRadioWindow();
  } else {
    currentwidgetState = false;
  }
  Avatar.Interface.refreshWidgetInfo({
    plugin: 'webradio',
    id: '444555',
  });
}

export async function getNewButtonState() {
  return currentwidgetState === true ? 'Off' : 'On';
}

export async function getPeriphInfo() {
  return periphInfo;
}

export async function widgetAction(even) {
  let widgetCommands = extractCommands(even);

  even.action = { remote: false };

  if (widgetCommands[0]) {
    switch (widgetCommands[0].command) {
      case 'alarm':
        managerWindows.launchWindow();
        break;
      case 'radio':
        radioPlayer.play(even, false, widgetCommands[0].value);
        break;
      default:
        break;
    }
  }

  currentwidgetState = even.value.action === 'On' ? true : false;
  if (!WebRadioWindow && even.value.action === 'On') {
    return radioPlayer.openWebRadioWindow(selectRadio);
  }
  if (WebRadioWindow && even.value.action === 'Off') {
    WebRadioWindow.destroy();
    return radioPlayer.saveSettings(false);
  }
}

const extractCommands = (obj) => {
  const action = obj.value.action;

  const commands = action.split('=').slice(1);

  return commands.map((cmd) => {
    const [command, ...values] = cmd.split('~');
    return {
      command,
      value: values.join('~'), // Conserve les ~ dans la valeur si présents
    };
  });
};
