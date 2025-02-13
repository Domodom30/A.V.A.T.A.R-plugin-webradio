import * as path from "node:path";
import * as url from "url";
import fs from "fs-extra";
import axios from "axios";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

import * as widgetLib from "../../../widgetLibrairy.js";

const Widget = await widgetLib.init();

let periphInfo = [];
let sentenceRadio = [];
let Locale;
let currentwidgetState;
let WebRadioWindow;
let listeRadios;

const widgetFolder = path.resolve(__dirname, "assets/widget");
const widgetImgFolder = path.resolve(__dirname, "assets/images/widget");

export async function onClose(widgets) {
    if (Config.modules.webradio.widget.display === true) {
        await Widget.initVar(widgetFolder, widgetImgFolder, null, Config.modules.webradio);
        if (widgets) await Widget.saveWidgets(widgets);
    }

    save_params(false);
}

export async function init() {
    if (!(await Avatar.lang.addPluginPak("webradio"))) {
        return error("webradio: unable to load language pak files");
    }

    Locale = await Avatar.lang.getPak("webradio", Config.language);

    if (!Locale) {
        return error(`webradio: Unable to find the '${Config.language}' language pak.`);
    }

    listeRadios = await searchTopRadios();

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

export async function action(data, callback) {
    if (!Locale) {
        return errStart("No language pack available. first, add a language pack for the current language.", callback);
    }

    Locale = await Avatar.lang.getPak("webradio", Config.language);

    const tblActions = {
        play: () => {
            sentenceRadio = [];
            compareSearchRadio(data.action.radio, listeRadios.resultat);
            if (sentenceRadio) {
                if (WebRadioWindow) {
                    Avatar.speak(Locale.get("message.launch"), data.client, () => {
                        WebRadioWindow.webContents.send("name-radio", sentenceRadio);
                    });
                } else {
                    setPlay(data);
                }
            } else {
                Avatar.speak(Locale.get("error.noradio"), data.client);
            }
        },
        stop: () => {
            setStop(data);
        },
    };

    tblActions[data.action.command]();

    info("webradio: ", data.action.command, L.get("plugin.from"), data.client);

    callback();
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
        let prop = fs.readJsonSync(path.resolve(__dirname, "assets", "style.json"), { throws: false });

        currentwidgetState = prop.start;

        if (currentwidgetState) openWebRadioWindow();
    } else {
        currentwidgetState = false;
    }
    Avatar.Interface.refreshWidgetInfo({ plugin: "webradio", id: "444555" });
}

export async function getNewButtonState() {
    return currentwidgetState === true ? "Off" : "On";
}

export async function getPeriphInfo() {
    return periphInfo;
}

export async function widgetAction(even) {
    currentwidgetState = even.value.action === "On" ? true : false;
    if (!WebRadioWindow && even.value.action === "On") return openWebRadioWindow();
    if (WebRadioWindow && even.value.action === "Off") {
        WebRadioWindow.destroy();
        save_params(false);
    }
}

const openWebRadioWindow = async () => {
    if (WebRadioWindow) return WebRadioWindow.show();

    let style = {
        parent: Avatar.Interface.mainWindow(),
        frame: false,
        movable: true,
        resizable: false,
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

    if (fs.existsSync(path.resolve(__dirname, "assets", "style.json"))) {
        let prop = fs.readJsonSync(path.resolve(__dirname, "assets", "style.json"), { throws: false });
        if (prop) {
            style.x = prop.x;
            style.y = prop.y;
        }
    }

    WebRadioWindow = await Avatar.Interface.BrowserWindow(style, path.resolve(__dirname, "html", "webradio.html"), false);

    WebRadioWindow.once("ready-to-show", () => {
        WebRadioWindow.show();
        save_params(true);
        WebRadioWindow.webContents.send("onInit-webradio");
        if (Config.modules.webradio.devTools) WebRadioWindow.webContents.openDevTools();
    });

    Avatar.Interface.ipcMain().on("webradio-quit", () => {
        Avatar.Interface.refreshWidgetInfo({ plugin: "webradio", id: "444555" });
        save_params(false);
        WebRadioWindow.destroy();
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

    // Top Radios
    Avatar.Interface.ipcMain().handle("webradio-top", async (_event) => {
        return await searchTopRadios();
    });

    Avatar.Interface.ipcMain().handle("webradio-radio", async (_event) => {
        return sentenceRadio;
    });

    Avatar.Interface.ipcMain().handle("webradio-msg", async (_event, arg) => {
        return Locale.get(arg);
    });

    WebRadioWindow.on("closed", () => {
        currentwidgetState = false;
        Avatar.Interface.ipcMain().removeHandler("webradio-msg");
        Avatar.Interface.ipcMain().removeHandler("webradio-config");
        Avatar.Interface.ipcMain().removeHandler("webradio-top");
        Avatar.Interface.ipcMain().removeHandler("webradio-radio");
        Avatar.Interface.ipcMain().removeAllListeners("webradio-quit");
        sentenceRadio = [];
        WebRadioWindow = null;
    });
};

const setPlay = (data) => {
    if (!data.action.remote) {
        const client = Avatar.getTrueClient(data.toClient);
        const clientInfos = Avatar.Socket.getClient(client);

        if (Config.http.ip === clientInfos.ip) {
            Avatar.speak(Locale.get("message.launch"), client, () => {
                openWebRadioWindow();
            });
        } else {
            Avatar.speak(Locale.get("message.launch"), data.client, () => {
                data.action.remote = true;
                Avatar.clientPlugin(client, "webradio", data);
            });
        }
    } else {
        openWebRadioWindow();
    }
};

const setStop = (data) => {
    if (!data.action.remote) {
        const client = Avatar.getTrueClient(data.toClient);
        const clientInfos = Avatar.Socket.getClient(client);

        if (Config.http.ip === clientInfos.ip) {
            Avatar.speak(Locale.get("message.stopradio"), client, () => {
                WebRadioWindow.destroy();
            });
        } else {
            Avatar.speak(Locale.get("message.stopradio"), data.client, () => {
                data.action.remote = true;
                Avatar.clientPlugin(client, "webradio", data);
            });
        }
    } else {
        WebRadioWindow.destroy();
    }
};

const searchTopRadios = async () => {
    const nbradio = Config.modules.webradio.search.nbradio;
    const radioStart = Config.modules.webradio.selection.radio;

    try {
        const apiUrl = `https://de1.api.radio-browser.info/json/stations/bycountry/france?countrycode=FR&order=clickcount&reverse=true`;
        let result = await axios.get(apiUrl);

        // Filtrer les radios pour ne garder que celles avec une image
        const stations = result.data.filter((radio) => radio.favicon && radio.favicon.trim() !== "");

        // Trier les stations par popularité (votes)
        const sortedStations = stations.sort((a, b) => b.votes - a.votes);

        // Supprimer les doublons (basé sur le nom de la radio)
        const uniqueStations = [];
        const seenNames = new Set();

        for (const station of sortedStations) {
            if (!seenNames.has(station.name)) {
                seenNames.add(station.name);
                uniqueStations.push(station);
            }
        }

        const topStations = uniqueStations.slice(0, nbradio);
        const sortedByName = topStations.sort((a, b) => a.name.localeCompare(b.name));

        const resultat = sortedByName.map((station) => ({
            name: station.name,
            genre: station.tags.split(",").slice(0, 2).join(" - ") ? station.tags.split(",").slice(0, 2).join(" - ") : " Aucune info ",
            audio_stream: station.url,
            audio_stream_resolved: station.url_resolved,
            cover_art_url: station.favicon ? station.favicon : path.resolve(__dirname, "assets", "images", "webradio.png"),
        }));

        const StationFavori = Config.modules.webradio.selection.favoris;

        if (StationFavori.length) {
            for (let i = 0; i < StationFavori.length; i++) {
                const element = StationFavori[i];

                // Rechercher les radios dans les favoris fichier prop
                const stationUrl = `http://de1.api.radio-browser.info/json/stations/search?name=${element}&country=France&limit=1`;
                const stationResult = await axios.get(stationUrl);

                // Si des résultats sont trouvés, les ajouter à `resultat`
                if (stationResult.data.length > 0) {
                    const stationResultat = stationResult.data[0];
                    const formattedStation = {
                        name: stationResultat.name,
                        genre: stationResultat.tags.split(",").slice(0, 2).join(" - ") ? stationResultat.tags.split(",").slice(0, 2).join(" - ") : " Aucune info ",
                        audio_stream: stationResultat.url,
                        audio_stream_resolved: stationResultat.url_resolved,
                        cover_art_url: stationResultat.favicon ? stationResultat.favicon : path.resolve(__dirname, "assets", "images", "webradio.png"),
                    };
                    resultat.push(formattedStation);
                }
            }
        }

        // Rechercher la station correspondante à radioStart (insensible à la casse)
        const selectedStation = uniqueStations.find((station) => station.name.toLowerCase() === radioStart.toLowerCase());

        const radioStartInfo = selectedStation
            ? {
                  name: selectedStation.name,
                  genre: selectedStation.tags.split(",").slice(0, 2).join(" - ") ? selectedStation.tags.split(",").slice(0, 2).join(" - ") : " Aucune info ",
                  audio_stream: selectedStation.url,
                  audio_stream_resolved: selectedStation.url_resolved,
                  cover_art_url: selectedStation.favicon ? selectedStation.favicon : path.resolve(__dirname, "assets", "images", "webradio.png"),
              }
            : null;

        return { resultat: resultat, radioStart: radioStartInfo };
    } catch (err) {
        return { error: Locale.get("error.error") };
    }
};

const save_params = async (start) => {
    const styleFilePath = path.resolve(__dirname, "assets", "style.json");
    let style = {};

    if (fs.existsSync(styleFilePath)) {
        style = fs.readJsonSync(styleFilePath, { throws: false }) || {};
    }

    if (WebRadioWindow) {
        const [x, y] = WebRadioWindow.getPosition();
        style = { ...style, x, y, start };
    } else {
        style.start = start;
    }

    fs.writeJsonSync(styleFilePath, style);
};

const compareSearchRadio = async (searchRadio, listeRadios) => {
    sentenceRadio = [];
    let resultRadio = searchRadio.join(" ").toLowerCase();
    for (let i = 0; i < listeRadios.length; i++) {
        if (resultRadio == listeRadios[i].name.toLowerCase()) {
            sentenceRadio.push({
                name: listeRadios[i].name,
                genre: listeRadios[i].genre,
                audio_stream: listeRadios[i].audio_stream,
                cover_art_url: listeRadios[i].cover_art_url,
            });
        }
    }
    return sentenceRadio;
};
