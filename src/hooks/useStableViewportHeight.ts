import { useEffect, useState } from "react";

/**
 * The window height in px, ignoring the shrink when an on-screen keyboard opens.
 * Chrome on iOS resizes the viewport for the keyboard, which drags anything pinned
 * to the bottom of a 100dvh page up with it; a held height lets the keyboard
 * cover the page instead.
 */
export function useStableViewportHeight() {
  const [height, setHeight] = useState(() => (typeof window === "undefined" ? null : window.innerHeight));

  useEffect(() => {
    const handleResize = () => {
      const next = window.innerHeight;
      setHeight((current) => (current != null && next < current && isTyping() ? current : next));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return height;
}

function isTyping() {
  const element = document.activeElement;
  return element instanceof HTMLElement && (element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName));
}
