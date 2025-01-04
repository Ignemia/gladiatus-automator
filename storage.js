/*************************
 * storage.js
 *************************/
/**
 * storage.js
 *
 * Handles reading and writing of data (settings, Turma history) to Chrome storage.
 * Uses a "reports" and "opponents" structure to avoid duplicate data for each fight.
 */

/**
 * Updates the global TurmaAttackHistory object in memory, storing each fight by its unique `reportId`.
 *
 * @function updateTurmaAttackHistory
 * @param {string} reportId     - The unique report ID from the URL (e.g., "1303737").
 * @param {string} opponent     - The opponent's name.
 * @param {object} fightData    - Data about the fight: { state, goldWon, xpGained, timestamp, ... }
 */
window.updateTurmaAttackHistory = function (reportId, opponent, fightData) {
    if (!window.turmaAttackHistory || typeof window.turmaAttackHistory !== "object") {
        console.log("Initializing turmaAttackHistory with new structure.");
        window.turmaAttackHistory = {
            reports: {},
            opponents: {}
        };
    }

    // Check if we already have this reportId. If yes, skip re-storing that same data.
    const alreadyExists = !!window.turmaAttackHistory.reports[reportId];
    if (!alreadyExists) {
        window.turmaAttackHistory.reports[reportId] = {
            // Minimal necessary data for referencing the fight.
            state: fightData.state,
            goldWon: Number(fightData.goldWon) || 0,
            xpGained: Number(fightData.xpGained) || 0,
            timestamp: fightData.timestamp || new Date().toISOString()
            // Add other fields if desired (e.g. fameGained, raidedAmount, etc.).
        };
        console.log(`Stored new fight data under reportId=${reportId}.`);
    } else {
        console.log(`Report ID ${reportId} already in storage; skipping re-save of identical data.`);
    }

    if (!window.turmaAttackHistory.opponents[opponent]) {
        window.turmaAttackHistory.opponents[opponent] = {
            reportIds: [],
            wins: 0,
            losses: 0,
            draws: 0,
            goldWon: 0,
            xpGained: 0,
            attackCount: 0
        };
    }

    const oppRecord = window.turmaAttackHistory.opponents[opponent];
    const alreadyLinked = oppRecord.reportIds.includes(reportId);

    if (!alreadyLinked) {
        oppRecord.reportIds.push(reportId);
    }

    // Update aggregated stats only if the report was brand new to the system.
    if (!alreadyExists) {
        oppRecord.attackCount++;
        if (fightData.state === "win") {
            oppRecord.wins++;
            oppRecord.goldWon += Number(fightData.goldWon) || 0;
        } else if (fightData.state === "loss") {
            oppRecord.losses++;
        } else {
            oppRecord.draws++;
        }
        oppRecord.xpGained += Number(fightData.xpGained) || 0;
    }

    storeTurmaHistory();
};

/**
 * Persists the global turmaAttackHistory object to Chrome storage.
 *
 * @function storeTurmaHistory
 */
function storeTurmaHistory() {
    if (!window.turmaAttackHistory || typeof window.turmaAttackHistory !== "object") {
        console.warn("No valid turmaAttackHistory to store. Creating a fresh structure.");
        window.turmaAttackHistory = {reports: {}, opponents: {}};
    }
    chrome.storage.local.set({ gladex_turma_history: window.turmaAttackHistory }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error storing turmaAttackHistory:", chrome.runtime.lastError);
        } else {
            console.log("TurmaAttackHistory updated successfully in Chrome storage (report-based).");
        }
    });
}

/**
 * Loads the Turma history from Chrome storage (if available).
 *
 * @function loadTurmaHistory
 * @returns {Promise<object>} Resolves with the loaded history object, or an empty { reports: {}, opponents: {} } if not found.
 */
window.loadTurmaHistory = function () {
    return new Promise((resolve) => {
        chrome.storage.local.get("gladex_turma_history", (stored) => {
            if (chrome.runtime.lastError) {
                console.error("Error loading turmaAttackHistory:", chrome.runtime.lastError);
                return resolve({reports: {}, opponents: {}});
            }
            if (stored && stored.gladex_turma_history) {
                console.log("TurmaAttackHistory loaded from storage.");
                resolve(stored.gladex_turma_history);
            } else {
                console.log("No turmaAttackHistory found; returning empty structure.");
                resolve({reports: {}, opponents: {}});
            }
        });
    });
};

/**
 * Writes the current global settings object to Chrome storage.
 *
 * @function storeSettings
 */
window.storeSettings = function () {
    if (!window.settings || typeof window.settings !== "object") {
        console.log("No valid window.settings object. Creating a new one.");
        window.settings = {};
    }

    console.log("Storing settings:", window.settings);
    chrome.storage.local.set({ gladex_settings: window.settings }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error storing settings:", chrome.runtime.lastError);
        } else {
            console.log("Settings successfully stored in Chrome storage.");
        }
    });
};

/**
 * Updates a key within the global settings object and persists it to storage.
 *
 * @function update_settings
 * @param {string} key   - Setting name
 * @param {*}      value - New setting value
 */
window.update_settings = function (key, value) {
    if (!window.settings || typeof window.settings !== "object") {
        console.log("No valid window.settings object. Creating a new one.");
        window.settings = {};
    }

    console.log(`Updating setting - ${key}:`, value);
    window.settings[key] = value;
    window.storeSettings();
};

/**
 * Loads extension settings from Chrome storage, returning a Promise.
 *
 * @function loadSettings
 * @returns {Promise<object>} Resolves with loaded settings, or rejects if not found.
 */
window.loadSettings = function () {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("gladex_settings", (stored) => {
            if (chrome.runtime.lastError) {
                console.error("Error loading settings:", chrome.runtime.lastError);
                return reject(chrome.runtime.lastError);
            }
            if (stored && stored.gladex_settings) {
                console.log("Settings loaded from storage:", stored.gladex_settings);
                resolve(stored.gladex_settings);
            } else {
                reject("Settings not found.");
            }
        });
    });
};
