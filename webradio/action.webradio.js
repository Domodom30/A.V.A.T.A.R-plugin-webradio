import {default as _helpers} from '../../ia/node_modules/ava-ia/helpers/index.js';

export default async function (state) {
	return new Promise(async (resolve) => {

		const phrase = state.rawSentence.toLowerCase().split(/\s+/);
		const terms = ['je', 'un', 'une', 'la', 'le', 'dans', 'sur', 'radio', 'radios'];
        const verbs = ['mets', 'joues', 'lance', 'lances', 'écouter','écoutes', 'ecoute', 'ecoutes', 'actives', 'active'];

        const resultRadio = filtrerPhrase(phrase, terms, verbs);

		setTimeout(() => { 
			state.action = {
				module: 'webradio',
				command: state.rule,
				radio: resultRadio,
			};
			resolve(state);
		}, Config.waitAction.time);	
	});
}


const filtrerPhrase = function (phrase, terms, verbs) {
    const termsSet = new Set([...terms, ...verbs]); // Combine terms and verbs into a single Set
    const radioCount = phrase.filter(word => word === 'radio').length;
    let radioInclus = false;
    const resultat = [];

    for (const mot of phrase) {
        if (!termsSet.has(mot)) {
            resultat.push(mot);
        } else {
            if (mot === 'radio') {
                if (radioCount > 1 && !radioInclus) {
                    resultat.push(mot);
                    radioInclus = true;
                }
            }
        }
    }
    return resultat;
}

