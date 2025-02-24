import * as path from "node:path";
import * as url from "url";
import fs from "fs-extra";

const __dirname = url.fileURLToPath(new URL("../../", import.meta.url));

class AlarmClockManager {
    constructor() {
        this.dataTime = null;
    }

    async setCron(data) {
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
                const response = await this.askmeInfos(data);
                if (response) {
                    Avatar.speak(data.Locale.get(["alarm.cron", `${response.heures}:${response.minutes}` ?? "00"]), data.client, () => {
                        Avatar.clientPlugin(client, "webradio", data);
                    });
                }
            } else {
                Avatar.speak(data.Locale.get("alarm.error"), data.client);
            }
        }
    }

    async askmeInfos(data) {
        const askmeKeys = { "*": "generic", ...Config.modules.webradio["search"][data.language] };

        return new Promise((resolve) => {
            Avatar.askme(data.Locale.get("alarm.askmeTime"), data.client, askmeKeys, 15, async (answer, end) => {
                end(data.client);

                if (answer && answer.includes("generic")) {
                    const answerResponse = answer.split(":")[1];
                    const response = this.extraireInfos(answerResponse);
                    await this.saveCron(response);
                    resolve(response);
                } else {
                    switch (answer) {
                        case "done":
                        default:
                            Avatar.speak(data.Locale.get("alarm.finish"), data.client);
                            resolve(null);
                    }
                }
            });
        });
    }

    extraireInfos(valeur) {
        const regexHeure = /(\d{1,2})h(\d{0,2})/;
        const matchHeure = valeur.match(regexHeure);

        let heures = null;
        let minutes = null;

        if (matchHeure) {
            heures = parseInt(matchHeure[1], 10);
            minutes = matchHeure[2] ? parseInt(matchHeure[2], 10) : 0;
        }

        //A Voir pour la langue eng
        const regexJours = /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/gi;
        const matchJours = valeur.match(regexJours);

        let jours = null;

        if (matchJours) {
            // Convertir les jours en numéros (1 pour lundi, 2 pour mardi, etc.)
            const joursEnNumero = matchJours.map((jour) => {
                switch (jour.toLowerCase()) {
                    case "lundi":
                        return 1;
                    case "mardi":
                        return 2;
                    case "mercredi":
                        return 3;
                    case "jeudi":
                        return 4;
                    case "vendredi":
                        return 5;
                    case "samedi":
                        return 6;
                    case "dimanche":
                        return 7;
                    default:
                        return null;
                }
            });

            // Si c'est une plage de jours (ex: "du lundi au vendredi")
            if (valeur.includes("au")) {
                const premierJour = joursEnNumero[0];
                const dernierJour = joursEnNumero[joursEnNumero.length - 1];
                jours = `${premierJour}-${dernierJour}`;
            } else {
                // Sinon, on liste les jours séparément
                jours = joursEnNumero.join(",");
            }
        }
        return {
            heures,
            minutes,
            jours,
        };
    }

    async saveCron(value) {
        const configPath = path.resolve(__dirname, "webradio.prop");
        let config = {};

        if (fs.existsSync(configPath)) {
            const fileContent = fs.readFileSync(configPath, "utf8");
            config = JSON.parse(fileContent);
        }
        let time = `${value.minutes} ${value.heures} * * ${value.jours}`;

        config.cron.webradio.time = time;

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
}

export const radioAlarmClock = new AlarmClockManager();
