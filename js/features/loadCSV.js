// ======================================================
// CSV SETTINGS
// ======================================================

// Change this if you ONLY want one delimiter:
// const CSV_DELIMITER = ",";   // Only comma
// const CSV_DELIMITER = ";";   // Only semicolon

// Leave as "auto" to detect automatically.
const CSV_DELIMITER = "auto";

// Detect delimiter from the header line
function getDelimiter(headerLine) {
    if (CSV_DELIMITER !== "auto") {
        return CSV_DELIMITER;
    }

    const commaCount = (headerLine.match(/,/g) || []).length;
    const semicolonCount = (headerLine.match(/;/g) || []).length;

    return semicolonCount > commaCount ? ";" : ",";
}

async function loadCSV() {
    try {
        const file = window.__csvFile || "data1.csv";

        console.log(`Reading: ${CONFIG.BASE_PATH}data/${file}`);

        const response = await fetch(`${CONFIG.BASE_PATH}data/${file}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csv = await response.text();

        const rows = csv
            .trim()
            .split(/\r?\n/); // Supports Windows & Unix line endings

        const delimiter = getDelimiter(rows[0]);

        console.log("Detected delimiter:", delimiter);

        const headers = rows[0].split(delimiter).map(h => h.trim());

        const data = rows
            .slice(1)
            .map(row => row.split(delimiter).map(cell => cell.trim()));

        createTable(headers, data);
        updateCsvTitle(file);

    } catch (err) {
        console.error("Failed to read CSV:", err);
    }
}

function updateCsvTitle(file) {
    const titleEl = document.getElementById("csvFileName");
    if (titleEl) {
        titleEl.textContent = file;
    }
}

// Detect whether a string is a URL
function isUrl(text) {
    return /^https?:\/\//i.test(text.trim());
}

// Shorten long text
function truncate(text, maxLength = 20) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
}

function createTable(headers, data) {
    const thead = document.querySelector("#tableData thead");
    const tbody = document.querySelector("#tableData tbody");

    thead.innerHTML = "";
    tbody.innerHTML = "";

    // Header
    const trHead = document.createElement("tr");

    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        trHead.appendChild(th);
    });

    thead.appendChild(trHead);

    // Body
    data.forEach(row => {
        const tr = document.createElement("tr");

        headers.forEach((_, index) => {
            const td = document.createElement("td");
            const rawValue = row[index] || "";

            if (isUrl(rawValue)) {
                const a = document.createElement("a");
                a.href = rawValue;
                a.textContent = "Link";
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                td.appendChild(a);
            } else {
                td.textContent = truncate(rawValue);

                if (rawValue.length > 20) {
                    td.title = rawValue;
                }
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

loadCSV();