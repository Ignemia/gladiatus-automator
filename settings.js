// Corresponds to the same default_settings in your main extension code
const default_settings = {
    autoExpedition: true,
    autoDungeon: true,
    autoHeal: true,
    autoTurma: false,
    expeditionLocation: 3, // WOLF_CAVE by default
    expeditionLevel: 2,
    dungeonLevel: 2, // Assuming dungeonLevel corresponds to locId
    minHP: 0.25,
    dungeonStrategy: 0, // SLOW
    dungeonBossFight: false
};

// Selectors for form elements
const formElems = {
    autoExpedition: document.getElementById('autoExpedition'),
    autoDungeon: document.getElementById('autoDungeon'),
    autoHeal: document.getElementById('autoHeal'),
    autoTurma: document.getElementById('autoTurma'),
    expeditionLocation: document.getElementById('expeditionLocation'),
    expeditionLevel: document.getElementById('expeditionLevel'),
    dungeonLevel: document.getElementById('dungeonLevel'),
    minHP: document.getElementById('minHP'),
    dungeonStrategy: document.getElementById('dungeonStrategy'),
    dungeonBossFight: document.getElementById('dungeonBossFight'),
    saveBtn: document.getElementById('saveBtn')
};

// Load on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    const [savedSettings, locations] = await Promise.all([
        loadSettingsFromStorage(),
        loadLocationsFromStorage()
    ]);

    populateForm(savedSettings);
    populateSelectElements(locations);

    // Listen for Save button click
    formElems.saveBtn.addEventListener('click', onSaveSettings);
});

/**
 * Fetch saved settings from chrome.storage.local
 */
async function loadSettingsFromStorage() {
    return new Promise((resolve) => {
        chrome.storage.local.get('gladex_settings', (data) => {
            if (data.gladex_settings) {
                resolve(data.gladex_settings);
            } else {
                resolve({}); // No settings yet
            }
        });
    });
}

/**
 * Fetch parsed locations from chrome.storage.local
 */
async function loadLocationsFromStorage() {
    return new Promise((resolve) => {
        chrome.storage.local.get('locations', (data) => {
            if (data.locations && Array.isArray(data.locations)) {
                resolve(data.locations);
            } else {
                resolve([]); // No locations found
            }
        });
    });
}

/**
 * Fill the form fields with either stored settings or defaults.
 */
function populateForm(stored) {
    const finalSettings = { ...default_settings, ...stored };

    // Checkboxes
    formElems.autoExpedition.checked = finalSettings.autoExpedition;
    formElems.autoDungeon.checked = finalSettings.autoDungeon;
    formElems.autoHeal.checked = finalSettings.autoHeal;
    formElems.autoTurma.checked = finalSettings.autoTurma;
    formElems.dungeonBossFight.checked = finalSettings.dungeonBossFight;

    // Selects & Numbers
    formElems.expeditionLocation.value = finalSettings.expeditionLocation;
    formElems.expeditionLevel.value = finalSettings.expeditionLevel;
    formElems.dungeonLevel.value = finalSettings.dungeonLevel;
    formElems.minHP.value = finalSettings.minHP;
    formElems.dungeonStrategy.value = finalSettings.dungeonStrategy;
}

/**
 * Populate the expeditionLocation and dungeonLevel select elements with parsed locations.
 */
function populateSelectElements(locations) {
    if (!locations.length) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No locations available";
        option.disabled = true;
        formElems.expeditionLocation.appendChild(option.cloneNode(true));
        formElems.dungeonLevel.appendChild(option.cloneNode(true));
        return;
    }

    locations.forEach(({ name, locId }) => {
        const optionExpedition = document.createElement('option');
        optionExpedition.value = locId;
        optionExpedition.textContent = name;
        formElems.expeditionLocation.appendChild(optionExpedition);

        const optionDungeon = document.createElement('option');
        optionDungeon.value = locId;
        optionDungeon.textContent = name;
        formElems.dungeonLevel.appendChild(optionDungeon);
    });
}

/**
 * Called when user clicks "Save" – gather all form inputs and store them.
 */
function onSaveSettings() {
    const newSettings = {
        autoExpedition: formElems.autoExpedition.checked,
        autoDungeon: formElems.autoDungeon.checked,
        autoHeal: formElems.autoHeal.checked,
        autoTurma: formElems.autoTurma.checked,
        expeditionLocation: parseValue(formElems.expeditionLocation.value),
        expeditionLevel: parseValue(formElems.expeditionLevel.value),
        dungeonLevel: parseValue(formElems.dungeonLevel.value),
        minHP: parseFloat(formElems.minHP.value),
        dungeonStrategy: parseValue(formElems.dungeonStrategy.value),
        dungeonBossFight: formElems.dungeonBossFight.checked
    };

    chrome.storage.local.set({ gladex_settings: newSettings }, () => {
        console.log('Settings saved:', newSettings);
        window.close(); // Optionally close popup after saving
    });
}

/**
 * Small helper to parse integer and float values from string inputs.
 */
function parseValue(val) {
    if (/^\d+$/.test(val)) {
        return parseInt(val, 10);
    }
    if (/^\d+\.\d+$/.test(val)) {
        return parseFloat(val);
    }
    return val; // e.g., 'tundra'
}
