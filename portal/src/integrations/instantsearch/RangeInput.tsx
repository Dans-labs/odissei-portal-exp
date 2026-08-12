import { useEffect, useState } from "react";
import { useRange } from "react-instantsearch";
import { Slider } from "@base-ui/react/slider";
import { Input } from "#/components/Input";

const thumbClassName =
  "block h-3 w-3 rounded-full border-2 border-cyan-600 bg-white shadow-sm outline-none transition data-dragging:scale-115 cursor-grab data-dragging:cursor-grabbing";

export function RangeInput({ attribute, label }: { attribute: string; label?: string }) {
  const { start, range, refine } = useRange({ attribute });

  const min = range.min ?? 0;
  const max = range.max ?? 100;

  const committedMin = (start[0] !== -Infinity ? start[0] : min) as number;
  const committedMax = (start[1] !== Infinity ? start[1] : max) as number;

  const [value, setValue] = useState<[number, number]>([committedMin, committedMax]);
  const [inputText, setInputText] = useState<[string, string]>([
    String(committedMin),
    String(committedMax),
  ]);

  // Keep local state in sync when the refinement changes from outside
  // this component (cleared filters, different results, etc).
  useEffect(() => {
    setValue([committedMin, committedMax]);
    setInputText([String(committedMin), String(committedMax)]);
  }, [committedMin, committedMax]);

  function commit(next: [number, number]) {
    setValue(next);
    refine(next);
  }

  function handleInputChange(index: 0 | 1, text: string) {
    setInputText((prev) => {
      const next: [string, string] = [...prev] as [string, string];
      next[index] = text;
      return next;
    });
  }

  function handleInputCommit(index: 0 | 1, text: string) {
    const parsed = Number(text);
    if (text.trim() === "" || Number.isNaN(parsed)) {
      // revert to last good value if the field was left invalid/empty
      setInputText([String(value[0]), String(value[1])]);
      return;
    }

    const raw: [number, number] = [...value] as [number, number];
    raw[index] = parsed;

    // clamp: keep min <= max, and both inside the facet's [min, max]
    const clampedMin = Math.max(min, Math.min(raw[0], raw[1]));
    const clampedMax = Math.min(max, Math.max(raw[0], raw[1]));
    const safe: [number, number] = [clampedMin, clampedMax];

    setInputText([String(safe[0]), String(safe[1])]);
    commit(safe);
  }

  return (
    <div className="text-sm">
      {label && <p className="mb-2 font-medium">{label}</p>}

      <Slider.Root
        value={value}
        min={min}
        max={max}
        step={1}
        minStepsBetweenValues={1}
        onValueChange={(newValue) => {
          if (Array.isArray(newValue)) {
            const next: [number, number] = [newValue[0], newValue[1]];
            setValue(next);
            setInputText([String(next[0]), String(next[1])]);
          }
        }}
        onValueCommitted={(newValue) => {
          if (Array.isArray(newValue)) {
            commit([newValue[0], newValue[1]]);
          }
        }}
      >
        <Slider.Control className="flex h-6 items-center px-2">
          <Slider.Track className="relative h-1 w-full rounded-full bg-gray-200">
            <Slider.Indicator className="absolute h-full rounded-full bg-cyan-400" />

            <Slider.Thumb index={0} aria-label="Minimum value" className={thumbClassName} />

            <Slider.Thumb index={1} aria-label="Maximum value" className={thumbClassName} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <div className="mt-2 flex items-center justify-between gap-2">
        <Input
          type="number"
          size="sm"
          value={inputText[0]}
          onChange={(text) => handleInputChange(0, text)}
          onCommit={(text) => handleInputCommit(0, text)}
          placeholder={String(min)}
        />
        <span className="text-gray-400">–</span>
        <Input
          type="number"
          size="sm"
          value={inputText[1]}
          onChange={(text) => handleInputChange(1, text)}
          onCommit={(text) => handleInputCommit(1, text)}
          placeholder={String(max)}
        />
      </div>
    </div>
  );
}
