// ======================================================
// CSV SETTINGS
// ======================================================

// Change this if you ONLY want one delimiter:
// const CSV_DELIMITER = ",";   // Only comma
// const CSV_DELIMITER = ";";   // Only semicolon

// Kolom yang secara default disembunyikan saat pertama load (opsional)
const DEFAULT_HIDDEN_COLUMNS = []// ["Keyword"];

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
        const file = window.__csvFile;

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

function renderColumnToggles(headers) {
    const container = document.getElementById("columnToggles");
    if (!container) return;

    container.innerHTML = "";
    container.classList.add("column-toggles");

    // ===== Toggle All =====
    const toggleAllLabel = document.createElement("label");
    toggleAllLabel.classList.add("column-toggle-item", "toggle-all-item");

    const toggleAllCheckbox = document.createElement("input");
    toggleAllCheckbox.type = "checkbox";
    toggleAllCheckbox.id = "toggleAllColumns";

    const toggleAllText = document.createElement("span");
    toggleAllText.textContent = "Toggle All";

    toggleAllLabel.appendChild(toggleAllCheckbox);
    toggleAllLabel.appendChild(toggleAllText);
    container.appendChild(toggleAllLabel);

    // ===== Grid untuk daftar kolom =====
    const selectorWrapper = document.createElement("div");
    selectorWrapper.classList.add("column-selector");
    container.appendChild(selectorWrapper);

    // // ===== Separator tipis (opsional, biar Toggle All kebeda dari list kolom) =====
    // const divider = document.createElement("span");
    // divider.classList.add("column-toggle-divider");
    // container.appendChild(divider);

    // ===== Checkbox per kolom, langsung jadi flex item, TANPA grid terpisah =====
    headers.forEach((header, index) => {
        const isHiddenByDefault = DEFAULT_HIDDEN_COLUMNS.includes(header);

        const label = document.createElement("label");
        label.classList.add("column-toggle-item");
        label.title = header; // fallback tooltip nama lengkap

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !isHiddenByDefault;
        checkbox.dataset.colIndex = index;
        checkbox.classList.add("column-checkbox");

        checkbox.addEventListener("change", (e) => {
            toggleColumn(index, e.target.checked);
            updateToggleAllState();
        });

        const text = document.createElement("span");
        text.textContent = header;
        text.classList.add("column-toggle-label");

        label.appendChild(checkbox);
        label.appendChild(text);
        container.appendChild(label);

        if (isHiddenByDefault) {
            toggleColumn(index, false);
        }
    });

    // ===== Event Toggle All =====
    toggleAllCheckbox.addEventListener("change", (e) => {
        const checked = e.target.checked;
        const checkboxes = container.querySelectorAll(".column-checkbox");

        checkboxes.forEach(cb => {
            cb.checked = checked;
            toggleColumn(Number(cb.dataset.colIndex), checked);
        });

        toggleAllCheckbox.indeterminate = false;
    });

    updateToggleAllState();
}

// Sinkronisasi state checkbox "Toggle All"
function updateToggleAllState() {
    const toggleAllCheckbox = document.getElementById("toggleAllColumns");
    if (!toggleAllCheckbox) return;

    const checkboxes = document.querySelectorAll("#columnToggles .column-checkbox");
    const total = checkboxes.length;
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

    if (checkedCount === 0) {
        toggleAllCheckbox.checked = false;
        toggleAllCheckbox.indeterminate = false;
    } else if (checkedCount === total) {
        toggleAllCheckbox.checked = true;
        toggleAllCheckbox.indeterminate = false;
    } else {
        toggleAllCheckbox.checked = false;
        toggleAllCheckbox.indeterminate = true;
    }
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