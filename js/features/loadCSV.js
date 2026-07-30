async function loadCSV() {
    try {
        const file = window.__csvFile || "data1.csv"; // default kalau belum pilih
        const response = await fetch(`${CONFIG.BASE_PATH}data/${file}`);

        if(!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csv = await response.text();

        const rows = csv.trim().split("\n");
        const headers = rows[0].split(",");
        const data = rows.slice(1).map(row => row.split(","));

        createTable(headers, data);
        updateCsvTitle(file);

    } catch (err) {
        console.error("Gagal membaca CSV:", err);
    }
}

function updateCsvTitle(file) {
    const titleEl = document.getElementById("csvFileName");
    if (titleEl) {
        titleEl.textContent = file;
    }
}

// Deteksi apakah sebuah teks adalah URL
function isUrl(text) {
    return /^https?:\/\//i.test(text.trim());
}

// Potong teks panjang jadi "20 karakter pertama..."
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
        th.textContent = header.trim();
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // Body
    data.forEach(row => {
        const tr = document.createElement("tr");

        headers.forEach((_, index) => {
            const td = document.createElement("td");
            const rawValue = row[index] ? row[index].trim() : "";

            if (isUrl(rawValue)) {
                // Jadikan hyperlink dengan label "Link"
                const a = document.createElement("a");
                a.href = rawValue;
                a.textContent = "Link";
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                td.appendChild(a);
            } else {
                // Potong teks panjang, tapi simpan teks lengkap di tooltip (title)
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