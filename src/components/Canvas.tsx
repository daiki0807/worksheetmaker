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
        />
      ))}
    </div>
  );
});

export default Canvas;
