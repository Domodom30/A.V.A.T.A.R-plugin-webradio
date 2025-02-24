import * as path from "node:path";
import * as url from "url";
import fs from "fs-extra";
import { radioPlayer } from "./lib/services/player.js";
import { radioAlarmClock } from "./lib/services/alarm.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

import * as widgetLib from "../../../widgetLibrairy.js";


const Widget = await widgetLib.init();
await radioPlayer.init();

let periphInfo = [];
let Locale, currentwidgetState, WebRadioWindow, selectRadio;

const widgetFolder = path.resolve(__dirname, "assets/widget");
const widgetImgFolder = path.resolve(__dirname, "assets/images/widget");

export async function onClose(widgets) {
    if (Config.modules.webradio.widget.display === true) {
        await Widget.initVar(widgetFolder, widgetImgFolder, null, Config.modules.webradio);
        if (widgets) await Widget.saveWidgets(widgets);
    }

    radioPlayer.saveSettings(false);
}

export async function init() {
    if (!(await Avatar.lang.addPluginPak("webradio"))) return;
    Locale = await Avatar.lang.getPak("webradio", Config.language);

    periphInfo.push({
        Buttons: [
            {
                name: "webradio",
                value_type: "button",
                usage_name: "Button",
                periph_id: "444555",
                notes: "Open webradio",
            },
        ],
    });
}

export async function cron() {
    radioPlayer.openWebRadioWindow()
}

export async function action(data, callback) {
    if (!Locale) {
        return errStart("No language pack available. first, add a language pack for the current language.", callback);
    }

    data.Locale = Locale = await Avatar.lang.getPak("webradio", data.language);

    try {
        // Table of actions
        const tblCommand = {
            play: () => radioPlayer.play(data, false),
            playLast: () => radioPlayer.play(data, false, true),
            playGroup: () =>  radioPlayer.play(data, true),
            stop: () => radioPlayer.stop(data, false),
            stopGroup: () => radioPlayer.stop(data, false),
            alarmClock: () => { radioAlarmClock.setCron(data)}
        };

        info("webradio:", data.action.command, L.get("plugin.from"), data.client, L.get("plugin.to"), data.toClient);

        tblCommand[data.action.command]();
    } catch (err) {
        if (data.client) Avatar.Speech.end(data.client);
        if (err.message) error(err.message);
    }
}

export async function getWidgetsOnLoad() {
    if (Config.modules.webradio.widget.display === true) {
        await Widget.initVar(widgetFolder, widgetImgFolder, null, Config.modules.webradio);
        let widgets = await Widget.getWidgets();
        return {
            plugin: "webradio",
            widgets: widgets,
            Config: Config.modules.webradio,
        };
    }
}

export async function readyToShow() {
    if (fs.existsSync(path.resolve(__dirname, "assets", "style.json"))) {
        let prop = fs.readJsonSync(path.resolve(__dirname, "assets", "style.json"), {
            throws: false,
        });

        currentwidgetState = prop.start;

        if (currentwidgetState) radioPlayer.openWebRadioWindow();
    } else {
        currentwidgetState = false;
    }
    Avatar.Interface.refreshWidgetInfo({
        plugin: "webradio",
        id: "444555",
    });
}

export async function getNewButtonState() {
    return currentwidgetState === true ? "Off" : "On";
}

export async function getPeriphInfo() {
    return periphInfo;
}

export async function widgetAction(even) {
    currentwidgetState = even.value.action === "On" ? true : false;
    if (!WebRadioWindow && even.value.action === "On") return radioPlayer.openWebRadioWindow(selectRadio);
    if (WebRadioWindow && even.value.action === "Off") {
        WebRadioWindow.destroy();
        radioPlayer.saveSettings(false);
    }
}