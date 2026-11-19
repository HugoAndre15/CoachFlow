// Both the public app and the cached match notebook use the same device preference.
(() => {
  const key = "coachflow.theme";
  const root = document.documentElement;
  function apply(value) {
    root.dataset.theme = value === "dark" ? "dark" : "light";
    const notebookSwitch = document.getElementById("terrain-theme");
    notebookSwitch?.setAttribute("aria-checked", String(root.dataset.theme === "dark"));
    window.dispatchEvent(new Event("coachflow:theme"));
  }
  try { apply(localStorage.getItem(key)); } catch { apply("light"); }
  document.addEventListener("DOMContentLoaded", () => apply(root.dataset.theme), { once: true });
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || !event.target.closest("[data-theme-toggle]")) return;
    apply(root.dataset.theme === "dark" ? "light" : "dark");
    try { localStorage.setItem(key, root.dataset.theme); } catch { /* The choice still applies to this page. */ }
  });
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) apply(event.newValue);
  });
})();
