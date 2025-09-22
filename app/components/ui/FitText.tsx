// FitText: auto-scales font-size so wrapped text snugly fits the container width
// Comments in English per project rules.

'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

type FitTextProps = {
  children: React.ReactNode;
  min?: number; // min font size in px
  max?: number; // max font size in px
  step?: number; // binary search iterations
  className?: string;
  textClassName?: string; // classes for inner text (line-height, tracking)
  maxVwRatio?: number; // cap max as a ratio of container width, e.g., 0.18 => 18% of width
};

export default function FitText({ children, min = 12, max = 48, step = 6, className = '', textClassName, maxVwRatio = 0.18 }: FitTextProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  // Start at min to avoid an initial oversized flash before the first fit()
  const [fontSize, setFontSize] = useState<number>(min);
  const rafRef = useRef<number | null>(null);

  // ResizeObserver for responsive fit
  useLayoutEffect(() => {
    if (!boxRef.current) return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(boxRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  // Fallback for environments where ResizeObserver may not fire (or for viewport changes)
  useEffect(() => {
    const onResize = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => fit());
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    // Recompute after webfonts load (prevents oversized text after font swap)
    const fonts: any = (document as any).fonts;
    const onFonts = () => onResize();
    if (fonts?.ready) {
      fonts.ready.then(onResize).catch(() => {});
    }
    if (fonts && typeof fonts.addEventListener === 'function') {
      try { fonts.addEventListener('loadingdone', onFonts); } catch {}
      try { fonts.addEventListener('loadingerror', onFonts); } catch {}
    }
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (fonts && typeof fonts.removeEventListener === 'function') {
        try { fonts.removeEventListener('loadingdone', onFonts); } catch {}
        try { fonts.removeEventListener('loadingerror', onFonts); } catch {}
      }
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fits(): boolean {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return true;
    // Allow a tiny epsilon so we don't jitter
    const epsilon = 0.5;
    return text.scrollWidth <= box.clientWidth + epsilon;
  }

  function fit() {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;
    // Binary search font-size between min..max to fit width
    let low = min;
    // Cap the maximum by a % of the container width to avoid absurdly large lines on small screens
    const vwCap = Math.floor(box.clientWidth * maxVwRatio);
    let high = Math.min(max, Math.max(min, vwCap));
    let best = min;
    for (let i = 0; i < 12; i++) {
      const mid = Math.floor((low + high) / 2);
      text.style.fontSize = `${mid}px`;
      if (fits()) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    text.style.fontSize = `${best}px`;
    setFontSize(best);
  }

  return (
    <div ref={boxRef} className={`w-full ${className}`}> 
      <div ref={textRef} style={{ fontSize }} className={`font-black ${textClassName || 'leading-[0.95] tracking-tight break-words [text-wrap:balance]'}`}>
        {children}
      </div>
    </div>
  );
}
