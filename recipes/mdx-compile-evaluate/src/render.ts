import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import type { ComponentType } from "react";

export type MdxComponent = ComponentType<Record<string, unknown>>;

export type MdxComponentMap = Record<string, MdxComponent>;

export type MdxResult = {
  Content: ComponentType<{ components?: MdxComponentMap }>;
  exports: Record<string, unknown>;
};

export async function evaluateMdx(source: string): Promise<MdxResult> {
  const mod = await evaluate(source, {
    ...runtime,
    baseUrl: import.meta.url,
  });

  const { default: Content, ...exports } = mod;

  return {
    Content: Content as unknown as MdxResult["Content"],
    exports: exports as Record<string, unknown>,
  };
}
