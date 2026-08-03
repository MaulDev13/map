// js/core/config.js
window.CONFIG = {

    API_BASE: document
        .querySelector('meta[name="api-base"]')
        ?.getAttribute("content") || "",

    BASE_PATH: (() => {
        const host = location.hostname;

        if (host === "localhost" || host === "127.0.0.1") {
            return "";
        }

        if (host === "mauldev13.github.io") {
            return "https://mauldev13.github.io/map";
        }

        if (host.endsWith(".vercel.app")) {
            return "";
        }

        return "";
    })()
};