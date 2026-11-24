import type { HealStroke, RetouchParams } from '../types';
interface HealLayerProps {
    active: boolean;
    /** Brush radius as a fraction of the frame's short edge. */
    radius: number;
    rotate: RetouchParams['rotate'];
    flip: boolean;
    onStroke: (stroke: HealStroke) => void;
}
export declare function HealLayer({ active, radius, rotate, flip, onStroke }: HealLayerProps): import("react").JSX.Element;
export {};
