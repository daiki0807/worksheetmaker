const fs = require('fs');

let content = fs.readFileSync('src/hooks/useWorksheet.ts', 'utf-8');

// replace selectedId with selectedIds
content = content.replace(
  `const [selectedId, setSelectedId] = useState<string | null>(null);`,
  `const [selectedIds, setSelectedIds] = useState<string[]>([]);\n  const clipboardRef = useRef<WorksheetBlock[]>([]);`
);

// update addBlock
content = content.replace(
  /const defaultWritingH = 'horizontal-tb' as const;\n    let newBlock: WorksheetBlock;\n\n    switch \(type\) \{/s,
  `const defaultWritingH = 'horizontal-tb' as const;
    const nextZIndex = Math.max(0, ...data.blocks.map(b => b.zIndex || 0)) + 1;
    const defaultFont = '"UD Digi Kyokasho N-R", "UD デジタル 教科書体 N-R", "Yu Mincho", "MS Mincho", serif';
    let newBlock: WorksheetBlock;

    const baseProps = { id, pageIndex: data.currentPage, x: baseX, y: baseY, zIndex: nextZIndex, fontFamily: defaultFont };

    switch (type) {`
);

content = content.replace(
  `id, type: 'title', pageIndex: data.currentPage, x: baseX, y: baseY,`,
  `...baseProps, type: 'title',`
);
content = content.replace(
  `id, type: 'nameBox', pageIndex: data.currentPage, x: baseX, y: baseY,`,
  `...baseProps, type: 'nameBox',`
);
content = content.replace(
  `id, type: 'goal', pageIndex: data.currentPage, x: baseX, y: baseY,`,
  `...baseProps, type: 'goal',`
);
content = content.replace(
  `id, type: 'notice', pageIndex: data.currentPage, x: baseX, y: baseY,`,
  `...baseProps, type: 'notice',`
);
content = content.replace(
  `id, type: 'table', pageIndex: data.currentPage, x: baseX, y: baseY,`,
  `...baseProps, type: 'table',`
);
content = content.replace(
  `id, type: 'line', pageIndex: data.currentPage, x: baseX, y: baseY,`,
  `...baseProps, type: 'line',`
);
content = content.replace(
  `id, type: 'writeArea', pageIndex: data.currentPage, x: baseX, y: baseY,`,
  `...baseProps, type: 'writeArea',`
);
content = content.replace(
  `id, type: 'image', pageIndex: data.currentPage, x: baseX, y: baseY,`,
  `...baseProps, type: 'image',`
);
content = content.replace(
  `id, type: 'checkbox', pageIndex: data.currentPage, x: baseX, y: baseY,`,
  `...baseProps, type: 'checkbox',`
);
content = content.replace(
  `id, type: 'qrCode', pageIndex: data.currentPage, x: baseX, y: baseY,`,
  `...baseProps, type: 'qrCode',`
);

content = content.replace(
  `setData(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));\n    setSelectedId(id);`,
  `setData(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));\n    setSelectedIds([id]);`
);

content = content.replace(
  `const deleteBlock = (id: string) => {\n    setData(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== id) }));\n    if (selectedId === id) setSelectedId(null);\n  };`,
  `const deleteBlocks = (ids: string[]) => {\n    setData(prev => ({ ...prev, blocks: prev.blocks.filter(b => !ids.includes(b.id)) }));\n    setSelectedIds(prev => prev.filter(id => !ids.includes(id)));\n  };`
);

content = content.replace(
  `const duplicateBlock = (id: string) => {\n    const block = data.blocks.find(b => b.id === id);\n    if (!block) return;\n    const newId = uuidv4();\n    const newBlock = { ...block, id: newId, x: block.x + 20, y: block.y + 20 } as WorksheetBlock;\n    setData(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));\n    setSelectedId(newId);\n  };`,
  `const duplicateBlocks = (ids: string[]) => {\n    const newBlocks: WorksheetBlock[] = [];\n    const newIds: string[] = [];\n    ids.forEach(id => {\n      const block = data.blocks.find(b => b.id === id);\n      if (block) {\n        const newId = uuidv4();\n        newBlocks.push({ ...block, id: newId, x: block.x + 20, y: block.y + 20, zIndex: Math.max(0, ...data.blocks.map(b => b.zIndex || 0), ...newBlocks.map(b => b.zIndex || 0)) + 1 } as WorksheetBlock);\n        newIds.push(newId);\n      }\n    });\n    if (newBlocks.length === 0) return;\n    setData(prev => ({ ...prev, blocks: [...prev.blocks, ...newBlocks] }));\n    setSelectedIds(newIds);\n  };`
);

content = content.replace(
  `const selectBlock = (id: string | null) => setSelectedId(id);`,
  `const selectBlock = (id: string | null, multi = false) => {\n    if (id === null) {\n      setSelectedIds([]);\n    } else {\n      setSelectedIds(prev => multi ? (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) : [id]);\n    }\n  };`
);

content = content.replace(
  `setSelectedId(null);`,
  `setSelectedIds([]);`
);
content = content.replace(
  `setSelectedId(null);`,
  `setSelectedIds([]);`
);
content = content.replace(
  `setSelectedId(null);`,
  `setSelectedIds([]);`
);

content = content.replace(
  `updateBlock,\n    updateBlockTransient,\n    deleteBlock,\n    duplicateBlock,\n    selectBlock,`,
  `updateBlock,\n    updateBlockTransient,\n    deleteBlocks,\n    duplicateBlocks,\n    selectBlock,\n    copyBlocks,\n    pasteBlocks,\n    changeZIndex,`
);

// Add copy/paste/zIndex
const extraMethods = `
  const copyBlocks = (ids: string[]) => {
    clipboardRef.current = data.blocks.filter(b => ids.includes(b.id));
  };

  const pasteBlocks = () => {
    if (clipboardRef.current.length === 0) return;
    const newBlocks: WorksheetBlock[] = [];
    const newIds: string[] = [];
    let currentMaxZ = Math.max(0, ...data.blocks.map(b => b.zIndex || 0));
    
    clipboardRef.current.forEach(block => {
      const newId = uuidv4();
      currentMaxZ++;
      newBlocks.push({ ...block, id: newId, x: block.x + 20, y: block.y + 20, zIndex: currentMaxZ } as WorksheetBlock);
      newIds.push(newId);
    });
    
    setData(prev => ({ ...prev, blocks: [...prev.blocks, ...newBlocks] }));
    setSelectedIds(newIds);
  };

  const changeZIndex = (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => {
    setData(prev => {
      const blocks = [...prev.blocks];
      const targetIdx = blocks.findIndex(b => b.id === id);
      if (targetIdx === -1) return prev;
      
      const target = blocks[targetIdx];
      
      if (direction === 'front') {
        const maxZ = Math.max(0, ...blocks.map(b => b.zIndex || 0));
        target.zIndex = maxZ + 1;
      } else if (direction === 'back') {
        const minZ = Math.min(0, ...blocks.map(b => b.zIndex || 0));
        target.zIndex = minZ - 1;
      } else if (direction === 'forward') {
        target.zIndex = (target.zIndex || 0) + 1;
      } else if (direction === 'backward') {
        target.zIndex = (target.zIndex || 0) - 1;
      }
      return { ...prev, blocks };
    });
  };
`;

content = content.replace(`// ページング`, extraMethods + `\n  // ページング`);

content = content.replace(`selectedId,`, `selectedIds,`);

fs.writeFileSync('src/hooks/useWorksheet.ts', content);
