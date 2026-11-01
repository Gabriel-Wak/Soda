import { motion } from "framer-motion";
import { FLAVORS, type FlavorId } from "@/lib/flavors";

export function FlavorDock({ active, onChange }: { active: FlavorId; onChange: (id: FlavorId) => void }) {
  return (
    <div className="glass-pill flex items-center gap-1 p-1.5" role="tablist" aria-label="Escolher sabor">
      {FLAVORS.map((f) => (
        <button
          key={f.id}
          role="tab"
          aria-selected={active === f.id}
          onClick={() => onChange(f.id)}
          className="relative rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors aria-selected:text-foreground sm:px-6"
        >
          {active === f.id && (
            <motion.span
              layoutId="flavor-pill"
              className="absolute inset-0 rounded-full bg-secondary"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: f.glow }} />
            {f.name}
          </span>
        </button>
      ))}
    </div>
  );
}
