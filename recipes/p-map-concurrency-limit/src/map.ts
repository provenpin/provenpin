import pMap from "p-map";

export async function doubleAll(values: number[], concurrency: number, onStart: (n: number) => void) {
  let inflight = 0;
  let maxInflight = 0;
  const result = await pMap(
    values,
    async (n) => {
      inflight += 1;
      maxInflight = Math.max(maxInflight, inflight);
      onStart(inflight);
      await new Promise((r) => setTimeout(r, 20));
      inflight -= 1;
      return n * 2;
    },
    { concurrency },
  );
  return { result, maxInflight };
}
