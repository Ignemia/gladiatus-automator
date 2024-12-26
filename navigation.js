/**
 * navigation.js
 *
 * Functions for navigating among the main screens: expedition, dungeon, profile, etc.
 */

/**
 * Navigates to the expedition tab (?mod=location) with the stored expedition location.
 */
window.openExpeditionTab = function () {
    if (typeof window.settings !== "object" || !window.settings) {
        console.log("window.settings is not available. Cannot open expedition tab.");
        return;
    }
    const currentMod = new URLSearchParams(window.location.search).get("mod");

    // Ensure SCREEN_MODES.EXPEDITION is spelled correctly
    if (currentMod !== window.SCREEN_MODES.EXPEDITION) {
        // Check if createLink exists
        if (typeof window.createLink !== "function") {
            console.log("window.createLink is not defined. Cannot open expedition tab.");
            return;
        }
        const expeditionLoc = window.settings.expeditionLocation ?? 0;
        window.location.href = window.createLink(window.SCREEN_MODES.EXPEDITION, expeditionLoc);
    }
};

/**
 * Navigates to the dungeon tab (?mod=dungeon) with the stored dungeonLevel.
 */
window.openDungeonTab = function () {
    if (typeof window.settings !== "object" || !window.settings) {
        console.log("window.settings is not available. Cannot open dungeon tab.");
        return;
    }
    const currentMod = new URLSearchParams(window.location.search).get("mod");

    if (currentMod !== window.SCREEN_MODES.DUNGEON) {
        if (typeof window.createLink !== "function") {
            console.log("window.createLink is not defined. Cannot open dungeon tab.");
            return;
        }
        const dungeonLvl = window.settings.dungeonLevel ?? 1;
        window.location.href = window.createLink(window.SCREEN_MODES.DUNGEON, dungeonLvl);
    }
};

/**
 * Navigates to the "home" screen (?mod=overview).
 */
window.openProfile = function () {
    const currentMod = new URLSearchParams(window.location.search).get("mod");
    if (currentMod !== window.SCREEN_MODES.HOME) {
        if (typeof window.createLink !== "function") {
            console.log("window.createLink is not defined. Cannot open profile tab.");
            return;
        }
        window.location.href = window.createLink(window.SCREEN_MODES.HOME, null);
    }
};

/**
 * Cancels or exits the current dungeon (if the button is present).
 */
window.exitDungeon = function () {
    // Look for an input with value="cancel dungeon" among .button1 elements
    const cancelBtn = $(".button1")
        .toArray()
        .find((e) => e.value && e.value.toLowerCase() === "cancel dungeon");

    if (cancelBtn) {
        $(cancelBtn).trigger("click");
    } else {
        console.log("No 'cancel dungeon' button found.");
    }
};

/**
 * Clicks the "Attack" button for whichever expedition target is selected by a radio input.
 */
window.attack_target = function () {
    // .expedition-selector:checked => the selected radio
    const $selectedRadio = $(".expedition-selector:checked");
    if (!$selectedRadio.length) {
        console.log("No expedition target is selected. Cannot attack.");
        return;
    }
    // The nearest .expedition_box, then find .expedition_button
    const $attackButton = $selectedRadio
        .closest(".expedition_box")
        .find(".expedition_button")
        .first();

    if ($attackButton.length) {
        $attackButton.trigger("click");
    } else {
        console.log("No .expedition_button found for the selected expedition target.");
    }
};

/**
 * From a radio input, read the location/dungeon level stored in the onclick attribute.
 * @param {HTMLElement|JQuery} radioBox
 * @returns {string|null}
 */
window.getLocationIdFromRadioBox = function (radioBox) {
    const $button = $(radioBox)
        .closest(".expedition_box")
        .find(".expedition_button.awesome-button")
        .first();

    if (!$button.length) {
        console.log("No .expedition_button found in the same .expedition_box. Cannot get location ID.");
        return null;
    }

    const onclickAttr = $button.attr("onclick") || "";
    const match = onclickAttr.match(/[^,]+,\s*'(\d+)',\s*[^)]*/);
    return match ? match[1] : null;
};

/**
 * Renders radio buttons for each .expedition_box, hooking up onChange events to update settings.
 * Each box's name is read, and a radio input is appended to .expedition_picture.
 */
window.renderExpeditionSelection = function () {
    if (typeof window.settings !== "object" || !window.settings) {
        console.log("window.settings is not available. Cannot render expedition selection.");
        return;
    }
    if (typeof window.update_settings !== "function" || typeof window.parseValue !== "function") {
        console.log("Required functions (update_settings, parseValue) are not defined.");
        return;
    }

    let counter = 0;
    $(".expedition_box").each((_, box) => {
        const $box = $(box);
        const expeditionName = $box.find(".expedition_name").text().trim() || `Expedition #${counter + 1}`;

        // Create a new radio input
        const $newElement = $(`
          <input class="expedition-selector" type="radio" name="expedition" value="${expeditionName}">
        `);

        // On change, update settings
        $newElement.on("change", (e) => {
            const $target = $(e.currentTarget);

            // This index is the order of the .expedition_box in the DOM
            window.update_settings("expeditionLevel", $target.closest(".expedition_box").index());

            const locId = window.getLocationIdFromRadioBox($target);
            const parsedLocId = window.parseValue(locId);
            window.update_settings("expeditionLocation", parsedLocId);
        });

        // Check if this box matches the stored expeditionLevel
        if (counter === window.settings.expeditionLevel) {
            $newElement.prop("checked", true);
        }

        // Append the radio input to the .expedition_picture
        const $picture = $box.find(".expedition_picture");
        if ($picture.length) {
            $picture.append($newElement);
        } else {
            console.log("No .expedition_picture element found in .expedition_box:", box);
        }
        counter++;
    });
};

/**
 * Create a link that appends ?sh=<param> and &loc if needed.
 * @param {string} mode      - e.g. "location" for expedition, "dungeon" for dungeon
 * @param {number|string} loc - location ID or dungeon level
 * @param {object|null} bonus - Additional query parameters as key-value pairs
 * @returns {string} The constructed URL
 */
window.createLink = function (mode, loc, bonus = null) {
    let baseLink = `${window.location.protocol}//${window.location.hostname}/game/index.php?mod=${mode}`;

    if (loc !== null && loc !== undefined) {
        // Use 'loc' for both Expedition and Dungeon modes
        if (mode === window.SCREEN_MODES.EXPEDITION || mode === window.SCREEN_MODES.DUNGEON) {
            baseLink += `&loc=${loc}`;
        } else {
            baseLink += `&submod=${loc}`;
        }
    }

    if (bonus !== null && bonus !== undefined) {
        for (const [key, value] of Object.entries(bonus)) {
            baseLink += `&${key}=${value}`;
        }
    }

    const shParam = new URLSearchParams(window.location.search).get("sh");
    if (shParam) {
        baseLink += `&sh=${shParam}`;
    }

    return baseLink;
};

/**
 * Parses a string value into an integer/float if possible, otherwise returns as-is.
 * @param {string} val
 * @returns {number|string}
 */
window.parseValue = function (val) {
    if (/^\d+$/.test(val)) return parseInt(val, 10);
    if (/^\d+\.\d+$/.test(val)) return parseFloat(val);
    return val;
};
