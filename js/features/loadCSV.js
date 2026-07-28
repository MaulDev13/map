async function loadCSV() {
    try {
        const file = window.__csvFile || "data1.csv"; // default kalau belum pilih
        const response = await fetch(`data/${file}`);
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

function createTable(headers, data) {
    const thead = document.querySelector("#tableData thead");
    const tbody = document.querySelector("#tableData tbody");

    thead.innerHTML = "";
    tbody.innerHTML = "";

    const trHead = document.createElement("tr");
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header.trim();
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    data.forEach(row => {
        const tr = document.createElement("tr");
        headers.forEach((_, index) => {
            const td = document.createElement("td");
            td.textContent = row[index] ? row[index].trim() : "";
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

loadCSV();