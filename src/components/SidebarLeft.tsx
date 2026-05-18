import React from 'react';
import { Type, SquareUser, Target, MessageSquare, Table, Minus, NotebookPen, Image as ImageIcon, CheckSquare, QrCode } from 'lucide-react';
import type { BlockType } from '../types';

interface SidebarLeftProps {
  onAddBlock: (type: BlockType) => void;
  onAddTemplate?: (templateId: 'math' | 'japanese') => void;
}

const SidebarLeft: React.FC<SidebarLeftProps> = ({ onAddBlock, onAddTemplate }) => {
  const parts: { type: BlockType; label: string; icon: React.ReactNode }[] = [
    { type: 'title', label: 'タイトル', icon: <Type size={18} /> },
    { type: 'nameBox', label: '名前欄', icon: <SquareUser size={18} /> },
    { type: 'goal', label: 'めあて欄', icon: <Target size={18} /> },
    { type: 'notice', label: '気づいたこと', icon: <MessageSquare size={18} /> },
    { type: 'writeArea', label: '記述欄', icon: <NotebookPen size={18} /> },
    { type: 'table', label: '表（比較・整理）', icon: <Table size={18} /> },
    { type: 'line', label: '罫線', icon: <Minus size={18} /> },
    { type: 'checkbox', label: 'チェックリスト', icon: <CheckSquare size={18} /> },
    { type: 'image', label: '画像', icon: <ImageIcon size={18} /> },
    { type: 'qrCode', label: 'QRコード', icon: <QrCode size={18} /> },
    { type: 'shape', label: '図形', icon: <div style={{width: 18, height: 18, border: '2px solid currentColor', borderRadius: '50%'}} /> },
  ];

  return (
    <aside className="sidebar no-print">
      <div className="sidebar-header">パーツを追加</div>
      <div className="sidebar-content">
        {parts.map((part) => (
          <button
            key={part.type}
            className="btn"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => onAddBlock(part.type)}
          >
            {part.icon}
            {part.label}
          </button>
        ))}
      </div>
      <div className="sidebar-header" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', borderBottom: 'none' }}>テンプレート</div>
      <div className="sidebar-content" style={{ paddingTop: 0 }}>
        <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onAddTemplate?.('japanese')}>国語ワークシート</button>
        <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onAddTemplate?.('math')}>算数プリント</button>
      </div>
    </aside>
  );
};

export default SidebarLeft;
