// Init module for Tasmota plugin
import axios from 'axios'

let Config;
/**
 * Get periph list attached to your user account
 @param { String } the value to set
 @return { Objet } a list of periphs
**/
async function getPeriphInfos() {
  try {
    const style = {
      opacity: 0.01
    }

    const deviceDatas = {
      ['webradio']: [
        {
          periph_id: '444555',
          parent_periph_id: '444555',
          name: 'webradio',
          value_type: 'button',
          usage_name: 'Button',
          click_values: [
            { description: 'On', plugin: 'webradio', action: 'Off' },
            { description: 'Off', plugin: 'webradio', action: 'On' }
          ],
          notes: '',
          style: style
        }
      ]
    }
    return deviceDatas
  } catch (error) {
    console.error('Erreur:', error)
  }
}

/**
 * Initialisation of the module
 @param { Conf } The properties of the module
 @return { none } 
*/
var initVar = function (conf) {
  Config = conf;
}

async function init() {
  return {
    initVar: initVar,
    getPeriphInfos: getPeriphInfos,
  }
}

export { init }
