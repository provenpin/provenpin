import { createHooks } from "hookable";

export type PipelineHooks = {
  "step:start": (name: string) => void;
  "step:end": (name: string, durationMs: number) => void;
  "pipeline:done": (steps: string[]) => void;
};

export function createPipeline() {
  return createHooks<PipelineHooks>();
}
