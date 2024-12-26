/**
 * dungeon-logic.js
 *
 * Functions to handle dungeon opponents, including "fast" or "slow" approach.
 */

/**
 * Collects potential dungeon opponents from .map_label or <img onclick="...">.
 * @returns {Array<HTMLElement>}
 */
window.getPotentialOpponents = function () {
    // jQuery selectors to gather relevant labels and images
    const labels = $(".map_label").toArray();       // Divs
    const images = $("img[onclick]").toArray();     // Images with onclick
    return labels.concat(images).filter((node) => {
        // Filter out only DIV or IMG elements
        return node.nodeName === "DIV" || node.nodeName === "IMG";
    });
};

/**
 * Extracts a numeric ID from the 'onclick' attribute (e.g. onclick="somefunc('123',...)").
 * @param {HTMLElement} element
 * @returns {number|null}
 */
window.extractMatchNumber = function (element) {
    // Safely get the onclick attribute and attempt a regex match
    const onclk = element.getAttribute("onclick");
    if (!onclk) return null;

    const match = onclk.match(/\(\s*['"](\d+)['"]/);
    return match ? parseInt(match[1], 10) : null;
};

/**
 * Generic function to choose one opponent from the potential list based on a comparator.
 * The comparator should return true if `current` is preferred over `selected`.
 * @param {(current: number, chosen: number) => boolean} comparator
 * @returns {HTMLElement|null}
 */
window.selectOpponent = function (comparator) {
    const potentialOpponents = window.getPotentialOpponents();
    let chosen = null;
    let chosenMatchNumber = null;

    potentialOpponents.forEach((opponent) => {
        const matchNum = window.extractMatchNumber(opponent);
        // If we couldn't parse a valid match number, skip
        if (matchNum === null) return;

        // Should we replace the currently chosen opponent?
        const shouldReplace = !chosen || comparator(matchNum, chosenMatchNumber);

        // If there's a tie (same matchNum) but the new element is a DIV, prefer the DIV.
        // (Often DIV might hold more detailed data.)
        const tieAndDiv = matchNum === chosenMatchNumber && opponent.nodeName === "DIV";

        if (shouldReplace || tieAndDiv) {
            chosen = opponent;
            chosenMatchNumber = matchNum;
        }
    });

    return chosen;
};

/**
 * Selects the highest ID => usually represents a "fast" strategy.
 * @returns {HTMLElement|null}
 */
window.selectDungeonOpponentFast = function () {
    return window.selectOpponent((current, selected) => current > selected);
};

/**
 * Selects the lowest ID => usually represents a "slow" strategy.
 * @returns {HTMLElement|null}
 */
window.selectDungeonOpponentSlow = function () {
    return window.selectOpponent((current, selected) => current < selected);
};
