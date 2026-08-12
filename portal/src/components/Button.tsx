import { Button as BaseButton } from "@base-ui/react/button";
import { cn } from "#/utils/cn";
import { button } from "#/utils/surfaces";

export function Button({
  onClick,
  children,
  type,
  full,
}: {
  onClick: () => void;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  full?: boolean;
}) {
  return (
    <BaseButton
      type={type ?? "button"}
      onClick={onClick}
      className={cn(button, full ? "w-full" : "w-auto")}
    >
      {children}
    </BaseButton>
  );
}
