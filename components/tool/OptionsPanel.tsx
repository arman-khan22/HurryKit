'use client';
import { useState } from 'react';
import type { Tool, Option } from '@/registry/schema';

type Props = {
  tool: Tool;
  options: Record<string, string | number | boolean>;
  onChange: (key: string, value: string | number | boolean) => void;
  disabled?: boolean;
};

export function OptionsPanel({ tool, options, onChange, disabled }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const basicOptions = tool.options.filter((o) => !o.advanced);
  const advancedOptions = tool.options.filter((o) => o.advanced);

  if (tool.options.length === 0) return null;

  return (
    <div
      className={`card border border-[var(--border)] transition-opacity ${
        disabled ? 'opacity-60 pointer-events-none' : ''
      }`}
      aria-label={`Options for ${tool.seo.primary}`}
    >
      <fieldset>
        <legend className="text-sm font-bold text-[var(--text)] mb-3.5">
          Options
        </legend>

        {/* Primary / Basic options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {basicOptions.map((opt) => (
            <OptionControl
              key={opt.id}
              opt={opt}
              value={options[opt.id] ?? opt.default}
              onChange={(v) => onChange(opt.id, v)}
            />
          ))}
        </div>

        {/* Advanced collapsible section */}
        {advancedOptions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              aria-expanded={showAdvanced}
              aria-controls={`advanced-opts-${tool.id}`}
              className="text-xs sm:text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-2 py-1 transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="transition-transform duration-200"
                style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none' }}
              >
                <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{showAdvanced ? 'Hide advanced options' : 'Advanced options'}</span>
            </button>

            {showAdvanced && (
              <div
                id={`advanced-opts-${tool.id}`}
                className="mt-3.5 pt-1 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in"
              >
                {advancedOptions.map((opt) => (
                  <OptionControl
                    key={opt.id}
                    opt={opt}
                    value={options[opt.id] ?? opt.default}
                    onChange={(v) => onChange(opt.id, v)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </fieldset>
    </div>
  );
}

function OptionControl({
  opt,
  value,
  onChange,
}: {
  opt: Option;
  value: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
}) {
  const inputId = `opt-${opt.id}`;

  const formatUnit = (val: number | string | boolean): string => {
    if (typeof val !== 'number') return String(val);
    if (opt.id === 'quality') return `${val}%`;
    if (opt.id === 'fps') return `${val} fps`;
    if (opt.id === 'audio-bitrate' || opt.id === 'video-bitrate') return `${val} kbps`;
    return String(val);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={inputId} className="text-xs sm:text-sm font-medium text-[var(--text)]">
          {opt.label}
        </label>
        {opt.type === 'slider' && (
          <span
            className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatUnit(value)}
          </span>
        )}
      </div>

      {opt.type === 'select' && opt.choices && (
        <select
          id={inputId}
          value={String(value)}
          onChange={(e) => {
            const choice = opt.choices?.find((c) => String(c.value) === e.target.value);
            onChange(choice?.value ?? e.target.value);
          }}
          className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] transition-shadow"
        >
          {opt.choices.map((c) => (
            <option key={String(c.value)} value={String(c.value)}>
              {c.label}
            </option>
          ))}
        </select>
      )}

      {opt.type === 'slider' && (
        <input
          id={inputId}
          type="range"
          min={opt.min ?? 0}
          max={opt.max ?? 100}
          step={opt.step ?? 1}
          value={typeof value === 'number' ? value : Number(opt.default)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-[var(--video)] cursor-pointer"
          aria-valuemin={opt.min ?? 0}
          aria-valuemax={opt.max ?? 100}
          aria-valuenow={typeof value === 'number' ? value : Number(opt.default)}
        />
      )}

      {opt.type === 'toggle' && (
        <div className="flex items-center gap-3 pt-1">
          <button
            id={inputId}
            type="button"
            role="switch"
            aria-checked={Boolean(value)}
            onClick={() => onChange(!Boolean(value))}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-2 ${
              value ? 'bg-[var(--video)]' : 'bg-[var(--border)]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                value ? 'translate-x-5' : 'translate-x-0'
              }`}
              aria-hidden="true"
            />
          </button>
          {opt.help && (
            <span className="text-xs text-[var(--muted)] leading-tight">{opt.help}</span>
          )}
        </div>
      )}

      {opt.help && opt.type !== 'toggle' && (
        <p className="text-[11px] text-[var(--muted)] mt-1">{opt.help}</p>
      )}
    </div>
  );
}
