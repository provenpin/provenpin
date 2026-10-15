import { AbilityBuilder, createMongoAbility, subject, type MongoAbility, type InferSubjects } from "@casl/ability";

export type Actions = "create" | "read" | "update" | "delete" | "manage";
export type Post = { id: number; authorId: number; published: boolean };
export type Subjects = InferSubjects<Post> | "Post" | "all";
export type AppAbility = MongoAbility<[Actions, Subjects]>;

export type Actor = { id: number; role: "admin" | "author" | "guest" };

export function asPost(p: Post) {
  return subject("Post", p);
}

export function defineAbilityFor(user: Actor): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
  if (user.role === "admin") {
    can("manage", "all");
  } else if (user.role === "author") {
    can("read", "Post");
    can("create", "Post");
    can("update", "Post", { authorId: user.id });
    cannot("delete", "Post");
  } else {
    can("read", "Post", { published: true });
  }
  return build();
}

export function packAbility(ability: AppAbility) {
  return ability.rules;
}
