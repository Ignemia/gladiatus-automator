window.selectOptimalAttack = function (topElement) {
    return new Promise((resolve, reject) => {
        // Validate input
        if (!(topElement instanceof jQuery)) {
            reject(new Error("Invalid topElement: Expected a jQuery object."));
            return;
        }

        // Retrieve the attack history from Chrome's local storage
        chrome.storage.local.get(["gladex_arena_history"], (result) => {
            // Handle potential Chrome storage errors
            if (chrome.runtime.lastError) {
                reject(new Error(`Chrome storage error: ${chrome.runtime.lastError.message}`));
                return;
            }

            // Fallback to an empty object if no stored history is found
            const arenaAttackHistory = result.gladex_arena_history || {};

            // Select all `.attack` elements within the topElement
            const attackElements = topElement.find(".attack");

            if (attackElements.length === 0) {
                console.log("No `.attack` elements found within the provided topElement.");
                resolve(null);
                return;
            }

            const opponents = [];

            // Iterate over each `.attack` element to extract opponent information
            attackElements.each(function () {
                const attackDiv = $(this);
                const row = attackDiv.closest("tr");

                if (row.length === 0) {
                    console.log("`.attack` element is not within a `<tr>` row.");
                    return; // Skip this element
                }

                // Extract the opponent's name from the first `<td>`'s `<a>` element
                const nameLink = row.find("td:first-child a");
                const opponentName = nameLink.text().trim();

                if (!opponentName) {
                    console.log("Opponent name not found for a `.attack` element.");
                    return; // Skip this element
                }

                const history = arenaAttackHistory[opponentName];

                let winRate = 0;
                let averageGold = 0;

                // If we have stored history, calculate winRate and averageGold from it
                if (history && history.attackCount > 0) {
                    winRate = history.wins / history.attackCount;
                    averageGold = history.wins > 0 ? history.goldWon / history.wins : 0;
                } else {
                    // Assign default values if no history exists
                    winRate = 0.5;   // Default 50% win rate
                    averageGold = 100; // Default average gold
                }

                opponents.push({
                    attackDiv,
                    opponentName,
                    winRate,
                    averageGold,
                });
            });

            if (opponents.length === 0) {
                console.log("No opponents with valid names found.");
                resolve(null);
                return;
            }

            // Sort opponents primarily by winRate (descending), secondarily by averageGold (descending)
            opponents.sort((a, b) => {
                if (b.winRate !== a.winRate) {
                    return b.winRate - a.winRate;
                }
                return b.averageGold - a.averageGold;
            });

            let selectedAttack = null;
            // If the highest-ranked opponent has some non-zero win rate, choose them
            if (opponents[0].winRate > 0) {
                selectedAttack = opponents[0].attackDiv;
            } else {
                // If all opponents have 0 win rate, select one at random
                const randomIndex = Math.floor(Math.random() * opponents.length);
                selectedAttack = opponents[randomIndex].attackDiv;
            }

            resolve(selectedAttack);
        });
    });
};
