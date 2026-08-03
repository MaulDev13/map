// ======================================================
// CSV SETTINGS
// ======================================================

// Change this if you ONLY want one delimiter:
// const CSV_DELIMITER = ",";   // Only comma
// const CSV_DELIMITER = ";";   // Only semicolon

// Kolom yang secara default disembunyikan saat pertama load (opsional)
// const DEFAULT_HIDDEN_COLUMNS = ["Keyword"];

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

    headers.forEach((header, index) => {
        const th = document.createElement("th");
        th.textContent = header;
        th.dataset.colIndex = index; // <-- penanda kolom
        trHead.appendChild(th);
    });

    thead.appendChild(trHead);

    // Body
    data.forEach(row => {
        const tr = document.createElement("tr");

        headers.forEach((_, index) => {
            const td = document.createElement("td");
            const rawValue = row[index] || "";

            td.dataset.colIndex = index; // <-- penanda kolom

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

    renderColumnToggles(headers); // <-- ditambahkan, supaya toggle ikut dibuat
}

// Bikin checkbox show/hide per kolom
function renderColumnToggles(headers) {
    const container = document.getElementById("columnToggles");
    if (!container) return;

    container.innerHTML = "";

    headers.forEach((header, index) => {
        const isHiddenByDefault = DEFAULT_HIDDEN_COLUMNS.includes(header);

        const label = document.createElement("label");
        label.style.display = "flex";
        label.style.alignItems = "center";
        label.style.gap = "4px";
        label.style.fontSize = "var(--text-sm)";
        label.style.cursor = "pointer";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !isHiddenByDefault;
        checkbox.dataset.colIndex = index;

        checkbox.addEventListener("change", (e) => {
            toggleColumn(index, e.target.checked);
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(header));
        container.appendChild(label);

        // Terapkan status default (hide) saat render pertama
        if (isHiddenByDefault) {
            toggleColumn(index, false);
        }
    });
}

// Tampilkan / sembunyikan semua sel pada kolom tertentu
function toggleColumn(colIndex, show) {
    const cells = document.querySelectorAll(
        `#tableData [data-col-index="${colIndex}"]`
    );
    cells.forEach(cell => {
        cell.style.display = show ? "" : "none";
    });
}

loadCSV();