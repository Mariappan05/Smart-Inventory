type StatusPillProps = {
  status:
    | "online"
    | "maintenance"
    | "offline"
    | "ONLINE"
    | "MAINTENANCE"
    | "OFFLINE"
    | "AVAILABLE"
    | "IN_USE"
    | "OUT_OF_STOCK";
};

export function StatusPill({ status }: StatusPillProps) {
  const normalizedStatus = status.toLowerCase() as
    | "online"
    | "maintenance"
    | "offline"
    | "available"
    | "in_use"
    | "out_of_stock";
  
  const styles = {
    online: "bg-emerald-100 text-emerald-700",
    maintenance: "bg-amber-100 text-amber-700",
    offline: "bg-rose-100 text-rose-700",
    available: "bg-emerald-100 text-emerald-700",
    in_use: "bg-amber-100 text-amber-700",
    out_of_stock: "bg-rose-100 text-rose-700",
  };

  const displayText = normalizedStatus
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
        styles[normalizedStatus]
      }`}
    >
      {displayText}
    </span>
  );
}
