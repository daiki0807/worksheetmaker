export type PaperSize = 'A4' | 'B4';
export type Orientation = 'portrait' | 'landscape';

export interface PaperSettings {
  size: PaperSize;
  orientation: Orientation;
}

export type BlockType =
  | 'title'
  | 'nameBox'
  | 'goal'
  | 'notice'
  | 'table'
  | 'line'
  | 'writeArea'
  | 'image'
  | 'checkbox'
  | 'qrCode'
  | 'shape';

export interface BaseBlock {
  id: string;
  type: BlockType;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  fontFamily?: string;
  selected?: boolean;
}

export interface TitleBlock extends BaseBlock {
  type: 'title';
  text: string;
  writingMode: 'horizontal-tb' | 'vertical-rl';
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  underline: boolean;
  textAlign?: 'left' | 'center' | 'right';
}

export interface NameBoxBlock extends BaseBlock {
  type: 'nameBox';
  text: string;
  writingMode: 'horizontal-tb' | 'vertical-rl';
  fontSize: number;
}

export interface GoalBlock extends BaseBlock {
  type: 'goal';
  title: string;
  text: string;
  writingMode: 'horizontal-tb' | 'vertical-rl';
  frameStyle: 'none' | 'corner' | 'solid';
  fontSize: number;
  titleFontSize: number;
}

export interface NoticeBlock extends BaseBlock {
  type: 'notice';
  title: string;
  writingMode: 'horizontal-tb' | 'vertical-rl';
  titleFontSize: number;
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  rows: number;
  cols: number;
  headerBackground: string;
  borderWidth: number;
  cellTexts: string[][];
}

export interface LineBlock extends BaseBlock {
  type: 'line';
  orientation: 'horizontal' | 'vertical';
  thickness: number;
  color: string;
  dashed: boolean;
}

export interface WriteAreaBlock extends BaseBlock {
  type: 'writeArea';
  title: string;
  text: string;
  showLines: boolean;
  lineCount: number;
  writingMode: 'horizontal-tb' | 'vertical-rl';
  fontSize: number;
  titleFontSize: number;
  backgroundType?: 'none' | 'grid' | 'manuscript';
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
}

export interface CheckboxBlock extends BaseBlock {
  type: 'checkbox';
  items: { text: string; checked: boolean }[];
  fontSize: number;
}

export interface QrCodeBlock extends BaseBlock {
  type: 'qrCode';
  url: string;
  caption: string;
}

export type ShapeType = 'circle' | 'rectangle' | 'triangle' | 'callout' | 'arrow';

export interface ShapeBlock extends BaseBlock {
  type: 'shape';
  shapeType: ShapeType;
  fillColor: string;
  borderColor: string;
  borderWidth: number;
}

export type WorksheetBlock =
  | TitleBlock
  | NameBoxBlock
  | GoalBlock
  | NoticeBlock
  | TableBlock
  | LineBlock
  | WriteAreaBlock
  | ImageBlock
  | CheckboxBlock
  | QrCodeBlock
  | ShapeBlock;

export interface WorksheetData {
  paper: PaperSettings;
  blocks: WorksheetBlock[];
  pageCount: number;
  currentPage: number;
  gridSnap: number;
}
