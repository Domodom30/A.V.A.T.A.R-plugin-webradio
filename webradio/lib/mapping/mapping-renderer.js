let mappingRules;
let mappingRadios;

window.onbeforeunload = async (e) => {
    e.returnValue = false;
    window.electronAPI.quitMapping();
};

document.getElementById("quit").addEventListener("click", async (event) => {
    window.dispatchEvent(new Event("beforeunload"));
});

function valueExists(searchValue, rules) {
    return Object.values(rules).some((valuesArray) => valuesArray.includes(searchValue));
}

async function ruleExists(searchValue) {
    const lowerSearch = searchValue.toLowerCase();

    return Object.values(mappingRules).some((valuesArray) => valuesArray.some((value) => value.toLowerCase() === lowerSearch));
}

document.getElementById("save-mapping").addEventListener("click", async (event) => {
    if (document.getElementById("L-auto").toggled === true && !document.getElementById("new-mapping").value) {
        notification(await Lget("mapping.noMapping"));
        return;
    }

    if (!document.getElementById("L-auto").toggled && document.getElementById("new-mapping").value) {
        notification(await Lget("mapping.multiMapping"));
        return;
    }

    const menuOn = document.getElementsByClassName("item-mapping");

    const selection = {
        exist: false,
        list: "",
        sentence: document.getElementById("youSay").value,
    };

    if (!document.getElementById("L-auto").toggled) {
        for (let i = 0; i < menuOn.length; i++) {
            if (menuOn[i].toggled) {
                const exists = await ruleExists(selection.sentence);
                if (!exists) {
                    selection.list = menuOn[i].value;
                    selection.exist = false;
                    break;
                } else {
                    notification(await Lget("mapping.mappingValueExists", selection.sentence, menuOn[i].value), true);
                    return;
                }
            }
        }
    } else if (document.getElementById("new-mapping").value) {
        for (let i = 0; i < menuOn.length; i++) {
            if (menuOn[i].value.toLowerCase() === document.getElementById("new-mapping").value.toLowerCase()) {
                notification(await Lget("mapping.existMapping"), true);
                return;
            }
        }

        selection.list = document.getElementById("new-mapping").value;
    }

    const result = await window.electronAPI.applyMapping(selection);

    if (result) {
        if (!selection.exist) {
            const menuOn = document.getElementById("menu-mapping");
            const itemOn = document.createElement("x-menuitem");

            itemOn.value = document.getElementById("new-mapping").value;
            itemOn.setAttribute("class", "item-mapping");
            const labelOn = document.createElement("x-label");
            labelOn.innerHTML = document.getElementById("new-mapping").value;
            itemOn.appendChild(labelOn);
            menuOn.appendChild(itemOn);
            notification(await Lget("mapping.newMapping", selection.sentence, selection.list));
        } else {
            for (let i = 0; i < menuOn.length; i++) {
                if (menuOn[i].toggled) {
                    mappingRules[menuOn[i].value].push(selection.sentence);
                    break;
                }
            }
            notification(await Lget("mapping.addedToMapping", selection.sentence, selection.list));
        }
    } else {
        notification(await Lget("mapping.error"), true);
    }
});

function notification(msg, err) {
    const notif = document.getElementById("notification");
    notif.style.color = err ? "red" : "rgba(255, 255, 255, 0.9)";
    if (notif.opened == true) notif.opened = false;
    notif.innerHTML = msg;
    notif.opened = true;
}

async function setMappingList(mappingList, mappingListRadio) {
    const mappingLists = Object.keys(mappingList);
    const mappingListsRadio = Object.keys(mappingListRadio);

    const menuOn = document.getElementById("menu-mapping");

    const hr = document.createElement("hr");

    mappingLists.forEach((item) => {
        const itemOn = document.createElement("x-menuitem");

        itemOn.value = item;
        itemOn.setAttribute("class", "item-mapping");
        const labelOn = document.createElement("x-label");
        labelOn.innerHTML = item;
        itemOn.appendChild(labelOn);
        menuOn.appendChild(itemOn);
    });

    menuOn.appendChild(hr);

    mappingListsRadio.forEach((item) => {
        const itemOn = document.createElement("x-menuitem");

        itemOn.value = item;
        itemOn.setAttribute("class", "item-mapping");
        const labelOn = document.createElement("x-label");
        labelOn.innerHTML = item;
        itemOn.appendChild(labelOn);
        menuOn.appendChild(itemOn);
    });

    document.getElementById("L-auto").toggled = true;
}

async function Lget(target, ...args) {
    if (args) {
        target = [target];
        args.forEach((arg) => {
            target.push(arg);
        });
    }

    return await window.electronAPI.getMsg(target);
}


const setSettingsXel = async (xel) => {
    document.querySelector('meta[name="xel-theme"]').setAttribute('content', '../../../../..' + '/node_modules/xel/themes/' + xel.theme + '.css')
    document.querySelector('meta[name="xel-accent-color"]').setAttribute('content', xel.color)
    document.querySelector('meta[name="xel-icons"]').setAttribute('content', '../../../../..' + '/node_modules/xel/icons/' + xel.icons + '.svg')
  }

async function setTargets(searchRadio) {
    document.querySelector("#window-title").innerHTML = await Lget("mapping.windowTitle");
    document.getElementById("youSay").value = searchRadio;
    document.getElementById("youSay-title").innerHTML = await Lget("mapping.yousayTitle");
    document.getElementById("mapping-title").innerHTML = await Lget("mapping.mappingTitle");
    document.getElementById("mapping-label").innerHTML = await Lget("mapping.mappingLabel");
    document.getElementById("L-auto-label").innerHTML = await Lget("mapping.auto");
    document.getElementById("input-mapping-label").innerHTML = await Lget("mapping.inputMappingLabel");
    document.getElementById("label-save-mapping").innerHTML = await Lget("mapping.saveMappingLabel");
    document.getElementById("label-quit").innerHTML = await Lget("mapping.labelQuit");
}

window.electronAPI.onInitMapping(async (_event, searchRadio, mapping, listeRadios) => {
    mappingRules = mapping || {};
    mappingRadios = listeRadios || {};

    const xel = await window.electronAPI.getTheme();

    await setSettingsXel(xel);
    await setTargets(searchRadio);
    await setMappingList(mapping, listeRadios);
});
