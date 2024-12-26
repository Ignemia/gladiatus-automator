/**
 * parser-report-type.js
 *
 * Utility to figure out what kind of report is displayed, based on URL query ?t=...
 */

/**
 * Extract query params from a URL.
 * @param {string} url
 * @returns {object} Key-value map of all query parameters.
 */
window.getQueryParams = function (url) {
    // If url is not provided or is not a valid URL, default to window.location.href
    let safeUrl = url;
    try {
        // Attempt constructing a URL to validate
        new URL(url);
    } catch (e) {
        safeUrl = window.location.href;
    }

    const urlObj = new URL(safeUrl);
    const params = {};
    urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
};

/**
 * Determines the type of report (Expedition, Dungeon, Arena, Turma) based on ?t=...
 * @returns {string} e.g. "Circus Turma" or "Unknown Report Type"
 */
window.getReportType = function () {
    const currentUrl = window.location.href;
    const params = window.getQueryParams(currentUrl);

    const reportTypes = {
        "0": "Expedition",
        "1": "Dungeon",
        "2": "Arena",
        "3": "Circus Turma",
    };

    return reportTypes[params.t] || "Unknown Report Type";
};
