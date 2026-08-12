// ThemeSwitch.tsx
import { ComputerDesktopIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { Toggle } from "@base-ui/react/toggle";
import { Button } from "@base-ui/react";
import { useTheme } from "./ThemeProvider";
import { m } from "@/paraglide/messages";
import { useEffect, useState } from "react";
import { cn } from "#/utils/cn";
import { card } from "#/utils/surfaces";

const themes = [
  { key: "system", label: m.themeSystem(), Icon: ComputerDesktopIcon },
  { key: "light", label: m.themeLight(), Icon: SunIcon },
  { key: "dark", label: m.themeDark(), Icon: MoonIcon },
] as const;

type Theme = (typeof themes)[number]["key"];

export default function ThemeSwitch({ expanded = false }: { expanded?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function handleChange(value: Theme) {
    setTheme(value);
  }

  const { Icon: ActiveIcon } = themes.find((t) => t.key === theme) ?? themes[0];

  return (
    <div className="inline-flex items-center">
      {/* Collapsed / mobile: single icon button, styled as the same
          rounded-full "chip" as the locale switcher's badge/flag buttons
          so the two sit together cleanly at narrow widths. */}
      <Button
        onClick={() =>
          handleChange(theme === "system" ? "light" : theme === "light" ? "dark" : "system")
        }
        aria-label={m.themeSwitcherButton({ theme: theme })}
        className={`
          ${expanded ? "hidden" : ""} md:hidden
          flex items-center justify-center rounded-full p-2
          border border-gray-200/80 bg-white/80 backdrop-blur shadow-sm
          text-gray-500 hover:text-gray-900
          dark:border-gray-700/80 dark:bg-gray-900/80 dark:text-gray-400 dark:hover:text-gray-200
          transition-colors duration-200 ease-out cursor-pointer active:scale-95
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500
        `}
      >
        <ActiveIcon className="h-4 w-4" />
      </Button>

      {/* Expanded: pill group, same shape/spacing/gradient language as
          ParaglideLocaleSwitcher so the two read as one control cluster. */}
      <ToggleGroup
        value={[theme]}
        onValueChange={(values) => {
          if (values.length > 0) setTheme(values[0] as Theme);
        }}
        aria-label={m.themeSwitcherButtonGroup({ theme: mounted ? theme : "system" })}
        className={cn(
          card,
          `${!expanded ? "hidden" : "inline-flex"} md:inline-flex
          items-center 
          p-1`,
        )}
      >
        {themes.map(({ key, label, Icon }) => {
          const isActive = mounted && theme === key;

          return (
            <Toggle
              key={key}
              value={key}
              aria-label={label}
              className={`
                flex flex-1 items-center justify-center gap-1.5 rounded-full
                px-2.5 py-1.5 text-xs font-semibold tracking-wide
                transition-colors duration-200 ease-out cursor-pointer active:scale-95
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500
                ${
                  isActive
                    ? "bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }
              `}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Toggle>
          );
        })}
      </ToggleGroup>
    </div>
  );
}
