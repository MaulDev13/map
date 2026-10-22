// ======================================================
// TOGGLE UI
// Expand/collapse the inline category list on the home page.
// Lazily renders the list (via renderCategoryList) the first
// time a category is opened. Only one category open at a time.
// ======================================================

function toggleCategory(button) {
    const category = button.dataset.category;
    const panel = button.parentElement.querySelector(".project-content");
    if (!panel) return;

    const isOpen = !panel.classList.contains("hidden");

    // Collapse every open category + reset arrows/active state.
    document.querySelectorAll(".project-content").forEach(el => el.classList.add("hidden"));
    document.querySelectorAll("[data-category] .arrow").forEach(el => (el.textContent = "▼"));
    document.querySelectorAll("[data-category]").forEach(b => b.classList.remove("is-open"));

    if (isOpen) return; // was open -> now closed, nothing more to do

    panel.classList.remove("hidden");
    button.classList.add("is-open");
    const arrow = button.querySelector(".arrow");
    if (arrow) arrow.textContent = "▲";

    // Render once (lazy). Marked via data-loaded so re-opening is instant.
    if (panel.dataset.loaded !== "true" && typeof renderCategoryList === "function") {
        renderCategoryList(category, panel);
        panel.dataset.loaded = "true";
    }

    setTimeout(() => panel.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
}

window.toggleCategory = toggleCategory;
