/**
 * Worker entry point. Phase 1 wires the pgmq consumers (inbound, jobs, outbound) here.
 * In Phase 0 the same orchestrator and generator run inside the local simulator (`pnpm sim`).
 */
console.log(
  'CuentasBot worker: los consumidores de colas se conectan en la Fase 1. Usa `pnpm sim` para probar.',
);
