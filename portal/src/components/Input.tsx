import { Input as BaseInput } from "@base-ui/react/input";

export function Input({
  onChange,
  onCommit,
  value,
  type,
  placeholder,
  size,
}: {
  onChange: (value: string) => void;
  onCommit?: (value: string) => void;
  value: string;
  type?: string;
  placeholder?: string;
  size?: "sm" | "lg";
}) {
  return (
    <BaseInput
      type={type ?? "text"}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      {...(onCommit
        ? {
            onBlur: (e) => onCommit?.(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") {
                onCommit?.(e.currentTarget.value);
                e.currentTarget.blur();
              }
            },
          }
        : {})}
      placeholder={placeholder ?? ""}
      className={`
        w-full 
        border 
        border-gray-200 
        bg-gray-50
        dark:border-gray-700
        dark:bg-gray-900
        ${size === "sm" ? "text-xs rounded-lg px-2.5 py-1.5" : "text-sm rounded-2xl px-3 py-2.5"}
        outline-none
        transition
        placeholder:text-gray-400
        focus:border-gray-400 
        focus:bg-white focus:ring-2 
        focus:ring-gray-100
        dark:placeholder:text-gray-500
        dark:focus:border-gray-500 
        dark:focus:bg-gray-950 
        dark:focus:ring-gray-800
      `}
    />
  );
}
