export interface GenerateOptions {
  mode?: "skeleton" | "skeleton-texts";
  duration?: number;
  delay?: number;
  steps?: string[];
  done?: string;
  code?: string[];
  title?: string;
  maxParts?: number;
  keys?: number;
  onDone?: (el: Element) => void;
}
export interface GenerateRun { finished: Promise<void>; cancel: () => void; element: Element }
export function generate(el: Element, options?: GenerateOptions): GenerateRun;
export function auto(root?: ParentNode): void;
