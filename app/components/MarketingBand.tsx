"use client";

// Auto-sliding marketing band. Reads its messages from lib/marketing.ts —
// append to that list and they join the rotation automatically.
//
// Behaviour worth knowing:
//   - pauses while hovered or keyboard-focused, so nobody loses the sentence
//     they are halfway through reading;
//   - honours prefers-reduced-motion by not auto-advancing and not animating
//     (the dots still work, so the content stays reachable);
//   - with a single message it renders as a plain static band, no controls.

import { useCallback, useEffect, useRef, useState } from "react";
import { MARKETING_MESSAGES } from "@/lib/marketing";

const INTERVAL_MS = 6000;

export default function MarketingBand() {
  const messages = MARKETING_MESSAGES;
  const count = messages.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  );

  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(id);
  }, [count, paused, reducedMotion]);

  if (count === 0) return null;

  // Swipe support on touch devices, where there is no hover to reveal controls.
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null) return;
    const dx = e.changedTouches[0].clientX - start;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
  }

  return (
    <section
      aria-label="Mensagens da loja"
      className="bg-secondary-container text-on-secondary-container"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="max-w-5xl mx-auto w-full px-margin-mobile py-4 flex items-center gap-3">
        {count > 1 && (
          <button
            onClick={() => go(index - 1)}
            aria-label="Mensagem anterior"
            className="hidden sm:grid place-items-center w-8 h-8 rounded-full hover:bg-on-secondary-container/10 transition-colors flex-none"
          >
            <span className="material-symbols-outlined text-[20px]">
              chevron_left
            </span>
          </button>
        )}

        {/* Viewport: a fixed min-height keeps the page from jumping as
            messages of different lengths rotate through. */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div
            className={
              "flex " +
              (reducedMotion ? "" : "transition-transform duration-500 ease-out")
            }
            style={{ transform: "translateX(-" + index * 100 + "%)" }}
          >
            {messages.map((m, i) => (
              <div
                key={m.title}
                className="w-full flex-none flex items-center gap-3 min-h-[64px]"
                aria-hidden={i !== index}
              >
                <span className="material-symbols-outlined text-[28px] flex-none">
                  {m.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-headline-md text-headline-md">{m.title}</p>
                  <p className="font-body-md text-body-md opacity-90">
                    {m.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {count > 1 && (
          <button
            onClick={() => go(index + 1)}
            aria-label="Mensagem seguinte"
            className="hidden sm:grid place-items-center w-8 h-8 rounded-full hover:bg-on-secondary-container/10 transition-colors flex-none"
          >
            <span className="material-symbols-outlined text-[20px]">
              chevron_right
            </span>
          </button>
        )}
      </div>

      {count > 1 && (
        <div className="flex justify-center gap-1.5 pb-3">
          {messages.map((m, i) => (
            <button
              key={m.title}
              onClick={() => go(i)}
              aria-label={"Mensagem " + (i + 1) + " de " + count}
              aria-current={i === index}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === index
                  ? "w-5 bg-on-secondary-container"
                  : "w-1.5 bg-on-secondary-container/40 hover:bg-on-secondary-container/70")
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
