const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const MANIFEST_PATH = path.join(DATA_DIR, "manifest.json");

// Supported view-only file types, mapped from extension -> viewer type.
const SUPPORTED = {
    ".csv": "csv",
    ".txt": "txt"
};

// Load the existing manifest (if any) so manual fields like `password`
// are preserved across regenerations instead of being wiped.
function loadExisting() {
    try {
        const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
        const arr = JSON.parse(raw);
        const byFile = {};
        if (Array.isArray(arr)) {
            arr.forEach(item => { if (item && item.file) byFile[item.file] = item; });
        }
        return byFile;
    } catch {
        return {};
    }
}

function generateManifest() {
    if (!fs.existsSync(DATA_DIR)) {
        console.error(`Folder not found: ${DATA_DIR}`);
        process.exit(1);
    }

    const existing = loadExisting();

    const manifest = fs
        .readdirSync(DATA_DIR)
        .filter(file => Object.keys(SUPPORTED).includes(path.extname(file).toLowerCase()))
        .sort()
        .map(file => {
            const ext = path.extname(file).toLowerCase();
            const fileName = path.parse(file).name;
            const prev = existing[file] || {};

            const label = fileName
                .split(/[_\-\s]+/) // split on _, -, or whitespace
                .filter(Boolean)
                .map(
                    word =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                );

            return {
                file,
                type: SUPPORTED[ext],
                label,
                // preserve a manually-set password if one already existed
                password: prev.password ?? null
            };
        });

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 4));

    console.log(`manifest.json created with ${manifest.length} file(s):`);
    manifest.forEach(item => console.log(`   - ${item.file} [${item.type}]`));
}

generateManifest();
