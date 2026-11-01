import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { motion } from "framer-motion";
import { FLAVORS, SHIFT_MS, type FlavorId } from "@/lib/flavors";
import { FlavorDock } from "@/components/soda/FlavorDock";

const SodaScene = lazy(() => import("@/components/soda/SodaScene"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soda — Puro Zero" },
      { name: "description", content: "Refrescante de verdade — zero açúcar, faísca cinética infinita." },
      { property: "og:title", content: "Soda — Puro Zero" },
      { property: "og:description", content: "Refrescante de verdade — zero açúcar, faísca cinética infinita." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [active, setActive] = useState<FlavorId>("guarana");
  const flavor = FLAVORS.find((f) => f.id === active)!;

  return (
    <main
      className="relative h-screen w-full overflow-hidden bg-background"
      style={{ ["--glow" as string]: flavor.glow, transition: `--glow ${SHIFT_MS}ms ease` }}
    >
      <div className="ambient-glow absolute inset-0" />

      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <SodaScene flavor={flavor} />
        </Suspense>
      </ClientOnly>

      <header className="pointer-events-none relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <span className="font-display text-lg font-bold tracking-[0.3em]">SODA</span>
        <span className="pointer-events-auto font-display text-xs tracking-[0.22em] text-muted-foreground">
          feito por @devgabri7
        </span>
      </header>

      <section className="pointer-events-none relative z-10 flex h-[calc(100vh-88px)] flex-col justify-between px-6 pb-28 sm:px-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-muted-foreground">Edição {flavor.name}</p>
          <h1 className="metallic font-display text-[18vw] font-bold leading-[0.85] tracking-tight sm:text-[11vw]">
            Puro
            <br />
            Zero
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.9 }}
          className="max-w-xs self-end rounded-2xl bg-background/75 px-5 py-4 text-right text-sm text-muted-foreground backdrop-blur-md sm:text-base"
        >
          Refrescante de verdade — zero açúcar, faísca cinética infinita.
        </motion.p>
      </section>

      <div className="absolute inset-x-0 bottom-6 z-20 flex flex-col items-center gap-3">
        <FlavorDock active={active} onChange={setActive} />
      </div>
    </main>
  );
}
