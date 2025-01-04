/**
 * constants.js
 *
 * This file holds global constants and default configurations.
 * Lines of code here are documented thoroughly but do not exceed 100
 * actual code lines when counting only executable/statements.
 */

// ---------------------------
//           CONSTANTS
// ---------------------------

// Global lock to prevent repeated triggers
window.timeLocked = false;

/**
 * A global object to store Turma attack histories.
 */
window.turmaAttackHistory = {};

/**
 * Holds user-defined or default settings. Will be merged upon initialization.
 */
window.settings = {};

/**
 * Default extension settings, merged if absent in stored data.
 */
window.default_settings = {
    autoExpedition: true,
    autoDungeon: true,
    autoHeal: true,
    autoTurma: false,
    expeditionLocation: 3, // e.g. WOLF_CAVE
    expeditionLevel: 2,
    dungeonLevel: 2,
    minHP: 0.25,
    dungeonStrategy: 0, // 0 => SLOW, 1 => FAST
    dungeonBossFight: false,
    forceReload: false,
};

/**
 * Possible screen modes for ?mod=...
 */
window.SCREEN_MODES = {
    DUNGEON: "dungeon",
    EXPEDITION: "location", // Corrected spelling
    REPORT: "reports",
    HOME: "overview",
    TRAINING: "training",
    FORGE: "forge",
    AUCTION: "auction",
    ARENA: "arena",
};

/**
 * Arena submodes (?submod=...).
 */
window.ARENA_SUBMODES = {
    ARENA: "",
    PROVINCIARUM: "serverArena",
    CIRCUS_TURMA: "groupArena",
};

/**
 * Provinciarum types in the game environment.
 */
window.PROVINCIARUM_TYPES = {
    ARENA: 2,
    TURMA: 3,
};

/**
 * Forge modes (if relevant).
 */
window.FORGE_MODES = {
    FORGE: "forge",
    SMELTER: "smelter",
    WORKBENCH: "workbench",
};

/**
 * Store types, if relevant.
 */
window.STORES = {
    WEAPONS: 1,
    ARMOR: 2,
    GENERAL: 3,
    ALCHEMIST: 4,
    MERCENARY: 5,
    MALEFICA: 6,
};

/**
 * Expedition locations enumerations.
 */
window.EXPEDITION_LOCATIONS = {
    GRIMWOOD: 0,
    PIRATE_HARBOR: 1,
    MISTY_MOUNTAINS: 2,
    WOLF_CAVE: 3,
    ANCIENT_TEMPLE: 4,
    BARBARIAN_VILLAGE: 5,
    BANDIT_CAMP: 6,
    SNOW_EVENT: "tundra",
};

/**
 * For interpreting t= in the URL to identify report types.
 */
window.REPORTS_MODES = {
    EXPEDITION: "0",
    DUNGEON: "1",
    ARENA: "2",
    TURMA: "3",
};

/**
 * Common call-to-action (CTA) button references for quick usage.
 * Each selector returns the first matching element or null if not found.
 */
window.CTA_SELECTORS = {
    THOROUGH_SEARCH:
        $(".loot-button")
            .toArray()
            .filter((e) => $(e).text().trim().toLowerCase() === "thorough search")[0] || null,

    START_DUNGEON: (() => {
        const h3Filtered = $("h3")
            .toArray()
            .filter((e) => $(e).text().trim().toLowerCase() !== "enter dungeon");
        if (h3Filtered.length === 0) return null;
        const nextElem = $(h3Filtered[0]).next();
        if (!nextElem.length) return null;
        return nextElem.find("input[type=button]").toArray().filter(e => !e.getAttribute("disabled")).sort((a, b) => a.value.toLowerCase().localeCompare(b.value.toLowerCase()))[0] || null;
    })(),

    LEVEL_UP: $("#linknotification").length ? $("#linknotification")[0] : null,
    CONFIRM_ATTACK: $("#linkbod").length ? $("#linkbod")[0] : null
};

/**
 * Possible strategies for dungeon approach.
 */
window.DUNGEON_STRATEGIES = {
    SLOW: 0,
    FAST: 1,
};

/**
 * Some commonly used selectors.
 */
window.SELECTORS = {
    ExpeditionTimeText: "#cooldown_bar_text_expedition",
    ServerTime: "#server-time",
    DungeonTimeText: "#cooldown_bar_text_dungeon",
};
