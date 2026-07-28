// js/app.js

// import "./core/config.js";
// import "./core/router.js";
// import "./core/loading.js";
// import "./core/error.js";
// import "./core/navigation.js";

// import "./features/home.js";
// import "./features/skill-tree.js";

const VERSION = document.querySelector('meta[name="app-version"]')?.content || '1';

document.addEventListener('htmx:configRequest', (e) => {
    e.detail.parameters['v'] = VERSION;
});