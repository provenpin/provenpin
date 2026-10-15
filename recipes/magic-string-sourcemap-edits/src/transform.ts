import MagicString from "magic-string";

export type TransformResult = {
  code: string;
  map: ReturnType<MagicString["generateMap"]>;
};

export function transform(input: string): TransformResult {
  const magic = new MagicString(input);

  const worldStart = input.indexOf('"world"');
  magic.overwrite(worldStart, worldStart + '"world"'.length, '"provenpin"');

  const greetingStart = input.indexOf("greeting");
  magic.prependLeft(greetingStart, "/* left */");

  const unusedStart = input.indexOf("// unused");
  magic.remove(unusedStart, unusedStart + "// unused".length);

  magic.append("\nexport const version = 1;\n");

  const map = magic.generateMap({
    source: "input.ts",
    file: "output.ts",
    hires: true,
    includeContent: true,
  });

  return { code: magic.toString(), map };
}
