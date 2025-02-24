import * as path from "node:path";
import * as url from "url";
import fs from "fs-extra";
import axios from "axios";

const __dirname = url.fileURLToPath(new URL("../../", import.meta.url));

class MusicManager {
    constructor() {
        this.listeRadios = [];
    }

    async searchTopRadios() {
        const nbradio = Config.modules.webradio.player.nbradio;
        const Locale = await Avatar.lang.getPak("webradio", Config.language);
        try {
            const apiUrl = `https://de1.api.radio-browser.info/json/stations/bycountry/france?countrycode=FR&order=clickcount&reverse=true&limit=${nbradio}`;
            let result = await axios.get(apiUrl);

            const stations = result.data.filter((radio) => radio.favicon && radio.favicon.trim() !== "");
            const sortedStations = stations.sort((a, b) => b.votes - a.votes);

            const uniqueStations = [];
            const seenNames = new Set();

            for (const station of sortedStations) {
                if (!seenNames.has(station.name)) {
                    seenNames.add(station.name);
                    uniqueStations.push(station);
                }
            }

            const sortedByName = uniqueStations.sort((a, b) => a.name.localeCompare(b.name));
            const resultat = sortedByName.map((station) => ({
                name: station.name,
                genre: station.tags.split(",").slice(0, 2).join(" - ") || Locale.get("music.noTag"),
                audio_stream: station.url,
                audio_stream_resolved: station.url_resolved,
                cover_art_url: station.favicon || path.resolve(__dirname, "assets", "images", "webradio.png"),
            }));

            const StationFavori = Config.modules.webradio.player.favoris;

            if (StationFavori.length) {
                for (let element of StationFavori) {
                    const stationUrl = `http://de1.api.radio-browser.info/json/stations/search?name=${element}&country=France&limit=1`;
                    const stationResult = await axios.get(stationUrl);

                    if (stationResult.data.length > 0) {
                        const stationResultat = stationResult.data[0];
                        const formattedStation = {
                            name: stationResultat.name,
                            genre: stationResultat.tags.split(",").slice(0, 2).join(" - ") || Locale.get("music.noTag"),
                            audio_stream: stationResultat.url,
                            audio_stream_resolved: stationResultat.url_resolved,
                            cover_art_url: stationResultat.favicon || path.resolve(__dirname, "assets", "images", "webradio.png"),
                        };
                        resultat.push(formattedStation);
                    }
                }
            }
            return resultat;
        } catch (err) {
            console.log(err);
        }
    }

    async searchWebRadio(element) {
        let resultat = [];
        const Locale = await Avatar.lang.getPak("webradio", Config.language);

        const stationUrl = `http://de1.api.radio-browser.info/json/stations/search?name=${element}&country=France&limit=1`;
        const stationResult = await axios.get(stationUrl);

        if (stationResult.data.length > 0) {
            const stationResultat = stationResult.data[0];
            const formattedStation = {
                name: stationResultat.name,
                genre: stationResultat.tags.split(",").slice(0, 2).join(" - ") || Locale.get("music.noTag"),
                audio_stream: stationResultat.url,
                audio_stream_resolved: stationResultat.url_resolved,
                cover_art_url: stationResultat.favicon || path.resolve(__dirname, "assets", "images", "webradio.png"),
            };
            resultat.push(formattedStation);
        }
        return resultat;
    }

    async search(data, listeRadios) {
        const askmeKeys = { "*": "generic", ...Config.modules.webradio["search"][data.language] };

        return new Promise((resolve) => {
            Avatar.askme(data.Locale.get("music.askme"), data.client, askmeKeys, 15, async (answer, end) => {
                end(data.client);

                if (answer && answer.includes("generic")) {
                    const answerResponse = answer.split(":")[1];
                    if (answerResponse.includes("genre")) {
                        const responseGenre = answerResponse.split("genre")[1].trim();

                        const responseRadio = await this.compareSearchRadiobyGenre(data, listeRadios, responseGenre);
                        if (responseRadio) {
                            resolve(responseRadio);
                        }
                    } else {
                        const responseRadio = await this.compareSearchRadio(data, listeRadios, answerResponse);
                        resolve(responseRadio);
                    }
                } else {
                    switch (answer) {
                        case "radioMapping":
                            break;
                        case "done":
                        default:
                            Avatar.speak("Terminé", data.client);
                            resolve(null);
                    }
                }
            });
        });
    }

    async compareSearchRadio(data, listeRadios, searchRadio) {
        try {
            const searchTerm = searchRadio.toLowerCase();
            const matchingRadios = listeRadios.filter((radio) => radio.name.toLowerCase() === searchTerm);

            if (matchingRadios.length === 0) {
                Avatar.speak(
                    data.Locale.get("music.notFound"),
                    data.client,
                    () => {
                        this.search(data, listeRadios, searchRadio);
                    },
                    false
                );
                return;
            }

            if (matchingRadios.length > 1) {
                Avatar.speak(
                    `J'ai trouvé plusieurs radios ${searchRadio}.`,
                    data.client,
                    () => {
                        this.search(data, listeRadios, searchRadio);
                    },
                    false
                );
                return;
            }

            return {
                name: matchingRadios[0].name,
                genre: matchingRadios[0].genre,
                audio_stream: matchingRadios[0].audio_stream,
                cover_art_url: matchingRadios[0].cover_art_url,
            };
        } catch (error) {
            console.error("Erreur dans compareSearchRadio :", error);
            throw error;
        }
    }

    async compareSearchRadiobyGenre(data, listeRadios, searchGenre) {
        
        try {
            const searchTerm = searchGenre.toLowerCase();
            const matchingRadios = listeRadios.filter((radio) => radio.genre.toLowerCase() === searchTerm);
            

    return listeRadios.filter(radio => {
        const radioGenreLower = radio.genre.toLowerCase();
        return radioGenreLower.includes(searchTerm);
    });



            if (matchingRadios.length === 0) {
                Avatar.speak(
                    data.Locale.get("music.notFound"),
                    data.client,
                    () => {
                        this.search(data, listeRadios, searchGenre);
                    },
                    false
                );
                return;
            }

            if (matchingRadios.length > 1) {
                Avatar.speak(
                    `J'ai trouvé plusieurs radios ${searchGenre}.`,
                    data.client,
                    () => {
                        this.search(data, listeRadios, searchGenre);
                    },
                    false
                );
                return;
            }

            return {
                name: matchingRadios[0].name,
                genre: matchingRadios[0].genre,
                audio_stream: matchingRadios[0].audio_stream,
                cover_art_url: matchingRadios[0].cover_art_url,
            };
        } catch (error) {
            console.error("Erreur dans compareSearchRadio :", error);
            throw error;
        }
    }

    saveRadioFavoris(nameRadio) {
        const configPath = path.resolve(__dirname, "webradio.prop");
        let config = {};

        if (fs.existsSync(configPath)) {
            const fileContent = fs.readFileSync(configPath, "utf8");
            config = JSON.parse(fileContent);
        }
        let favoris = config.modules.webradio.player.favoris;
        favoris.push(nameRadio);

        config.modules.webradio.player.favoris = favoris;

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }

    saveRadio(nameRadio) {
        if (!nameRadio) {
            return;
        }
        const propFilePath = path.resolve(__dirname, "webradio.prop");
        let config = {};

        if (fs.existsSync(propFilePath)) {
            const fileContent = fs.readFileSync(propFilePath, "utf8");
            config = JSON.parse(fileContent);
        }

        config.modules.webradio.player.radio = nameRadio;

        fs.writeFileSync(propFilePath, JSON.stringify(config, null, 2));
    }
}
export const radioMusic = new MusicManager();
