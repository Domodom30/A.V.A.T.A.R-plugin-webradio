import * as path from "node:path";
import fs from "fs-extra";
import * as url from "url";
import { radioMusic } from "./music.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

class MusicMapping {
    constructor() {
        this.musicMappingWindow = null;
    }

    async init() {
        if (!(await Avatar.lang.addPluginPak("webradio"))) return;
        this.Locale = await Avatar.lang.getPak("webradio", Config.language);
        this.listeRadios = await radioMusic.searchTopRadios();
    }

    async openWindowMapping(data, searchRadio, listeRadios) {
        this.Locale = await Avatar.lang.getPak("webradio", Config.language);
        if (this.musicMappingWindow) return this.musicMappingWindow.show();

        if (!listeRadios) { listeRadios = await radioMusic.searchTopRadios();
        }

        let style = {
            parent: Avatar.Interface.mainWindow(),
            frame: false,
            movable: true,
            resizable: true,
            minimizable: false,
            alwaysOnTop: false,
            show: false,
            width: 420,
            minWidth: 420,
            height: 290,
            minHeight: 290,
            icon: path.resolve(__dirname, "..", "..", "assets", "images", "webradio.png"),
            webPreferences: {
                preload: path.resolve(__dirname, "..", "mapping", "mapping-preload.js"),
            },
            title: "Music mapping",
        };

        if (fs.existsSync(path.resolve(__dirname, "..", "..", "assets", "style.json"))) {
            const prop = fs.readJsonSync(path.resolve(__dirname, "..", "mapping", "style.json"), { throws: false });
            if (prop) {
                style.x = prop.x;
                style.y = prop.y;
            }
        }

        this.musicMappingWindow = await Avatar.Interface.BrowserWindow(style, path.resolve(__dirname, "..", "mapping", "mapping.html"), false);

        this.musicMappingWindow.once("ready-to-show", () => {
            this.musicMappingWindow.show();
            this.musicMappingWindow.webContents.send("onInit-musicMapping", searchRadio, Config.modules.webradio.mappingRules, radioMusic.listeRadiosToObject(listeRadios));
            if (Config.modules.webradio.devTools) this.musicMappingWindow.webContents.openDevTools();
        });

        Avatar.Interface.ipcMain().on("quit-mapping", () => {
            this.musicMappingWindow.destroy();
        });

        Avatar.Interface.ipcMain().handle("apply-mapping", async (_event, mapping) => {
            return await this.applyMapping(mapping);
        });

        Avatar.Interface.ipcMain().handle("mapping-msg", async (_event, arg) => {
            return this.Locale.get(arg);
        });

        this.musicMappingWindow.on("closed", () => {
            Avatar.Interface.ipcMain().removeHandler("mapping-msg");
            Avatar.Interface.ipcMain().removeHandler("apply-mapping");
            Avatar.Interface.ipcMain().removeAllListeners("quit-mapping");
            this.musicMappingWindow = null;
        });
    }


    async openWindowAlarm() {
        if (this.musicAlarmWindow) return this.musicAlarmWindow.show();

        let style = {
            parent: Avatar.Interface.mainWindow(),
            frame: false,
            movable: true,
            resizable: true,
            minimizable: false,
            alwaysOnTop: false,
            show: false,
            width: 420,
            minWidth: 420,
            height: 290,
            minHeight: 290,
            icon: path.resolve(__dirname, "..", "..", "assets", "images", "webradio.png"),
            webPreferences: {
                preload: path.resolve(__dirname, "..", "alarm", "alarm-preload.js"),
            },
            title: "Music Alarm Clock",
        };

        if (fs.existsSync(path.resolve(__dirname, "..", "..", "assets", "style.json"))) {
            const prop = fs.readJsonSync(path.resolve(__dirname, "..", "alarm", "style.json"), { throws: false });
            if (prop) {
                style.x = prop.x;
                style.y = prop.y;
            }
        }

        this.musicAlarmWindow = await Avatar.Interface.BrowserWindow(style, path.resolve(__dirname, "..", "alarm", "cron.html"), false);

        this.musicAlarmWindow.once("ready-to-show", () => {
            this.musicAlarmWindow.show();
            this.musicAlarmWindow.webContents.send("onInit-musicAlarm");
            if (Config.modules.webradio.devTools) this.musicAlarmWindow.webContents.openDevTools();
        });

        Avatar.Interface.ipcMain().on("quit-alarm", () => {
            this.musicAlarmWindow.destroy();
        });

        Avatar.Interface.ipcMain().handle("apply-alarm", async (_event, alarm) => {
            return await this.applyAlarm(alarm);
        });

        Avatar.Interface.ipcMain().handle("alarm-msg", async (_event, arg) => {
            return data.Locale.get(arg);
        });

        this.musicAlarmWindow.on("closed", () => {
            Avatar.Interface.ipcMain().removeHandler("alarm-msg");
            Avatar.Interface.ipcMain().removeHandler("apply-alarm");
            Avatar.Interface.ipcMain().removeAllListeners("quit-alarm");
            this.musicAlarmWindow = null;
        });
    }


    async applyMapping(mapping) {
        try {
            if (mapping.exist) {
                Config.modules.webradio.mappingRules[mapping.list].push(mapping.sentence);
            } else {
                Config.modules.webradio.mappingRules[mapping.list] = [mapping.sentence];
            }

            fs.writeJsonSync(path.resolve(__dirname, "..", "..", "webradio.prop"), {
                modules: {
                    webradio: Config.modules.webradio,
                },
            });
            return true;
        } catch (err) {
            console.error("webradio:", err || err.stack);
            return false;
        }
    }

    async launchWindowClient(data) {

        if (!data) { data = {}; }
        if (!data.action) { data.action = {};}

        data.action.remote = true;
        
        if (!data.action.remote) {
            data.action.remote = true;

            // true = sur le serveur A.V.A.T.A.R, false = sur le client qui se trouve sur la même machine que le serveur
            const onServer = Config.modules.webradio.onServer;

            const client = Avatar.getTrueClient(data.toClient);
            const clientInfos = Avatar.Socket.getClient(client);
            const sameIP = Config.http.ip === clientInfos.ip;

            if (clientInfos.is_mobile) {
                return;
            }

            if (!onServer || !sameIP) {
                Avatar.clientPlugin(client, "webradio", { action: { command: "launchWindowClient", searchRadio: "metallica" } });
            } else {
                this.openWindowMapping(data, "metallica");
            }
        } else {
            this.openWindowMapping(data, "metallica");
        }
    }
}

// Usage example
export const musicMapping = new MusicMapping();
