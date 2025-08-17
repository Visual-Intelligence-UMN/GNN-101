export type NodeDatum = {
  id: number;
  element: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
};

export type LinkDatum = {
  source: number; // store ids; d3 will replace with objects during sim
  target: number;
  attr?: any;
};

export type HoverState =
  | { kind: "node"; nodeId: number }
  | { kind: "edge"; a: number; b: number }
  | null;