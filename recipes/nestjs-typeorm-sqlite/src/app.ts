import "reflect-metadata";
import { Body, Controller, Get, Inject, Injectable, Module, NotFoundException, Param, ParseIntPipe, Post } from "@nestjs/common";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { Column, Entity, PrimaryGeneratedColumn, type Repository } from "typeorm";

// Explicit column types and @Inject tokens: tsx/esbuild do not emit decorator metadata.
@Entity()
export class Todo {
  @PrimaryGeneratedColumn("increment") id!: number;
  @Column({ type: "varchar", length: 200 }) title!: string;
  @Column({ type: "boolean", default: false }) done!: boolean;
}

@Injectable()
export class TodosService {
  constructor(@Inject(getRepositoryToken(Todo)) private readonly repo: Repository<Todo>) {}
  create(title: string) { return this.repo.save(this.repo.create({ title })); }
  findAll() { return this.repo.find({ order: { id: "ASC" } }); }
  async findOne(id: number) {
    const t = await this.repo.findOneBy({ id });
    if (!t) throw new NotFoundException(`todo ${id} not found`);
    return t;
  }
}

@Controller("todos")
export class TodosController {
  constructor(@Inject(TodosService) private readonly todos: TodosService) {}
  @Post() create(@Body() body: { title: string }) { return this.todos.create(body.title); }
  @Get() all() { return this.todos.findAll(); }
  @Get(":id") one(@Param("id", ParseIntPipe) id: number) { return this.todos.findOne(id); }
}

@Module({
  imports: [
    TypeOrmModule.forRoot({ type: "better-sqlite3", database: ":memory:", entities: [Todo], synchronize: true }),
    TypeOrmModule.forFeature([Todo]),
  ],
  controllers: [TodosController],
  providers: [TodosService],
})
export class AppModule {}
