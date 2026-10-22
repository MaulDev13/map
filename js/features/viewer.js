// ======================================================
// GENERALIST VIEWER (view-only)
// Dispatches by file type: csv -> sortable table, txt -> preformatted text.
// The selected file + type are passed via window.__viewFile / window.__viewType,
// set by the navbar / content pages before the viewer page is swapped in.
// ======================================================

// Columns hidden by default on first CSV load (optional).
const DEFAULT_HIDDEN_COLUMNS = [];

// CSV delimiter: "auto" detects from the header line.
const CSV_DELIMITER = "auto";

// ---- CSV sort state ----
let currentHeaders = [];
let originalData = [];
let sortState = { colIndex: null, direction: null }; // "asc" | "desc" | null

// ======================================================
// ENTRY POINT
// ======================================================
async function loadView() {
    const file = window.__viewFile;
    const type = window.__viewType || inferType(file);

    if (!file) {
        console.warn("No file selected to view.");
        return;
    }

    try {
        const url = `${CONFIG.BASE_PATH}data/${file}`;
        console.log(`Reading: ${url} [${type}]`);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();

        if (type === "txt") {
            renderText(text);
        } else {
            renderCsv(text);
        }
    } catch (err) {
        console.error("Failed to read file:", err);
    }
}

// Fallback type detection from extension.
function inferType(file) {
    if (!file) return "csv";
    return file.toLowerCase().endsWith(".txt") ? "txt" : "csv";
}

// ======================================================
// TXT VIEWER
// ======================================================
function renderText(text) {
    setTableVisible(false);

    const host = document.getElementById("textView");
    if (!host) return;

    host.classList.remove("hidden");
    host.innerHTML = `<article class="doc">${markupToHtml(text)}</article>`;
}

// ------------------------------------------------------
// Lightweight markup -> HTML (safe subset of Markdown)
// The source file stays plain, readable .txt. We escape ALL
// text first, then introduce only a fixed set of tags.
// Supported: # headings, **bold**, *italic*, `code`,
// ![alt](src) images, [text](url) links, - lists, > quotes,
// --- rules, ``` fenced code, blank-line paragraphs.
// ------------------------------------------------------

function escapeHtml(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Allow http(s), root-relative, and relative paths (e.g. assets/pic.jpg).
// Block javascript:, data:, and other schemes. Relative paths get BASE_PATH.
function safeUrl(raw) {
    const url = raw.trim();
    const base = (window.CONFIG && CONFIG.BASE_PATH) || "";

    if (/^https?:\/\//i.test(url)) return url;      // absolute http(s)
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return ""; // any other scheme -> reject
    if (url.startsWith("/")) return url;             // root-relative
    return base + url;                               // relative -> prefix base
}

// Inline formatting applied to already-escaped text.
function formatInline(escaped) {
    let s = escaped;

    // images: ![alt](src)
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, src) => {
        const url = safeUrl(src);
        if (!url) return escapeHtml(m);
        return `<img class="doc-img" src="${encodeURI(url)}" alt="${alt}" loading="lazy">`;
    });

    // links: [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, href) => {
        const url = safeUrl(href);
        if (!url) return escapeHtml(m);
        return `<a href="${encodeURI(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });

    // bold, italic, inline code
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");

    return s;
}

function markupToHtml(src) {
    const lines = String(src).replace(/\r\n?/g, "\n").split("\n");
    const out = [];

    let i = 0;
    let paragraph = [];
    let listItems = [];

    function flushParagraph() {
        if (paragraph.length) {
            out.push(`<p>${paragraph.join("<br>")}</p>`);
            paragraph = [];
        }
    }
    function flushList() {
        if (listItems.length) {
            out.push(`<ul>${listItems.map(li => `<li>${li}</li>`).join("")}</ul>`);
            listItems = [];
        }
    }
    function flushAll() { flushParagraph(); flushList(); }

    while (i < lines.length) {
        const line = lines[i];

        // fenced code block: ``` ... ```
        if (/^```/.test(line.trim())) {
            flushAll();
            const code = [];
            i++;
            while (i < lines.length && !/^```/.test(lines[i].trim())) {
                code.push(escapeHtml(lines[i]));
                i++;
            }
            i++; // skip closing fence
            out.push(`<pre class="doc-pre"><code>${code.join("\n")}</code></pre>`);
            continue;
        }

        // blank line -> break current block
        if (line.trim() === "") {
            flushAll();
            i++;
            continue;
        }

        // horizontal rule
        if (/^\s*---+\s*$/.test(line)) {
            flushAll();
            out.push("<hr>");
            i++;
            continue;
        }

        // heading: #..###### text
        const heading = line.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
            flushAll();
            const level = heading[1].length;
            out.push(`<h${level}>${formatInline(escapeHtml(heading[2]))}</h${level}>`);
            i++;
            continue;
        }

        // blockquote: > text
        const quote = line.match(/^\s*>\s?(.*)$/);
        if (quote) {
            flushParagraph();
            flushList();
            const buf = [];
            let q = quote;
            while (q) {
                buf.push(formatInline(escapeHtml(q[1])));
                i++;
                q = i < lines.length ? lines[i].match(/^\s*>\s?(.*)$/) : null;
            }
            out.push(`<blockquote>${buf.join("<br>")}</blockquote>`);
            continue;
        }

        // list item: - text  or  * text
        const item = line.match(/^\s*[-*]\s+(.*)$/);
        if (item) {
            flushParagraph();
            listItems.push(formatInline(escapeHtml(item[1])));
            i++;
            continue;
        }

        // standalone image line -> treat as block (centered via CSS)
        if (/^\s*!\[[^\]]*\]\([^)]+\)\s*$/.test(line)) {
            flushAll();
            out.push(`<p class="doc-figure">${formatInline(escapeHtml(line.trim()))}</p>`);
            i++;
            continue;
        }

        // default: paragraph text
        flushList();
        paragraph.push(formatInline(escapeHtml(line)));
        i++;
    }

    flushAll();
    return out.join("\n");
}

// ======================================================
// CSV VIEWER
// ======================================================
function getDelimiter(headerLine) {
    if (CSV_DELIMITER !== "auto") return CSV_DELIMITER;
    const commaCount = (headerLine.match(/,/g) || []).length;
    const semicolonCount = (headerLine.match(/;/g) || []).length;
    return semicolonCount > commaCount ? ";" : ",";
}

function renderCsv(csv) {
    setTableVisible(true);

    const textHost = document.getElementById("textView");
    if (textHost) textHost.classList.add("hidden");

    const rows = csv.trim().split(/\r?\n/); // Windows & Unix line endings
    const delimiter = getDelimiter(rows[0]);
    const headers = rows[0].split(delimiter).map(h => h.trim());
    const data = rows.slice(1).map(row => row.split(delimiter).map(cell => cell.trim()));

    currentHeaders = headers;
    originalData = data;
    sortState = { colIndex: null, direction: null };

    createTable(headers, data);
    updateSortIndicators();
}

function isUrl(text) {
    return /^https?:\/\//i.test(text.trim());
}

function truncate(text, maxLength = 20) {
    return text.length <= maxLength ? text : text.slice(0, maxLength) + "...";
}

// Turn a raw CSV header into a human-readable label.
// Handles camelCase/PascalCase, snake_case, kebab-case, and dotted names.
// Display-only: sorting/column logic always uses the column index.
function humanizeHeader(header) {
    if (!header) return "";
    return String(header)
        .trim()
        .replace(/[_\-.]+/g, " ")              // snake_case, kebab-case, dotted -> spaces
        .replace(/([a-z\d])([A-Z])/g, "$1 $2") // camelCase boundary: aB -> a B
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2") // acronym boundary: HTTPServer -> HTTP Server
        .replace(/\s+/g, " ")                  // collapse repeats
        .trim()
        .replace(/\b\w/g, c => c.toUpperCase()); // Title Case each word
}

function compareValues(a, b) {
    const aClean = a.trim().replace(/,/g, "");
    const bClean = b.trim().replace(/,/g, "");
    const aNum = parseFloat(aClean);
    const bNum = parseFloat(bClean);
    const bothNumeric =
        !isNaN(aNum) && !isNaN(bNum) &&
        /^-?\d+(\.\d+)?$/.test(aClean) &&
        /^-?\d+(\.\d+)?$/.test(bClean);

    if (bothNumeric) return aNum - bNum;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function getSortedData() {
    const { colIndex, direction } = sortState;
    if (colIndex === null || direction === null) return originalData;

    return [...originalData].sort((rowA, rowB) => {
        const a = rowA[colIndex] || "";
        const b = rowB[colIndex] || "";
        const cmp = compareValues(a, b);
        return direction === "asc" ? cmp : -cmp;
    });
}

// asc -> desc -> original -> asc ...
function handleHeaderClick(colIndex) {
    if (sortState.colIndex !== colIndex) {
        sortState = { colIndex, direction: "asc" };
    } else if (sortState.direction === "asc") {
        sortState = { colIndex, direction: "desc" };
    } else {
        sortState = { colIndex: null, direction: null };
    }

    createTable(currentHeaders, getSortedData());
    updateSortIndicators();
}

function updateSortIndicators() {
    document.querySelectorAll("#tableData thead th").forEach(th => {
        const idx = Number(th.dataset.colIndex);
        th.classList.remove("sort-asc", "sort-desc");

        const arrowEl = th.querySelector(".sort-arrow");
        if (!arrowEl) return;

        if (sortState.colIndex === idx && sortState.direction) {
            arrowEl.textContent = sortState.direction === "asc" ? "▲" : "▼";
            th.classList.add(sortState.direction === "asc" ? "sort-asc" : "sort-desc");
        } else {
            arrowEl.textContent = "";
        }
    });
}

function createTable(headers, data) {
    const thead = document.querySelector("#tableData thead");
    const tbody = document.querySelector("#tableData tbody");
    if (!thead || !tbody) return;

    thead.innerHTML = "";
    tbody.innerHTML = "";

    // Header
    const trHead = document.createElement("tr");
    headers.forEach((header, index) => {
        const th = document.createElement("th");
        th.dataset.colIndex = index;
        th.dataset.label = header;
        th.style.cursor = "pointer";
        th.title = `${header} — click to sort`;

        const labelSpan = document.createElement("span");
        labelSpan.classList.add("th-label");
        labelSpan.textContent = humanizeHeader(header);

        const arrowSpan = document.createElement("span");
        arrowSpan.classList.add("sort-arrow");
        arrowSpan.textContent = "";

        th.appendChild(labelSpan);
        th.appendChild(arrowSpan);
        th.addEventListener("click", () => handleHeaderClick(index));

        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // Body
    data.forEach(row => {
        const tr = document.createElement("tr");

        headers.forEach((_, index) => {
            const td = document.createElement("td");
            const rawValue = row[index] || "";
            td.dataset.colIndex = index;

            if (isUrl(rawValue)) {
                const a = document.createElement("a");
                a.href = rawValue;
                a.textContent = "Link";
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                td.appendChild(a);
            } else {
                td.textContent = truncate(rawValue);
                if (rawValue.length > 20) td.title = rawValue;
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    renderColumnToggles(headers);
}

function renderColumnToggles(headers) {
    const container = document.getElementById("columnToggles");
    if (!container) return;

    container.innerHTML = "";
    container.classList.add("column-panel");

    // ---- Header: "Columns" label + Toggle all ----
    const head = document.createElement("div");
    head.classList.add("column-panel__head");

    const label = document.createElement("span");
    label.classList.add("column-panel__label");
    label.textContent = "Columns";

    const toggleAllLabel = document.createElement("label");
    toggleAllLabel.classList.add("column-toggle-all");

    const toggleAllCheckbox = document.createElement("input");
    toggleAllCheckbox.type = "checkbox";
    toggleAllCheckbox.id = "toggleAllColumns";

    const toggleAllText = document.createElement("span");
    toggleAllText.textContent = "Toggle all";

    toggleAllLabel.appendChild(toggleAllCheckbox);
    toggleAllLabel.appendChild(toggleAllText);

    head.appendChild(label);
    head.appendChild(toggleAllLabel);
    container.appendChild(head);

    // ---- Pills ----
    const pills = document.createElement("div");
    pills.classList.add("column-pills");
    container.appendChild(pills);

    headers.forEach((header, index) => {
        const isHiddenByDefault = DEFAULT_HIDDEN_COLUMNS.includes(header);

        const pill = document.createElement("label");
        pill.classList.add("column-pill");
        pill.classList.toggle("is-on", !isHiddenByDefault);
        pill.title = header;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !isHiddenByDefault;
        checkbox.dataset.colIndex = index;
        checkbox.classList.add("column-checkbox");

        const dot = document.createElement("span");
        dot.classList.add("column-pill__dot");

        const text = document.createElement("span");
        text.classList.add("column-pill__text");
        text.textContent = humanizeHeader(header);

        checkbox.addEventListener("change", (e) => {
            const on = e.target.checked;
            pill.classList.toggle("is-on", on);
            toggleColumn(index, on);
            updateToggleAllState();
        });

        pill.appendChild(checkbox);
        pill.appendChild(dot);
        pill.appendChild(text);
        pills.appendChild(pill);

        if (isHiddenByDefault) toggleColumn(index, false);
    });

    toggleAllCheckbox.addEventListener("change", (e) => {
        const checked = e.target.checked;
        container.querySelectorAll(".column-pill").forEach(pill => {
            const cb = pill.querySelector(".column-checkbox");
            cb.checked = checked;
            pill.classList.toggle("is-on", checked);
            toggleColumn(Number(cb.dataset.colIndex), checked);
        });
        toggleAllCheckbox.indeterminate = false;
    });

    updateToggleAllState();
}

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

function toggleColumn(colIndex, show) {
    document
        .querySelectorAll(`#tableData [data-col-index="${colIndex}"]`)
        .forEach(cell => { cell.style.display = show ? "" : "none"; });
}

// Show/hide the whole table shell (search + toggles + table) for non-CSV views.
function setTableVisible(visible) {
    const shell = document.getElementById("tableShell");
    if (shell) shell.classList.toggle("hidden", !visible);
}
