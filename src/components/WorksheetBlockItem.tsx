import React from 'react';
import { Rnd } from 'react-rnd';
import { Trash2, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { WorksheetBlock } from '../types';

interface WorksheetBlockItemProps {
  block: WorksheetBlock;
  isSelected: boolean;
  onSelect: (multi: boolean) => void;
  onUpdate: (updates: Partial<WorksheetBlock>) => void;
  onUpdateTransient?: (updates: Partial<WorksheetBlock>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  scale?: number;
  gridSnap?: number;
  onDragStartCustom?: (id: string) => void;
  onDragCustom?: (id: string, x: number, y: number, w: number, h: number) => void;
  onDragStopCustom?: (id: string, x: number, y: number) => void;
  onResizeStartCustom?: (id: string) => void;
  onResizeCustom?: (id: string, x: number, y: number, w: number, h: number) => void;
  onResizeStopCustom?: (id: string, x: number, y: number, w: number, h: number) => void;
}

const WorksheetBlockItem: React.FC<WorksheetBlockItemProps> = ({
  block, isSelected, onSelect, onUpdate, onDelete, onDuplicate, scale = 1, gridSnap = 1,
  onDragStartCustom, onDragCustom, onDragStopCustom,
  onResizeStartCustom, onResizeCustom, onResizeStopCustom,
}) => {

  const baseFont = block.fontFamily || '"Yu Mincho", "MS Mincho", serif';

  const renderTextWithFurigana = (text: string) => {
    if (typeof text !== 'string') return text;
    const regex = /\[([^\]]+)\]\{([^}]+)\}/g;
    if (!regex.test(text)) return text;
    
    const parts = text.split(regex);
    const result = [];
    for (let i = 0; i < parts.length; i += 3) {
      if (parts[i]) result.push(<React.Fragment key={i}>{parts[i]}</React.Fragment>);
      if (i + 1 < parts.length) {
        result.push(
          <ruby key={i+1}>
            {parts[i+1]}<rt>{parts[i+2]}</rt>
          </ruby>
        );
      }
    }
    return result;
  };

  const getCornerBrackets = (color: string, thickness = 2, size = 18) => (
    <>
      {(['tl','tr','bl','br'] as const).map(k => {
        const style: React.CSSProperties = {
          position: 'absolute',
          width: size,
          height: size,
          pointerEvents: 'none',
        };
        if (k === 'tl') { style.top = 0; style.left = 0; style.borderTop = `${thickness}px solid ${color}`; style.borderLeft = `${thickness}px solid ${color}`; }
        if (k === 'tr') { style.top = 0; style.right = 0; style.borderTop = `${thickness}px solid ${color}`; style.borderRight = `${thickness}px solid ${color}`; }
        if (k === 'bl') { style.bottom = 0; style.left = 0; style.borderBottom = `${thickness}px solid ${color}`; style.borderLeft = `${thickness}px solid ${color}`; }
        if (k === 'br') { style.bottom = 0; style.right = 0; style.borderBottom = `${thickness}px solid ${color}`; style.borderRight = `${thickness}px solid ${color}`; }
        return <div key={k} style={style} />;
      })}
    </>
  );

  const renderContent = () => {
    switch (block.type) {
      case 'title': {
        const isVertical = block.writingMode === 'vertical-rl';
        let justify = 'center';
        if (block.textAlign === 'left') justify = 'flex-start';
        if (block.textAlign === 'right') justify = 'flex-end';

        return (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: justify,
            fontFamily: baseFont,
            fontSize: block.fontSize,
            fontWeight: block.fontWeight,
            color: block.color,
            textDecoration: block.underline ? 'underline' : 'none',
            writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
            textOrientation: 'mixed',
            whiteSpace: 'pre-wrap',
          }}>
            {renderTextWithFurigana(block.text)}
          </div>
        );
      }
      case 'nameBox': {
        const isVertical = block.writingMode === 'vertical-rl';
        return (
          <div style={{
            width: '100%', height: '100%',
            border: '1px solid black',
            padding: '8px',
            fontFamily: baseFont,
            fontSize: block.fontSize,
            writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
            whiteSpace: 'pre-wrap',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {renderTextWithFurigana(block.text)}
          </div>
        );
      }
      case 'goal': {
        const isVertical = block.writingMode === 'vertical-rl';
        const labelStyle: React.CSSProperties = isVertical
          ? { position: 'absolute', top: 12, right: 12, writingMode: 'vertical-rl' as const }
          : { position: 'absolute', top: 12, right: 16 };
        return (
          <div style={{
            width: '100%', height: '100%', position: 'relative', background: 'white',
            fontFamily: baseFont, boxSizing: 'border-box',
            border: block.frameStyle === 'solid' ? '2px solid black' : 'none',
          }}>
            {block.frameStyle === 'corner' && getCornerBrackets('black')}
            <div style={{ ...labelStyle, fontWeight: 'bold', fontSize: block.titleFontSize, padding: '2px 8px', background: 'white', zIndex: 2 }}>
              {renderTextWithFurigana(block.title)}
            </div>
            <textarea
              value={block.text}
              onChange={e => onUpdate({ text: e.target.value })}
              onPointerDown={e => e.stopPropagation()}
              style={{
                width: '100%', height: '100%', boxSizing: 'border-box',
                padding: isVertical ? '12px 60px 12px 16px' : '60px 16px 16px 16px',
                border: 'none', outline: 'none', resize: 'none',
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: block.fontSize,
                lineHeight: 1.7,
                writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
              }}
            />
          </div>
        );
      }
      case 'notice': {
        const isVertical = block.writingMode === 'vertical-rl';
        return (
          <div style={{
            width: '100%', height: '100%',
            border: '1px solid black',
            display: 'flex',
            fontFamily: baseFont,
            flexDirection: isVertical ? 'row-reverse' : 'column',
          }}>
            <div style={{
              padding: '8px',
              borderBottom: isVertical ? 'none' : '1px solid black',
              borderLeft: isVertical ? '1px solid black' : 'none',
              fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: block.titleFontSize,
              writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
            }}>
              {renderTextWithFurigana(block.title)}
            </div>
            <div style={{ flex: 1 }} />
          </div>
        );
      }
      case 'table':
        return (
          <table style={{
            width: '100%', height: '100%',
            borderCollapse: 'collapse',
            border: `${block.borderWidth}px solid black`,
            fontFamily: baseFont,
          }}>
            <tbody>
              {Array.from({ length: block.rows }).map((_, r) => {
                const rowHeights = block.rowHeights || Array(block.rows).fill(Math.round(block.height / block.rows));
                const rowHeight = rowHeights[r] || 80;
                return (
                  <tr key={r} style={{ height: `${rowHeight}px` }}>
                    {Array.from({ length: block.cols }).map((_, c) => (
                      <td key={c} style={{
                        border: `${block.borderWidth}px solid black`,
                        backgroundColor: r === 0 ? block.headerBackground : 'transparent',
                        textAlign: 'center', verticalAlign: 'middle',
                        fontWeight: r === 0 ? 'bold' : 'normal',
                        padding: '4px',
                      }}>
                        {renderTextWithFurigana(block.cellTexts[r]?.[c] || '')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      case 'line': {
        const isH = block.orientation === 'horizontal';
        return (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: isH ? '100%' : `${block.thickness}px`,
              height: isH ? `${block.thickness}px` : '100%',
              borderTop: isH ? `${block.thickness}px ${block.dashed ? 'dashed' : 'solid'} ${block.color}` : 'none',
              borderLeft: isH ? 'none' : `${block.thickness}px ${block.dashed ? 'dashed' : 'solid'} ${block.color}`,
            }} />
          </div>
        );
      }
      case 'writeArea': {
        const isVertical = block.writingMode === 'vertical-rl';
        const lineCount = Math.max(1, block.lineCount);
        const titlePad = 32;
        const titleStyle: React.CSSProperties = isVertical
          ? { position: 'absolute', top: 8, right: 6, fontWeight: 'bold', fontSize: block.titleFontSize, background: 'white', padding: '4px 0', zIndex: 2, writingMode: 'vertical-rl' as const }
          : { position: 'absolute', top: 4, left: 8, fontWeight: 'bold', fontSize: block.titleFontSize, background: 'white', padding: '0 4px', zIndex: 2 };
        const linesPadding = isVertical ? `8px ${titlePad}px 8px 8px` : `${titlePad}px 8px 8px 8px`;
        const textareaPadding = isVertical ? `8px ${titlePad}px 8px 12px` : `${titlePad}px 12px 8px 12px`;
        return (
          <div style={{
            width: '100%', height: '100%', position: 'relative',
            border: '1px solid black', background: 'white', boxSizing: 'border-box',
            fontFamily: baseFont,
          }}>
            <div style={titleStyle}>
              {renderTextWithFurigana(block.title)}
            </div>
            {(!block.backgroundType || block.backgroundType === 'none') && block.showLines && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex',
                flexDirection: isVertical ? 'row-reverse' : 'column',
                pointerEvents: 'none',
                padding: linesPadding,
              }}>
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i} style={{
                    flex: 1,
                    borderBottom: isVertical ? 'none' : (i === lineCount - 1 ? 'none' : '1px solid #94a3b8'),
                    borderLeft: isVertical ? (i === lineCount - 1 ? 'none' : '1px solid #94a3b8') : 'none',
                  }} />
                ))}
              </div>
            )}
            {(block.backgroundType === 'grid' || block.backgroundType === 'manuscript') && (
              <div style={{
                position: 'absolute', inset: 0,
                pointerEvents: 'none',
                padding: textareaPadding,
                backgroundOrigin: 'content-box',
                backgroundSize: `${block.fontSize * 1.6}px ${block.fontSize * 1.6}px`,
                backgroundImage: block.backgroundType === 'grid'
                  ? 'linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)'
                  : (isVertical ? 'linear-gradient(to right, #cbd5e1 1px, transparent 1px)' : 'linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)'),
              }} />
            )}
            <textarea
              value={block.text}
              onChange={e => onUpdate({ text: e.target.value })}
              onPointerDown={e => e.stopPropagation()}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                boxSizing: 'border-box',
                padding: textareaPadding,
                border: 'none', outline: 'none', resize: 'none',
                background: 'transparent',
                fontFamily: 'inherit', fontSize: block.fontSize,
                lineHeight: 1.6,
                writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
              }}
            />
          </div>
        );
      }
      case 'image': {
        if (!block.src) {
          return (
            <div style={{
              width: '100%', height: '100%',
              border: '2px dashed #cbd5e1',
              borderRadius: '6px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '8px',
              background: '#f8fafc', fontSize: '12px', color: '#64748b',
              boxSizing: 'border-box',
              padding: '8px',
            }}>
              <div style={{ fontWeight: 'bold' }}>画像ブロック</div>
              <label style={{
                padding: '4px 12px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                color: '#334155',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                display: 'inline-flex',
                alignItems: 'center',
              }}
                onPointerDown={e => e.stopPropagation()}
              >
                画像を選択
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => onUpdate({ src: String(reader.result) });
                    reader.readAsDataURL(f);
                  }}
                />
              </label>
            </div>
          );
        }
        return (
          <img
            src={block.src}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
          />
        );
      }
      case 'checkbox': {
        return (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', gap: '4px',
            padding: '8px', boxSizing: 'border-box',
            fontFamily: baseFont, fontSize: block.fontSize,
          }}>
            {block.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                onPointerDown={e => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={e => {
                    const next = [...block.items];
                    next[i] = { ...next[i], checked: e.target.checked };
                    onUpdate({ items: next });
                  }}
                  style={{ width: '18px', height: '18px' }}
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={e => {
                    const next = [...block.items];
                    next[i] = { ...next[i], text: e.target.value };
                    onUpdate({ items: next });
                  }}
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    background: 'transparent',
                    fontFamily: 'inherit', fontSize: 'inherit',
                  }}
                />
              </div>
            ))}
          </div>
        );
      }
      case 'qrCode': {
        const qrSize = Math.min(block.width, block.height - 24);
        return (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'white', padding: '4px', boxSizing: 'border-box',
          }}>
            {block.url ? (
              <QRCodeSVG value={block.url} size={Math.max(40, qrSize)} />
            ) : (
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>URLを設定してください</div>
            )}
            {block.caption && (
              <div style={{ fontSize: '11px', marginTop: '4px', fontFamily: baseFont }}>
                {block.caption}
              </div>
            )}
          </div>
        );
      }
      case 'shape': {
        const renderSvg = (content: React.ReactNode) => (
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            {content}
          </svg>
        );
        const { fillColor, borderColor, borderWidth, shapeType } = block;
        const styleProps = {
          fill: fillColor,
          stroke: borderColor,
          strokeWidth: borderWidth,
          vectorEffect: 'non-scaling-stroke',
        };

        let shapeContent = null;
        if (shapeType === 'rectangle') {
          shapeContent = renderSvg(<rect x="0" y="0" width="100" height="100" {...styleProps} />);
        } else if (shapeType === 'circle') {
          shapeContent = renderSvg(<ellipse cx="50" cy="50" rx="50" ry="50" {...styleProps} />);
        } else if (shapeType === 'triangle') {
          shapeContent = renderSvg(<polygon points="50,0 100,100 0,100" {...styleProps} />);
        } else if (shapeType === 'arrow') {
          shapeContent = renderSvg(<polygon points="0,30 60,30 60,0 100,50 60,100 60,70 0,70" {...styleProps} />);
        } else if (shapeType === 'callout') {
          shapeContent = renderSvg(<path d="M 0,0 L 100,0 L 100,70 L 60,70 L 30,100 L 40,70 L 0,70 Z" {...styleProps} />);
        }
        
        return (
          <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
            {shapeContent}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Rnd
      size={{ width: block.width, height: block.height }}
      position={{ x: block.x, y: block.y }}
      disableDragging={block.isLocked}
      enableResizing={block.isLocked ? false : undefined}
      onDragStart={(e: any) => {
        onSelect(e.shiftKey);
        if (onDragStartCustom) onDragStartCustom(block.id);
      }}
      onDrag={(_e, d) => {
        if (onDragCustom) onDragCustom(block.id, d.x, d.y, block.width, block.height);
      }}
      onDragStop={(_e, d) => {
        if (onDragStopCustom) {
          onDragStopCustom(block.id, d.x, d.y);
        } else {
          onUpdate({ x: d.x, y: d.y });
        }
      }}
      onResizeStart={(e: any) => {
        onSelect(e.shiftKey);
        if (onResizeStartCustom) onResizeStartCustom(block.id);
      }}
      onResize={(_e, _dir, ref, _delta, position) => {
        const w = parseInt(ref.style.width, 10);
        const h = parseInt(ref.style.height, 10);
        if (onResizeCustom) onResizeCustom(block.id, position.x, position.y, w, h);
      }}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        const w = parseInt(ref.style.width, 10);
        const h = parseInt(ref.style.height, 10);
        if (onResizeStopCustom) {
          onResizeStopCustom(block.id, position.x, position.y, w, h);
        } else {
          onUpdate({
            width: w,
            height: h,
            ...position,
          });
        }
      }}
      dragGrid={[gridSnap, gridSnap]}
      resizeGrid={[gridSnap, gridSnap]}
      bounds="parent"
      scale={scale}
      className={`${isSelected ? 'rnd-selected' : ''} ${block.isLocked ? 'rnd-locked' : ''}`}
      style={{
        outline: isSelected
          ? block.isLocked
            ? '2px solid #ef4444'
            : '2px dashed var(--accent-color)'
          : 'none',
        zIndex: (block.zIndex || 1) + (isSelected ? 1000 : 0),
      }}
    >
      {isSelected && block.isLocked && (
        <div className="no-print" style={{
          position: 'absolute', top: '-28px', left: 0,
          display: 'flex', gap: '4px', zIndex: 11,
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate({ isLocked: false }); }}
            title="ロック解除"
            style={{
              background: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer',
              padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px',
              color: 'white', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <span>🔒</span> ロック解除
          </button>
        </div>
      )}

      {isSelected && !block.isLocked && (
        <div className="no-print" style={{
          position: 'absolute', top: '-28px', right: 0,
          display: 'flex', gap: '4px', zIndex: 11,
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            title="複製"
            style={{ background: 'white', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', padding: '2px', display: 'flex' }}
          >
            <Copy size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="削除"
            style={{ background: 'white', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', padding: '2px', display: 'flex' }}
          >
            <Trash2 size={14} color="red" />
          </button>
        </div>
      )}

      <div style={{ width: '100%', height: '100%' }} onPointerDown={(e) => onSelect(e.shiftKey)}>
        {renderContent()}
      </div>
    </Rnd>
  );
};

export default WorksheetBlockItem;
