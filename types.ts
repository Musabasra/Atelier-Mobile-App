export interface Sketch {
  id: string;
  title: string;
  createdAt: string;
  thumbnail?: string; // Data URL
  status: 'Local Sketch' | 'Ready for Atelier Sync' | 'Synced';
}

export interface Project {
  id: string;
  name: string;
  sketches: Sketch[];
}

export type ToolType = 'brush' | 'eraser';

export interface DrawPoint {
  x: number;
  y: number;
  pressure: number;
}