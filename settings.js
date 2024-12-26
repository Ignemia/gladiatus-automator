// settings.js

/**
 * @file settings.js
 * @description
 * This script manages the Gladex Chrome Extension's settings page. It handles loading and saving user
 * preferences, populating form fields with stored settings, and displaying the `turmaAttackHistory` data.
 * The `turmaAttackHistory` provides insights into past attacks, including win rates and gold earned, enhancing
 * the user's decision-making process within the extension.
 *
 * @requires jQuery
 * @requires Chrome Extension APIs (`chrome.storage.local`)
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeSettingsPage();
});

/**
 * Initializes the settings page by loading settings, locations, and turma attack history.
 * It populates the form fields and displays the turma history in the designated section.
 */
async function initializeSettingsPage() {
    try {
        const [savedSettings, locations, turmaHistory] = await Promise.all([
            loadSettingsFromStorage(),
            loadLocationsFromStorage(),
            loadTurmaAttackHistory()
        ]);

        populateForm(savedSettings);
        populateSelectElements(locations);
        displayTurmaAttackHistory(turmaHistory);

        // Attach event listener to the Save button
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', onSaveSettings);
        } else {
            console.error('Save button with id "saveBtn" not found.');
        }
    } catch (error) {
        console.error('Error initializing settings page:', error);
    }
}

/**
 * Loads the user settings from Chrome's local storage.
 * If no settings are found, returns the default settings.
 *
 * @returns {Promise<Object>} A promise that resolves to the saved settings object.
 */
function loadSettingsFromStorage() {
    const defaultSettings = {
        autoExpedition: true,
        autoDungeon: true,
        autoHeal: true,
        autoTurma: false,
        expeditionLocation: 3, // Example default value
        expeditionLevel: 2,
        dungeonLevel: 2, // Assuming dungeonLevel corresponds to locId
        minHP: 0.25,
        dungeonStrategy: 0, // 0: SLOW, 1: FAST
        dungeonBossFight: false
    };

    return new Promise((resolve) => {
        chrome.storage.local.get('gladex_settings', (data) => {
            if (chrome.runtime.lastError) {
                console.error('Error fetching settings:', chrome.runtime.lastError);
                resolve(defaultSettings);
                return;
            }
            const savedSettings = data.gladex_settings || {};
            // Merge saved settings with default settings
            const finalSettings = { ...defaultSettings, ...savedSettings };
            resolve(finalSettings);
        });
    });
}

/**
 * Loads the available expedition and dungeon locations from Chrome's local storage.
 *
 * @returns {Promise<Array>} A promise that resolves to an array of location objects.
 * Each location object should have `name` and `locId` properties.
 */
function loadLocationsFromStorage() {
    return new Promise((resolve) => {
        chrome.storage.local.get('locations', (data) => {
            if (chrome.runtime.lastError) {
                console.error('Error fetching locations:', chrome.runtime.lastError);
                resolve([]);
                return;
            }
            const locations = data.locations && Array.isArray(data.locations) ? data.locations : [];
            resolve(locations);
        });
    });
}

/**
 * Loads the `turmaAttackHistory` from Chrome's local storage.
 *
 * @returns {Promise<Object>} A promise that resolves to the `turmaAttackHistory` object.
 */
function loadTurmaAttackHistory() {
    return new Promise((resolve) => {
        chrome.storage.local.get('gladex_turma_history', (data) => {
            if (chrome.runtime.lastError) {
                console.error('Error fetching turma attack history:', chrome.runtime.lastError);
                resolve({});
                return;
            }
            const turmaAttackHistory = data.gladex_turma_history || {};
            resolve(turmaAttackHistory);
        });
    });
}

/**
 * Populates the settings form with the provided settings.
 *
 * @param {Object} settings - The settings object containing user preferences.
 */
function populateForm(settings) {
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
        dungeonBossFight: document.getElementById('dungeonBossFight')
    };

    // Validate and set checkbox states
    ['autoExpedition', 'autoDungeon', 'autoHeal', 'autoTurma', 'dungeonBossFight'].forEach(id => {
        if (formElems[id]) {
            formElems[id].checked = Boolean(settings[id]);
        } else {
            console.log(`Form element with id "${id}" not found.`);
        }
    });

    // Validate and set select and input values
    ['expeditionLocation', 'expeditionLevel', 'dungeonLevel', 'minHP', 'dungeonStrategy'].forEach(id => {
        if (formElems[id]) {
            formElems[id].value = settings[id];
        } else {
            console.log(`Form element with id "${id}" not found.`);
        }
    });
}

/**
 * Populates the expeditionLocation and dungeonLevel select elements with the provided locations.
 *
 * @param {Array} locations - An array of location objects with `name` and `locId` properties.
 */
function populateSelectElements(locations) {
    const formElems = {
        expeditionLocation: document.getElementById('expeditionLocation'),
        dungeonLevel: document.getElementById('dungeonLevel')
    };

    ['expeditionLocation', 'dungeonLevel'].forEach(id => {
        const selectElem = formElems[id];
        if (!selectElem) {
            console.log(`Select element with id "${id}" not found.`);
            return;
        }

        // Clear existing options
        selectElem.innerHTML = '';

        if (locations.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No locations available";
            option.disabled = true;
            option.selected = true;
            selectElem.appendChild(option);
            return;
        }

        // Populate with locations
        locations.forEach(({ name, locId }) => {
            const option = document.createElement('option');
            option.value = locId;
            option.textContent = name;
            selectElem.appendChild(option);
        });
    });
}

/**
 * Displays the `turmaAttackHistory` in a formatted table within the settings page.
 *
 * @param {Object} turmaHistory - The `turmaAttackHistory` object containing attack records.
 */
function displayTurmaAttackHistory(turmaHistory) {
    const historyContainer = document.getElementById('turmaHistory');

    if (!historyContainer) {
        console.log('History container with id "turmaHistory" not found in settings.html.');
        return;
    }

    // Clear existing content
    historyContainer.innerHTML = '';

    const opponents = Object.keys(turmaHistory);
    if (opponents.length === 0) {
        historyContainer.textContent = 'No attack history available.';
        return;
    }

    // Create table
    const table = document.createElement('table');
    table.classList.add('history-table');

    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const headers = ['Opponent Name', 'Wins', 'Losses', 'Draws', 'Win Rate (%)', 'Total Gold Won'];
    headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');

    opponents.forEach(name => {
        const record = turmaHistory[name];
        const row = createHistoryRow(name, record);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    historyContainer.appendChild(table);
}

/**
 * Creates a table row for a single opponent's attack history.
 *
 * @param {string} name - The opponent's name.
 * @param {Object} record - The attack history record for the opponent.
 * @returns {HTMLTableRowElement} The table row element representing the opponent's data.
 */
function createHistoryRow(name, record) {
    const totalAttacks = record.attackCount || 0;
    const winRate = totalAttacks > 0 ? ((record.wins / totalAttacks) * 100).toFixed(2) : '0.00';
    const totalGoldWon = record.goldWon || 0;

    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.textContent = name;
    row.appendChild(nameCell);

    const winsCell = document.createElement('td');
    winsCell.textContent = record.wins || 0;
    row.appendChild(winsCell);

    const lossesCell = document.createElement('td');
    lossesCell.textContent = record.losses || 0;
    row.appendChild(lossesCell);

    const drawsCell = document.createElement('td');
    drawsCell.textContent = record.draws || 0;
    row.appendChild(drawsCell);

    const winRateCell = document.createElement('td');
    winRateCell.textContent = winRate;
    row.appendChild(winRateCell);

    const goldWonCell = document.createElement('td');
    goldWonCell.textContent = totalGoldWon;
    row.appendChild(goldWonCell);

    return row;
}

/**
 * Handles the Save Settings button click event.
 * It gathers all form inputs, validates them, and saves the settings to Chrome's local storage.
 *
 * After saving, it logs the saved settings and optionally closes the settings window.
 */
function onSaveSettings() {
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
        dungeonBossFight: document.getElementById('dungeonBossFight')
    };

    // Validate form elements
    if (!Object.values(formElems).every(elem => elem !== null)) {
        console.error('One or more form elements are missing.');
        return;
    }

    // Gather settings
    const newSettings = {
        autoExpedition: formElems.autoExpedition.checked,
        autoDungeon: formElems.autoDungeon.checked,
        autoHeal: formElems.autoHeal.checked,
        autoTurma: formElems.autoTurma.checked,
        expeditionLocation: parseValue(formElems.expeditionLocation.value),
        expeditionLevel: parseInt(formElems.expeditionLevel.value, 10) || 0,
        dungeonLevel: parseInt(formElems.dungeonLevel.value, 10) || 0,
        minHP: parseFloat(formElems.minHP.value) || 0,
        dungeonStrategy: parseInt(formElems.dungeonStrategy.value, 10) || 0,
        dungeonBossFight: formElems.dungeonBossFight.checked
    };

    // Save settings to storage
    chrome.storage.local.set({ gladex_settings: newSettings }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error saving settings:', chrome.runtime.lastError);
            alert('Failed to save settings. Please try again.');
            return;
        }
        console.log('Settings saved successfully:', newSettings);
        alert('Settings have been saved successfully.');
        // Optionally, close the settings window
        // window.close();
    });
}

/**
 * Parses a string value to an integer or float if applicable.
 *
 * @param {string} val - The string value to parse.
 * @returns {number|string} The parsed number or the original string if parsing is not possible.
 */
function parseValue(val) {
    if (/^\d+$/.test(val)) {
        return parseInt(val, 10);
    }
    if (/^\d+\.\d+$/.test(val)) {
        return parseFloat(val);
    }
    return val; // Return as-is if not a number
}
