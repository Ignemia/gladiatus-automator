/**
 * healing.js
 *
 * Functions for checking current HP, switching to main char, and using food items.
 */

/**
 * Converts a Roman numeral (including Unicode variants) to a standard integer up to 3999.
 * Logs warnings for invalid or empty inputs.
 *
 * @param {string} roman - The Roman numeral string to convert (ASCII or Unicode).
 * @returns {number} The integer representation, or 0 if invalid.
 */
window.romanToInt = function (roman) {
    // Map common Unicode Roman numerals to ASCII equivalents.
    // Extend as needed, including "Ⅾ" => "D", "Ⅿ" => "M" for completeness.
    const unicodeToAsciiMap = {
        'Ⅰ': 'I',
        'Ⅱ': 'II',
        'Ⅲ': 'III',
        'Ⅳ': 'IV',
        'Ⅴ': 'V',
        'Ⅵ': 'VI',
        'Ⅶ': 'VII',
        'Ⅷ': 'VIII',
        'Ⅸ': 'IX',
        'Ⅹ': 'X',
        'Ⅺ': 'XI',
        'Ⅻ': 'XII',
        'Ⅽ': 'C',  // Rarely used, but included just in case
        'Ⅾ': 'D',
        'Ⅿ': 'M'
    };

    // Replace recognized Unicode numerals with their ASCII equivalents.
    // Any unmapped Unicode characters in range \u2160-\u2188 will remain unchanged
    // and be tested against the standard Roman logic.
    let asciiRoman = roman.replace(/[\u2160-\u2188]/g, (match) => {
        return unicodeToAsciiMap[match] || match;
    });

    // Complete mapping for ASCII Roman numerals up to 1000 (M)
    // D = 500, M = 1000
    const map = {
        I: 1,
        V: 5,
        X: 10,
        L: 50,
        C: 100,
        D: 500,
        M: 1000
    };

    // Basic input checks
    if (typeof asciiRoman !== "string" || !asciiRoman.trim()) {
        console.log("Invalid input for romanToInt:", roman);
        return 0;
    }

    // Normalize spacing & case
    const normalizedRoman = asciiRoman.trim().toUpperCase();

    // Regex for standard Roman numerals up to 3999 (MMMCMXCIX)
    const validRomanRegex = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
    if (!validRomanRegex.test(normalizedRoman)) {
        console.log("Invalid Roman numeral format:", roman);
        return 0;
    }

    let result = 0;
    let prev = 0;

    // Parse from right to left
    for (let i = normalizedRoman.length - 1; i >= 0; i--) {
        const char = normalizedRoman[i];
        const current = map[char];

        // Subtractive notation (e.g., IV => 4)
        if (current < prev) {
            result -= current;
        } else {
            result += current;
        }
        prev = current;
    }

    return result;
};

/**
 * Gets the numeric representation of the currently selected inventory tab.
 * @returns {number} The integer representation of the tab's Roman numeral (e.g., "I" => 1).
 */
window.getCurrentInvTab = function () {
    const $currentTab = $("#inventory_nav").find(".current");
    console.log($currentTab);
    if (!$currentTab.toArray().length) {
        console.log("Current inventory tab element not found.");
        return 0;
    }

    const romanText = $currentTab.text().trim().toUpperCase();
    const tabNumber = window.romanToInt(romanText);
    console.log(`Current inventory tab: ${romanText} => ${tabNumber}`);
    return tabNumber;
};

/**
 * Returns the index of the active character among .charmercsel elements.
 * @returns {number} The zero-based index of the active character.
 */
window.getCurrentCharacter = function () {
    const $elements = $(".charmercsel");
    const $activeElement = $(".charmercsel.active");
    const index = $elements.index($activeElement);
    console.log(`Current active character index: ${index}`);
    return index;
};

/**
 * Switches to the main character (index 0) if not already selected.
 */
window.switchToMainCharacter = function () {
    const currentChar = window.getCurrentCharacter();
    if (currentChar === 0) {
        console.log("Main character is already selected.");
        return;
    }
    const $elements = $(".charmercsel");
    if ($elements.length) {
        $elements.first().trigger("click");
        console.log("Switched to main character.");
    } else {
        console.log("No .charmercsel elements found to switch to.");
    }
};

/**
 * Click the first tab in #inventory_nav if not already in tab 1 ("I").
 */
window.switchToFirstInventoryTab = function () {
    const currentTab = window.getCurrentInvTab();
    if (currentTab === 1) {
        console.log("Already on the first inventory tab (I).");
        return;
    }

    const $inventoryNav = $("#inventory_nav");
    if (!$inventoryNav.toArray().length) {
        console.log("#inventory_nav not found. Cannot switch inventory tab.");
        return;
    }

    const $firstTab = $inventoryNav.find("a").first();
    if ($firstTab.toArray().length) {
        // Using native .click() to mimic user interaction
        $firstTab[0].click();
        console.log("Switched to the first inventory tab.");

        // Optional: Check if the tab has changed after a small delay
        setTimeout(() => {
            const newTab = window.getCurrentInvTab();
            console.log(`New inventory tab after switch: ${newTab}`);
        }, 500);
    } else {
        console.log("No inventory tabs found to click.");
    }
};

/**
 * Gets the ratio (current / max HP) from #header_values_hp_bar.
 * @returns {number} Ratio of current HP to max HP (0 if not found).
 */
window.getCurrentHP = function () {
    const $hpBar = $("#header_values_hp_bar");
    if (!$hpBar.length) {
        console.log("#header_values_hp_bar not found.");
        return 0;
    }

    const current = parseInt($hpBar.data("value"), 10) || 0;
    const max = parseInt($hpBar.data("max-value"), 10) || 1; // Avoid division by zero

    const ratio = current / max;
    console.log(`Current HP: ${current}, Max HP: ${max}, Ratio: ${ratio}`);
    return ratio;
};

/**
 * Returns { current, max } HP in integer form.
 * @returns {{ current: number, max: number }}
 */
window.getHealthPoints = function () {
    const ratio = window.getCurrentHP();
    const $hpBar = $("#header_values_hp_bar");
    if (!$hpBar.length) {
        // Fallback if the bar isn't present
        return { current: 0, max: 0 };
    }

    const maxHp = parseInt($hpBar.data("max-value"), 10) || 0;
    const currentHp = Math.ceil(ratio * maxHp);
    console.log(`Health Points => Current: ${currentHp}, Max: ${maxHp}`);
    return { current: currentHp, max: maxHp };
};

/**
 * Extracts the integer healing value from a tooltip text, e.g. "Using: Heals 50 of life".
 * @param {string} tooltip
 * @returns {number|null} The healing amount, or null if not found.
 */
window.extractHealingValue = function (tooltip) {
    if (!tooltip || typeof tooltip !== "string") {
        console.log("Invalid tooltip input for extractHealingValue:", tooltip);
        return null;
    }

    const regex = /Using:\s*Heals\s*(\d+)\s*of\s*life/i;
    const match = tooltip.match(regex);
    const healing = match ? parseInt(match[1], 10) : null;
    console.log(`extractHealingValue => ${healing}`);
    return healing;
};

/**
 * Simulates a native drag-and-drop (mousedown -> mousemove -> mouseup).
 * Used to move items (food) onto the character's avatar for healing.
 *
 * @param {JQuery} $dragElement - The jQuery-wrapped element to drag.
 * @param {JQuery} $dropTarget - The jQuery-wrapped element to drop onto.
 */
window.simulateDragAndDrop = function ($dragElement, $dropTarget) {
    if (!$dragElement || !$dropTarget) {
        console.log("Invalid drag or drop element for simulateDragAndDrop.");
        return;
    }

    const dragEl = $dragElement[0];
    const dropEl = $dropTarget[0];

    if (!dragEl || !dropEl) {
        console.log("One or both elements for simulateDragAndDrop are not valid DOM elements.");
        return;
    }

    const rectDrag = dragEl.getBoundingClientRect();
    const rectDrop = dropEl.getBoundingClientRect();

    // Dispatch a mousedown event on the drag element
    dragEl.dispatchEvent(
        new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            clientX: rectDrag.x + rectDrag.width / 2,
            clientY: rectDrag.y + rectDrag.height / 2,
        })
    );

    // Dispatch a mousemove event on the drop target
    dropEl.dispatchEvent(
        new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
            clientX: rectDrop.x + rectDrop.width / 2,
            clientY: rectDrop.y + rectDrop.height / 2,
        })
    );

    // Finally, dispatch a mouseup event on the drop target
    dropEl.dispatchEvent(
        new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            clientX: rectDrop.x + rectDrop.width / 2,
            clientY: rectDrop.y + rectDrop.height / 2,
        })
    );

    console.log("simulateDragAndDrop => Moved item from dragEl to dropEl.");
};

/**
 * Uses the optimal food item to heal (closest to missing HP, else the smallest).
 * Selects from elements with data-content-type="64" (food).
 */
window.useOptimalFood = function () {
    const foodItems = $('div[data-content-type="64"]');
    if (!foodItems.length) {
        console.log("No food items found to use for healing.");
        return;
    }

    const foods = [];
    foodItems.each((_, el) => {
        const $el = $(el);
        const tooltip = $el.attr("data-tooltip") || "";
        const healing = window.extractHealingValue(tooltip);
        if (healing !== null) {
            foods.push({ element: $el, healing });
        }
    });

    if (!foods.length) {
        console.log("No valid food items with healing values found.");
        return;
    }

    const { current, max } = window.getHealthPoints();
    const missing = max - current;
    console.log(`Missing HP: ${missing}`);

    if (missing <= 0) {
        console.log("HP is already full. No need to use food.");
        return;
    }

    let optimalFood = null;
    let smallestDiff = Infinity;

    // Find food whose healing is closest to (but not exceeding) missing HP
    foods.forEach((food) => {
        const diff = missing - food.healing;
        // We want diff >= 0 (no over-heal) and as small as possible
        if (diff >= 0 && diff < smallestDiff) {
            smallestDiff = diff;
            optimalFood = food;
        }
    });

    // If all foods exceed missing HP, pick the one with the smallest healing to minimize waste
    if (!optimalFood) {
        optimalFood = foods.reduce((acc, cur) => (acc.healing < cur.healing ? acc : cur));
        console.log("Selected over-healing food due to all items exceeding missing HP.");
    } else {
        console.log("Selected optimal food based on missing HP.");
    }

    if (!optimalFood) {
        console.log("No suitable food item found to use.");
        return;
    }

    const $dropTarget = $("#avatar .ui-droppable");
    if ($dropTarget.length) {
        window.simulateDragAndDrop(optimalFood.element, $dropTarget);
        console.log(`Used optimal food item (healing: ${optimalFood.healing}).`);
    } else {
        console.log("Drop target for food items not found (#avatar .ui-droppable).");
    }
};
