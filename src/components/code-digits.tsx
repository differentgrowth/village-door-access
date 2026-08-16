import { cn } from "@/lib/utils";

export function CodeDigits({
  code,
  size = "lg",
  masked = false,
}: {
  code?: string;
  size?: "lg" | "md";
  masked?: boolean;
}) {
  const raw = masked
    ? ["•", "•", "•", "•"]
    : (code ?? "----").padStart(4, "0").slice(0, 4).split("");
  const [thousands = "-", hundreds = "-", tens = "-", ones = "-"] = raw;
  const digits = [
    { digit: thousands, id: "thousands" },
    { digit: hundreds, id: "hundreds" },
    { digit: tens, id: "tens" },
    { digit: ones, id: "ones" },
  ];
  return (
    <div
      aria-label={
        masked
          ? "Código oculto"
          : `Código ${digits.map((slot) => slot.digit).join(" ")}`
      }
      className={cn(
        "grid grid-cols-4",
        size === "lg" ? "gap-2 sm:gap-3" : "gap-2"
      )}
      role="img"
    >
      {digits.map((slot) => (
        <div
          className={cn(
            "flex items-center justify-center rounded-lg bg-chip text-fg tabular-nums",
            size === "lg"
              ? "h-20 font-display font-medium text-5xl tracking-wide sm:h-24 sm:text-6xl"
              : "h-14 font-display font-medium text-3xl"
          )}
          key={slot.id}
        >
          {slot.digit}
        </div>
      ))}
    </div>
  );
}
