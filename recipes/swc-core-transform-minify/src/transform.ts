import type { Options } from "@swc/core";

export const TSX_SOURCE = `type Props = { name: string; age: number };
function Greeting(props: Props) {
  const label: string = "Hello " + props.name;
  return <div className="greet">{label}</div>;
}
`;

export const PLAIN_TS_SOURCE = `function addNumbers(first: number, second: number): number {
  const total: number = first + second;
  return total;
}
(globalThis as any).__swcResult = addNumbers(20, 22);
`;

export const TSX_OPTIONS: Options = {
  jsc: {
    parser: { syntax: "typescript", tsx: true },
    target: "es2020",
  },
  module: { type: "es6" },
};

export const TS_OPTIONS: Options = {
  jsc: {
    parser: { syntax: "typescript" },
    target: "es2020",
  },
  module: { type: "es6" },
};
