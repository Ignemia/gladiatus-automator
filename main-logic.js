/**
 * main-logic.js
 *
 * Brings together logic for expedition, dungeon, home screen, etc.
 * Also defines the initExtension() entry point.
 */

/**
 * If autoExpedition is on and HP is above 15%, then render expedition selection UI.
 */
window.handleExpeditionCase = function () {
    // Check if global settings and required functions are defined
    if (!window.settings || typeof window.getCurrentHP !== "function") {
        console.log("Settings or getCurrentHP not available; cannot handle expedition logic.");
        return;
    }

    if (!window.settings.autoExpedition || window.getCurrentHP() < 0.15) return;
    if (typeof window.renderExpeditionSelection === "function") {
        window.renderExpeditionSelection();
    } else {
        console.log("renderExpeditionSelection function not found.");
    }
};

/**
 * If autoDungeon is on and cooldown is 0, tries to fight in the dungeon or skip boss if not wanted.
 */
window.handleDungeonCase = function () {
    if (
        !window.settings ||
        !window.settings.autoDungeon ||
        typeof window.getTimeUntilDungeon !== "function" ||
        window.getTimeUntilDungeon() !== 0
    ) {
        return;
    }

    // Attempt to click any dungeon forms (confirm dialogs, etc.)
    const $forms = $(".contentItem_content form");
    if ($forms.length) {
        $forms.find(".button1").trigger("click");
    }

    // Ensure the dungeon opponent selection functions exist
    if (typeof window.selectDungeonOpponentSlow !== "function" || typeof window.selectDungeonOpponentFast !== "function") {
        console.log("Dungeon opponent selection functions not found.");
        return;
    }

    const opponent =
        window.settings.dungeonStrategy === window.DUNGEON_STRATEGIES.SLOW
            ? window.selectDungeonOpponentSlow()
            : window.selectDungeonOpponentFast();

    const skipBoss =
        !window.settings.dungeonBossFight &&
        opponent?.innerText?.toLowerCase().includes("boss");

    // If it's a boss and we don't want to fight bosses, exit.
    if (!opponent?.getAttribute("src") && skipBoss) {
        if (typeof window.exitDungeon === "function") {
            window.exitDungeon();
        } else {
            console.log("exitDungeon function not found.");
        }
        return;
    }

    // Click the opponent if found
    if (opponent) {
        opponent.click();
    }
};

/**
 * If HP is below minHP, switch to main char and use food.
 */
window.handleHomeCase = function () {
    if (!window.settings || typeof window.getCurrentHP !== "function") {
        console.log("Settings or getCurrentHP not available; cannot handle home logic.");
        return;
    }

    if (window.getCurrentHP() < window.settings.minHP) {
        if (typeof window.switchToFirstInventoryTab === "function") {
            window.switchToFirstInventoryTab();
        }
        if (typeof window.update_settings === "function") {
            window.update_settings("forceReload", true);
        }
        if (typeof window.switchToMainCharacter === "function") {
            window.switchToMainCharacter();
        }
        console.log("HP is low, using food");
        if (typeof window.useOptimalFood === "function") {
            window.useOptimalFood();
        }
        if (typeof window.update_settings === "function") {
            window.update_settings("forceReload", true);
        }
    }
};

/**
 * If autoTurma is on, attempts to select an optimal attack and click it.
 */
window.handleTurmaCase = async function () {
    if (!window.settings || !window.settings.autoTurma) return;
    if (typeof window.selectOptimalAttack !== "function") {
        console.log("selectOptimalAttack function not found.");
        return;
    }

    const $own3 = $("#own3");
    if (!$own3.length) {
        console.log("#own3 not found; cannot handle Turma attack.");
        return;
    }

    try {
        const opponent = await window.selectOptimalAttack($own3);
        console.log(opponent);
        if (opponent) {
            opponent.click();
            setTimeout(() => {
                if (window.CTA_SELECTORS.CONFIRM_ATTACK) {
                    $(window.CTA_SELECTORS.CONFIRM_ATTACK).click();
                }
            }, 1000);
        }
    } catch (err) {
        console.error("Error selecting Turma attack:", err);
    }
};

/**
 * If autoArena is on, attempts to select an optimal attack and click it.
 */
window.handleArenaCase = async function () {
    console.log({
        settings: !window.settings,
        autoarena: !window.settings.autoArena
    })
    if (!window.settings || !window.settings.autoArena) return;
    if (typeof window.selectOptimalAttack !== "function") {
        console.log("selectOptimalAttack function not found.");
        return;
    }

    const $own2 = $("#own2");
    if (!$own2.length) {
        console.log("#own3 not found; cannot handle Arena attack.");
        return;
    }

    try {
        const opponent = await window.selectOptimalAttack($own2);
        if (opponent) {
            opponent.click();
            setTimeout(() => {
                if (window.CTA_SELECTORS.CONFIRM_ATTACK) {
                    $(window.CTA_SELECTORS.CONFIRM_ATTACK).click();
                }
            }, 1000);
        }
    } catch (err) {
        console.error("Error selecting Arena attack:", err);
    }
};

/**
 * Checks if the current report is a Turma report. If so, parse and update the attack history.
 */
window.handleReportCase = function () {
    if (
        typeof window.getReportType !== "function" ||
        typeof window.REPORTS_MODES !== "object"
    ) {
        console.log("getReportType or REPORTS_MODES not available; cannot handle report logic.");
        return;
    }
    if (window.getReportType() === window.REPORTS_MODES.TURMA) {
        if (
            typeof window.parseTurmaReport !== "function" ||
            typeof window.updateTurmaAttackHistory !== "function"
        ) {
            console.log("parseTurmaReport or updateTurmaAttackHistory not available.");
            return;
        }
        const parsedReport = window.parseTurmaReport();
        if (parsedReport) {
            window.updateTurmaAttackHistory(parsedReport.opponent, parsedReport.result);
        }
    }
};

/**
 * Decides which function to call based on ?mod=... in the URL.
 */
window.performScreenLogic = function () {
    if (typeof window.SCREEN_MODES !== "object") {
        console.log("SCREEN_MODES is not defined; cannot perform screen logic.");
        return;
    }

    const mod = new URLSearchParams(window.location.search).get("mod");
    switch (mod) {
        case window.SCREEN_MODES.EXPEDITION:
            window.handleExpeditionCase();
            break;
        case window.SCREEN_MODES.DUNGEON:
            window.handleDungeonCase();
            break;
        case window.SCREEN_MODES.HOME:
            window.handleHomeCase();
            break;
        case window.SCREEN_MODES.REPORT:
            window.handleReportCase();
            break;
        case window.SCREEN_MODES.ARENA: {
            console.log("in arena");
            const searchParams = new URLSearchParams(window.location.search);
            console.log(searchParams);
            if (
                searchParams.get("submod") === window.ARENA_SUBMODES.PROVINCIARUM &&
                searchParams.get("aType") === String(window.PROVINCIARUM_TYPES.ARENA)
            ) {
                console.log("Handling Arena")
                window.handleArenaCase();
            }
            if (
                searchParams.get("submod") === window.ARENA_SUBMODES.PROVINCIARUM &&
                searchParams.get("aType") === String(window.PROVINCIARUM_TYPES.TURMA)
            ) {
                window.handleTurmaCase();
            }
            break;
        }
        default:
            break;
    }
};

/**
 * Main entry point called on window load.
 * Loads settings, merges them with defaults, sets up an observer, then runs screen logic.
 */
window.initExtension = async function () {
    let loadedSettings = {};
    try {
        // Attempt to load settings and turma history
        if (typeof window.loadSettings === "function") {
            loadedSettings = await window.loadSettings();
        } else {
            console.log("loadSettings function not found; settings cannot be loaded.");
        }
        if (typeof window.loadTurmaHistory === "function") {
            window.turmaAttackHistory = await window.loadTurmaHistory();
        } else {
            console.log("loadTurmaHistory function not found; turma attack history cannot be loaded.");
        }
    } catch (err) {
        console.log("Error loading settings or turma history:", err);
    }

    // Merge loaded settings with current global settings
    if (typeof window.settings !== "object" || !window.settings) {
        console.log("Global settings object is not available; creating a fallback one.");
        window.settings = {};
    }
    Object.keys(loadedSettings).forEach((key) => {
        window.settings[key] = loadedSettings[key];
    });

    // Apply defaults
    if (typeof window.default_settings === "object") {
        Object.keys(window.default_settings).forEach((key) => {
            if (window.settings[key] == null && typeof window.update_settings === "function") {
                window.update_settings(key, window.default_settings[key]);
            }
        });
    }

    if (typeof window.getCurrentHP === "function") {
        const hp = window.getCurrentHP();
        console.log(`Current hp is at: ${Math.round(hp * 100)}%`);
    } else {
        console.log("getCurrentHP not defined; cannot display current HP.");
    }

    // Parse and store location data if parseLocations is available
    if (typeof window.parseLocations === "function") {
        window.parseLocations();
    }

    // If a time observer is set up, observe the server time element
    if (typeof window.timeObserver === "object" && typeof window.SELECTORS === "object") {
        const serverTimeEl = $(window.SELECTORS.ServerTime)[0];
        if (serverTimeEl) {
            window.timeObserver.observe(serverTimeEl, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true,
            });
        }
    }

    // Perform screen-specific logic
    window.performScreenLogic();
};

// Attach initExtension to the window load event
window.addEventListener("load", () => {
    if (typeof window.initExtension === "function") {
        window.initExtension();
    } else {
        console.log("initExtension is not defined.");
    }
}, false);
