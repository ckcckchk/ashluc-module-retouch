import { type RetouchParams } from '../types';
import { type Copy, type Locale } from '../copy';
export interface RetouchResult {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    params: RetouchParams;
}
export type RetouchStatus = 'idle' | 'loading' | 'ready' | 'no-face' | 'failed';
export interface RetouchEditorProps {
    source: string;
    locale?: Locale;
    previewEdge?: number;
    onApply: (result: RetouchResult, params: RetouchParams) => void | Promise<void>;
    onParamsChange?: (params: RetouchParams) => void;
    copy?: Partial<Copy>;
    className?: string;
}
export declare function RetouchEditor({ source, locale, previewEdge, onApply, onParamsChange, copy, className, }: RetouchEditorProps): import("react").JSX.Element;
