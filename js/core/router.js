// js/core/router.js

(function () {

    const {
        API_BASE,
        BASE_PATH
    } = window.CONFIG;

    document.body.addEventListener("htmx:configRequest", function (event) {

        let path = event.detail.path;

        if (!path) return;

        // API request
        if (path.startsWith("/api")) {
            event.detail.path = API_BASE + path;
            return;
        }

        // Local page/component.
        // BASE_PATH is "" (root) or ends with "/" (e.g. "/map/").
        // Strip the path's leading slash so we never produce a double slash,
        // then re-add one when serving from the domain root.
        if (!path.startsWith("http")) {
            const rel = path.replace(/^\/+/, "");
            event.detail.path = BASE_PATH ? BASE_PATH + rel : "/" + rel;
        }
    });

})();