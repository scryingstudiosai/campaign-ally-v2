'use client';

import { useEffect, useState, useRef } from 'react';

interface LiveSpineProps {
  activeIndex: number;
  containerRef: React.RefObject<HTMLElement>;
}

export function LiveSpine({ activeIndex, containerRef }: LiveSpineProps) {
  const [spineStyle, setSpineStyle] = useState({ top: 0, height: 48 });
  const prevActiveRef = useRef(activeIndex);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSpinePosition = () => {
      const container = containerRef.current;
      if (!container) return;

      const blocks = container.querySelectorAll('[data-playbook-block]');
      if (blocks.length === 0 || activeIndex < 0 || activeIndex >= blocks.length) return;

      const activeBlock = blocks[activeIndex] as HTMLElement;
      if (!activeBlock) return;

      const containerRect = container.getBoundingClientRect();
      const blockRect = activeBlock.getBoundingClientRect();

      setSpineStyle({
        top: blockRect.top - containerRect.top + container.scrollTop,
        height: blockRect.height,
      });
    };

    updateSpinePosition();

    // Update on resize
    const observer = new ResizeObserver(updateSpinePosition);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [activeIndex, containerRef]);

  // Track previous active for animation direction
  useEffect(() => {
    prevActiveRef.current = activeIndex;
  }, [activeIndex]);

  return (
    <>
      {/* The Rail (subtle track) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
        style={{ background: 'rgba(45, 212, 191, 0.1)' }}
      />

      {/* The Active Spine (glowing indicator) */}
      <div
        className="absolute left-0 w-[3px] rounded-full animate-spine-pulse"
        style={{
          background: 'var(--arcane)',
          boxShadow: '0 0 20px rgba(45, 212, 191, 0.3)',
          top: spineStyle.top,
          height: spineStyle.height,
          transition: 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </>
  );
}
