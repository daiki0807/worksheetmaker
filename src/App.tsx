import { useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useWorksheet } from './hooks/useWorksheet';
import Header from './components/Header';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Canvas from './components/Canvas';
import './App.css';

function App() {
  const worksheet = useWorksheet();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'ワークシート',
  });

  // キーボードショートカット
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const isEditable = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        worksheet.undo();
      } else if ((meta && e.key.toLowerCase() === 'z' && e.shiftKey) || (meta && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        worksheet.redo();
      } else if (meta && e.key.toLowerCase() === 'c' && worksheet.selectedIds.length > 0) {
        worksheet.copyBlocks(worksheet.selectedIds);
      } else if (meta && e.key.toLowerCase() === 'v') {
        worksheet.pasteBlocks();
      } else if (meta && e.key.toLowerCase() === 'd' && worksheet.selectedIds.length > 0) {
        e.preventDefault();
        worksheet.duplicateBlocks(worksheet.selectedIds);
      } else if (!isEditable && (e.key === 'Delete' || e.key === 'Backspace') && worksheet.selectedIds.length > 0) {
        e.preventDefault();
        worksheet.deleteBlocks(worksheet.selectedIds);
      } else if (!isEditable && worksheet.selectedIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        worksheet.selectedIds.forEach(id => {
          const b = worksheet.data.blocks.find(x => x.id === id);
          if (!b) return;
          if (e.key === 'ArrowUp') worksheet.updateBlock(b.id, { y: b.y - step });
          if (e.key === 'ArrowDown') worksheet.updateBlock(b.id, { y: b.y + step });
          if (e.key === 'ArrowLeft') worksheet.updateBlock(b.id, { x: b.x - step });
          if (e.key === 'ArrowRight') worksheet.updateBlock(b.id, { x: b.x + step });
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [worksheet]);

  const pageSize = `${worksheet.data.paper.size} ${worksheet.data.paper.orientation}`;

  return (
    <div className="app-container">
      <style>{`@page { size: ${pageSize}; margin: 0; }`}</style>
      <Header
        paper={worksheet.data.paper}
        updatePaper={worksheet.updatePaper}
        onPrint={() => handlePrint()}
        onUndo={worksheet.undo}
        onRedo={worksheet.redo}
        onExport={worksheet.exportJSON}
        onImport={worksheet.importJSON}
        onClear={worksheet.clearAll}
        pageCount={worksheet.data.pageCount}
        currentPage={worksheet.data.currentPage}
        onPrevPage={() => worksheet.setCurrentPage(Math.max(0, worksheet.data.currentPage - 1))}
        onNextPage={() => worksheet.setCurrentPage(Math.min(worksheet.data.pageCount - 1, worksheet.data.currentPage + 1))}
        onAddPage={worksheet.addPage}
        onRemovePage={() => worksheet.removePage(worksheet.data.currentPage)}
        gridSnap={worksheet.data.gridSnap}
        onGridSnapChange={worksheet.setGridSnap}
      />
      <div className="main-content">
        <SidebarLeft onAddBlock={worksheet.addBlock} onAddTemplate={worksheet.loadTemplate} />
        <div className="canvas-wrapper">
          <Canvas
            ref={printRef}
            data={worksheet.data}
            selectedIds={worksheet.selectedIds}
            onSelect={worksheet.selectBlock}
            onUpdate={worksheet.updateBlock}
            onDelete={(id) => worksheet.deleteBlocks([id])}
            onDuplicate={(id) => worksheet.duplicateBlocks([id])}
          />
        </div>
        <SidebarRight
          selectedIds={worksheet.selectedIds}
          blocks={worksheet.data.blocks}
          onUpdate={worksheet.updateBlock}
          onAlign={worksheet.alignBlock}
          onPlaceInRegion={worksheet.placeInRegion}
          onChangeZIndex={worksheet.changeZIndex}
        />
      </div>
    </div>
  );
}

export default App;
