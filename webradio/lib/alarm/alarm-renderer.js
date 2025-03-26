const now = new Date();
const hours = String(now.getHours()).padStart(2, '0'); // Heures sur 2 chiffres
const minutes = String(now.getMinutes()).padStart(2, '0'); // Minutes sur 2 chiffres
const currentTime = `${hours}:${minutes}`;
const notification = document.querySelector('#notification');

let dayOfWeek;
let months = [];
let applyCron = {};
let cron;

const btnClose = document.querySelector('#close');

window.onbeforeunload = async (e) => {
  e.returnValue = false;
  window.electronAPI.quitAlarm();
};

document.getElementById('inputsecondes').addEventListener('beforevalidate', async (event) => {
  event.preventDefault();

  if (document.getElementById('inputsecondes').empty === true) {
    document.getElementById('inputsecondes').setCustomValidity('Enter a value for the secondes');
  } else {
    const result = await validateCron();
    if (!result) {
      showNotification(await Lget('alarm.defineNoValide'), 'error');
    } else {
      const txt = generateCronDescription();
      if (txt) {
        showNotification(txt, 'success');
      }
    }
    document.getElementById('inputsecondes').setCustomValidity('');
  }
});

document.getElementById('inputminutes').addEventListener('beforevalidate', async (event) => {
  event.preventDefault();

  if (document.getElementById('inputminutes').empty === true) {
    document.getElementById('inputminutes').setCustomValidity('Enter a value for the minutes');
  } else {
    const result = await validateCron();
    if (!result) {
      showNotification(await Lget('alarm.defineNoValide'), 'error');
    } else {
      const txt = generateCronDescription();
      if (txt) {
        showNotification(txt, 'success');
      }
    }
    document.getElementById('inputminutes').setCustomValidity('');
  }
});

document.getElementById('inputhours').addEventListener('beforevalidate', async (event) => {
  event.preventDefault();

  if (document.getElementById('inputhours').empty === true) {
    document.getElementById('inputhours').setCustomValidity('Enter a value for the hours');
  } else {
    const result = await validateCron();
    if (!result) {
      showNotification(await Lget('alarm.defineNoValide'), 'error');
    } else {
      const txt = generateCronDescription();
      if (txt) {
        showNotification(txt, 'success');
      }
    }
    document.getElementById('inputhours').setCustomValidity('');
  }
});

document.getElementById('inputmonthdays').addEventListener('beforevalidate', async (event) => {
  event.preventDefault();

  if (document.getElementById('inputmonthdays').empty === true) {
    document.getElementById('inputmonthdays').setCustomValidity('Enter a value for the days of month');
  } else {
    const result = await validateCron();
    if (!result) {
      showNotification(await Lget('alarm.defineNoValide'), 'error');
    } else {
      const txt = generateCronDescription();
      if (txt) {
        showNotification(txt, 'success');
      }
    }
    document.getElementById('inputmonthdays').setCustomValidity('');
  }
});

document.getElementById('inputmonths').addEventListener('beforevalidate', async (event) => {
  event.preventDefault();

  if (document.getElementById('inputmonths').empty === true) {
    document.getElementById('inputmonths').setCustomValidity('Enter a value for the months');
  } else {
    const result = await validateCron();
    if (!result) {
      showNotification(await Lget('alarm.defineNoValide'), 'error');
    } else {
      const txt = generateCronDescription();
      if (txt) {
        showNotification(txt, 'success');
      }
    }
    document.getElementById('inputmonths').setCustomValidity('');
  }
});

document.getElementById('inputweekdays').addEventListener('beforevalidate', async (event) => {
  event.preventDefault();

  if (document.getElementById('inputweekdays').empty === true) {
    document.getElementById('inputweekdays').setCustomValidity('Enter a value for the days of week');
  } else {
    const result = await validateCron();
    if (!result) {
      showNotification(await Lget('alarm.defineNoValide'), 'error');
    } else {
      const txt = generateCronDescription();
      if (txt) {
        showNotification(txt, 'success');
      }
    }
    document.getElementById('inputweekdays').setCustomValidity('');
  }
});

async function validateCron() {
  const secondes = document.getElementById('inputsecondes').value;
  const minutes = document.getElementById('inputminutes').value;
  const hours = document.getElementById('inputhours').value;
  const mtdays = document.getElementById('inputmonthdays').value;
  const mt = document.getElementById('inputmonths').value;

  const activeCron = document.querySelector('#activeCron').toggled;

  let selectedweekdays = document.getElementById('inputweekdays').value;

  if (minutes && hours && mtdays && mt && selectedweekdays) {
    if (!validateSecondes(secondes)) {
      return false;
    }
    // cron = secondes + ' ' + minutes + ' ' + hours + ' ' + mtdays + ' ' + mt + ' ' + selectedweekdays;
    applyCron = { cron: secondes + ' ' + minutes + ' ' + hours + ' ' + mtdays + ' ' + mt + ' ' + selectedweekdays, active: activeCron };

    const result = await window.electronAPI.validateCron(applyCron.cron);
    return result;
  } else {
    return false;
  }
}

function validateSecondes(value) {
  const trimmedValue = value.trim();

  // 4. Vérifier si c'est une liste de valeurs séparées par une virgule
  if (trimmedValue.includes(',')) {
    const parts = trimmedValue.split(',');
    if (parts.length === 0) {
      return false;
    }
    for (let part of parts) {
      part = part.trim();
      // Chaque valeur doit être un entier exact entre 0 et 59
      const number = parseInt(part, 10);
      if (isNaN(number) || number < 0 || number > 59 || number.toString() !== part) {
        return false;
      }
    }
    return true;
  }

  // 5. Vérifier si c'est à chaque seconde
  if (trimmedValue === '*') {
    return true;
  }

  // 1. Tester si la valeur peut être convertie en entier et se trouve entre 0 et 59
  const number = parseInt(trimmedValue, 10);
  if (!isNaN(number) && number.toString() === trimmedValue) {
    if (number >= 0 && number <= 59) {
      return true;
    }
  }

  // 2. Vérifier le format "*/interval"
  const stepMatch = trimmedValue.match(/^\*\/(\d+)$/);
  if (stepMatch) {
    const interval = parseInt(stepMatch[1], 10);
    if (interval > 0) {
      return true;
    }
  }

  // 3. Vérifier le format "a-b"
  const rangeMatch = trimmedValue.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1], 10);
    const b = parseInt(rangeMatch[2], 10);
    if (a >= 0 && a <= 59 && b >= 0 && b <= 59 && a < b) {
      return true;
    }
  }

  // Sinon, la valeur n'est pas valide
  return false;
}

function generateCronDescription(seconde, minute, hour, mtdays, mt, daywk) {
  const sec = seconde || document.getElementById('inputsecondes').value;
  const min = minute || document.getElementById('inputminutes').value;
  const hr = hour || document.getElementById('inputhours').value;
  const daymonth = mtdays || document.getElementById('inputmonthdays').value;
  const month = mt || document.getElementById('inputmonths').value;
  const dayweek = daywk || document.getElementById('inputweekdays').value;

  // Détection de l'heure fixe (toutes valeurs numériques)
  const isFixedTime = /^\d+$/.test(sec) && /^\d+$/.test(min) && /^\d+$/.test(hr);
  let timeDesc;
  if (isFixedTime) {
    // Format hh:mm:ss avec padding à 2 chiffres
    const s = sec.padStart(2, '0');
    const m = min.padStart(2, '0');
    const h = hr.padStart(2, '0');
    timeDesc = `At ${h}:${m}:${s}`;
  } else {
    // Description détaillée pour chaque champ de temps
    const secDesc = describeField(sec, 'second');
    const minDesc = describeField(min, 'minute');
    const hrDesc = describeField(hr, 'hour');
    timeDesc = `At ${secDesc} ${minDesc}`;
    if (hr !== '*') {
      timeDesc += ` past ${hrDesc}`;
    }
  }

  // Construction de la partie date
  let description = timeDesc;
  let dayMonthDesc = describeDateField(daymonth, 'day-of-month', null);
  const monthDesc = describeDateField(month, 'month', months);
  let dayWeekDesc = describeDateField(dayweek, 'day-of-week', dayOfWeek);

  if (dayMonthDesc) {
    dayMonthDesc = `day-of-month ${dayMonthDesc}`;
    description += ` on ${dayMonthDesc}`;
  }
  if (monthDesc) {
    description += ` in ${monthDesc}`;
  }
  if (dayWeekDesc) {
    // Pour day-of-week, si ce n'est pas une valeur fixe ou déjà préfixée par "every", on ajoute le préfixe.
    if (dayweek !== '*' && !/^every/i.test(dayWeekDesc)) {
      dayWeekDesc = `every day-of-week ${dayWeekDesc}`;
    }
    // Si day-of-month a déjà été affiché, on utilise "and on"
    if (dayMonthDesc || monthDesc) {
      description += ` and on ${dayWeekDesc}`;
    } else {
      description += ` on ${dayWeekDesc}`;
    }
  }

  return description + '.';
}

function describeField(value, unit) {
  // Valeur fixe (entier)
  if (/^\d+$/.test(value)) {
    return `${unit} ${value}`;
  }
  // Format step "*/interval"
  const stepMatch = value.match(/^\*\/(\d+)$/);
  if (stepMatch) {
    const n = stepMatch[1];
    return `every ${ordinal(n)} ${unit}`;
  }
  // Joker "*"
  if (value === '*') {
    return `every ${unit}`;
  }
  // Autres formats (liste, range) affichés tels quels
  return `${unit} ${value}`;
}

function describeDateField(value, unit, mapping) {
  if (value === '*') return null;

  // Valeur fixe
  if (/^\d+$/.test(value)) {
    if (mapping) {
      let num = parseInt(value, 10);
      return mapping[num - 1];
    }
    return value;
  }
  // Format step "*/interval"
  const stepMatch = value.match(/^\*\/(\d+)$/);
  if (stepMatch) {
    const n = stepMatch[1];
    return `every ${ordinal(n)} ${unit}`;
  }
  // Format range "a-b"
  const rangeMatch = value.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    let start = rangeMatch[1];
    let end = rangeMatch[2];
    if (mapping) {
      start = mapping[parseInt(start, 10) - 1];
      end = mapping[parseInt(end, 10) - 1];
      return `from ${start} through ${end}`;
    }
    return `from ${rangeMatch[1]} through ${rangeMatch[2]}`;
  }
  // Liste séparée par des virgules
  if (value.includes(',')) {
    let parts = value.split(',').map((x) => x.trim());
    if (mapping) {
      parts = parts.map((x) => mapping[parseInt(x, 10) - 1]);
    }
    return parts.join(', ');
  }
  return value;
}

const saveCron = document.querySelector('#save');
saveCron.addEventListener('click', async () => {
  const activeCron = document.querySelector('#activeCron').toggled;
  let statusCron = null;

  if (!activeCron) {
    statusCron = await Lget('alarm.cronDisabled');
  } else {
    statusCron = await Lget('alarm.cronEnabled');
  }

  const message = generateCronDescription();
  const validCron = await validateCron();

  if (!validCron) {
    showNotification(await Lget('alarm.errorAlarm'), 'error');
    return;
  }

  const result = window.electronAPI.saveAlarm(applyCron);

  if (result) {
    const notificationMessage = (await Lget(['alarm.addAlarm', statusCron])) + ' ' + message;
    const notificationType = activeCron ? 'success' : 'warning';
    showNotification(notificationMessage, notificationType);
  }
});

const Lget = async (target, ...args) => {
  return await window.electronAPI.getMsg(target, ...args);
};

// Fonction pour afficher une notification
const showNotification = function (message, type) {
  notification.textContent = message;
  notification.classList.remove('hidden', 'warning', 'error', 'success');
  notification.classList.add(type);
  notification.style.display = 'block';
};

function daysToArray(daysString) {
  if (typeof daysString !== 'string') {
    error("Ce n'est pas une chaîne de caractères !");
    return [];
  }

  return daysString.split('|');
}

function getDayNames(daysInput) {
  // Si c'est une chaîne, on split, sinon on met dans un tableau directement
  const days = typeof daysInput === 'string' ? daysInput.split(',') : [daysInput]; // pour le cas où on envoie juste "1"

  return days
    .map((dayNumber) => {
      const index = parseInt(dayNumber, 10);

      if (isNaN(index) || index < 0 || index > 6) {
        console.warn(`Jour invalide : ${dayNumber}`);
        return null;
      }

      return dayOfWeek[index];
    })
    .filter((day) => day !== null);
}

btnClose.addEventListener('click', () => {
  window.electronAPI.quitAlarm();
});

// const clientFromList = document.getElementById('clientFrom');
// const clientToList = document.getElementById('clientTo');

// // Fonction de blur si nécessaire
// const blurIfMenuHidden = () => {
//   if (clientToList.getAttribute('aria-hidden') === 'true' && clientToList.contains(document.activeElement)) {
//     document.activeElement.blur();
//   }
//   if (clientFromList.getAttribute('aria-hidden') === 'true' && clientFromList.contains(document.activeElement)) {
//     document.activeElement.blur();
//   }
// };

// // Listeners pour la fermeture et les transitions
// clientToList.addEventListener('close', blurIfMenuHidden);
// clientToList.addEventListener('transitionend', blurIfMenuHidden);
// clientFromList.addEventListener('close', blurIfMenuHidden);
// clientFromList.addEventListener('transitionend', blurIfMenuHidden);

// // Optionnel : Observer les changements d'attribut aria-hidden
// const observer = new MutationObserver(() => {
//   blurIfMenuHidden();
// });
// observer.observe(clientToList, {
//   attributes: true,
//   attributeFilter: ['aria-hidden'],
// });

// // Ta fonction principale pour remplir les menus
// const setHTMLContent = async (values) => {
//   if (!values.clients.length) return;

//   // Enlève le focus si besoin avant de manipuler
//   if (clientFromList.contains(document.activeElement)) {
//     document.activeElement.blur();
//   }
//   if (clientToList.contains(document.activeElement)) {
//     document.activeElement.blur();
//   }

//   // Nettoyage avant d'ajouter
//   clientFromList.innerHTML = '';
//   clientToList.innerHTML = '';

//   for (const client of values.clients) {
//     // Item clientFrom
//     const itemFrom = document.createElement('x-menuitem');
//     itemFrom.id = client;
//     itemFrom.classList.add('clientFrom');
//     itemFrom.value = client;

//     const labelFrom = document.createElement('x-label');
//     labelFrom.textContent = client;

//     itemFrom.appendChild(labelFrom);
//     clientFromList.appendChild(itemFrom);

//     // Item clientTo
//     const itemTo = document.createElement('x-menuitem');
//     itemTo.id = client;
//     itemTo.classList.add('clientTo');
//     itemTo.value = client;

//     const labelTo = document.createElement('x-label');
//     labelTo.textContent = client;

//     itemTo.appendChild(labelTo);
//     clientToList.appendChild(itemTo);
//   }
// };

const setHTMLContent = async (values) => {
  const cron = values.cron.time.split(' ');

  dayOfWeek = await Lget('alarm.checkDays');
  dayOfWeek = daysToArray(dayOfWeek);

  document.getElementById('inputsecondes').setAttribute('value', cron[0]);
  document.getElementById('inputminutes').setAttribute('value', cron[1]);
  document.getElementById('inputhours').setAttribute('value', cron[2]);
  document.getElementById('inputmonthdays').setAttribute('value', cron[3]);
  document.getElementById('inputmonths').setAttribute('value', cron[4]);
  document.getElementById('inputweekdays').setAttribute('value', cron[5]);
  document.querySelector('#title').innerHTML = await Lget('alarm.windowTitle');

  if (values.cron.active) document.querySelector('#activeCron').setAttribute('toggled', true);
};

window.electronAPI.onInitAlarm(async (_event, values) => {
  applyCron = { cron: values.cron.time, active: values.cron.active };
  cron = values.cron;

  await setHTMLContent(values);
});
