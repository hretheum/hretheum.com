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
};

export default function FitText({ children, min = 12, max = 48, step = 6, className = '' }: FitTextProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>(max);

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

  function fits(): boolean {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return true;
    // Allow a tiny epsilon so we don't jitter
    const epsilon = 1;
    return text.scrollWidth <= box.clientWidth + epsilon;
  }

  function fit() {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;
    // Binary search font-size between min..max to fit width
    let low = min;
    let high = max;
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
      <div ref={textRef} style={{ fontSize }} className="font-black leading-tight break-words [text-wrap:balance]">
        {children}
      </div>
    </div>
  );
}
