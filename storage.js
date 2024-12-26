/**
 * storage.js
 *
 * Handles reading and writing of data (settings, Turma history) to Chrome storage.
 * Includes robust logging to diagnose any potential issues with storing settings.
 */

/**
 * Updates the global TurmaAttackHistory object in memory and saves to storage.
 *
 * @function updateTurmaAttackHistory
 * @param {string} opponent - Name of the opponent
 * @param {object} result   - Attack result { state, goldWon, xpGained, ... }
 */
window.updateTurmaAttackHistory = function (opponent, result) {
    if (!window.turmaAttackHistory || typeof window.turmaAttackHistory !== "object") {
        console.log("Global turmaAttackHistory object not found. Creating a new one.");
        window.turmaAttackHistory = {};
    }

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
    chrome.storage.local.set({ gladex_turma_history: window.turmaAttackHistory }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error storing turmaAttackHistory:", chrome.runtime.lastError);
        } else {
            console.log("TurmaAttackHistory updated successfully.");
        }
    });
};

/**
 * Loads the Turma history from Chrome storage (if available).
 *
 * @function loadTurmaHistory
 * @returns {Promise<object>} - Resolves with the loaded history object, or {} if not found.
 */
window.loadTurmaHistory = function () {
    return new Promise((resolve) => {
        chrome.storage.local.get("gladex_turma_history", (stored) => {
            if (chrome.runtime.lastError) {
                console.error("Error loading turmaAttackHistory:", chrome.runtime.lastError);
                return resolve({});
            }
            if (stored && stored.gladex_turma_history) {
                console.log("TurmaAttackHistory loaded from storage.");
                resolve(stored.gladex_turma_history);
            } else {
                console.log("No turmaAttackHistory found in storage. Returning empty {}.");
                resolve({});
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
 * @param {string} key - Setting name
 * @param {*} value    - New setting value
 */
window.update_settings = function (key, value) {
    if (!window.settings || typeof window.settings !== "object") {
        console.log("No valid window.settings object. Creating a new one.");
        window.settings = {};
    }

    console.log(`Updating setting - ${key}:`, value);
    window.settings[key] = value;
    window.storeSettings(); // Persist the updated settings
};

/**
 * Loads extension settings from Chrome storage, returning a Promise.
 *
 * @function loadSettings
 * @returns {Promise<object>} - Resolves with loaded settings, or rejects if not found.
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
