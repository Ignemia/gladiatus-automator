/**
 * cta-observer.js
 *
 * Handling CTA button clicks (Thorough search, Start dungeon, etc.)
 * and the MutationObserver logic to auto-run certain actions.
 */

/**
 * Clicks a CTA button if found, returns true if something was clicked.
 * @returns {boolean}
 */
window.handleCTASelectors = function () {
    // Ensure CTA_SELECTORS is valid
    if (typeof window.CTA_SELECTORS !== "object") {
        console.log("CTA_SELECTORS is not defined or not an object.");
        return false;
    }

    if (![SCREEN_MODES.ARENA, SCREEN_MODES.HOME, SCREEN_MODES.DUNGEON, SCREEN_MODES.REPORT, SCREEN_MODES.EXPEDITION].includes((new URLSearchParams(window.location.search)).get("mod"))) return true;
    // Loop through the CTA_SELECTORS object
    for (const key in window.CTA_SELECTORS) {
        const selector = window.CTA_SELECTORS[key];
        if (!selector) continue;

        // Ensure the element is present in DOM
        if ($(selector).length) {
            selector.click();
            return true;
        }
    }
    return false;
};

/**
 * Core function invoked upon DOM mutation.
 * Uses a lock (timeLocked) to avoid repeat triggers within short intervals.
 * @param {MutationRecord} mutation
 * @returns {Promise<boolean>} Whether the mutation was handled
 */
window.handleMutation = async function (mutation) {
    // Check if new nodes were actually added and if the lock is free
    if (!mutation.addedNodes.length || window.timeLocked) return false;
    window.timeLocked = true;

    try {
        window.handleCTASelectors();
    } catch (err) {
        console.error("Error in handleCTASelectors:", err);
    } finally {
        // Once we finish, start a timeout to unlock
        setTimeout(() => {
            window.timeLocked = false;

            // If forceReload is on, reload once and disable it
            if (window.settings && window.settings.forceReload) {
                window.location.reload();
                if (typeof window.update_settings === "function") {
                    window.update_settings("forceReload", false);
                }
            }
        }, 5000);
    }

    // Next, handle other time-based triggers in a Promise
    const timeChangesPromise = new Promise((resolve, reject) => {
        try {
            // Ensure the needed functions and settings exist
            if (
                typeof window.getTimeUntilExpedition === "function" &&
                typeof window.getTimeUntilDungeon === "function" &&
                typeof window.getCurrentHP === "function" &&
                typeof window.getTimeToTurma === "function" &&
                typeof window.openExpeditionTab === "function" &&
                typeof window.attack_target === "function" &&
                typeof window.openDungeonTab === "function" &&
                typeof window.openProfile === "function" &&
                typeof window.openTurma === "function" &&
                typeof window.openArena === "function" &&
                typeof window.update_settings === "function" &&
                typeof window.settings === "object"
            ) {
                if (window.getTimeUntilExpedition() === 0 && window.settings.autoExpedition) {
                    window.update_settings("forceReload", true);
                    window.openExpeditionTab();
                    window.attack_target();
                }
                if (window.getTimeUntilDungeon() === 0 && window.settings.autoDungeon) {
                    window.update_settings("forceReload", true);
                    window.openDungeonTab();
                }
                if (window.getCurrentHP() < window.settings.minHP && window.settings.autoHeal) {
                    window.openProfile();
                }
                if (window.getTimeToTurma() === 0 && window.settings.autoTurma) {
                    window.openTurma();
                }
                if (window.getTimeToArena() === 0 && window.settings.autoArena) {
                    window.openArena();
                }
            } else {
                console.log("Some required functions or settings are missing.");
            }
            resolve();
        } catch (err) {
            reject(err);
        }
    });

    // Wait for the time-based checks to complete
    try {
        await timeChangesPromise;
    } catch (err) {
        console.error("Error during time-based triggers:", err);
    }

    // Unlock again if needed (in case no new DOM mutations happen soon)
    window.timeLocked = false;
    return true;
};

/**
 * Observer callback that iterates over all mutations and triggers handleMutation.
 * @param {MutationRecord[]} mutationsList
 */
window.onMutations = function (mutationsList) {
    mutationsList.forEach((mutation) => {
        window.handleMutation(mutation).catch((err) => {
            console.error("Error in handleMutation:", err);
        });
    });
};

/**
 * A global MutationObserver to watch #server-time changes.
 */
window.timeObserver = new MutationObserver(window.onMutations);

/**
 * Stub to open the Turma interface (unimplemented logic).
 */
window.openTurma = function () {
    // Provide a fallback if createLink or certain objects aren't defined
    if (typeof window.createLink !== "function") {
        console.log("createLink is not defined. Cannot open Turma interface.");
        return;
    }

    const query = new URLSearchParams(window.location.search);

    // If we are already in Circus Turma, just log and return
    if (
        query.get("submod") === "serverArena" &&
        query.get("aType") === "3" &&
        query.get("mod") === "arena"
    ) {
        console.log("Already in Circus Turma context.");
        return;
    }

    console.log("Opening Turma interface...");
    window.location.href = window.createLink(
        window.SCREEN_MODES.ARENA,
        window.ARENA_SUBMODES.PROVINCIARUM,
        { aType: window.PROVINCIARUM_TYPES.TURMA }
    );
};

/**
 * Stub to open the Arena interface (unimplemented logic).
 */
window.openArena = function () {
    // Provide a fallback if createLink or certain objects aren't defined
    if (typeof window.createLink !== "function") {
        console.log("createLink is not defined. Cannot open Arena interface.");
        return;
    }

    const query = new URLSearchParams(window.location.search);

    // If we are already in Circus Turma, just log and return
    if (
        query.get("submod") === "serverArena" &&
        query.get("aType") === "2" &&
        query.get("mod") === "arena"
    ) {
        console.log("Already in Arena context.");
        return;
    }

    console.log("Opening Arena interface...");
    window.location.href = window.createLink(
        window.SCREEN_MODES.ARENA,
        window.ARENA_SUBMODES.PROVINCIARUM,
        { aType: window.PROVINCIARUM_TYPES.ARENA }
    );
};
