import { createContainer, asClass, asFunction, asValue, InjectionMode, Lifetime, type AwilixContainer } from "awilix";

export class Database {
  closed = false;
  rows = new Map<number, { id: number; name: string }>([[1, { id: 1, name: "Ada" }]]);
  async close() { this.closed = true; }
}

export class UserRepository {
  private db: Database;
  constructor({ db }: { db: Database }) { this.db = db; }
  find(id: number) { return this.db.rows.get(id) ?? null; }
}

export class UserService {
  private repo: UserRepository;
  private requestId: string;
  constructor({ userRepository, requestId }: { userRepository: UserRepository; requestId: string }) {
    this.repo = userRepository;
    this.requestId = requestId;
  }
  get(id: number) { return { requestId: this.requestId, user: this.repo.find(id) }; }
}

export type Cradle = {
  config: { appName: string };
  db: Database;
  userRepository: UserRepository;
  userService: UserService;
  requestId: string;
  greeter: (name: string) => string;
};

export function buildContainer(): AwilixContainer<Cradle> {
  const container = createContainer<Cradle>({ injectionMode: InjectionMode.PROXY, strict: true });
  container.register({
    config: asValue({ appName: "provenpin" }),
    db: asClass(Database, { lifetime: Lifetime.SINGLETON }).disposer((db) => db.close()),
    userRepository: asClass(UserRepository).singleton(),
    userService: asClass(UserService).scoped(),
    requestId: asValue("none"),
    greeter: asFunction(({ config }: Cradle) => (name: string) => `${config.appName} says hi to ${name}`).transient(),
  });
  return container;
}

/** One scope per incoming request, with its own requestId value. */
export function handleRequest(container: AwilixContainer<Cradle>, requestId: string, userId: number) {
  const scope = container.createScope();
  scope.register({ requestId: asValue(requestId) });
  return scope.resolve("userService").get(userId);
}
