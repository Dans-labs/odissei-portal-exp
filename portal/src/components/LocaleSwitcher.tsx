// Locale switcher refs:
// - Paraglide docs: https://inlang.com/m/gerre34r/library-inlang-paraglideJs
// - Router example: https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#switching-locale
import { getLocale, locales, setLocale, type Locale } from "#/paraglide/runtime";
import { m } from "#/paraglide/messages";

function NLFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
      <clipPath id="nl-circle">
        <circle cx="30" cy="30" r="30" />
      </clipPath>
      <g clipPath="url(#nl-circle)">
        <rect width="60" height="20" y="0" fill="#AE1C28" />
        <rect width="60" height="20" y="20" fill="#FFFFFF" />
        <rect width="60" height="20" y="40" fill="#21468B" />
      </g>
    </svg>
  );
}

function GBFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
      <clipPath id="gb-circle">
        <circle cx="30" cy="30" r="30" />
      </clipPath>
      <g clipPath="url(#gb-circle)">
        <rect width="60" height="60" fill="#00247D" />
        <path d="M0 0L60 60M60 0L0 60" stroke="#FFFFFF" strokeWidth="12" />
        <path d="M0 0L60 60M60 0L0 60" stroke="#CF142B" strokeWidth="4" />
        <path d="M30 0V60M0 30H60" stroke="#FFFFFF" strokeWidth="20" />
        <path d="M30 0V60M0 30H60" stroke="#CF142B" strokeWidth="12" />
      </g>
    </svg>
  );
}

function LocaleBadge({ locale, className }: { locale: string; className?: string }) {
  return (
    <span
      className={`flex items-center justify-center rounded-full bg-zinc-200 text-[0.6rem] font-bold text-zinc-600 ${className ?? ""}`}
      aria-hidden="true"
    >
      {locale.slice(0, 2).toUpperCase()}
    </span>
  );
}

const FLAGS: Partial<Record<Locale, (props: { className?: string }) => JSX.Element>> = {
  nl: NLFlag,
  en: GBFlag,
};

export default function ParaglideLocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const currentLocale = getLocale();
  const flagSize = compact ? "size-6" : "size-5";

  return (
    <div className="inline-flex items-center gap-2 text-inherit" aria-label={m.languageLabel()}>
      <div
        className={`
          inline-flex items-center gap-0.5
          rounded-full border border-zinc-200/80 bg-white/80 backdrop-blur
          shadow-sm ${compact ? "p-0.5" : "p-1"}
        `}
        role="group"
      >
        {locales.map((locale) => {
          const Flag = FLAGS[locale];
          const isActive = locale === currentLocale;

          return (
            <button
              key={locale}
              type="button"
              onClick={() => setLocale(locale)}
              aria-pressed={isActive}
              title={locale.toUpperCase()}
              className={`
                flex items-center rounded-full
                transition-colors duration-200 ease-out
                cursor-pointer
                focus-visible:outline-2
                focus-visible:outline-offset-2 focus-visible:outline-cyan-500
                active:scale-95
                ${compact ? "p-0.75" : "gap-1.5 px-2.5 py-1.5 text-xs font-semibold tracking-wide"}
                ${
                  isActive
                    ? "bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900"
                }
              `}
            >
              <span
                className={`
                  flex ${flagSize} shrink-0 overflow-hidden rounded-full
                  border-2 transition-colors duration-200
                  ${isActive ? "border-white/70" : "border-transparent"}
                `}
              >
                {Flag ? (
                  <Flag className="size-full" />
                ) : (
                  <LocaleBadge locale={locale} className="size-full" />
                )}
              </span>
              {!compact && locale.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
