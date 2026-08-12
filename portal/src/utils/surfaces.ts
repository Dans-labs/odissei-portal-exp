export const gradient = `bg-linear-to-r from-cyan-500 to-blue-600 text-white`;
export const hightlightGradient = `data-highlighted:bg-linear-to-r data-highlighted:from-cyan-500 data-highlighted:to-blue-600 data-highlighted:text-white`;

export const button = `
  flex items-center justify-center gap-2
  ${gradient}
  rounded-2xl 
  px-5 py-3 
  text-sm font-medium 
  shadow-sm
  transition 
  hover:brightness-110 active:scale-[0.99]
  cursor-pointer
`;

export const paginationButton = `
  h-9
  min-w-9
  px-3
  text-sm
  bg-none
  shadow-none
  hover:bg-gray-200
  disabled:opacity-30
  disabled:cursor-not-allowed
  dark:text-gray-100
  dark:hover:bg-gray-800
  text-gray-800 
`;

export const card = `
  group relative
  rounded-3xl
  border border-gray-200 dark:border-gray-800/80 shadow-sm
  bg-white
  dark:bg-gray-950
  p-6
  *:transition-all
`;

export const stats = `
  bg-gray-100 dark:bg-gray-800
  px-4 py-3
  rounded-2xl 
`;

export const devider = `border-gray-200 dark:border-gray-700`;

export const badge = `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset`;
