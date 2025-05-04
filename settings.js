/*************************
 * settings.js
 *************************/
/**
 * settings.js
 *
 * Manages the Gladex Chrome Extension's settings page. It loads/saves user
 * preferences, populates form fields, and displays the `turmaAttackHistory`.
 * The Turma data is stored in a structure with `reports` and `opponents`,
 * ensuring each fight is uniquely keyed by its `reportId`.
 */

/**
 * Fired when the DOM content is fully loaded, initializing the settings page.
 */
document.addEventListener("DOMContentLoaded", () => {
    initializeSettingsPage();
});

/**
 * Initializes the settings page by loading settings, locations, and Turma attack history.
 * Populates the form fields and displays the Turma history in the designated section.
 * Attaches the Save button listener.
 */
async function initializeSettingsPage() {
    try {
        // Load everything in parallel
        const [savedSettings, locations, turmaHistory] = await Promise.all([
            loadSettingsFromStorage(),
            loadLocationsFromStorage(),
            loadTurmaAttackHistory()
        ]);

        // Optionally store turmaHistory in savedSettings if desired (for easy reference),
        // but the UI display will use turmaHistory directly anyway.
        savedSettings.turmaAttackHistory = turmaHistory;

        // Populate the main form
        populateForm(savedSettings);
        // Populate expedition & dungeon select elements
        populateSelectElements(locations);
        // Display the Turma attack history in the settings page
        displayTurmaAttackHistory(turmaHistory);

        // Attach event listener to the Save button
        const saveBtn = document.getElementById("saveBtn");
        if (saveBtn) {
            saveBtn.addEventListener("click", onSaveSettings);
        } else {
            console.error('Save button with id "saveBtn" not found.');
        }
    } catch (error) {
        console.error("Error initializing settings page:", error);
    }
}

/**
 * Loads user settings (gladex_settings) from Chrome's local storage.
 * If none exist, returns default settings.
 *
 * @function loadSettingsFromStorage
 * @returns {Promise<Object>} Resolves to the final settings object.
 */
function loadSettingsFromStorage() {
    const defaultSettings = {
        autoExpedition: true,
        autoDungeon: true,
        autoHeal: true,
        autoTurma: false,
        autoArena: true,
        expeditionLocation: 3,
        expeditionLevel: 2,
        dungeonLevel: 2,
        minHP: 0.25,
        dungeonStrategy: 0,
        dungeonBossFight: false

    };

    return new Promise((resolve) => {
        chrome.storage.local.get("gladex_settings", (data) => {
            if (chrome.runtime.lastError) {
                console.error("Error fetching settings:", chrome.runtime.lastError);
                return resolve(defaultSettings);
            }
            const stored = data.gladex_settings || {};
            const finalSettings = {...defaultSettings, ...stored};
            resolve(finalSettings);
        });
    });
}

/**
 * Loads expedition/dungeon locations (key: "locations") from Chrome storage.
 *
 * @function loadLocationsFromStorage
 * @returns {Promise<Array>} Resolves to an array of location objects (each with name, locId).
 */
function loadLocationsFromStorage() {
    return new Promise((resolve) => {
        chrome.storage.local.get("locations", (data) => {
            if (chrome.runtime.lastError) {
                console.error("Error fetching locations:", chrome.runtime.lastError);
                return resolve([]);
            }
            const locs = Array.isArray(data.locations) ? data.locations : [];
            resolve(locs);
        });
    });
}

/**
 * Loads Turma attack history (gladex_turma_history) from Chrome storage.
 * Returns an object of the form { reports: {}, opponents: {} } if none is found.
 *
 * @function loadTurmaAttackHistory
 * @returns {Promise<Object>} - The Turma history object (with `reports` & `opponents`).
 */
function loadTurmaAttackHistory() {
    return new Promise((resolve) => {
        chrome.storage.local.get("gladex_turma_history", (data) => {
            if (chrome.runtime.lastError) {
                console.error("Error fetching turma attack history:", chrome.runtime.lastError);
                return resolve({reports: {}, opponents: {}});
            }
            const history = data.gladex_turma_history || {reports: {}, opponents: {}};
            resolve(history);
        });
    });
}

function loadArenaAttackHistory() {
    return new Promise((resolve) => {
        chrome.storage.local.get("gladex_arena_history", (data) => {
            if (chrome.runtime.lastError) {
                console.error("Error fetching arena attack history:", chrome.runtime.lastError);
                return resolve({reports: {}, opponents: {}});
            }
            const history = data.gladex_arena_history || {reports: {}, opponents: {}};
            resolve(history);
        });
    });
}

/**
 * Populates the settings form with the provided settings object.
 *
 * @function populateForm
 * @param {Object} settings - The user settings to populate the form with.
 */
function populateForm(settings) {
    const formElems = {
        autoExpedition: document.getElementById("autoExpedition"),
        autoDungeon: document.getElementById("autoDungeon"),
        autoHeal: document.getElementById("autoHeal"),
        autoTurma: document.getElementById("autoTurma"),
        autoArena: document.getElementById("autoArena"),
        expeditionLocation: document.getElementById("expeditionLocation"),
        expeditionLevel: document.getElementById("expeditionLevel"),
        dungeonLevel: document.getElementById("dungeonLevel"),
        minHP: document.getElementById("minHP"),
        dungeonStrategy: document.getElementById("dungeonStrategy"),
        dungeonBossFight: document.getElementById("dungeonBossFight")
    };

    // Set checkbox states
    ["autoExpedition", "autoDungeon", "autoHeal", "autoTurma", "autoArena", "dungeonBossFight"].forEach(id => {
        if (formElems[id]) {
            formElems[id].checked = Boolean(settings[id]);
        }
    });

    // Set numeric/selected values
    ["expeditionLocation", "expeditionLevel", "dungeonLevel", "minHP", "dungeonStrategy"].forEach(id => {
        if (formElems[id]) {
            formElems[id].value = settings[id];
        }
    });
}

/**
 * Populates the expeditionLocation and dungeonLevel <select> elements with location data.
 *
 * @function populateSelectElements
 * @param {Array} locations - Array of { name, locId } objects.
 */
function populateSelectElements(locations) {
    const formElems = {
        expeditionLocation: document.getElementById("expeditionLocation"),
        dungeonLevel: document.getElementById("dungeonLevel")
    };

    Object.entries(formElems).forEach(([key, selectElem]) => {
        if (!selectElem) {
            console.warn(`Select element "${key}" not found.`);
            return;
        }
        // Clear existing options
        selectElem.innerHTML = "";

        if (!locations.length) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "No locations available";
            opt.disabled = true;
            opt.selected = true;
            selectElem.appendChild(opt);
            return;
        }

        locations.forEach(({ name, locId }) => {
            const opt = document.createElement("option");
            opt.value = locId;
            opt.textContent = name;
            selectElem.appendChild(opt);
        });
    });
}

/**
 * Displays the given Turma attack history in a table inside #turmaHistory.
 * Expects an object { reports: {}, opponents: {} }.
 *
 * @function displayTurmaAttackHistory
 * @param {Object} turmaHistory - The turma history object with opponents keyed in .opponents
 */
function displayTurmaAttackHistory(turmaHistory) {
    const container = document.getElementById("turmaHistory");
    if (!container) {
        console.warn('turmaHistory container not found in settings.html.');
        return;
    }

    container.innerHTML = "";

    const opponentsObj = turmaHistory.opponents || {};
    const opponentNames = Object.keys(opponentsObj);
    if (!opponentNames.length) {
        container.textContent = "No attack history available.";
        return;
    }

    // Build a table
    const table = document.createElement("table");
    table.classList.add("history-table");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const headers = ["Opponent Name", "Wins", "Losses", "Draws", "Win Rate (%)", "Total Gold Won"];
    headers.forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    opponentNames.forEach(opponentName => {
        const record = opponentsObj[opponentName] || {};
        const row = createHistoryRow(opponentName, record);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

/**
 * Creates and returns a table row for one opponent's Turma stats.
 * record is { reportIds: [...], wins, losses, draws, goldWon, xpGained, attackCount }
 *
 * @function createHistoryRow
 * @param {string} opponentName - Opponent name
 * @param {Object} record       - Aggregated data for that opponent
 */
function createHistoryRow(opponentName, record) {
    const totalAttacks = record.attackCount || 0;
    const wins = record.wins || 0;
    const losses = record.losses || 0;
    const draws = record.draws || 0;
    const goldWon = record.goldWon || 0;

    let winRate = "0.00";
    if (totalAttacks > 0) {
        winRate = ((wins / totalAttacks) * 100).toFixed(2);
    }

    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = opponentName;
    row.appendChild(nameCell);

    const winsCell = document.createElement("td");
    winsCell.textContent = wins;
    row.appendChild(winsCell);

    const lossesCell = document.createElement("td");
    lossesCell.textContent = losses;
    row.appendChild(lossesCell);

    const drawsCell = document.createElement("td");
    drawsCell.textContent = draws;
    row.appendChild(drawsCell);

    const winRateCell = document.createElement("td");
    winRateCell.textContent = winRate;
    row.appendChild(winRateCell);

    const goldWonCell = document.createElement("td");
    goldWonCell.textContent = goldWon;
    row.appendChild(goldWonCell);

    return row;
}

/**
 * Called when the user clicks the "Save Settings" button.
 * Reads values from the form, validates, and saves them to Chrome local storage.
 *
 * @function onSaveSettings
 */
function onSaveSettings() {
    const formElems = {
        autoExpedition: document.getElementById("autoExpedition"),
        autoDungeon: document.getElementById("autoDungeon"),
        autoHeal: document.getElementById("autoHeal"),
        autoTurma: document.getElementById("autoTurma"),
        autoArena: document.getElementById("autoArena"),
        expeditionLocation: document.getElementById("expeditionLocation"),
        expeditionLevel: document.getElementById("expeditionLevel"),
        dungeonLevel: document.getElementById("dungeonLevel"),
        minHP: document.getElementById("minHP"),
        dungeonStrategy: document.getElementById("dungeonStrategy"),
        dungeonBossFight: document.getElementById("dungeonBossFight")
    };

    const missingElem = Object.entries(formElems).find(([_, elem]) => !elem);
    if (missingElem) {
        console.error(`Form element "${missingElem[0]}" is missing from DOM.`);
        return;
    }

    const newSettings = {
        autoExpedition: formElems.autoExpedition.checked,
        autoDungeon: formElems.autoDungeon.checked,
        autoHeal: formElems.autoHeal.checked,
        autoTurma: formElems.autoTurma.checked,
        autoTurma: formElems.autoArena.checked,
        expeditionLocation: parseValue(formElems.expeditionLocation.value),
        expeditionLevel: parseInt(formElems.expeditionLevel.value, 10) || 0,
        dungeonLevel: parseInt(formElems.dungeonLevel.value, 10) || 0,
        minHP: parseFloat(formElems.minHP.value) || 0,
        dungeonStrategy: parseInt(formElems.dungeonStrategy.value, 10) || 0,
        dungeonBossFight: formElems.dungeonBossFight.checked
    };

    // Save to local storage
    chrome.storage.local.set({ gladex_settings: newSettings }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error saving settings:", chrome.runtime.lastError);
            alert("Failed to save settings. Please try again.");
            return;
        }
        console.log("Settings saved successfully:", newSettings);
        alert("Settings have been saved successfully.");
    });
}

/**
 * Parses a string value into a number if possible; otherwise returns the original string.
 *
 * @function parseValue
 * @param {string} val
 * @returns {number|string}
 */
function parseValue(val) {
    if (/^\d+$/.test(val)) {
        return parseInt(val, 10);
    }
    if (/^\d+\.\d+$/.test(val)) {
        return parseFloat(val);
    }
    return val;
}
