import * as path from "node:path";
import * as url from "url";
import fs from "fs-extra";

import { radioMusic } from "./music.js";

const __dirname = url.fileURLToPath(new URL("../../", import.meta.url));

class WebRadioManager {
    constructor() {
        this.responseRadio = [];
        this.listeRadios = [];
        this.Locale = null;
        this.currentwidgetState = false;
        this.WebRadioWindow = null;
        this.lastNameRadio = null;
    }

    async init() {
        if (!(await Avatar.lang.addPluginPak("webradio"))) return;
        this.Locale = await Avatar.lang.getPak("webradio", Config.language);
        this.listeRadios = await radioMusic.searchTopRadios();
    }

    async openWebRadioWindow(valueRadio) {
        // if (this.WebRadioWindow) return this.WebRadioWindow.show();
        if (this.WebRadioWindow) this.WebRadioWindow.destroy();

        if (!valueRadio) {
            let prop = {};
            if (fs.existsSync(path.resolve(__dirname, "webradio.prop"))) {
                prop = fs.readJsonSync(path.resolve(__dirname, "webradio.prop"), {
                    throws: false,
                });
            }
            valueRadio = prop.modules.webradio.player.radio;
        }

        const style = {
            parent: Avatar.Interface.mainWindow(),
            frame: false,
            movable: true,
            resizable: true,
            minimizable: false,
            alwaysOnTop: false,
            show: false,
            width: Config.modules.webradio.window.width,
            height: Config.modules.webradio.window.height,
            opacity: Config.modules.webradio.window.opacity,
            icon: path.resolve(__dirname, "assets", "images", "webradio.png"),
            webPreferences: {
                preload: path.resolve(__dirname, "html", "webradio-preload.js"),
            },
            title: "Web Radio",
        };

        const styleFilePath = path.resolve(__dirname, "assets", "style.json");
        if (fs.existsSync(styleFilePath)) {
            const prop = await fs.readJson(styleFilePath, { throws: false });
            if (prop) {
                style.x = prop.x;
                style.y = prop.y;
            }
        }

        this.WebRadioWindow = await Avatar.Interface.BrowserWindow(style, path.resolve(__dirname, "html", "webradio.html"), false);

        this.WebRadioWindow.once("ready-to-show", async () => {
            this.WebRadioWindow.show();
            this.saveSettings(true);
            this.WebRadioWindow.webContents.send("onInit-webradio", valueRadio);

            if (Config.modules.webradio.devTools) this.WebRadioWindow.webContents.openDevTools();
        });

        Avatar.Interface.ipcMain().on("webradio-quit", () => {
            Avatar.Interface.refreshWidgetInfo({
                plugin: "webradio",
                id: "444555",
            });
            this.saveSettings(false);
            if (this.WebRadioWindow) {
                this.WebRadioWindow.destroy();
                this.WebRadioWindow = null; // Réinitialiser la référence
            }
        });

        // Top Radios
        Avatar.Interface.ipcMain().handle("webradio-top", async (_event) => {
            return this.listeRadios;
        });

        // Save Last Radio play
        Avatar.Interface.ipcMain().handle("webradio-save", async (_event, value) => {
            radioMusic.saveRadio(value);
        });

        // Save liste favorite radio
        Avatar.Interface.ipcMain().handle("webradio-save-favoris", async (_event, value) => {
            radioMusic.saveRadioFavoris(value);
        });

        // Config Radio
        Avatar.Interface.ipcMain().handle("webradio-config", async (_event) => {
            let prop = {};
            if (fs.existsSync(path.resolve(__dirname, "webradio.prop"))) {
                prop = fs.readJsonSync(path.resolve(__dirname, "webradio.prop"), {
                    throws: false,
                });
            }
            return prop.modules.webradio;
        });

        // last play Radio
        Avatar.Interface.ipcMain().handle("webradio-play-last-radio", async (_event) => {
            return this.lastNameRadio;
        });

        Avatar.Interface.ipcMain().handle("webradio-radio", async (_event) => {
            return this.responseRadio;
        });

        this.WebRadioWindow.on("closed", () => {
            this.currentwidgetState = false;
            Avatar.Interface.ipcMain().removeHandler("webradio-top");
            Avatar.Interface.ipcMain().removeHandler("webradio-msg");
            Avatar.Interface.ipcMain().removeHandler("webradio-save");
            Avatar.Interface.ipcMain().removeHandler("webradio-save-favoris");
            Avatar.Interface.ipcMain().removeHandler("webradio-config");
            Avatar.Interface.ipcMain().removeHandler("webradio-play-last-radio");
            Avatar.Interface.ipcMain().removeHandler("webradio-radio");
            Avatar.Interface.ipcMain().removeAllListeners("webradio-quit");
            this.WebRadioWindow = null; // Réinitialiser la référence
        });
    }

    async play(data, allClients, lastRadio) {
        let radio = null;

        if (!data.action.remote) {
            data.action.remote = true;

            if (!lastRadio) {
                radio = await radioMusic.search(data, this.listeRadios);
            }

            if (!radio || !radio.length) {
                // Si radio est undefined, null, ou un tableau vide, on utilise le nom de la radio par defaut dans config
                data.action.radio = radio?.name || Config.modules.webradio.player.radio;
            } else {
                // Si plusieurs radios sont disponibles, on en choisit une au hasard
                const randomIndex = Math.floor(Math.random() * radio.length);
                const selectedRadio = radio[randomIndex];
                data.action.radio = selectedRadio.name;
            }

            // true = sur le serveur A.V.A.T.A.R, false = sur le client qui se trouve sur la même machine que le serveur
            const onServer = Config.modules.webradio.onServer;

            if (allClients) {
                Avatar.speak(data.Locale.get(["player.openRadioAllRoom"], data.action.radio), data.client, () => {
                    const clients = Avatar.Socket.getClients();
                    clients.forEach((client) => {
                        if (client.is_mobile) return;
                        const sameIP = Config.http.ip === client.ip;
                        if (!onServer || !sameIP) {
                            Avatar.clientPlugin(client.name, "webradio", data);
                        } else {
                            this.openWebRadioWindow(data.action.radio);
                        }
                    });
                });
            } else {
                const client = Avatar.getTrueClient(data.toClient);
                const clientInfos = Avatar.Socket.getClient(client);
                const sameIP = Config.http.ip === clientInfos.ip;

                if (clientInfos.is_mobile) {
                    Avatar.speak(data.Locale.get("player.radioNoMobile"), data.client);
                    return;
                }

                if (!onServer || !sameIP) {
                    Avatar.speak(data.Locale.get(["player.openRadio", data.action.radio, client]), data.client, () => {
                        Avatar.clientPlugin(client, "webradio", data);
                    });
                } else {
                    Avatar.speak(data.Locale.get(["player.openRadio", data.action.radio, client]), data.client, () => {
                        this.openWebRadioWindow(data.action.radio);
                    });
                }
            }
        } else {
            this.openWebRadioWindow(data.action.radio);
        }
    }

    stop(data, allClients) {
        if (!data.action.remote) {
            data.action.remote = true;

            // true = sur le serveur A.V.A.T.A.R, false = sur le client qui se trouve sur la même machine que le serveur
            const onServer = Config.modules.webradio.onServer;

            if (allClients) {
                Avatar.speak(data.Locale.get(["player.stopRadio", data.client]), data.client, () => {
                    const clients = Avatar.Socket.getClients();
                    clients.forEach((client) => {
                        if (client.is_mobile) return;
                        const sameIP = Config.http.ip === client.ip;
                        if (!onServer || !sameIP) {
                            Avatar.clientPlugin(client.name, "webradio", data);
                        } else {
                            this.WebRadioWindow.destroy();
                        }
                    });
                });
            } else {
                const client = Avatar.getTrueClient(data.toClient);
                const clientInfos = Avatar.Socket.getClient(client);
                const sameIP = Config.http.ip === clientInfos.ip;

                if (clientInfos.is_mobile) {
                    return;
                }

                if (!onServer || !sameIP) {
                    Avatar.speak(data.Locale.get(["player.stopRadio", client]), data.client, () => {
                        Avatar.clientPlugin(client, "webradio", data);
                    });
                } else {
                    Avatar.speak(data.Locale.get(["player.stopRadio", data.client]), data.client, () => {
                        this.WebRadioWindow.destroy();
                    });
                }
            }
        } else {
            this.WebRadioWindow.destroy();
        }
    }

    saveSettings(start) {
        const styleFilePath = path.resolve(__dirname, "assets", "style.json");
        let style = {};

        if (fs.existsSync(styleFilePath)) {
            style = fs.readJsonSync(styleFilePath, { throws: false }) || {};
        }

        if (this.WebRadioWindow) {
            const [x, y] = this.WebRadioWindow.getPosition();
            style = { ...style, x, y, start };
        } else {
            style.start = start;
        }

        fs.writeJsonSync(styleFilePath, style);
    }
}

// Exportation d'une instance unique de WebRadioManager
export const radioPlayer = new WebRadioManager();
