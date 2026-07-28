// js/core/config.js
window.CONFIG = {

    API_BASE: document
        .querySelector('meta[name="api-base"]')
        ?.getAttribute("content") || "",

    BASE_PATH :
        (location.hostname === "localhost" || 
            location.hostname === "127.0.0.1"
            ? ""
            : "/wo/"
        )
};