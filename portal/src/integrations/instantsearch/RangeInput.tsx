import { useRange } from "react-instantsearch";
import { Slider } from "@base-ui/react/slider";

export function RangeInput({ attribute, label }: { attribute: string; label: string }) {
  const { start, range, refine } = useRange({ attribute });

  const min = start[0] !== -Infinity ? start[0] : (range.min ?? 0);
  const max = start[1] !== Infinity ? start[1] : (range.max ?? 100);

  return (
    <div className="text-sm">
      <p className="mb-2 font-medium">{label}</p>

      <Slider.Root
        value={[min as number, max as number]}
        min={range.min ?? 0}
        max={range.max ?? 100}
        step={1}
        minStepsBetweenValues={1}
        onValueCommitted={(value) => {
          if (Array.isArray(value)) {
            refine([value[0], value[1]]);
          }
        }}
      >
        <Slider.Control className="flex h-6 items-center">
          <Slider.Track className="relative h-1 w-full rounded-full bg-gray-200">
            <Slider.Indicator className="absolute h-full rounded-full bg-black" />

            <Slider.Thumb
              index={0}
              aria-label="Minimum value"
              className="block h-4 w-4 rounded-full border border-black bg-white shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-black/20"
            />

            <Slider.Thumb
              index={1}
              aria-label="Maximum value"
              className="block h-4 w-4 rounded-full border border-black bg-white shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-black/20"
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
