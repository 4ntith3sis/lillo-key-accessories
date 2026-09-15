'use client';

import { useEffect, useState } from 'react';

export default function Cursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [ringPosition, setRingPosition] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    let mouseX = -100;
    let mouseY = -100;
    let rx = -100;
    let ry = -100;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      setPosition({ x: mouseX, y: mouseY });
    };

    const renderRing = () => {
      rx += (mouseX - rx) * 0.25;
      ry += (mouseY - ry) * 0.25;
      setRingPosition({ x: rx, y: ry });
      animId = requestAnimationFrame(renderRing);
    };

    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    animId = requestAnimationFrame(renderRing);

    const updateHoverState = () => {
      const hoverableElements = document.querySelectorAll('a, button, #heroCharm, .lillo-product-card');
      hoverableElements.forEach((el) => {
        el.addEventListener('mouseenter', () => setIsHovered(true));
        el.addEventListener('mouseleave', () => setIsHovered(false));
      });
    };

    updateHoverState();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <div
        className="cur-dot"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)`,
        }}
      />
      <div
        className={`cur-ring ${isHovered ? 'cur-hover' : ''} ${isMouseDown ? 'cur-down' : ''}`}
        style={{
          transform: `translate(${ringPosition.x}px, ${ringPosition.y}px) translate(-50%, -50%)`,
        }}
      />
    </>
  );
}
