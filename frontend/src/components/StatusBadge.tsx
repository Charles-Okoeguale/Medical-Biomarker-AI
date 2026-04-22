interface StatusBadgeProps {
  status: "optimal" | "normal" | "out_of_range";
}

const CONFIG = {
  optimal: { label: "Optimal", className: "bg-green-100 text-green-800 border border-green-200" },
  normal: { label: "Normal", className: "bg-yellow-100 text-yellow-800 border border-yellow-200" },
  out_of_range: { label: "Out of Range", className: "bg-red-100 text-red-800 border border-red-200" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = CONFIG[status];
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
