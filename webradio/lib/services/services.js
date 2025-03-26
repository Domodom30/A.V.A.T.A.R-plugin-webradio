import levenshtein from "talisman/metrics/levenshtein.js";
import _ from "underscore";
import { default as soundexFR } from "@jollie/soundex-fr";
import { soundex as soundexUS } from "soundex-code";

export class webRadioAPI {
    constructor(mappingRules) {
        if (!webRadioAPI.instance) {
            this.webRadioAPI = new Map();
            webRadioAPI.instance = this;
        }
        this.mappingRules = mappingRules;
        return webRadioAPI.instance;
    }

    matchTermByLanguage(soundex, items, term) {
        let match = [];
        let sdx = soundex(term, term.length);
        let score = 0;
        items.forEach((item) => {
            if (item.title || item.name) {
                let title, lgth;
                if (item.title) {
                    title = item.title;
                    lgth = item.title.length;
                } else {
                    title = item.name;
                    lgth = item.name.length;
                }

                var sdx_gram = soundex(title, lgth);
                var levens = levenshtein(sdx, sdx_gram);
                levens = 1 - levens / sdx_gram.length;
                if (levens > score && levens >= 0.6) {
                    score = levens;
                    match.push(item);
                }
            }
        });
        return match;
    }

    /**
     * Matches a term against a list of items based on the specified language.
     *
     * @param {string} language - The language code ('fr' for French, other values default to US English).
     * @param {Array} items - The list of items to match the term against.
     * @param {string} term - The term to match.
     * @returns {Array} - An array of matched items.
     */
    matchTerm(language, items, term) {
        let match = [];
        if (language === "fr") {
            match = this.matchTermByLanguage(soundexFR, items, term);
        }
        if (match.length === 0) {
            match = this.matchTermByLanguage(soundexUS, items, term);
        }
        return match;
    }

    searchSpotifyAlbumByName(albums, answered, albumsMatched) {
        return new Promise((resolve, reject) => {
            if (answered == true || answered == "list") return resolve(albums);

            let sdx = soundexFR(answered);
            let score = 0;
            albums.forEach((album) => {
                if (this.getLevenshteinDistance(sdx, album.name, score)) albumsMatched.push(album);
            });
            resolve(albums);
        });
    }

    searchSpotifyAlbumByArtist(albums, answered, albumsMatched) {
        return new Promise((resolve, reject) => {
            if (answered == true || answered == "list") return resolve(albums);

            let sdx = soundexFR(answered);
            let score = 0;
            albums.forEach((album) => {
                if (this.getLevenshteinDistance(sdx, album.artists[0].name, score)) albumsMatched.push(album);
            });
            resolve(albums);
        });
    }

    getLevenshteinDistance(sdx, text, score) {
        let sdx_gram = soundexFR(text);
        let levens = levenshtein.metrics.levenshtein(sdx, sdx_gram);
        levens = 1 - levens / sdx_gram.length;
        if (levens > score && levens >= 0.8) {
            score = levens;
            return true;
        } else {
            return false;
        }
    }

    getLexic(sentence) {
        for (let i in this.mappingTTS) {
            let even = _.find(this.mappingTTS[i], (num) => {
                if (sentence.toLowerCase().indexOf(num) !== -1) {
                    let replaceSentence = sentence.substring(0, sentence.toLowerCase().indexOf(num) - 1);
                    let replaceSentence1 = sentence.substring(sentence.toLowerCase().indexOf(num) + num.length);
                    sentence = replaceSentence + " " + i + " " + replaceSentence1;
                }
                return sentence.toLowerCase() == num.toLowerCase();
            });
            if (even) {
                sentence = i;
                break;
            }
        }
        return sentence;
    }

    searchCorrespondence(sentence) {
        for (let i in this.mappingRules) {
            let even = _.find(this.mappingRules[i], (num) => {
                return sentence.toLowerCase() === num.toLowerCase();
            });
            if (even) {
                sentence = i;
                break;
            }
        }
        return sentence;
    }
}
