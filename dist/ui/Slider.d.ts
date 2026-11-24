interface SliderProps {
    label: string;
    value: number;
    /** Accessible name for the value chip that zeroes the slider. */
    zeroLabel: string;
    disabled?: boolean;
    onChange: (value: number) => void;
}
export declare function Slider({ label, value, zeroLabel, disabled, onChange }: SliderProps): import("react").JSX.Element;
export {};
