import * as path from "node:path";
import * as url from "url";
import fs from "fs-extra";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

class AlarmClockManager {

    extraireInfos(valeur) {
        const regexHeure = /(\d{1,2})h(\d{0,2})/;
        const matchHeure = valeur.match(regexHeure);

        let heures = null;
        let minutes = null;

        if (matchHeure) {
            heures = parseInt(matchHeure[1], 10);
            minutes = matchHeure[2] ? parseInt(matchHeure[2], 10) : 0;
        }

        const regexJours = /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/gi;
        const matchJours = valeur.match(regexJours);

        let jours = null;

        if (matchJours) {
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
                        return 0;
                    default:
                        return null;
                }
            });

            if (valeur.includes("au")) {
                const premierJour = joursEnNumero[0];
                const dernierJour = joursEnNumero[joursEnNumero.length - 1];
                jours = `${premierJour}-${dernierJour}`;
            } else {
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
        const configPath = path.resolve(__dirname, ".." , "..", "webradio.prop");
        let config = {};

        if (fs.existsSync(configPath)) {
            const fileContent = fs.readFileSync(configPath, "utf8");
            config = JSON.parse(fileContent);
        }

        // Formater l'heure et les jours au format cron
        let time = `${value.minutes} ${value.heures} * * ${value.jours}`;

        config.cron = config.cron || {};
        config.cron.webradio = config.cron.webradio || {};
        config.cron.webradio.time = time;

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
}

export const radioAlarmClock = new AlarmClockManager();