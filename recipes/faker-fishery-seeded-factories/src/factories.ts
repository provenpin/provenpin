import { Factory } from "fishery";
import { faker } from "@faker-js/faker";

export type User = { id: number; name: string; email: string; role: "member" | "admin"; createdAt: Date };
export type Post = { id: number; title: string; author: User; tags: string[] };

const REF_DATE = new Date("2026-01-01T00:00:00Z");

class UserFactory extends Factory<User, { domain: string }> {
  admin() {
    return this.params({ role: "admin" });
  }
}

export const userFactory = UserFactory.define(({ sequence, transientParams }) => {
  const first = faker.person.firstName();
  const last = faker.person.lastName();
  return {
    id: sequence,
    name: `${first} ${last}`,
    email: faker.internet.email({ firstName: first, lastName: last, provider: transientParams.domain ?? "example.test" }).toLowerCase(),
    role: "member",
    createdAt: faker.date.past({ years: 1, refDate: REF_DATE }),
  };
});

export const postFactory = Factory.define<Post>(({ sequence, associations }) => ({
  id: sequence,
  title: faker.lorem.sentence({ min: 3, max: 6 }),
  author: associations.author ?? userFactory.build(),
  tags: faker.helpers.arrayElements(["ts", "node", "testing", "mcp", "api"], 2),
}));

/** Reset faker and factory sequences so every test starts from the same data. */
export function resetData(seed = 42) {
  faker.seed(seed);
  userFactory.rewindSequence();
  postFactory.rewindSequence();
}
