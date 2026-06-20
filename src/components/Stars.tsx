import { cn } from "@/utils/cn";

export function Stars(props: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(5, props.value));
  const full = Math.floor(v);
  const half = v - full >= 0.5;

  return (
    <div className={cn("flex items-center gap-1", props.className)} aria-label={`Rating ${v} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <span
            key={i}
            className={cn(
              "text-xs",
              filled ? "text-[#ffb703]" : "text-white/20",
              i === full && half ? "opacity-90" : ""
            )}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
