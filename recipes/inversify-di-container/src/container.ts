import "reflect-metadata";
import { Container, inject, injectable } from "inversify";

export const TYPES = {
  Logger: Symbol.for("Logger"),
  UserRepository: Symbol.for("UserRepository"),
  UserService: Symbol.for("UserService"),
} as const;

export interface Logger {
  log(message: string): void;
}

export interface User {
  id: string;
  name: string;
}

export interface UserRepository {
  findById(id: string): User | undefined;
}

export interface UserService {
  greet(id: string): string;
}

@injectable()
export class ConsoleLogger implements Logger {
  readonly lines: string[] = [];

  log(message: string): void {
    this.lines.push(message);
  }
}

@injectable()
export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>([
    ["1", { id: "1", name: "Ada" }],
  ]);

  findById(id: string): User | undefined {
    return this.users.get(id);
  }
}

@injectable()
export class DefaultUserService implements UserService {
  constructor(
    @inject(TYPES.Logger) private readonly logger: Logger,
    @inject(TYPES.UserRepository) private readonly repo: UserRepository,
  ) {}

  greet(id: string): string {
    const user = this.repo.findById(id);
    if (!user) {
      this.logger.log(`missing ${id}`);
      return "unknown";
    }
    this.logger.log(`greet ${id}`);
    return `Hello ${user.name}`;
  }
}

export function createContainer(): Container {
  const container = new Container();
  container.bind<Logger>(TYPES.Logger).to(ConsoleLogger).inSingletonScope();
  container
    .bind<UserRepository>(TYPES.UserRepository)
    .to(InMemoryUserRepository)
    .inSingletonScope();
  container
    .bind<UserService>(TYPES.UserService)
    .to(DefaultUserService)
    .inTransientScope();
  return container;
}
