/**
 * storage.js
 *
 * Handles reading and writing of data (settings, Turma history) to Chrome storage.
 */

/**
 * Updates the global TurmaAttackHistory object in memory and saves to storage.
 * @param {string} opponent - Name of the opponent
 * @param {object} result   - Attack result {state, goldWon, xpGained, ...}
 */
window.updateTurmaAttackHistory = function (opponent, result) {
    // If the object for this opponent already exists, update it
    if (window.turmaAttackHistory[opponent]) {
        window.turmaAttackHistory[opponent].results.push(result);
        window.turmaAttackHistory[opponent].attackCount++;
        if (result.state === "win") {
            window.turmaAttackHistory[opponent].wins++;
            // Safely handle goldWon updates in case result.goldWon is missing or not a number
            const goldDelta = Number(result.goldWon) || 0;
            window.turmaAttackHistory[opponent].goldWon += goldDelta;
        } else if (result.state === "loss") {
            window.turmaAttackHistory[opponent].losses++;
        } else {
            window.turmaAttackHistory[opponent].draws++;
        }
    } else {
        // Create a new record if none existed
        window.turmaAttackHistory[opponent] = {
            results: [result],
            wins: result.state === "win" ? 1 : 0,
            losses: result.state === "loss" ? 1 : 0,
            draws: result.state === "draw" ? 1 : 0,
            goldWon: result.state === "win" ? (Number(result.goldWon) || 0) : 0,
            xpGained: Number(result.xpGained) || 0,
            attackCount: 1,
        };
    }

    // Persist the updated history to Chrome storage
    chrome.storage.local.set({ gladex_turma_history: window.turmaAttackHistory });
};

/**
 * Loads the Turma history from Chrome storage (if available).
 * @returns {Promise<object>} - The loaded history object or an empty object if none.
 */
window.loadTurmaHistory = function () {
    return new Promise((resolve) => {
        chrome.storage.local.get("gladex_turma_history", (stored) => {
            if (stored && stored.gladex_turma_history) {
                resolve(stored.gladex_turma_history);
            } else {
                // Resolve with empty object if no history is found
                resolve({});
            }
        });
    });
};

/**
 * Writes the current global settings object to Chrome storage.
 */
window.storeSettings = function () {
    chrome.storage.local.set({ gladex_settings: window.settings });
};

/**
 * Updates a key within the global settings object and persists to storage.
 * @param {string} key   - Setting name
 * @param {*}      value - New setting value
 */
window.update_settings = function (key, value) {
    window.settings[key] = value;
    window.storeSettings();
};

/**
 * Loads extension settings from Chrome storage, returning a Promise.
 * @returns {Promise<object>}
 */
window.loadSettings = function () {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("gladex_settings", (stored) => {
            if (stored && stored.gladex_settings) {
                resolve(stored.gladex_settings);
            } else {
                reject("Settings not found.");
            }
        });
    });
};
