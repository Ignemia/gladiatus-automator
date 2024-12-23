// ---------------------------
//           CONSTANTS
// ---------------------------
let timeLocked = false;

const SCREEN_MODES = {
    DUNGEON: "dungeon",
    EXPEDITON: "location",
    REPORT: "reports",
    HOME: "overview",
    TRAINING: "training",
    FORGE: "forge",
    AUCTION: "auction",
};

const FORGE_MODES = {
    FORGE: "forge",
    SMELTER: "smelter",
    WORKBENCH: "workbench",
};

const STORES = {
    WEAPONS: 1,
    ARMOR: 2,
    GENERAL: 3,
    ALCHEMIST: 4,
    MERCENARY: 5,
    MALEFICA: 6,
};

const EXPEDITION_LOCATIONS = {
    GRIMWOOD: 0,
    PIRATE_HARBOR: 1,
    MISTY_MOUNTAINS: 2,
    WOLF_CAVE: 3,
    ANCIENT_TEMPLE: 4,
    BARBARIAN_VILLAGE: 5,
    BANDIT_CAMP: 6,
    SNOW_EVENT: "tundra",
};

const REPORTS_MODES = {
    COMBAT_REPORT: "showCombatReport",
};

const CTA_SELECTORS = {
    THOROUGH_SEARCH: $(".loot-button").filter((e) => $(e).text().toLowerCase() !== "thorough search")[0],
    START_DUNGEON: $("h3").filter((e) => $(e).text().toLowerCase() !== "enter dungeon").next().find("button")[0],
    // LEVEL_UP: "#level_up",
};

const DUNGEON_STRATEGIES = {
    SLOW: 0,
    FAST: 1,
};

const SELECTORS = {
    ExpeditionTimeText: "#cooldown_bar_text_expedition",
    ServerTime: "#server-time",
    DungeonTimeText: "#cooldown_bar_text_dungeon",
};

// ---------------------------
//      SETTINGS HANDLING
// ---------------------------
const settings = {};

const default_settings = {
    autoExpedition: true,
    autoDungeon: true,
    autoHeal: true,
    autoTurma: false,
    expeditionLocation: EXPEDITION_LOCATIONS.WOLF_CAVE,
    expeditionLevel: 2,
    dungeonLevel: 2,
    minHP: 0.25,
    dungeonStrategy: DUNGEON_STRATEGIES.SLOW,
    dungeonBossFight: false,
};

function storeSettings() {
    chrome.storage.local.set({"gladex_settings": settings});
}

function update_settings(key, value) {
    console.log({key, value});
    settings[key] = value;
    storeSettings();
}

async function loadSettings() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("gladex_settings", (stored) => {
            if (stored && stored.gladex_settings) {
                resolve(stored.gladex_settings);
            } else {
                reject("Settings not found.");
            }
        });
    });
}

// ---------------------------
//       LOCATION PARSING
// ---------------------------

function parseLocations() {
    const submenu = $("#submenu2");
    if (!submenu.length) {
        console.warn("submenu2 not found");
        return;
    }

    const locationElements = submenu.children(".menuitem, .menuitem.inactive");

    const locations = [];

    locationElements.each((_, elem) => {
        const $elem = $(elem);
        let locId = null;
        let name = $elem.text().trim();

        if ($elem.is("a")) {
            const href = $elem.attr("href");
            const params = new URLSearchParams(href.split('?')[1]);
            locId = params.get("loc");
        } else if ($elem.is("span")) {
            // Inactive locations might not have loc IDs; assume locId is from the span's id
            const idAttr = $elem.attr("id");
            const match = idAttr.match(/location_inactive_(\d+)/);
            if (match) {
                locId = match[1];
            } else {
                console.warn("Cannot parse locId for inactive location:", name);
            }
        }

        if (locId !== null) {
            // Convert locId to number if possible
            const parsedLocId = isNaN(Number(locId)) ? locId : Number(locId);
            locations.push({name, locId: parsedLocId});
        }
    });

    // Store the locations in chrome.storage.local
    chrome.storage.local.set({locations}, () => {
        console.log("Locations parsed and stored:", locations);
    });
}

// ---------------------------
//          UTILITIES
// ---------------------------
function parseTime(timeString) {
    const [hh, mm, ss] = timeString.split(":");
    return parseInt(hh, 10) * 3600 + parseInt(mm, 10) * 60 + parseInt(ss, 10);
}

/**
 * A generic function to parse cooldown text and return the remaining seconds.
 * If the displayed text matches an expected "go to" or "to circus" phrase, it returns 0.
 */
function getRemainingTime(selector, expectedPhrase) {
    const rawText = $(selector).text().trim().toLowerCase();
    return rawText === expectedPhrase ? 0 : parseTime(rawText);
}

function getTimeUntilExpedition() {
    return getRemainingTime(SELECTORS.ExpeditionTimeText, "go to expedition");
}

function getTimeUntilDungeon() {
    return getRemainingTime(SELECTORS.DungeonTimeText, "go to dungeon");
}

function getTimeToTurma() {
    const turmaText = $("#cooldown_bar_ct").text().trim().toLowerCase();
    return turmaText === "to circus turma" ? 0 : parseTime(turmaText);
}

function createLink(mode, location) {
    let baseLink = `${window.location.protocol}//${window.location.hostname}/game/index.php?mod=${mode}`;
    if (location !== null && location !== undefined) baseLink += `&loc=${location}`;
    const shParam = new URLSearchParams(window.location.search).get("sh");
    return `${baseLink}&sh=${shParam}`;
}

// ---------------------------
//         NAVIGATION
// ---------------------------
function openExpeditionTab() {
    const currentMod = new URLSearchParams(window.location.search).get("mod");
    if (currentMod !== SCREEN_MODES.EXPEDITON) {
        window.location.href = createLink(SCREEN_MODES.EXPEDITON, settings.expeditionLocation);
    }
}

function openDungeonTab() {
    const currentMod = new URLSearchParams(window.location.search).get("mod");
    if (currentMod !== SCREEN_MODES.DUNGEON) {
        window.location.href = createLink(SCREEN_MODES.DUNGEON, settings.dungeonLevel);
    }
}

function openProfile() {
    const currentMod = new URLSearchParams(window.location.search).get("mod");
    if (currentMod !== SCREEN_MODES.HOME) {
        window.location.href = createLink(SCREEN_MODES.HOME, null);
    }
}

function exitDungeon() {
    $(".button1")
        .filter((e) => $(e).text().toLowerCase() !== "cancel dungeon")[0]
        .click();
}

// ---------------------------
//    EXPEDITION & ATTACK
// ---------------------------
function attack_target() {
    $(".expedition-selector:checked")
        .closest(".expedition_box")
        .find(".expedition_button")[0]
        .click();
}

function getLocationIdFromRadioBox(radioBox) {
    const button = $(radioBox)
        .closest(".expedition_box")
        .find(".expedition_button.awesome-button");
    const onclickAttr = button.attr("onclick");
    const match = onclickAttr.match(/[^,]+, '(\d+)', [^)]*/);
    return match ? match[1] : null;
}

function renderExpeditionSelection() {
    let counter = 0;

    $(".expedition_box").each((_, box) => {
        const $box = $(box);
        const expeditionName = $box.find(".expedition_name").text().trim();
        const newElement = $(`
            <input class="expedition-selector" type="radio" name="expedition" value="${expeditionName}">
        `);

        newElement.on("change", (e) => {
            const $target = $(e.target);
            update_settings("expeditionLevel", $target.closest(".expedition_box").index());
            update_settings("expeditionLocation", parseValue(getLocationIdFromRadioBox($target)));
        });

        if (counter === settings.expeditionLevel) newElement.prop("checked", true);

        $box.find(".expedition_picture").append(newElement);
        counter++;
    });
}

// ---------------------------
//    DUNGEON OPPONENT LOGIC
// ---------------------------
function getPotentialOpponents() {
    const labels = $(".map_label").toArray();
    const images = $("img[onclick]").toArray();
    return labels.concat(images).filter((node) =>
        node.nodeName === "DIV" || node.nodeName === "IMG"
    );
}

function extractMatchNumber(element) {
    const onclk = element.getAttribute("onclick");
    const match = onclk.match(/\(\s*['"](\d+)['"]/);
    return match ? parseInt(match[1], 10) : null;
}

function selectOpponent(comparator) {
    const potentialOpponents = getPotentialOpponents();
    let chosen = null;
    let chosenMatch = null;

    potentialOpponents.forEach((opponent) => {
        const matchNum = extractMatchNumber(opponent);
        if (matchNum === null) return;

        const shouldReplace = !chosen || comparator(matchNum, chosenMatch);
        const tieAndDiv = matchNum === chosenMatch && opponent.nodeName === "DIV";

        if (shouldReplace || tieAndDiv) {
            chosen = opponent;
            chosenMatch = matchNum;
        }
    });

    return chosen;
}

function selectDungeonOpponentFast() {
    return selectOpponent((current, selected) => current > selected);
}

function selectDungeonOpponentSlow() {
    return selectOpponent((current, selected) => current < selected);
}

// ---------------------------
//         HEALING / HP
// ---------------------------
function extractHealingValue(tooltip) {
    const regex = /Using:\s*Heals\s*(\d+)\s*of\s*life/i;
    const match = tooltip.match(regex);
    return match ? parseInt(match[1], 10) : null;
}

function getCurrentHP() {
    const hpBar = "#header_values_hp_bar";
    const current = parseInt($(hpBar).data("value"), 10);
    const max = parseInt($(hpBar).data("max-value"), 10);
    return current / max;
}

function getHealthPoints() {
    const ratio = getCurrentHP();
    const maxHp = parseInt($("#header_values_hp_bar").data("max-value"), 10);
    return {current: Math.ceil(ratio * maxHp), max: maxHp};
}

function selectOptimalFood(foods, missingHealth) {
    let optimal = null;
    let smallestDifference = Infinity;

    foods.forEach((food) => {
        const diff = missingHealth - food.healing;
        if (diff >= 0 && diff < smallestDifference) {
            smallestDifference = diff;
            optimal = food;
        }
    });
    return optimal;
}

function simulateDragAndDrop($dragElement, $dropTarget) {
    // Convert jQuery objects to native DOM
    const dragEl = $dragElement[0];
    const dropEl = $dropTarget[0];

    const rectDrag = dragEl.getBoundingClientRect();
    const rectDrop = dropEl.getBoundingClientRect();

    dragEl.dispatchEvent(
        new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            clientX: rectDrag.x + rectDrag.width / 2,
            clientY: rectDrag.y + rectDrag.height / 2,
        })
    );
    dropEl.dispatchEvent(
        new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
            clientX: rectDrop.x + rectDrop.width / 2,
            clientY: rectDrop.y + rectDrop.height / 2,
        })
    );
    dropEl.dispatchEvent(
        new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            clientX: rectDrop.x + rectDrop.width / 2,
            clientY: rectDrop.y + rectDrop.height / 2,
        })
    );
}

function useOptimalFood() {
    const foodItems = $('div[data-content-type="64"]');
    if (!foodItems.length) return;

    const foods = [];
    foodItems.each((_, element) => {
        const $element = $(element);
        const tooltip = $element.attr("data-tooltip");
        const healing = extractHealingValue(tooltip);
        if (healing !== null) {
            foods.push({element: $element, healing});
        }
    });

    if (!foods.length) return;

    const {current, max} = getHealthPoints();
    const missing = max - current;
    if (missing <= 0) return;

    let optimalFood = selectOptimalFood(foods, missing);

    // If no perfect match, pick the smallest healing food
    if (!optimalFood && foods.length > 0) {
        optimalFood = foods.reduce((acc, curr) => (acc.healing < curr.healing ? acc : curr));
    }
    if (!optimalFood) return;

    const $dropTarget = $("#avatar .ui-droppable");
    if ($dropTarget.length) simulateDragAndDrop(optimalFood.element, $dropTarget);
}

// ---------------------------
//       OBSERVER LOGIC
// ---------------------------
function handleCTASelectors() {
    for (const key in CTA_SELECTORS) {
        if ($(CTA_SELECTORS[key]).length) {
            $(CTA_SELECTORS[key]).click();
            return true; // If clicked, stop checking further
        }
    }
    return false;
}

async function handleMutation(mutation) {
    if (!mutation.addedNodes.length || timeLocked) return false;
    timeLocked = true;
    try {
        if (handleCTASelectors()) {
            timeLocked = false;
        }
    } catch (err) {
        console.error(err);
    }

    const timeChangesPromise = new Promise((resolve, reject) => {
        try {
            if (getTimeUntilExpedition() === 0 && settings.autoExpedition) {
                openExpeditionTab();
                attack_target();
                resolve();
            }

            if (getTimeUntilDungeon() === 0 && settings.autoDungeon) {
                openDungeonTab();
                resolve();
            }

            if (getCurrentHP() < settings.minHP && settings.autoHeal) {
                openProfile();
                resolve();
            }

            if (getTimeToTurma() === 0 && settings.autoTurma) {
                openTurma();
                resolve();
            }
            resolve();
        }
        catch (err) {
            reject(err);
        }
    });

    const timeChanges = await timeChangesPromise;
    timeLocked = false;
}

function onMutations(mutationsList) {
    mutationsList.forEach((mutation) => handleMutation(mutation));
}

const timeObserver = new MutationObserver(onMutations);

function openTurma() {
    // Stub function for Turma logic
    console.log("Opening Turma...");
}

// ---------------------------
//    EXPEDITION & ATTACK
// ---------------------------
// (Already defined above)

// ---------------------------
//         MAIN LOGIC
// ---------------------------
function handleExpeditionCase() {
    if (!settings.autoExpedition) return;
    renderExpeditionSelection();
}

function handleDungeonCase() {
    if (!settings.autoDungeon || getTimeUntilDungeon() !== 0) return;

    const forms = $(".contentItem_content form");
    if (forms.length) forms.find(".button1").click();

    const opponent =
        settings.dungeonStrategy === DUNGEON_STRATEGIES.SLOW
            ? selectDungeonOpponentSlow()
            : selectDungeonOpponentFast();

    // Skip boss if not desired
    const skipBoss =
        !settings.dungeonBossFight &&
        opponent?.innerText?.toLowerCase().includes("boss");

    if (!(opponent?.getAttribute("src")) && skipBoss) {
        exitDungeon();
        return;
    }

    if (opponent) opponent.click();
}

function handleHomeCase() {
    if (getCurrentHP() < settings.minHP) {
        console.log("HP is low, using food");
        useOptimalFood();
    }
}

function performScreenLogic() {
    const mod = new URLSearchParams(window.location.search).get("mod");
    switch (mod) {
        case SCREEN_MODES.EXPEDITON:
            handleExpeditionCase();
            break;
        case SCREEN_MODES.DUNGEON:
            handleDungeonCase();
            break;
        case SCREEN_MODES.HOME:
            handleHomeCase();
            break;
        default:
            break;
    }
}

async function initExtension() {
    let loadedSettings = {};
    try {
        loadedSettings = await loadSettings();
    } catch (err) {
        console.warn(err);
    }

    // Merge loaded settings
    Object.keys(loadedSettings).forEach((key) => {
        settings[key] = loadedSettings[key];
    });

    // Apply defaults
    Object.keys(default_settings).forEach((key) => {
        if (settings[key] == null || settings[key] === undefined) {
            update_settings(key, default_settings[key]);
        }
    });

    const hp = getCurrentHP();
    console.log(`Current hp is at: ${Math.round(hp * 100)}%`);

    // Parse and store locations
    parseLocations();

    // Observe server time
    const serverTimeEl = $(SELECTORS.ServerTime)[0];
    if (serverTimeEl) {
        timeObserver.observe(serverTimeEl, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true,
        });
    }

    // Perform logic for current screen
    performScreenLogic();
}

window.addEventListener("load", initExtension, false);
