/**
 * cooldowns.js
 *
 * Functions to parse or calculate expedition/dungeon/turma cooldown times.
 */

/**
 * Parses a "HH:MM:SS" string to an integer representing total seconds.
 * Safely handles malformed strings by returning 0.
 * @param {string} timeString - e.g. "01:23:45"
 * @returns {number} Total seconds
 */
window.parseTime = function (timeString) {
    if (!timeString || !timeString.includes(":")) {
        return 0;
    }

    const parts = timeString.split(":");
    if (parts.length !== 3) {
        return 0;
    }

    const hh = parseInt(parts[0], 10) || 0;
    const mm = parseInt(parts[1], 10) || 0;
    const ss = parseInt(parts[2], 10) || 0;

    return hh * 3600 + mm * 60 + ss;
};

/**
 * Reads text from a DOM selector. If it matches an expected phrase, returns 0.
 * Otherwise, parses the text as "HH:MM:SS".
 * @param {string} selector - A valid jQuery selector
 * @param {string} expectedPhrase - If the text matches this (case-insensitive), return 0
 * @returns {number} Remaining seconds or 0
 */
window.getRemainingTime = function (selector, expectedPhrase) {
    // If selector doesn't exist or has no text, default to an empty string
    const rawText = ($(selector).text() || "").trim().toLowerCase();

    if (rawText === expectedPhrase.toLowerCase()) {
        return 0;
    }

    // Safely parse the time; if it's invalid or NaN, parseTime returns 0
    return window.parseTime(rawText);
};

/**
 * Get the time until the next expedition is available.
 * @returns {number} 0 if ready, else seconds until available.
 */
window.getTimeUntilExpedition = function () {
    // Uses SELECTORS defined in constants.js
    return window.getRemainingTime(window.SELECTORS.ExpeditionTimeText, "go to expedition");
};

/**
 * Get the time until the next dungeon is available.
 * @returns {number} 0 if ready, else seconds until available.
 */
window.getTimeUntilDungeon = function () {
    // Uses SELECTORS defined in constants.js
    return window.getRemainingTime(window.SELECTORS.DungeonTimeText, "go to dungeon");
};

/**
 * Get the time until Turma (Circus Turma) is ready.
 * @returns {number} 0 if ready, else seconds until available.
 */
window.getTimeToTurma = function () {
    // Attempt to read from the #cooldown_bar_ct element
    const turmaText = ($("#cooldown_bar_ct").text() || "").trim().toLowerCase();
    if (turmaText === "to circus turma") {
        return 0;
    }
    // Fallback to parseTime; if invalid, it returns 0
    return window.parseTime(turmaText);
};
