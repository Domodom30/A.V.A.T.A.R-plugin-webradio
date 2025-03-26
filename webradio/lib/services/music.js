import * as path from 'node:path';
import * as url from 'url';
import fs from 'fs-extra';
import axios from 'axios';
import { webRadioAPI } from './services.js';
import { musicMapping } from './helpers.js';

import * as radiobrowser from '../radio-browser.js';

const __dirname = url.fileURLToPath(new URL('../../', import.meta.url));
const API = new webRadioAPI(Config.modules.webradio.mappingRules);
const BASE_API_URL = (await radiobrowser.get_radiobrowser_base_url_random()) + '/json/stations';

class MusicManager {
   constructor() {
      this.listeRadios = [];
      this.configPath = path.resolve(__dirname, 'webradio.prop');
   }

   async getLocale() {
      return await Avatar.lang.getPak('webradio', Config.language);
   }

   formatStation(station, defaultImagePath, Locale) {
      return {
         name: station.name,
         genre: station.tags.split(',').slice(0, 2).join(' - ') || Locale.get('music.noTag'),
         audio_stream: station.url,
         audio_stream_resolved: station.url_resolved,
         cover_art_url: station.favicon || defaultImagePath,
      };
   }

   async searchTopRadios() {
      const { nbradio, favoris } = Config.modules.webradio.player;
      const Locale = await this.getLocale();
      const defaultImagePath = path.resolve(__dirname, 'assets', 'images', 'webradio.png');

      try {
         // Get top radios by click count
         const apiUrl = `${BASE_API_URL}/bycountry/france?countrycode=FR&order=clickcount&reverse=true&limit=${nbradio}`;
         const { data: stations } = await axios.get(apiUrl);

         // Process and filter stations
         const filteredStations = stations.filter((radio) => radio.favicon && radio.favicon.trim() !== '').sort((a, b) => b.votes - a.votes);

         // Remove duplicates
         const uniqueStations = [];
         const seenNames = new Set();

         for (const station of filteredStations) {
            if (!seenNames.has(station.name)) {
               seenNames.add(station.name);
               uniqueStations.push(station);
            }
         }

         // Sort by name and format
         const resultat = uniqueStations.sort((a, b) => a.name.localeCompare(b.name)).map((station) => this.formatStation(station, defaultImagePath, Locale));

         // Add favorite stations
         if (favoris.length) {
            const favoriteStations = await Promise.all(
               favoris.map(async (stationName) => {
                  const stationUrl = `${BASE_API_URL}/search?name=${stationName}&country=France&limit=1`;
                  const { data } = await axios.get(stationUrl);

                  if (data.length > 0) {
                     return this.formatStation(data[0], defaultImagePath, Locale);
                  }
                  return null;
               })
            );

            // Add non-null stations to the result
            resultat.push(...favoriteStations.filter(Boolean));
         }

         return resultat;
      } catch (err) {
         error('Erreur lors de la recherche des stations radio');
         return [];
      }
   }

   async searchWebRadio(element) {
      try {
         const Locale = await this.getLocale();
         const defaultImagePath = path.resolve(__dirname, 'assets', 'images', 'webradio.png');

         // Normalize element to remove accents
         const normalizedElement = element.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

         const stationUrl = `${BASE_API_URL}/search?name=${normalizedElement}&country=France&limit=1`;
         const { data } = await axios.get(stationUrl);

         if (data.length > 0) {
            return [this.formatStation(data[0], defaultImagePath, Locale)];
         }

         return [];
      } catch (err) {
         console.error('Error in searchWebRadio:', err);
         return [];
      }
   }

   async search(data, listeRadios, searchRadio) {
      const askmeKeys = { '*': 'generic', ...Config.modules.webradio['search'][data.language] };

      return new Promise((resolve) => {
         Avatar.askme(data.Locale.get('music.askme'), data.client, askmeKeys, 15, async (answer, end) => {
            end(data.client);

            if (answer && answer.includes('generic')) {
               const searchTerm = answer.split(':')[1];
               const normalizedSearch = API.searchCorrespondence(searchTerm);
               const responseRadio = await this.compareSearchRadio(data, listeRadios, normalizedSearch);
               resolve(responseRadio);
            } else {
               switch (answer) {
                  case 'musicMapping':
                     await musicMapping.launchWindowClient(data, searchRadio, this.listeRadiosToObject(listeRadios));
                     Avatar.speak(data.Locale.get('music.doMapping'), data.client);
                     break;
                  case 'done':
                  default:
                     Avatar.speak('Terminé', data.client);
                     resolve(null);
               }
            }
         });
      });
   }

   async searchAdv(data, searchRadio) {
      const Locale = await this.getLocale();
      const askmeKeys = { ...Config.modules.webradio['search'][data.language] };

      return new Promise((resolve) => {
         Avatar.askme(Locale.get('music.askmeAdv'), data.client, askmeKeys, 15, async (answer, end) => {
            end(data.client);

            switch (answer) {
               case 'search':
                  const response = await this.searchWebRadio(searchRadio);
                  resolve(response);
                  break;
               case 'musicMapping':
                  await musicMapping(data);
                  Avatar.speak(data.Locale.get('music.doMapping'), data.client);
                  break;
               case 'done':
               default:
                  Avatar.speak('Terminé', data.client);
                  resolve(null);
            }
         });
      });
   }

   async compareSearchRadio(data, listeRadios, searchRadio) {
      try {
         const searchTerm = searchRadio.toLowerCase();

         // Case-insensitive and partial matching
         const matchingRadios = listeRadios.filter((radio) => radio.name.toLowerCase().includes(searchTerm));

         // No radio found
         if (!matchingRadios || matchingRadios.length === 0) {
            return new Promise((resolve) => {
               Avatar.speak(
                  data.Locale.get('music.notFound'),
                  data.client,
                  () => {
                     resolve(this.search(data, listeRadios, searchRadio));
                  },
                  false
               );
            });
         }

         // Select a random radio if multiple matches
         const selectedRadio = matchingRadios.length > 1 ? matchingRadios[Math.floor(Math.random() * matchingRadios.length)] : matchingRadios[0];

         return {
            name: selectedRadio.name,
            genre: selectedRadio.genre,
            audio_stream: selectedRadio.audio_stream,
            cover_art_url: selectedRadio.cover_art_url,
         };
      } catch (error) {
         console.error('Error in compareSearchRadio:', error);
         return null;
      }
   }

   async compareSearchRadiobyGenre(data, listeRadios, searchGenre) {
      try {
         const searchTerm = searchGenre.toLowerCase();
         return listeRadios.filter((radio) => radio.genre.toLowerCase().includes(searchTerm));
      } catch (error) {
         console.error('Error in compareSearchRadiobyGenre:', error);
         return [];
      }
   }

   updateConfig(updateFn) {
      try {
         let config = {};

         if (fs.existsSync(this.configPath)) {
            const fileContent = fs.readFileSync(this.configPath, 'utf8');
            config = JSON.parse(fileContent);
         }

         updateFn(config);

         fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
         return true;
      } catch (error) {
         console.error('Error updating config:', error);
         return false;
      }
   }

   saveRadioFavoris(nameRadio) {
      return this.updateConfig((config) => {
         const favoris = config.modules.webradio.player.favoris || [];
         if (!favoris.includes(nameRadio)) {
            favoris.push(nameRadio);
            config.modules.webradio.player.favoris = favoris;
         }
      });
   }

   listeRadiosToObject(radios) {
      return radios.reduce((acc, radio) => {
         acc[radio.name] = [];
         return acc;
      }, {});
   }

   saveRadio(nameRadio) {
      if (!nameRadio) return false;

      return this.updateConfig((config) => {
         config.modules.webradio.player.radio = nameRadio;
      });
   }
}

export const radioMusic = new MusicManager();
