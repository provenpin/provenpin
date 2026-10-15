import * as R from "ramda";

export type User = { name: string; score: number; tags: string[] };

export const normalizeName = R.pipe(R.trim, R.toLower);
export const bumpScore = R.add(10);

export const prepareUser = R.evolve({
  name: normalizeName,
  score: bumpScore,
  tags: R.map(R.toLower),
}) as (u: User) => User;

export const summarize = R.pipe(
  prepareUser,
  (u: User) => ({ label: `${u.name}:${u.score}`, tagCount: u.tags.length }),
);
