/**
 * One slider row: label, live value, and a track that fills out from the centre.
 *
 * The centre is the untouched position, so the fill always reads as "how far from neutral", the
 * same gesture the panel's presets and Reset land on.
 */
import { useId, type ChangeEvent } from 'react';

interface SliderProps {
  label: string;
  value: number;
  /** Accessible name for the value chip that zeroes the slider. */
  zeroLabel: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function Slider({ label, value, zeroLabel, disabled = false, onChange }: SliderProps) {
  const id = useId();
  const position = ((value + 100) / 200) * 100;
  const from = Math.min(50, position);
  const to = Math.max(50, position);

  return (
    <div className="rt-field">
      <div className="rt-field__head">
        <label className="rt-field__label" htmlFor={id}>
          {label}
        </label>
        {value === 0 ? (
          <span className="rt-field__value">0</span>
        ) : (
          <button
            type="button"
            className="rt-field__value"
            data-on=""
            aria-label={`${zeroLabel} · ${label}`}
            onClick={() => onChange(0)}
            disabled={disabled}
          >
            {value > 0 ? `+${value}` : value}
          </button>
        )}
      </div>
      <div className="rt-range">
        <span className="rt-range__track" aria-hidden="true" />
        <span
          className="rt-range__fill"
          aria-hidden="true"
          style={{ left: `${from}%`, width: `${to - from}%` }}
        />
        <span className="rt-range__zero" aria-hidden="true" />
        <input
          id={id}
          className="rt-range__input"
          type="range"
          min={-100}
          max={100}
          step={1}
          value={value}
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))}
        />
      </div>
    </div>
  );
}
