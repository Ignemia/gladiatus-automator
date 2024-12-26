/**
 * Parses the Turma Circus report from the DOM and extracts relevant information.
 *
 * @function parseTurmaReport
 * @returns {Object|null} An object containing the opponent's name and the result details,
 *                        or null if parsing fails.
 *
 * @property {string} state - The result state, either "win" or "loss".
 * @property {number} goldWon - The amount of gold won (0 if lost).
 * @property {number} xpGained - The amount of experience points gained (0 if lost).
 * @property {number} fameGained - The amount of fame gained (0 if lost).
 * @property {number} raidedAmount - The number extracted after "has raided:" (0 if not found or if lost).
 * @property {string} timestamp - The ISO timestamp when the report was parsed.
 *
 * @example
 * const report = parseTurmaReport();
 * if (report) {
 *     console.log(report.opponent);        // Defender name
 *     console.log(report.result.state);    // "win" or "loss"
 *     console.log(report.result.goldWon);  // 0 if lost
 *     console.log(report.result.xpGained); // 0 if lost
 *     console.log(report.result.fameGained);// 0 if lost
 *     console.log(report.result.raidedAmount);
 *     console.log(report.result.timestamp);
 * }
 */
window.parseTurmaReport = function () {
    /**
     * Logs an error message to the console.
     *
     * @param {string} message - The error message to log.
     */
    function logError(message) {
        console.error(`Error: ${message}`);
    }

    /**
     * Logs a warning message to the console.
     *
     * @param {string} message - The warning message to log.
     */
    function logWarning(message) {
        console.warn(`Warning: ${message}`);
    }

    /**
     * Extracts a number from a given text based on a regex pattern.
     *
     * @param {string} text - The text to search within.
     * @param {RegExp} pattern - The regex pattern to apply.
     * @returns {number} The extracted number, or 0 if not found.
     */
    function extractNumber(text, pattern) {
        const match = text.match(pattern);
        return match && match[1] ? parseInt(match[1], 10) : 0;
    }

    // Select the main content element
    const content = document.querySelector("#content");
    if (!content) {
        logError('Element with id "#content" not found.');
        return null;
    }

    // Extract Winner Information
    const winnerCell = content.querySelector("#reportHeader td:nth-of-type(2)");
    if (!winnerCell) {
        logError("Winner information not found in the report header.");
        return null;
    }

    const winnerText = winnerCell.textContent.trim();
    const winnerNameMatch = winnerText.match(/^Winner:\s*(.+)$/);
    const winnerName = winnerNameMatch ? winnerNameMatch[1].trim() : "";
    if (!winnerName) {
        logError("Winner name could not be parsed.");
        return null;
    }

    // Determine Result State
    // NOTE: Replace "Ignemia" with the actual in-game player name or read from settings if needed
    const currentPlayer = "Ignemia";
    const resultState = winnerName === currentPlayer ? "win" : "loss";

    // Initialize Reward Variables
    let goldWon = 0;
    let xpGained = 0;
    let fameGained = 0;

    // Only extract rewards if the player has won
    if (resultState === "win") {
        const rewardSection = content.querySelector(".report_reward section");
        if (rewardSection) {
            const rewardText = rewardSection.innerText || rewardSection.textContent || "";
            goldWon = extractNumber(rewardText, /(\d+)\s+Gold/i);
            xpGained = extractNumber(rewardText, /received\s+(\d+)\s+experience point\(s\)/i);
            fameGained = extractNumber(rewardText, /received\s+(\d+)\s+fame/i);
        } else {
            logWarning("Reward section not found; goldWon, xpGained, and fameGained remain 0.");
        }
    }

    // Extract Defender Information
    const defenderElement = content.querySelector("#defenderAvatar11 .playername");
    const defenderName = defenderElement ? defenderElement.textContent.trim() : "";
    if (!defenderName) {
        logError("Defender name could not be parsed.");
        return null;
    }

    // Extract "has raided" Number (if present anywhere in a <p> inside #content)
    let raidedAmount = 0;
    const raidParagraph = content.querySelector("p");
    if (raidParagraph) {
        const pText = raidParagraph.innerText || raidParagraph.textContent || "";
        raidedAmount = extractNumber(pText, /has raided:\s*(\d+)/i);
        if (!raidedAmount) {
            logWarning("'has raided:' number not found or 0.");
        }
    } else {
        logWarning("<p> element containing 'has raided:' not found.");
    }

    // Compile the Result Object
    const result = {
        state: resultState,
        goldWon,
        xpGained,
        fameGained,
        raidedAmount,
        timestamp: new Date().toISOString(),
    };

    console.log("Parsed Turma Circus report:", { opponent: defenderName, result });
    return { opponent: defenderName, result };
};

/**
 * Uses jQuery to parse the Turma result screen fields.
 * Updates storage accordingly via updateTurmaAttackHistory.
 */
window.parseTurmaResultScreen = function () {
    // Check for essential DOM elements
    const $opponentElem = $(".opponent_name");
    const $resultElem = $(".result");
    const $goldElem = $(".gold");

    if (!$opponentElem.length || !$resultElem.length) {
        console.error("Required elements (.opponent_name or .result) not found in the Turma result screen.");
        return;
    }

    const opponent = $opponentElem.text().trim();
    const resultText = $resultElem.text().trim().toLowerCase();
    // If .gold is missing, default to 0
    const goldWon = parseInt($goldElem.text().trim(), 10) || 0;

    let state = "draw";
    if (resultText.includes("win")) {
        state = "win";
    } else if (resultText.includes("loss")) {
        state = "loss";
    }

    // Update the global Turma Attack History
    window.updateTurmaAttackHistory(opponent, { state, goldWon });
};
