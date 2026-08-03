const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const MANIFEST_PATH = path.join(DATA_DIR, "manifest.json");

function generateManifest() {
    if (!fs.existsSync(DATA_DIR)) {
        console.error(`Folder tidak ditemukan: ${DATA_DIR}`);
        process.exit(1);
    }

    const manifest = fs
        .readdirSync(DATA_DIR)
        .filter(file => file.toLowerCase().endsWith(".csv"))
        .sort()
        .map(file => {
            const fileName = path.parse(file).name;

            const label = fileName
                .split(/[_\-\s]+/) // pisahkan berdasarkan _, -, atau spasi
                .filter(Boolean)
                .map(
                    word =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                );

            return {
                file,
                label,
                password: null
            };
        });

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 4));

    console.log(`✅ manifest.json dibuat dengan ${manifest.length} file:`);
    manifest.forEach(item => console.log(`   - ${item.file} (${item.label})`));
}

generateManifest();