import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { WorksheetData, WorksheetBlock, PaperSettings, BlockType, TableBlock } from '../types';

const STORAGE_KEY = 'worksheet-maker:data:v2';

const INITIAL_DATA: WorksheetData = {
  paper: { size: 'A4', orientation: 'landscape' },
  blocks: [],
  pageCount: 1,
  currentPage: 0,
  gridSnap: 1,
};

const loadInitial = (): WorksheetData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...INITIAL_DATA, ...parsed };
    }
  } catch {
    // ignore
  }
  return INITIAL_DATA;
};

export const useWorksheet = () => {
  const [data, setDataState] = useState<WorksheetData>(loadInitial);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const clipboardRef = useRef<WorksheetBlock[]>([]);

  // History
  const historyRef = useRef<{ past: WorksheetData[]; future: WorksheetData[] }>({ past: [], future: [] });
  const skipHistoryRef = useRef(false);

  // 保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data]);

  const setData = useCallback((updater: (prev: WorksheetData) => WorksheetData) => {
    setDataState(prev => {
      const next = updater(prev);
      if (!skipHistoryRef.current) {
        historyRef.current.past.push(prev);
        if (historyRef.current.past.length > 100) historyRef.current.past.shift();
        historyRef.current.future = [];
      }
      skipHistoryRef.current = false;
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (past.length === 0) return;
    const prev = past.pop()!;
    setDataState(current => {
      future.push(current);
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (future.length === 0) return;
    const next = future.pop()!;
    setDataState(current => {
      past.push(current);
      return next;
    });
  }, []);

  const updatePaper = (settings: Partial<PaperSettings>) => {
    setData(prev => ({ ...prev, paper: { ...prev.paper, ...settings } }));
  };

  const setGridSnap = (gridSnap: number) => {
    setData(prev => ({ ...prev, gridSnap }));
  };

  const addBlock = (type: BlockType) => {
    const id = uuidv4();
    const baseX = 50;
    const baseY = 50;
    const isPortrait = data.paper.orientation === 'portrait';
    const defaultWriting = isPortrait ? 'vertical-rl' : 'horizontal-tb';
    const defaultWritingH = 'horizontal-tb' as const;
    const nextZIndex = Math.max(0, ...data.blocks.map(b => b.zIndex || 0)) + 1;
    const defaultFont = '"UD Digi Kyokasho N-R", "UD デジタル 教科書体 N-R", "Yu Mincho", "MS Mincho", serif';
    let newBlock: WorksheetBlock;

    const baseProps = { id, pageIndex: data.currentPage, x: baseX, y: baseY, zIndex: nextZIndex, fontFamily: defaultFont };

    switch (type) {
      case 'title':
        newBlock = {
          ...baseProps, type: 'title',
          width: isPortrait ? 80 : 600, height: isPortrait ? 400 : 80,
          text: '新しいタイトル', writingMode: defaultWriting, fontSize: 32, fontWeight: 'bold',
          color: '#000000', underline: false, textAlign: 'center',
        };
        break;
      case 'nameBox':
        newBlock = {
          ...baseProps, type: 'nameBox',
          width: isPortrait ? 140 : 420, height: isPortrait ? 420 : 90,
          text: isPortrait ? '（　　）年（　　）組\n名前（　　　　　　　　　）' : '（　　）年（　　）組　　名前（　　　　　　　　　　）',
          writingMode: defaultWriting, fontSize: 16,
        };
        break;
      case 'goal':
        newBlock = {
          ...baseProps, type: 'goal',
          width: 700, height: 200,
          title: 'めあて', text: '', writingMode: defaultWritingH, frameStyle: 'corner', fontSize: 18, titleFontSize: 18,
        };
        break;
      case 'notice':
        newBlock = {
          ...baseProps, type: 'notice',
          width: 120, height: 400, title: '気づいたこと', writingMode: defaultWriting, titleFontSize: 18,
        };
        break;
      case 'table':
        newBlock = {
          ...baseProps, type: 'table',
          width: 400, height: 300, rows: 3, cols: 3,
          headerBackground: '#f3f4f6', borderWidth: 1,
          cellTexts: Array(3).fill(null).map(() => Array(3).fill('')),
          rowHeights: [100, 100, 100],
        };
        break;
      case 'line':
        newBlock = {
          ...baseProps, type: 'line',
          width: 400, height: 4, orientation: 'horizontal',
          thickness: 2, color: '#000000', dashed: false,
        };
        break;
      case 'writeArea':
        newBlock = {
          ...baseProps, type: 'writeArea',
          width: 600, height: 300, title: '考えたこと', text: '',
          showLines: true, lineCount: 6, writingMode: defaultWritingH, fontSize: 16, titleFontSize: 14,
        };
        break;
      case 'image':
        newBlock = {
          ...baseProps, type: 'image',
          width: 200, height: 200, src: '',
        };
        break;
      case 'checkbox':
        newBlock = {
          ...baseProps, type: 'checkbox',
          width: 300, height: 180, fontSize: 16,
          items: [
            { text: '項目1', checked: false },
            { text: '項目2', checked: false },
            { text: '項目3', checked: false },
          ],
        };
        break;
      case 'shape':
        newBlock = {
          ...baseProps, type: 'shape',
          width: 100, height: 100,
          shapeType: 'rectangle', fillColor: 'transparent', borderColor: '#000000', borderWidth: 2,
        };
        break;
      case 'qrCode':
        newBlock = {
          ...baseProps, type: 'qrCode',
          width: 160, height: 190, url: 'https://example.com', caption: '',
        };
        break;
      default:
        return;
    }

    setData(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
    setSelectedIds([id]);
  };

  const updateBlock = (id: string, updates: Partial<WorksheetBlock>) => {
    setData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => {
        if (b.id === id) {
          const merged = { ...b, ...updates } as WorksheetBlock;
          // テーブルブロックで高さが更新され、かつ rowHeights が updates に含まれていない場合
          if (merged.type === 'table' && updates.height !== undefined && updates.height !== b.height && !('rowHeights' in updates)) {
            const table = b as TableBlock;
            const oldHeight = table.height;
            const newHeight = updates.height;
            const currentHeights = table.rowHeights || Array(table.rows).fill(Math.round(oldHeight / table.rows));
            if (oldHeight > 0) {
              const ratio = newHeight / oldHeight;
              let newRowHeights = currentHeights.map(h => Math.round(h * ratio));
              const sum = newRowHeights.reduce((s, val) => s + val, 0);
              const diff = newHeight - sum;
              if (newRowHeights.length > 0) {
                newRowHeights[newRowHeights.length - 1] += diff;
              }
              (merged as TableBlock).rowHeights = newRowHeights;
            }
          }
          return merged;
        }
        return b;
      }),
    }));
  };

  const updateBlockTransient = (id: string, updates: Partial<WorksheetBlock>) => {
    skipHistoryRef.current = true;
    updateBlock(id, updates);
  };

  const deleteBlocks = (ids: string[]) => {
    setData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => !(ids.includes(b.id) && !b.isLocked))
    }));
    setSelectedIds(prev => prev.filter(id => {
      const b = data.blocks.find(x => x.id === id);
      return b?.isLocked || false;
    }));
  };

  const duplicateBlocks = (ids: string[]) => {
    let nextZIndex = Math.max(0, ...data.blocks.map(b => b.zIndex || 0));
    const newBlocks: WorksheetBlock[] = [];
    const newIds: string[] = [];
    const groupMapping: { [oldId: string]: string } = {};

    ids.forEach(id => {
      const block = data.blocks.find(b => b.id === id);
      if (block) {
        const newId = uuidv4();
        nextZIndex++;

        let newGroupId = block.groupId;
        if (block.groupId) {
          if (!groupMapping[block.groupId]) {
            groupMapping[block.groupId] = uuidv4();
          }
          newGroupId = groupMapping[block.groupId];
        }

        // コピーはロック解除状態で生成
        const { isLocked: _, ...rest } = block;

        newBlocks.push({
          ...rest,
          id: newId,
          x: block.x + 20,
          y: block.y + 20,
          zIndex: nextZIndex,
          groupId: newGroupId
        } as WorksheetBlock);
        newIds.push(newId);
      }
    });
    if (newBlocks.length === 0) return;
    setData(prev => ({ ...prev, blocks: [...prev.blocks, ...newBlocks] }));
    setSelectedIds(newIds);
  };

  const selectBlock = (id: string | null, multi = false) => {
    if (id === null) {
      setSelectedIds([]);
      return;
    }

    const clickedBlock = data.blocks.find(b => b.id === id);
    if (!clickedBlock) return;

    let idsToAdd: string[] = [id];
    if (clickedBlock.groupId) {
      idsToAdd = data.blocks
        .filter(b => b.groupId === clickedBlock.groupId && b.pageIndex === data.currentPage)
        .map(b => b.id);
    }

    setSelectedIds(prev => {
      if (multi) {
        const hasAny = idsToAdd.some(x => prev.includes(x));
        if (hasAny) {
          return prev.filter(x => !idsToAdd.includes(x));
        } else {
          return [...prev, ...idsToAdd];
        }
      } else {
        return idsToAdd;
      }
    });
  };

  const copyBlocks = (ids: string[]) => {
    clipboardRef.current = data.blocks.filter(b => ids.includes(b.id));
  };

  const pasteBlocks = () => {
    if (clipboardRef.current.length === 0) return;
    let nextZIndex = Math.max(0, ...data.blocks.map(b => b.zIndex || 0));
    const newBlocks: WorksheetBlock[] = [];
    const newIds: string[] = [];
    const groupMapping: { [oldId: string]: string } = {};

    clipboardRef.current.forEach(block => {
      const newId = uuidv4();
      nextZIndex++;

      let newGroupId = block.groupId;
      if (block.groupId) {
        if (!groupMapping[block.groupId]) {
          groupMapping[block.groupId] = uuidv4();
        }
        newGroupId = groupMapping[block.groupId];
      }

      // 貼り付けはロック解除状態で生成
      const { isLocked: _, ...rest } = block;

      newBlocks.push({
        ...rest,
        id: newId,
        x: block.x + 20,
        y: block.y + 20,
        zIndex: nextZIndex,
        groupId: newGroupId
      } as WorksheetBlock);
      newIds.push(newId);
    });

    setData(prev => ({ ...prev, blocks: [...prev.blocks, ...newBlocks] }));
    setSelectedIds(newIds);
  };

  const groupBlocks = (ids: string[]) => {
    if (ids.length <= 1) return;
    const newGroupId = uuidv4();
    setData(prev => {
      const blocks = prev.blocks.map(b => {
        if (ids.includes(b.id)) {
          return { ...b, groupId: newGroupId } as WorksheetBlock;
        }
        return b;
      });
      return { ...prev, blocks };
    });
  };

  const ungroupBlocks = (ids: string[]) => {
    setData(prev => {
      const groupIdsToClear = new Set<string>();
      prev.blocks.forEach(b => {
        if (ids.includes(b.id) && b.groupId) {
          groupIdsToClear.add(b.groupId);
        }
      });
      if (groupIdsToClear.size === 0) return prev;
      const blocks = prev.blocks.map(b => {
        if (b.groupId && groupIdsToClear.has(b.groupId)) {
          const updated = { ...b };
          delete updated.groupId;
          return updated as WorksheetBlock;
        }
        return b;
      });
      return { ...prev, blocks };
    });
  };

  const changeZIndex = (ids: string[], direction: 'front' | 'back' | 'forward' | 'backward') => {
    setData(prev => {
      const blocks = [...prev.blocks];
      const maxZ = Math.max(0, ...blocks.map(b => b.zIndex || 0));
      const minZ = Math.min(0, ...blocks.map(b => b.zIndex || 0));
      
      blocks.forEach(target => {
        if (!ids.includes(target.id)) return;
        if (direction === 'front') {
          target.zIndex = maxZ + 1;
        } else if (direction === 'back') {
          target.zIndex = minZ - 1;
        } else if (direction === 'forward') {
          target.zIndex = (target.zIndex || 0) + 1;
        } else if (direction === 'backward') {
          target.zIndex = (target.zIndex || 0) - 1;
        }
      });
      return { ...prev, blocks };
    });
  };

  // ページング
  const addPage = () => {
    setData(prev => ({ ...prev, pageCount: prev.pageCount + 1, currentPage: prev.pageCount }));
  };

  const removePage = (index: number) => {
    setData(prev => {
      if (prev.pageCount <= 1) return prev;
      const newBlocks = prev.blocks
        .filter(b => b.pageIndex !== index)
        .map(b => b.pageIndex > index ? { ...b, pageIndex: b.pageIndex - 1 } as WorksheetBlock : b);
      const newCount = prev.pageCount - 1;
      const newCurrent = Math.min(prev.currentPage, newCount - 1);
      return { ...prev, blocks: newBlocks, pageCount: newCount, currentPage: newCurrent };
    });
  };

  const setCurrentPage = (idx: number) => {
    setDataState(prev => ({ ...prev, currentPage: idx }));
    setSelectedIds([]);
  };

  // 整列（用紙基準）
  const alignBlock = (id: string, mode: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    const PAPER = { A4: { width: 794, height: 1123 }, B4: { width: 971, height: 1376 } } as const;
    const base = PAPER[data.paper.size];
    const pw = data.paper.orientation === 'portrait' ? base.width : base.height;
    const ph = data.paper.orientation === 'portrait' ? base.height : base.width;
    const block = data.blocks.find(b => b.id === id);
    if (!block) return;
    const updates: Partial<WorksheetBlock> = {};
    switch (mode) {
      case 'left': updates.x = 0; break;
      case 'center-h': updates.x = Math.round((pw - block.width) / 2); break;
      case 'right': updates.x = pw - block.width; break;
      case 'top': updates.y = 0; break;
      case 'center-v': updates.y = Math.round((ph - block.height) / 2); break;
      case 'bottom': updates.y = ph - block.height; break;
    }
    updateBlock(id, updates);
  };

  // 用紙の9分割位置に配置（上中下 x 左中右）
  const placeInRegion = (id: string, row: 0 | 1 | 2, col: 0 | 1 | 2) => {
    const PAPER = { A4: { width: 794, height: 1123 }, B4: { width: 971, height: 1376 } } as const;
    const base = PAPER[data.paper.size];
    const pw = data.paper.orientation === 'portrait' ? base.width : base.height;
    const ph = data.paper.orientation === 'portrait' ? base.height : base.width;
    const block = data.blocks.find(b => b.id === id);
    if (!block) return;
    const regionW = pw / 3;
    const regionH = ph / 3;
    const cx = regionW * col + regionW / 2;
    const cy = regionH * row + regionH / 2;
    let x = Math.round(cx - block.width / 2);
    let y = Math.round(cy - block.height / 2);
    x = Math.max(0, Math.min(pw - block.width, x));
    y = Math.max(0, Math.min(ph - block.height, y));
    updateBlock(id, { x, y });
  };

  // エクスポート / インポート
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worksheet-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(String(e.target?.result));
        setData(() => ({ ...INITIAL_DATA, ...parsed }));
        setSelectedIds([]);
      } catch (err) {
        alert('JSONの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  };

  const loadTemplate = (templateId: 'math' | 'japanese') => {
    if (!confirm('現在の編集内容が消去されます。テンプレートを読み込みますか？（元に戻すで復元可能）')) return;
    const defaultFont = '"UD Digi Kyokasho N-R", "UD デジタル 教科書体 N-R", "Yu Mincho", "MS Mincho", serif';
    
    if (templateId === 'math') {
      setData(() => ({
        ...INITIAL_DATA,
        paper: { size: 'A4', orientation: 'landscape' },
        blocks: [
          { id: uuidv4(), type: 'title', pageIndex: 0, x: 260, y: 50, width: 300, height: 60, text: 'さんすう プリント', writingMode: 'horizontal-tb', fontSize: 32, fontWeight: 'bold', color: '#000000', underline: false, textAlign: 'center', zIndex: 1, fontFamily: defaultFont },
          { id: uuidv4(), type: 'nameBox', pageIndex: 0, x: 550, y: 50, width: 200, height: 60, text: '　年　組\n名前', writingMode: 'horizontal-tb', fontSize: 16, zIndex: 2, fontFamily: defaultFont },
          { id: uuidv4(), type: 'goal', pageIndex: 0, x: 50, y: 130, width: 700, height: 100, title: 'めあて', text: '', writingMode: 'horizontal-tb', frameStyle: 'corner', fontSize: 18, titleFontSize: 18, zIndex: 3, fontFamily: defaultFont },
          { id: uuidv4(), type: 'writeArea', pageIndex: 0, x: 50, y: 250, width: 700, height: 400, title: 'もんだい', text: '', showLines: false, lineCount: 1, writingMode: 'horizontal-tb', fontSize: 16, titleFontSize: 18, zIndex: 4, fontFamily: defaultFont },
          { id: uuidv4(), type: 'writeArea', pageIndex: 0, x: 50, y: 670, width: 700, height: 200, title: 'ふりかえり', text: '', showLines: true, lineCount: 3, writingMode: 'horizontal-tb', fontSize: 16, titleFontSize: 18, zIndex: 5, fontFamily: defaultFont },
        ]
      }));
    } else if (templateId === 'japanese') {
      setData(() => ({
        ...INITIAL_DATA,
        paper: { size: 'B4', orientation: 'landscape' },
        blocks: [
          { id: uuidv4(), type: 'title', pageIndex: 0, x: 800, y: 50, width: 80, height: 400, text: '国語ワークシート', writingMode: 'vertical-rl', fontSize: 32, fontWeight: 'bold', color: '#000000', underline: false, textAlign: 'center', zIndex: 1, fontFamily: defaultFont },
          { id: uuidv4(), type: 'nameBox', pageIndex: 0, x: 800, y: 500, width: 140, height: 420, text: '（　）年（　）組\n名前（　　　　　）', writingMode: 'vertical-rl', fontSize: 16, zIndex: 2, fontFamily: defaultFont },
          { id: uuidv4(), type: 'goal', pageIndex: 0, x: 600, y: 50, width: 150, height: 800, title: 'めあて', text: '', writingMode: 'vertical-rl', frameStyle: 'corner', fontSize: 18, titleFontSize: 18, zIndex: 3, fontFamily: defaultFont },
          { id: uuidv4(), type: 'writeArea', pageIndex: 0, x: 50, y: 50, width: 500, height: 800, title: '考えたこと', text: '', showLines: true, lineCount: 8, writingMode: 'vertical-rl', backgroundType: 'manuscript', fontSize: 16, titleFontSize: 18, zIndex: 4, fontFamily: defaultFont },
        ]
      }));
    }
    setSelectedIds([]);
  };

  const clearAll = () => {
    if (!confirm('すべて削除しますか？（元に戻すで復元可能）')) return;
    setData(() => INITIAL_DATA);
    setSelectedIds([]);
  };

  return {
    data,
    selectedIds,
    updatePaper,
    setGridSnap,
    addBlock,
    updateBlock,
    updateBlockTransient,
    deleteBlocks,
    duplicateBlocks,
    selectBlock,
    copyBlocks,
    pasteBlocks,
    changeZIndex,
    undo,
    redo,
    canUndo: historyRef.current.past.length > 0,
    canRedo: historyRef.current.future.length > 0,
    addPage,
    removePage,
    setCurrentPage,
    alignBlock,
    placeInRegion,
    exportJSON,
    importJSON,
    clearAll,
    loadTemplate,
    groupBlocks,
    ungroupBlocks,
  };
};
