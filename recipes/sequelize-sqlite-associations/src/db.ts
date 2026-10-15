import { Sequelize, DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from "sequelize";

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare email: string;
}
export class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare userId: number;
}

export async function createDb(storage = ":memory:") {
  const sequelize = new Sequelize({ dialect: "sqlite", storage, logging: false });
  User.init(
    { id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true }, email: { type: DataTypes.STRING, allowNull: false, unique: true } },
    { sequelize, tableName: "users" },
  );
  Post.init(
    { id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true }, title: { type: DataTypes.STRING, allowNull: false }, userId: { type: DataTypes.INTEGER, allowNull: false } },
    { sequelize, tableName: "posts" },
  );
  User.hasMany(Post, { foreignKey: "userId", as: "posts" });
  Post.belongsTo(User, { foreignKey: "userId", as: "author" });
  await sequelize.sync({ force: true });
  return sequelize;
}

export async function createAuthorWithPosts(email: string, titles: string[]) {
  return User.sequelize!.transaction(async (t) => {
    const user = await User.create({ email }, { transaction: t });
    await Post.bulkCreate(titles.map((title) => ({ title, userId: user.id })), { transaction: t });
    return user;
  });
}

export async function postsForEmail(email: string) {
  const user = await User.findOne({
    where: { email },
    include: [{ model: Post, as: "posts" }],
  });
  return user;
}
