/**
 * Light/dark switch for the topbar.
 *
 * Reads its initial state from the DOM rather than from storage, because the
 * boot script in <head> has already resolved stored-choice-vs-OS by the time
 * this mounts. Asking localStorage again here would re-derive the same answer
 * and get it wrong for a visitor who has never chosen (stored is null, but the
 * OS said dark and the class is already on).
 *
 * Renders nothing until mounted: the server has no idea which theme will win,
 * so committing to an icon during SSR guarantees a hydration mismatch on half
 * of all loads.
 */

"use client";

import { useState, useEffect } from "react";
import { THEME_STORAGE_KEY } from "./themeBootScript";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setHasMounted(true);

    // Keep following the OS while the page is open — but only for a visitor who
    // has never picked a side. The boot script reads the media query once at
    // load; without this listener, someone who flips their system appearance in
    // another window sits on a stale theme until they reload. An explicit
    // choice must survive that, so the stored value short-circuits it.
    const osPrefersDark = window.matchMedia("(prefers-color-scheme: dark)");

    const followOsUnlessPinned = (event: MediaQueryListEvent) => {
      let hasExplicitChoice = false;
      try {
        hasExplicitChoice = localStorage.getItem(THEME_STORAGE_KEY) !== null;
      } catch {
        /* storage unreadable — treat as unpinned and follow the OS */
      }
      if (hasExplicitChoice) return;

      setIsDark(event.matches);
      document.documentElement.classList.toggle("dark", event.matches);
    };

    osPrefersDark.addEventListener("change", followOsUnlessPinned);
    return () => osPrefersDark.removeEventListener("change", followOsUnlessPinned);
  }, []);

  const applyTheme = (nextIsDark: boolean) => {
    setIsDark(nextIsDark);
    document.documentElement.classList.toggle("dark", nextIsDark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? "dark" : "light");
    } catch {
      /* private mode — the class still applied, it just will not persist */
    }
  };

  // Reserve the slot so the topbar does not reflow when the icon appears.
  if (!hasMounted) return <span className="w-7 h-7" aria-hidden />;

  return (
    <button
      onClick={() => applyTheme(!isDark)}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex items-center justify-center w-7 h-7 rounded-control text-ink-muted hover:text-ink hover:bg-raised transition-colors"
    >
      {isDark ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  );
}
