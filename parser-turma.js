/*************************
 * parser-turma.js
 *************************/

/**
 * parser-turma.js
 *
 * Parses Turma reports from the DOM, extracting the `reportId` from the URL
 * to store each fight uniquely in turmaAttackHistory.
 */

/**
 * Extracts the reportId from the current URL (?reportId=...).
 * @returns {string|null} The reportId if found, else null.
 */
function getTurmaReportId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("reportId");
}

/**
 * Parses the Turma Circus report from the DOM and extracts relevant information.
 *
 * @function parseTurmaReport
 * @returns {Object|null} An object containing { reportId, opponent, result } or null if parsing fails.
 *
 * result includes:
 * - state: "win" or "loss"
 * - goldWon
 * - xpGained
 * - fameGained
 * - raidedAmount
 * - timestamp
 */
window.parseTurmaReport = function () {
    /**
     * Logs an error message to the console.
     * @param {string} message - The error message to log.
     */
    function logError(message) {
        console.error(`Error: ${message}`);
    }

    /**
     * Logs a warning message to the console.
     * @param {string} message - The warning message to log.
     */
    function logWarning(message) {
        console.warn(`Warning: ${message}`);
    }

    /**
     * Extracts a number from text based on a regex pattern.
     * @param {string} text
     * @param {RegExp} pattern
     * @returns {number} The extracted number, or 0 if not found.
     */
    function extractNumber(text, pattern) {
        const match = text.match(pattern);
        return match && match[1] ? parseInt(match[1], 10) : 0;
    }

    const content = document.querySelector("#content");
    if (!content) {
        logError('Element with id "#content" not found.');
        return null;
    }

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

    // NOTE: Replace "Ignemia" with the actual in-game player name or fetch from settings
    const currentPlayer = "Ignemia";
    const resultState = winnerName === currentPlayer ? "win" : "loss";

    let goldWon = 0;
    let xpGained = 0;
    let fameGained = 0;

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

    const defenderElement = content.querySelector("#defenderAvatar11 .playername");
    const defenderName = defenderElement ? defenderElement.textContent.trim() : "";
    if (!defenderName) {
        logError("Defender name could not be parsed.");
        return null;
    }

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

    const reportId = getTurmaReportId();
    if (!reportId) {
        logError("No reportId found in the URL. Cannot uniquely store this Turma fight.");
        return null;
    }

    const result = {
        state: resultState,
        goldWon,
        xpGained,
        fameGained,
        raidedAmount,
        timestamp: new Date().toISOString(),
    };

    console.log("Parsed Turma Circus report:", {reportId, opponent: defenderName, result});
    return {reportId, opponent: defenderName, result};
};

/**
 * Uses jQuery to parse the Turma result screen fields (alternative shorter approach).
 * Extracts `reportId` from the URL and calls updateTurmaAttackHistory appropriately.
 */
window.parseTurmaResultScreen = function () {
    const reportId = new URLSearchParams(window.location.search).get("reportId");
    if (!reportId) {
        console.error("No `reportId` found in the URL; cannot store Turma fight uniquely.");
        return;
    }

    const $opponentElem = $(".opponent_name");
    const $resultElem = $(".result");
    const $goldElem = $(".gold");

    if (!$opponentElem.length || !$resultElem.length) {
        console.error("Required elements (.opponent_name or .result) not found in the Turma result screen.");
        return;
    }

    const opponent = $opponentElem.text().trim();
    const resultText = $resultElem.text().trim().toLowerCase();
    const goldWon = parseInt($goldElem.text().trim(), 10) || 0;

    let state = "draw";
    if (resultText.includes("win")) {
        state = "win";
    } else if (resultText.includes("loss")) {
        state = "loss";
    }

    window.updateTurmaAttackHistory(reportId, opponent, {
        state,
        goldWon,
        timestamp: new Date().toISOString()
    });
};

