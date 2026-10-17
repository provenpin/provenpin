import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

export type User = {
  id: string;
  username: string;
  password: string;
};

export type PublicUser = {
  id: string;
  username: string;
};

const users = new Map<string, User>([
  ["alice", { id: "1", username: "alice", password: "secret" }],
]);

export function findUser(username: string): User | undefined {
  return users.get(username);
}

export function findUserById(id: string): User | undefined {
  for (const user of users.values()) {
    if (user.id === id) return user;
  }
  return undefined;
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, username: user.username };
}

export function configurePassport(): typeof passport {
  passport.use(
    new LocalStrategy((username, password, done) => {
      const user = findUser(username);
      if (!user || user.password !== password) {
        done(null, false, { message: "invalid credentials" });
        return;
      }
      done(null, user);
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser((id, done) => {
    done(null, findUserById(id as string) ?? null);
  });

  return passport;
}
