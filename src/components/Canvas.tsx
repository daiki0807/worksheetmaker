import React, { forwardRef, useEffect, useState, useRef } from 'react';
import type { WorksheetData, WorksheetBlock } from '../types';
import WorksheetBlockItem from './WorksheetBlockItem';

interface CanvasProps {
  data: WorksheetData;
  selectedIds: string[];
  onSelect: (id: string | null, multi?: boolean) => void;
  onUpdate: (id: string, updates: Partial<WorksheetBlock>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const PAPER_DIMENSIONS = {
  A4: { width: 794, height: 1123 },
  B4: { width: 971, height: 1376 },
};

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({ data, selectedIds, onSelect, onUpdate, onDelete, onDuplicate }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const setRefs = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };
  const [scale, setScale] = useState(1);
  const [activeDragInfo, setActiveDragInfo] = useState<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const { width: baseWidth, height: baseHeight } = PAPER_DIMENSIONS[data.paper.size];
  const paperWidth = data.paper.orientation === 'portrait' ? baseWidth : baseHeight;
  const paperHeight = data.paper.orientation === 'portrait' ? baseHeight : baseWidth;

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          const padding = 80;
          const scaleX = (parent.clientWidth - padding) / paperWidth;
          const scaleY = (parent.clientHeight - padding) / paperHeight;
          setScale(Math.min(scaleX, scaleY, 1));
        }
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [paperWidth, paperHeight]);

  // ガイド候補の計算
  const getGuides = () => {
    if (!activeDragInfo) return { xGuides: [], yGuides: [], snapX: 0, snapY: 0 };

    const currentBlock = data.blocks.find(b => b.id === activeDragInfo.id);
    if (!currentBlock) return { xGuides: [], yGuides: [], snapX: activeDragInfo.x, snapY: activeDragInfo.y };

    const SNAP_THRESHOLD = 8;
    const { id, x, y, width, height } = activeDragInfo;

    const otherBlocks = data.blocks.filter(b => 
      b.pageIndex === data.currentPage && 
      b.id !== id && 
      (!currentBlock.groupId || b.groupId !== currentBlock.groupId)
    );

    const xTargets: number[] = [0, paperWidth / 2, paperWidth];
    otherBlocks.forEach(b => {
      xTargets.push(b.x);
      xTargets.push(b.x + b.width / 2);
      xTargets.push(b.x + b.width);
    });

    const yTargets: number[] = [0, paperHeight / 2, paperHeight];
    otherBlocks.forEach(b => {
      yTargets.push(b.y);
      yTargets.push(b.y + b.height / 2);
      yTargets.push(b.y + b.height);
    });

    let snapX = x;
    let snapY = y;
    const xGuidesSet = new Set<number>();
    const yGuidesSet = new Set<number>();

    // X方向
    let minDiffX = SNAP_THRESHOLD;
    xTargets.forEach(t => {
      const diff = Math.abs(x - t);
      if (diff < minDiffX) { minDiffX = diff; snapX = t; xGuidesSet.add(t); }
    });
    let minDiffCenterX = SNAP_THRESHOLD;
    xTargets.forEach(t => {
      const diff = Math.abs((x + width / 2) - t);
      if (diff < minDiffCenterX) { minDiffCenterX = diff; snapX = t - width / 2; xGuidesSet.add(t); }
    });
    let minDiffRightX = SNAP_THRESHOLD;
    xTargets.forEach(t => {
      const diff = Math.abs((x + width) - t);
      if (diff < minDiffRightX) { minDiffRightX = diff; snapX = t - width; xGuidesSet.add(t); }
    });

    // Y方向
    let minDiffY = SNAP_THRESHOLD;
    yTargets.forEach(t => {
      const diff = Math.abs(y - t);
      if (diff < minDiffY) { minDiffY = diff; snapY = t; yGuidesSet.add(t); }
    });
    let minDiffCenterY = SNAP_THRESHOLD;
    yTargets.forEach(t => {
      const diff = Math.abs((y + height / 2) - t);
      if (diff < minDiffCenterY) { minDiffCenterY = diff; snapY = t - height / 2; yGuidesSet.add(t); }
    });
    let minDiffBottomY = SNAP_THRESHOLD;
    yTargets.forEach(t => {
      const diff = Math.abs((y + height) - t);
      if (diff < minDiffBottomY) { minDiffBottomY = diff; snapY = t - height; yGuidesSet.add(t); }
    });

    const finalXGuides = Array.from(xGuidesSet).filter(t => 
      Math.abs(snapX - t) < 1 || 
      Math.abs((snapX + width / 2) - t) < 1 || 
      Math.abs((snapX + width) - t) < 1
    );
    const finalYGuides = Array.from(yGuidesSet).filter(t => 
      Math.abs(snapY - t) < 1 || 
      Math.abs((snapY + height / 2) - t) < 1 || 
      Math.abs((snapY + height) - t) < 1
    );

    return {
      xGuides: finalXGuides,
      yGuides: finalYGuides,
      snapX,
      snapY
    };
  };

  const handleDragStop = (id: string, currentX: number, currentY: number) => {
    const block = data.blocks.find(b => b.id === id);
    if (!block) {
      setActiveDragInfo(null);
      return;
    }

    const SNAP_THRESHOLD = 8;
    const otherBlocks = data.blocks.filter(b => 
      b.pageIndex === data.currentPage && 
      b.id !== id && 
      (!block.groupId || b.groupId !== block.groupId)
    );

    const xTargets = [0, paperWidth / 2, paperWidth];
    otherBlocks.forEach(b => { xTargets.push(b.x); xTargets.push(b.x + b.width / 2); xTargets.push(b.x + b.width); });
    const yTargets = [0, paperHeight / 2, paperHeight];
    otherBlocks.forEach(b => { yTargets.push(b.y); yTargets.push(b.y + b.height / 2); yTargets.push(b.y + b.height); });

    let finalSnapX = currentX;
    let finalSnapY = currentY;

    let minDiffX = SNAP_THRESHOLD;
    xTargets.forEach(t => {
      if (Math.abs(currentX - t) < minDiffX) { minDiffX = Math.abs(currentX - t); finalSnapX = t; }
      if (Math.abs((currentX + block.width / 2) - t) < minDiffX) { minDiffX = Math.abs((currentX + block.width / 2) - t); finalSnapX = t - block.width / 2; }
      if (Math.abs((currentX + block.width) - t) < minDiffX) { minDiffX = Math.abs((currentX + block.width) - t); finalSnapX = t - block.width; }
    });

    let minDiffY = SNAP_THRESHOLD;
    yTargets.forEach(t => {
      if (Math.abs(currentY - t) < minDiffY) { minDiffY = Math.abs(currentY - t); finalSnapY = t; }
      if (Math.abs((currentY + block.height / 2) - t) < minDiffY) { minDiffY = Math.abs((currentY + block.height / 2) - t); finalSnapY = t - block.height / 2; }
      if (Math.abs((currentY + block.height) - t) < minDiffY) { minDiffY = Math.abs((currentY + block.height) - t); finalSnapY = t - block.height; }
    });

    const dx = Math.round(finalSnapX - block.x);
    const dy = Math.round(finalSnapY - block.y);

    if (dx !== 0 || dy !== 0) {
      if (block.groupId) {
        const groupMembers = data.blocks.filter(b => b.groupId === block.groupId && b.pageIndex === data.currentPage);
        groupMembers.forEach(member => {
          onUpdate(member.id, { x: member.x + dx, y: member.y + dy });
        });
      } else {
        onUpdate(id, { x: finalSnapX, y: finalSnapY });
      }
    }

    setActiveDragInfo(null);
  };

  const handleResizeStop = (id: string, rx: number, ry: number, rw: number, rh: number) => {
    onUpdate(id, { x: rx, y: ry, width: rw, height: rh });
    setActiveDragInfo(null);
  };

  const { xGuides, yGuides } = getGuides();
  const visibleBlocks = data.blocks.filter(b => b.pageIndex === data.currentPage);

  return (
    <div
      ref={setRefs}
      style={{
        width: `${paperWidth}px`,
        height: `${paperHeight}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        backgroundColor: 'var(--paper-bg)',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        position: 'relative',
        flexShrink: 0,
      }}
      className="print-area"
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelect(null);
      }}
    >
      {visibleBlocks.map(block => (
        <WorksheetBlockItem
          key={block.id}
          block={block}
          isSelected={selectedIds.includes(block.id)}
          onSelect={(multi) => onSelect(block.id, multi)}
          onUpdate={(updates) => onUpdate(block.id, updates)}
          onDelete={() => onDelete(block.id)}
          onDuplicate={() => onDuplicate(block.id)}
          scale={scale}
          gridSnap={data.gridSnap}
          onDragStartCustom={(id) => setActiveDragInfo({ id, x: block.x, y: block.y, width: block.width, height: block.height })}
          onDragCustom={(id, dx, dy, w, h) => setActiveDragInfo({ id, x: dx, y: dy, width: w, height: h })}
          onDragStopCustom={handleDragStop}
          onResizeStartCustom={(id) => setActiveDragInfo({ id, x: block.x, y: block.y, width: block.width, height: block.height })}
          onResizeCustom={(id, rx, ry, rw, rh) => setActiveDragInfo({ id, x: rx, y: ry, width: rw, height: rh })}
          onResizeStopCustom={handleResizeStop}
        />
      ))}

      {/* スマートガイドの描画 (印刷時にはno-printにより非表示) */}
      {xGuides.map((x, idx) => (
        <div
          key={`gx-${idx}`}
          className="no-print"
          style={{
            position: 'absolute',
            left: `${x}px`,
            top: 0,
            width: '1px',
            height: '100%',
            borderLeft: '1px dashed #ec4899',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      ))}
      {yGuides.map((y, idx) => (
        <div
          key={`gy-${idx}`}
          className="no-print"
          style={{
            position: 'absolute',
            left: 0,
            top: `${y}px`,
            width: '100%',
            height: '1px',
            borderTop: '1px dashed #ec4899',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
});

export default Canvas;
