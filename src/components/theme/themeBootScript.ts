/**
 * The anti-flash script. Runs BEFORE first paint, inlined into <head>.
 *
 * Without this the page always paints light first and then snaps to dark once
 * React hydrates — the flash is worse than having no dark mode at all, and it
 * is the single reason this has to be a blocking inline script rather than a
 * useEffect.
 *
 * It is also where "follow the OS" lives. globals.css deliberately has no
 * duplicate `prefers-color-scheme` copy of the palette — that would put every
 * hex in two places and break the one-source-of-truth rule the token block
 * exists to enforce. Reading the media query here gets the same behaviour with
 * the values still declared exactly once.
 *
 * Precedence: an explicit stored choice always beats the OS.
 */

export const THEME_STORAGE_KEY = "feedloop-theme";

/**
 * Stringified rather than imported, because it has to be injected as raw text
 * into a <script> tag. Keep it small, dependency-free, and wrapped in try/catch:
 * localStorage throws in some privacy modes, and a throw here would block the
 * entire document from rendering.
 */
export const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) {}
})();
`.trim();
