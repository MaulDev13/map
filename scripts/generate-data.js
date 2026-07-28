const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const MANIFEST_PATH = path.join(DATA_DIR, "manifest.json");

function generateManifest() {
    if (!fs.existsSync(DATA_DIR)) {
        console.error(`Folder tidak ditemukan: ${DATA_DIR}`);
        process.exit(1);
    }

    const files = fs
        .readdirSync(DATA_DIR)
        .filter(file => file.toLowerCase().endsWith(".csv"))
        .sort(); // urut alfabetis biar konsisten (data1, data2, ...)

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(files, null, 4));

    console.log(`✅ manifest.json dibuat dengan ${files.length} file:`);
    files.forEach(f => console.log(`   - ${f}`));
}

generateManifest();