// ======================================================
// CATEGORY LIST (reusable)
// Reads data/manifest.json once and renders the files that
// match a category into a target element as clickable items.
// Replaces the old per-category content pages so the manifest
// logic lives in exactly one place.
// ======================================================

(function () {
    // Cache the manifest promise so repeated category expands share one fetch.
    let manifestPromise = null;

    function getManifest() {
        if (!manifestPromise) {
            const base = (window.CONFIG && CONFIG.BASE_PATH) || "";
            manifestPromise = fetch(`${base}data/manifest.json`)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .catch(err => {
                    // Reset so a later attempt can retry after a transient failure.
                    manifestPromise = null;
                    throw err;
                });
        }
        return manifestPromise;
    }

    function inferType(file) {
        return file.toLowerCase().endsWith(".txt") ? "txt" : "csv";
    }

    function openFile(item) {
        if (item.password) {
            const entered = prompt("Enter password:");
            if (entered === null) return;        // cancelled
            if (entered !== item.password) {
                alert("Incorrect password.");
                return;
            }
        }

        window.__viewFile = item.file;
        window.__viewType = item.type || inferType(item.file);

        htmx.ajax("GET", "/pages/viewer.html", {
            target: "#content",
            swap: "innerHTML"
        });
    }

    /**
     * Render files for a category into a target element.
     * @param {string} category  label to match (OR logic against item.label)
     * @param {string|HTMLElement} target  element or its id
     */
    async function renderCategoryList(category, target) {
        const host = typeof target === "string"
            ? document.getElementById(target)
            : target;
        if (!host) return;

        host.innerHTML = `<p class="text-meta">Loading...</p>`;

        try {
            const files = await getManifest();
            const matches = files.filter(item =>
                Array.isArray(item.label) && item.label.includes(category)
            );

            host.innerHTML = "";

            if (matches.length === 0) {
                host.innerHTML = `<p class="text-meta">No data available yet.</p>`;
                return;
            }

            const list = document.createElement("div");
            list.className = "project-list";

            matches.forEach(item => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "project-item";
                if (item.password) btn.classList.add("project-item--locked");

                const name = document.createElement("span");
                name.textContent = item.label.join(" ");

                const badge = document.createElement("span");
                badge.className = "project-item__type";
                badge.textContent = (item.type || inferType(item.file)).toUpperCase();

                btn.appendChild(name);
                btn.appendChild(badge);
                btn.addEventListener("click", () => openFile(item));

                list.appendChild(btn);
            });

            host.appendChild(list);
        } catch (err) {
            console.error("Failed loading manifest:", err);
            host.innerHTML = `<p class="text-meta">Failed to load list.</p>`;
        }
    }

    // Expose globally for inline use in home.html
    window.renderCategoryList = renderCategoryList;
})();
