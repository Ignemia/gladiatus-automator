/**
 * healing.js
 *
 * Functions for checking current HP, switching to main char, and using food items.
 */

/**
 * Converts a Roman numeral (I, II, III...) to an integer for reading the inventory tab.
 * @param {string} roman
 * @returns {number} The integer value of the Roman numeral, or 0 if invalid
 */
window.romanToInt = function (roman) {
    const map = { I: 1, V: 5, X: 10, L: 50, C: 100 };
    let result = 0;
    let prev = 0;

    if (typeof roman !== "string" || !roman.length) {
        return 0;
    }

    for (let i = roman.length - 1; i >= 0; i--) {
        const current = map[roman[i].toUpperCase()] || 0;
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
 * @returns {number} The integer representation of the Roman numeral tab (e.g., "I" => 1)
 */
window.getCurrentInvTab = function () {
    const $currentTab = $("#inventory_nav").next().find(".current");
    if (!$currentTab.length) return 0;

    const romanText = $currentTab.text().trim().toUpperCase();
    return window.romanToInt(romanText);
};

/**
 * Returns the index of the active character among .charmercsel elements.
 * @returns {number} The zero-based index of the active character
 */
window.getCurrentCharacter = function () {
    const $elements = $(".charmercsel");
    const $activeElement = $(".charmercsel.active");
    return $elements.index($activeElement);
};

/**
 * Switch to the main character (index 0) if not already selected.
 */
window.switchToMainCharacter = function () {
    if (window.getCurrentCharacter() === 0) return;
    const $elements = $(".charmercsel");
    if ($elements.length) {
        $elements.first().click();
    }
};

/**
 * Click the first tab in #inventory_nav if not already in tab 1 (Roman "I").
 */
window.switchToFirstInventoryTab = function () {
    if (window.getCurrentInvTab() === 1) return;
    const $tabs = $("#inventory_nav").find("a");
    if ($tabs.length) {
        $tabs.first().trigger("click");
    }
};

/**
 * Gets the ratio (current / max HP).
 * @returns {number} A floating-point ratio of current HP to max HP (0 if something is invalid)
 */
window.getCurrentHP = function () {
    const hpBar = $("#header_values_hp_bar");
    if (!hpBar.length) return 0;

    const current = parseInt(hpBar.data("value"), 10) || 0;
    const max = parseInt(hpBar.data("max-value"), 10) || 1; // Avoid division by 0

    return current / max;
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
    return { current: Math.ceil(ratio * maxHp), max: maxHp };
};

/**
 * Extract the integer healing value from tooltip text (e.g. "Using: Heals 50 of life").
 * @param {string} tooltip
 * @returns {number|null} The healing amount, or null if the pattern isn't found
 */
window.extractHealingValue = function (tooltip) {
    if (!tooltip || typeof tooltip !== "string") return null;

    const regex = /Using:\s*Heals\s*(\d+)\s*of\s*life/i;
    const match = tooltip.match(regex);
    return match ? parseInt(match[1], 10) : null;
};

/**
 * Simulates a native drag-and-drop (mousedown/mousemove/mouseup).
 * @param {JQuery} $dragElement - The jQuery-wrapped element to drag
 * @param {JQuery} $dropTarget - The jQuery-wrapped element to drop onto
 */
window.simulateDragAndDrop = function ($dragElement, $dropTarget) {
    if (!$dragElement || !$dropTarget) return;

    const dragEl = $dragElement[0];
    const dropEl = $dropTarget[0];

    if (!dragEl || !dropEl) return;

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
};

/**
 * Uses the optimal food item to heal (closest to missing HP, else the smallest).
 */
window.useOptimalFood = function () {
    // Find all food items by data-content-type="64"
    const foodItems = $('div[data-content-type="64"]');
    if (!foodItems.length) return;

    const foods = [];
    foodItems.each((_, el) => {
        const $el = $(el);
        const tooltip = $el.attr("data-tooltip") || "";
        const healing = window.extractHealingValue(tooltip);
        if (healing !== null) {
            foods.push({ element: $el, healing });
        }
    });

    if (!foods.length) return;

    const { current, max } = window.getHealthPoints();
    const missing = max - current;
    if (missing <= 0) return; // No need to heal if HP is already full or invalid

    let optimalFood = null;
    let smallestDiff = Infinity;

    // Find food whose healing is closest to missing HP (but not over-healing too much)
    foods.forEach((food) => {
        const diff = missing - food.healing;
        // We want a diff >= 0 (meaning it won't exceed HP) and as small as possible
        if (diff >= 0 && diff < smallestDiff) {
            smallestDiff = diff;
            optimalFood = food;
        }
    });

    // If all foods exceed missing HP, pick the one with the smallest healing (to minimize waste)
    if (!optimalFood) {
        optimalFood = foods.reduce((acc, cur) => (acc.healing < cur.healing ? acc : cur));
    }

    if (!optimalFood) return;

    // Find where to drop the food (avatar area)
    const $dropTarget = $("#avatar .ui-droppable");
    if ($dropTarget.length) {
        window.simulateDragAndDrop(optimalFood.element, $dropTarget);
    }
};
