import React, { useRef } from 'react';
import { Printer, Undo2, Redo2, Save, Upload, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaperSettings } from '../types';

interface HeaderProps {
  paper: PaperSettings;
  updatePaper: (settings: Partial<PaperSettings>) => void;
  onPrint: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onClear: () => void;
  pageCount: number;
  currentPage: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onAddPage: () => void;
  onRemovePage: () => void;
  gridSnap: number;
  onGridSnapChange: (n: number) => void;
}

const Header: React.FC<HeaderProps> = (p) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <header className="app-header no-print">
      <div className="header-title">先生のワークシートメーカー</div>
      <div className="header-controls">
        <button className="btn" onClick={p.onUndo} title="元に戻す (Ctrl+Z)">
          <Undo2 size={16} />
        </button>
        <button className="btn" onClick={p.onRedo} title="やり直し (Ctrl+Shift+Z)">
          <Redo2 size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button className="btn" onClick={p.onPrevPage} disabled={p.currentPage === 0}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: '13px', minWidth: '60px', textAlign: 'center' }}>
            {p.currentPage + 1} / {p.pageCount}
          </span>
          <button className="btn" onClick={p.onNextPage} disabled={p.currentPage === p.pageCount - 1}>
            <ChevronRight size={14} />
          </button>
          <button className="btn" onClick={p.onAddPage} title="ページ追加">
            <Plus size={14} />
          </button>
          <button className="btn" onClick={p.onRemovePage} title="現在のページを削除" disabled={p.pageCount <= 1}>
            <Trash2 size={14} />
          </button>
        </div>

        <select
          className="select-input"
          value={p.gridSnap}
          onChange={e => p.onGridSnapChange(parseInt(e.target.value))}
          title="グリッド吸着"
        >
          <option value={1}>グリッドなし</option>
          <option value={5}>5px</option>
          <option value={10}>10px</option>
          <option value={20}>20px</option>
        </select>

        <select
          className="select-input"
          value={p.paper.size}
          onChange={(e) => p.updatePaper({ size: e.target.value as any })}
        >
          <option value="A4">A4</option>
          <option value="B4">B4</option>
        </select>

        <select
          className="select-input"
          value={p.paper.orientation}
          onChange={(e) => p.updatePaper({ orientation: e.target.value as any })}
        >
          <option value="portrait">縦</option>
          <option value="landscape">横</option>
        </select>

        <button className="btn" onClick={p.onExport} title="JSON保存">
          <Save size={16} />
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()} title="JSON読み込み">
          <Upload size={16} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) p.onImport(f);
            e.target.value = '';
          }}
        />
        <button className="btn" onClick={p.onClear} title="全削除">
          <Trash2 size={16} />
        </button>

        <button className="btn btn-primary" onClick={p.onPrint}>
          <Printer size={16} />
          PDF出力
        </button>
      </div>
    </header>
  );
};

export default Header;
