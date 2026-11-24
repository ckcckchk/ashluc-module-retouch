/**
 * The panel's words, in the three languages the studio ships.
 *
 * Labels are the beauty-app terms a person already knows (瘦臉 / Teeth), two to three characters,
 * because they render as tab rows, chip rows and slider labels in a 336 px column.
 */
import type { GroupId, LipShade, PresetId, SliderId } from './types';
export type Locale = 'en' | 'zh-HK' | 'zh-CN';
export interface Copy {
    title: string;
    lead: string;
    tabs: Record<GroupId, string>;
    sliders: Record<SliderId, string>;
    presets: Record<PresetId, string>;
    presetLabel: string;
    shadesLabel: string;
    shades: Record<LipShade, string>;
    compare: string;
    compareHint: string;
    rotate: string;
    flip: string;
    reset: string;
    restore: string;
    apply: string;
    applying: string;
    applied: string;
    neutral: string;
    hint: string;
    heal: {
        toggle: string;
        size: string;
        undo: string;
        clear: string;
        hint: string;
    };
    detect: {
        searching: string;
        none: string;
        failed: string;
        retry: string;
    };
    needFace: string;
    failed: string;
    needSource: string;
}
export declare const COPY: Record<Locale, Copy>;
