/**
 * locations.js
 *
 * Logic to parse location data (Expedition locations) from the submenu (#submenu2).
 */

/**
 * Parse expedition or general location data from #submenu2 and store them in Chrome storage.
 */
window.parseLocations = function () {
    const $submenu = $("#submenu2");
    if (!$submenu.length) {
        console.log("submenu2 not found");
        return;
    }

    // We expect '.menuitem' or '.menuitem.inactive' children under #submenu2
    const locationElements = $submenu.children(".menuitem, .menuitem.inactive");
    const locations = [];

    locationElements.each((_, elem) => {
        const $elem = $(elem);
        let locId = null;
        const name = $elem.text().trim();

        // If it's a link (<a>), parse the query parameter ?loc=...
        if ($elem.is("a")) {
            const href = $elem.attr("href") || "";
            // Skip if the element has no meaningful href
            if (!href.includes("?")) {
                return;
            }
            const queryPart = href.split("?")[1] || "";
            const params = new URLSearchParams(queryPart);
            locId = params.get("loc");
        }
        // If it's a span, parse the ID attribute (e.g., id="location_inactive_123")
        else if ($elem.is("span")) {
            const idAttr = $elem.attr("id") || "";
            const match = idAttr.match(/location_inactive_(\d+)/);
            if (match) {
                locId = match[1];
            }
        }

        // Only store this location if locId is found
        if (locId !== null) {
            // If it's numeric, convert it to a Number; otherwise, leave it as a string
            const parsedLocId = isNaN(Number(locId)) ? locId : Number(locId);
            locations.push({ name, locId: parsedLocId });
        }
    });

    // Store the parsed locations in Chrome's local storage
    chrome.storage.local.set({ locations }, () => {
        console.log("Locations parsed and stored:", locations);
    });
};

/**
 * Create a link that appends `?sh=<param>` and additional parameters if needed.
 * @param {string} mode                - e.g. "location" for expedition
 * @param {number|string|null} loc     - location or dungeon level (can be null if not needed)
 * @param {Object|null} bonus          - additional query params as key-value pairs
 * @returns {string} A fully constructed URL string
 */
window.createLink = function (mode, loc, bonus = null) {
    // Safely reference global objects like SCREEN_MODES
    if (typeof window.SCREEN_MODES !== "object") {
        console.log("SCREEN_MODES is not defined; createLink may not behave as expected.");
    }

    // Base link: protocol + hostname + path
    let baseLink = `${window.location.protocol}//${window.location.hostname}/game/index.php?mod=${mode}`;

    // If loc is provided, decide whether to use &loc or &submod
    if (loc !== null && loc !== undefined) {
        if (mode === window.SCREEN_MODES?.DUNGEON) {
            baseLink += `&loc=${loc}`;
        } else {
            baseLink += `&submod=${loc}`;
        }
    }

    // If bonus object is given, append each key-value pair
    if (bonus !== null && bonus !== undefined && typeof bonus === "object") {
        for (const [key, value] of Object.entries(bonus)) {
            baseLink += `&${key}=${value}`;
        }
    }

    // Copy the current "sh" param from the page URL
    const shParam = new URLSearchParams(window.location.search).get("sh") || "";
    return `${baseLink}&sh=${shParam}`;
};

/**
 * Parses a string value into an integer or float if possible, otherwise returns the original string.
 * @param {string} val
 * @returns {number|string} A parsed number (int/float) or the original string if not numeric
 */
window.parseValue = function (val) {
    if (typeof val !== "string") {
        // If val is not a string, return as is (or convert to string if needed)
        return val;
    }
    if (/^\d+$/.test(val)) {
        return parseInt(val, 10);
    }
    if (/^\d+\.\d+$/.test(val)) {
        return parseFloat(val);
    }
    return val;
};
