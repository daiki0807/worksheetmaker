import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical, Plus, Minus as MinusIcon } from 'lucide-react';
import type { WorksheetBlock } from '../types';

interface SidebarRightProps {
  selectedIds: string[];
  blocks: WorksheetBlock[];
  onUpdate: (id: string, updates: Partial<WorksheetBlock>) => void;
  onAlign: (id: string, mode: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => void;
  onPlaceInRegion: (id: string, row: 0 | 1 | 2, col: 0 | 1 | 2) => void;
  onChangeZIndex: (ids: string[], direction: 'front' | 'back' | 'forward' | 'backward') => void;
  onGroup?: (ids: string[]) => void;
  onUngroup?: (ids: string[]) => void;
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{ fontSize: '12px' }}>{label}</label>
    {children}
  </div>
);

const SidebarRight: React.FC<SidebarRightProps> = ({ selectedIds, blocks, onUpdate, onAlign, onPlaceInRegion, onChangeZIndex, onGroup, onUngroup }) => {
  if (selectedIds.length === 0) {
    return (
      <aside className="sidebar sidebar-right no-print">
        <div className="sidebar-header">詳細設定</div>
        <div className="sidebar-content" style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center' }}>
          パーツを選択してください
        </div>
      </aside>
    );
  }

  const getZIndexControls = (disabled: boolean) => (
    <Row label="重なり順">
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onChangeZIndex(selectedIds, 'front')} title="最前面へ" disabled={disabled}>最前面</button>
        <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onChangeZIndex(selectedIds, 'forward')} title="前面へ" disabled={disabled}>前面</button>
        <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onChangeZIndex(selectedIds, 'backward')} title="背面へ" disabled={disabled}>背面</button>
        <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onChangeZIndex(selectedIds, 'back')} title="最背面へ" disabled={disabled}>最背面</button>
      </div>
    </Row>
  );

  if (selectedIds.length > 1) {
    const selectedBlocks = blocks.filter(b => selectedIds.includes(b.id));
    const hasGrouped = selectedBlocks.some(b => b.groupId);
    const allLocked = selectedBlocks.every(b => b.isLocked);
    const anyLocked = selectedBlocks.some(b => b.isLocked);

    const handleLockToggle = () => {
      const nextLocked = !anyLocked;
      selectedIds.forEach(id => onUpdate(id, { isLocked: nextLocked }));
    };

    return (
      <aside className="sidebar sidebar-right no-print">
        <div className="sidebar-header">詳細設定 (複数選択)</div>
        <div className="sidebar-content">
          <Row label="操作">
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
              <button
                className="btn"
                style={{ width: '100%', justifyContent: 'center', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }}
                onClick={() => onGroup?.(selectedIds)}
                disabled={allLocked}
              >
                👥 グループ化する
              </button>
              {hasGrouped && (
                <button
                  className="btn"
                  style={{ width: '100%', justifyContent: 'center', backgroundColor: '#64748b', color: 'white', fontWeight: 'bold' }}
                  onClick={() => onUngroup?.(selectedIds)}
                  disabled={allLocked}
                >
                  🔓 グループを解除
                </button>
              )}
              <button
                className="btn"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  backgroundColor: anyLocked ? '#22c55e' : '#ef4444',
                  color: 'white',
                  fontWeight: 'bold'
                }}
                onClick={handleLockToggle}
              >
                {anyLocked ? '🔓 選択パーツをアンロック' : '🔒 選択パーツをロック'}
              </button>
            </div>
          </Row>
          {!allLocked && getZIndexControls(allLocked)}
        </div>
      </aside>
    );
  }

  const block = blocks.find(b => b.id === selectedIds[0]);
  if (!block) return null;

  const isLocked = block.isLocked || false;
  const hasGroup = !!block.groupId;

  const operationRow = (
    <Row label="操作">
      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
        <button
          className="btn"
          style={{
            width: '100%',
            justifyContent: 'center',
            backgroundColor: isLocked ? '#22c55e' : '#ef4444',
            color: 'white',
            fontWeight: 'bold',
          }}
          onClick={() => onUpdate(block.id, { isLocked: !isLocked })}
        >
          {isLocked ? '🔓 パーツをアンロック' : '🔒 パーツをロックする'}
        </button>
        {hasGroup && (
          <button
            className="btn"
            style={{
              width: '100%',
              justifyContent: 'center',
              backgroundColor: '#64748b',
              color: 'white',
              fontWeight: 'bold',
            }}
            onClick={() => onUngroup?.([block.id])}
            disabled={isLocked}
          >
            🔓 グループを解除する
          </button>
        )}
      </div>
    </Row>
  );

  const hasFontRow = 'fontFamily' in block;
  const fontRow = hasFontRow && (
    <Row label="フォント">
      <select
        className="select-input"
        value={(block as any).fontFamily || '"UD Digi Kyokasho N-R", "UD デジタル 教科書体 N-R", "Yu Mincho", "MS Mincho", serif'}
        onChange={e => onUpdate(block.id, { fontFamily: e.target.value })}
        disabled={isLocked}
      >
        <option value={'"UD Digi Kyokasho N-R", "UD デジタル 教科書体 N-R", "Yu Mincho", "MS Mincho", serif'}>UDデジタル教科書体</option>
        <option value={'"Yu Mincho", "MS Mincho", serif'}>明朝体</option>
        <option value={'"Yu Gothic", "MS Gothic", sans-serif'}>ゴシック体</option>
      </select>
    </Row>
  );

  const writingModeRow = 'writingMode' in block && (
    <Row label="文字の向き">
      <select
        className="select-input"
        value={(block as any).writingMode}
        onChange={e => onUpdate(block.id, { writingMode: e.target.value as any })}
        disabled={isLocked}
      >
        <option value="horizontal-tb">横書き</option>
        <option value="vertical-rl">縦書き</option>
      </select>
    </Row>
  );

  const fontSizeRow = 'fontSize' in block && (
    <Row label="文字サイズ">
      <input
        type="number"
        min={8}
        max={120}
        className="select-input"
        value={(block as any).fontSize}
        onChange={e => onUpdate(block.id, { fontSize: parseInt(e.target.value) || 16 })}
        disabled={isLocked}
      />
    </Row>
  );

  const sizeRow = (
    <>
      <Row label="幅 (px)">
        <input
          type="number"
          min={10}
          className="select-input"
          value={block.width}
          onChange={e => onUpdate(block.id, { width: parseInt(e.target.value) || block.width })}
          disabled={isLocked}
        />
      </Row>
      <Row label="高さ (px)">
        <input
          type="number"
          min={10}
          className="select-input"
          value={block.height}
          onChange={e => onUpdate(block.id, { height: parseInt(e.target.value) || block.height })}
          disabled={isLocked}
        />
      </Row>
    </>
  );

  const rowLabels = ['上段', '中段', '下段'] as const;
  const placementGrid = (
    <Row label="段配置（用紙を9分割）">
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px repeat(3, 1fr)',
        gridTemplateRows: '24px repeat(3, 1fr)',
        gap: '4px',
        fontSize: '11px',
      }}>
        <div />
        {['左', '中央', '右'].map(c => (
          <div key={c} style={{ textAlign: 'center', color: '#64748b' }}>{c}</div>
        ))}
        {[0, 1, 2].map(r => (
          <React.Fragment key={r}>
            <div style={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>{rowLabels[r]}</div>
            {[0, 1, 2].map(c => (
              <button
                key={c}
                className="btn"
                style={{ padding: '6px', justifyContent: 'center', minHeight: '32px' }}
                onClick={() => onPlaceInRegion(block.id, r as 0 | 1 | 2, c as 0 | 1 | 2)}
                title={`${rowLabels[r]}・${['左', '中央', '右'][c]}`}
                disabled={isLocked}
              >
                <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }} />
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
    </Row>
  );

  const alignRow = (
    <Row label="用紙基準で整列">
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => onAlign(block.id, 'left')} title="左揃え" disabled={isLocked}><AlignLeft size={14} /></button>
        <button className="btn" onClick={() => onAlign(block.id, 'center-h')} title="水平中央" disabled={isLocked}><AlignCenter size={14} /></button>
        <button className="btn" onClick={() => onAlign(block.id, 'right')} title="右揃え" disabled={isLocked}><AlignRight size={14} /></button>
        <button className="btn" onClick={() => onAlign(block.id, 'top')} title="上揃え" disabled={isLocked}><AlignStartVertical size={14} /></button>
        <button className="btn" onClick={() => onAlign(block.id, 'center-v')} title="垂直中央" disabled={isLocked}><AlignCenterVertical size={14} /></button>
        <button className="btn" onClick={() => onAlign(block.id, 'bottom')} title="下揃え" disabled={isLocked}><AlignEndVertical size={14} /></button>
      </div>
    </Row>
  );

  return (
    <aside className="sidebar sidebar-right no-print">
      <div className="sidebar-header">詳細設定 ({block.type})</div>
      <div className="sidebar-content">
        {operationRow}
        <hr style={{ margin: '16px 0', borderColor: 'var(--border-color)', borderWidth: '1px', borderStyle: 'solid' }} />

        <fieldset disabled={isLocked} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* type-specific */}
          {block.type === 'title' && (
            <>
              <Row label="テキスト">
                <textarea className="select-input" value={block.text}
                  onChange={e => onUpdate(block.id, { text: e.target.value })}
                />
              </Row>
              <Row label="配置">
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    className="btn"
                    style={{ flex: 1, backgroundColor: block.textAlign === 'left' ? '#e2e8f0' : 'white', justifyContent: 'center' }} 
                    onClick={() => onUpdate(block.id, { textAlign: 'left' })}
                    title={block.writingMode === 'vertical-rl' ? '上段' : '左寄せ'}
                  >
                    {block.writingMode === 'vertical-rl' ? '上段' : '左寄せ'}
                  </button>
                  <button 
                    className="btn"
                    style={{ flex: 1, backgroundColor: (!block.textAlign || block.textAlign === 'center') ? '#e2e8f0' : 'white', justifyContent: 'center' }} 
                    onClick={() => onUpdate(block.id, { textAlign: 'center' })}
                    title={block.writingMode === 'vertical-rl' ? '中段' : '中央'}
                  >
                    {block.writingMode === 'vertical-rl' ? '中段' : '中央'}
                  </button>
                  <button 
                    className="btn"
                    style={{ flex: 1, backgroundColor: block.textAlign === 'right' ? '#e2e8f0' : 'white', justifyContent: 'center' }} 
                    onClick={() => onUpdate(block.id, { textAlign: 'right' })}
                    title={block.writingMode === 'vertical-rl' ? '下段' : '右寄せ'}
                  >
                    {block.writingMode === 'vertical-rl' ? '下段' : '右寄せ'}
                  </button>
                </div>
              </Row>
              <Row label="太さ">
                <select className="select-input" value={block.fontWeight}
                  onChange={e => onUpdate(block.id, { fontWeight: e.target.value as any })}>
                  <option value="normal">標準</option>
                  <option value="bold">太字</option>
                </select>
              </Row>
              <Row label="色">
                <input type="color" value={block.color}
                  onChange={e => onUpdate(block.id, { color: e.target.value })}
                />
              </Row>
              <Row label="下線">
                <label style={{ fontSize: '13px' }}>
                  <input type="checkbox" checked={block.underline}
                    onChange={e => onUpdate(block.id, { underline: e.target.checked })}
                  /> あり
                </label>
              </Row>
            </>
          )}

          {block.type === 'nameBox' && (
            <Row label="テキスト">
              <textarea className="select-input" rows={3} value={block.text}
                onChange={e => onUpdate(block.id, { text: e.target.value })}
              />
            </Row>
          )}

          {block.type === 'goal' && (
            <>
              <Row label="見出し">
                <input className="select-input" value={block.title}
                  onChange={e => onUpdate(block.id, { title: e.target.value })}
                />
              </Row>
              <Row label="本文">
                <textarea className="select-input" rows={4} value={block.text}
                  onChange={e => onUpdate(block.id, { text: e.target.value })}
                />
              </Row>
              <Row label="枠線スタイル">
                <select className="select-input" value={block.frameStyle}
                  onChange={e => onUpdate(block.id, { frameStyle: e.target.value as any })}>
                  <option value="corner">コーナー（鉤括弧）</option>
                  <option value="solid">実線（黒）</option>
                  <option value="none">なし</option>
                </select>
              </Row>
              <Row label="見出しの文字サイズ">
                <input type="number" min={8} max={120} className="select-input" value={block.titleFontSize}
                  onChange={e => onUpdate(block.id, { titleFontSize: parseInt(e.target.value) || 18 })}
                />
              </Row>
            </>
          )}

          {block.type === 'notice' && (
            <>
              <Row label="見出し">
                <input className="select-input" value={block.title}
                  onChange={e => onUpdate(block.id, { title: e.target.value })}
                />
              </Row>
              <Row label="見出しの文字サイズ">
                <input type="number" min={8} max={120} className="select-input" value={block.titleFontSize}
                  onChange={e => onUpdate(block.id, { titleFontSize: parseInt(e.target.value) || 18 })}
                />
              </Row>
            </>
          )}

          {block.type === 'table' && (
            <>
              <Row label="行数">
                <input type="number" min={1} max={20} className="select-input" value={block.rows}
                  onChange={e => {
                    const rows = parseInt(e.target.value) || 1;
                    const newCellTexts = Array.from({ length: rows }, (_, r) =>
                      Array.from({ length: block.cols }, (_, c) => block.cellTexts[r]?.[c] || '')
                    );
                    const currentHeights = (block as any).rowHeights || Array(block.rows).fill(Math.round(block.height / block.rows));
                    const newRowHeights = Array.from({ length: rows }, (_, r) => currentHeights[r] || 80);
                    const newHeight = newRowHeights.reduce((sum, h) => sum + h, 0);
                    onUpdate(block.id, { rows, cellTexts: newCellTexts, rowHeights: newRowHeights, height: newHeight });
                  }}
                />
              </Row>
              <Row label="列数">
                <input type="number" min={1} max={20} className="select-input" value={block.cols}
                  onChange={e => {
                    const cols = parseInt(e.target.value) || 1;
                    const newCellTexts = Array.from({ length: block.rows }, (_, r) =>
                      Array.from({ length: cols }, (_, c) => block.cellTexts[r]?.[c] || '')
                    );
                    onUpdate(block.id, { cols, cellTexts: newCellTexts });
                  }}
                />
              </Row>
              <Row label="見出し背景色">
                <input type="color" value={block.headerBackground}
                  onChange={e => onUpdate(block.id, { headerBackground: e.target.value })}
                />
              </Row>
              <Row label="罫線の太さ">
                <input type="number" min={1} max={6} className="select-input" value={block.borderWidth}
                  onChange={e => onUpdate(block.id, { borderWidth: parseInt(e.target.value) || 1 })}
                />
              </Row>
              <Row label="各行の高さ (px)">
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  padding: '8px',
                  borderRadius: '4px',
                  backgroundColor: '#f9fafb'
                }}>
                  {Array.from({ length: block.rows }).map((_, r) => {
                    const rowHeights = (block as any).rowHeights || Array(block.rows).fill(Math.round(block.height / block.rows));
                    const rowHeight = rowHeights[r] || 80;
                    return (
                      <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', width: '45px', color: '#64748b' }}>{r + 1}行目:</span>
                        <input
                          type="number"
                          min={10}
                          className="select-input"
                          style={{ flex: 1, padding: '4px 8px', fontSize: '13px' }}
                          value={rowHeight}
                          onChange={e => {
                            const val = Math.max(10, parseInt(e.target.value) || 10);
                            const nextHeights = [...rowHeights];
                            nextHeights[r] = val;
                            const newHeight = nextHeights.reduce((sum, h) => sum + h, 0);
                            onUpdate(block.id, { rowHeights: nextHeights, height: newHeight });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </Row>
            </>
          )}

          {block.type === 'line' && (
            <>
              <Row label="方向">
                <select className="select-input" value={block.orientation}
                  onChange={e => onUpdate(block.id, { orientation: e.target.value as any })}>
                  <option value="horizontal">横線</option>
                  <option value="vertical">縦線</option>
                </select>
              </Row>
              <Row label="太さ">
                <input type="number" min={1} max={20} className="select-input" value={block.thickness}
                  onChange={e => onUpdate(block.id, { thickness: parseInt(e.target.value) || 1 })}
                />
              </Row>
              <Row label="色">
                <input type="color" value={block.color}
                  onChange={e => onUpdate(block.id, { color: e.target.value })}
                />
              </Row>
              <Row label="点線">
                <label style={{ fontSize: '13px' }}>
                  <input type="checkbox" checked={block.dashed}
                    onChange={e => onUpdate(block.id, { dashed: e.target.checked })}
                  /> 点線にする
                </label>
              </Row>
            </>
          )}

          {block.type === 'writeArea' && (
            <>
              <Row label="見出し">
                <input className="select-input" value={block.title}
                  onChange={e => onUpdate(block.id, { title: e.target.value })}
                />
              </Row>
              <Row label="本文">
                <textarea className="select-input" rows={4} value={block.text}
                  onChange={e => onUpdate(block.id, { text: e.target.value })}
                />
              </Row>
              <Row label="罫線を表示">
                <label style={{ fontSize: '13px' }}>
                  <input type="checkbox" checked={block.showLines}
                    onChange={e => onUpdate(block.id, { showLines: e.target.checked })}
                  /> あり
                </label>
              </Row>
              <Row label="行数">
                <input type="number" min={1} max={30} className="select-input" value={block.lineCount}
                  onChange={e => onUpdate(block.id, { lineCount: parseInt(e.target.value) || 1 })}
                />
              </Row>
              <Row label="見出しの文字サイズ">
                <input type="number" min={8} max={120} className="select-input" value={block.titleFontSize}
                  onChange={e => onUpdate(block.id, { titleFontSize: parseInt(e.target.value) || 14 })}
                />
              </Row>
              <Row label="背景の形式">
                <select className="select-input" value={block.backgroundType || 'none'}
                  onChange={e => onUpdate(block.id, { backgroundType: e.target.value as any })}>
                  <option value="none">なし</option>
                  <option value="grid">方眼罫</option>
                  <option value="manuscript">原稿用紙</option>
                </select>
              </Row>
            </>
          )}

          {block.type === 'image' && (
            <Row label="画像">
              <input type="file" accept="image/*" onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => onUpdate(block.id, { src: String(reader.result) });
                reader.readAsDataURL(f);
              }} />
              {block.src && (
                <button className="btn" onClick={() => onUpdate(block.id, { src: '' })}>画像を削除</button>
              )}
            </Row>
          )}

          {block.type === 'checkbox' && (
            <>
              <Row label="項目">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {block.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', gap: '4px' }}>
                      <input className="select-input" style={{ flex: 1 }} value={it.text}
                        onChange={e => {
                          const next = [...block.items];
                          next[i] = { ...next[i], text: e.target.value };
                          onUpdate(block.id, { items: next });
                        }}
                      />
                      <button className="btn" onClick={() => {
                        const next = block.items.filter((_, j) => j !== i);
                        onUpdate(block.id, { items: next });
                      }}><MinusIcon size={12} /></button>
                    </div>
                  ))}
                  <button className="btn" onClick={() => {
                    onUpdate(block.id, { items: [...block.items, { text: '新しい項目', checked: false }] });
                  }}><Plus size={12} /> 項目を追加</button>
                </div>
              </Row>
            </>
          )}

          {block.type === 'qrCode' && (
            <>
              <Row label="URL / テキスト">
                <input className="select-input" value={block.url}
                  onChange={e => onUpdate(block.id, { url: e.target.value })}
                />
              </Row>
              <Row label="キャプション">
                <input className="select-input" value={block.caption}
                  onChange={e => onUpdate(block.id, { caption: e.target.value })}
                />
              </Row>
            </>
          )}

          {block.type === 'shape' && (
            <>
              <Row label="図形の種類">
                <select className="select-input" value={block.shapeType}
                  onChange={e => onUpdate(block.id, { shapeType: e.target.value as any })}>
                  <option value="rectangle">四角形</option>
                  <option value="circle">円形</option>
                  <option value="triangle">三角形</option>
                  <option value="arrow">矢印</option>
                  <option value="callout">吹き出し</option>
                </select>
              </Row>
              <Row label="塗りつぶしの色">
                <input type="color" value={block.fillColor === 'transparent' ? '#ffffff' : block.fillColor}
                  onChange={e => onUpdate(block.id, { fillColor: e.target.value })}
                />
                <label style={{ fontSize: '12px', marginTop: '4px' }}>
                  <input type="checkbox" checked={block.fillColor === 'transparent'}
                    onChange={e => onUpdate(block.id, { fillColor: e.target.checked ? 'transparent' : '#ffffff' })}
                  /> 透明にする
                </label>
              </Row>
              <Row label="枠線の色">
                <input type="color" value={block.borderColor === 'transparent' ? '#000000' : block.borderColor}
                  onChange={e => onUpdate(block.id, { borderColor: e.target.value })}
                />
                <label style={{ fontSize: '12px', marginTop: '4px' }}>
                  <input type="checkbox" checked={block.borderColor === 'transparent'}
                    onChange={e => onUpdate(block.id, { borderColor: e.target.checked ? 'transparent' : '#000000' })}
                  /> なし
                </label>
              </Row>
              <Row label="枠線の太さ">
                <input type="number" min={0} max={20} className="select-input" value={block.borderWidth}
                  onChange={e => onUpdate(block.id, { borderWidth: parseInt(e.target.value) || 0 })}
                />
              </Row>
            </>
          )}

          {writingModeRow}
          {fontRow}
          {fontSizeRow}
          {sizeRow}
          {placementGrid}
          {alignRow}
          {getZIndexControls(isLocked)}
        </fieldset>
      </div>
    </aside>
  );
};

export default SidebarRight;
