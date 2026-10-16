import { Low, Memory } from "lowdb";
import { JSONFilePreset } from "lowdb/node";

export type User = { id: string; name: string };

export type Comment = { id: string; postId: string; body: string };

export type Post = {
  id: string;
  title: string;
  authorId: string;
  tags: string[];
  comments: Comment[];
};

export type Data = {
  users: User[];
  posts: Post[];
};

export type Store = Low<Data>;

export const defaultData: Data = {
  users: [],
  posts: [],
};

export async function openStore(filename: string): Promise<Store> {
  const store = await JSONFilePreset<Data>(filename, structuredClone(defaultData));
  // Ensure the seed file exists for callers that read it immediately.
  await store.write();
  return store;
}

export async function openMemoryStore(): Promise<Store> {
  const store = new Low<Data>(new Memory<Data>(), structuredClone(defaultData));
  await store.read();
  return store;
}

export async function addUser(store: Store, user: User): Promise<void> {
  await store.update((data) => {
    if (data.users.some((u) => u.id === user.id)) {
      throw new Error(`user already exists: ${user.id}`);
    }
    data.users.push(user);
  });
}

export async function addPost(store: Store, post: Post): Promise<void> {
  await store.update((data) => {
    const author = data.users.find((u) => u.id === post.authorId);
    if (!author) {
      throw new Error(`unknown author: ${post.authorId}`);
    }
    data.posts.push(post);
  });
}

export async function addComment(
  store: Store,
  postId: string,
  comment: Comment,
): Promise<void> {
  await store.update((data) => {
    const post = data.posts.find((p) => p.id === postId);
    if (!post) {
      throw new Error(`unknown post: ${postId}`);
    }
    post.comments.push(comment);
  });
}

export function getPost(store: Store, postId: string): Post | undefined {
  return store.data.posts.find((p) => p.id === postId);
}

export function getPostsByTag(store: Store, tag: string): Post[] {
  return store.data.posts.filter((p) => p.tags.includes(tag));
}

export function getUserPosts(store: Store, userId: string): Post[] {
  return store.data.posts.filter((p) => p.authorId === userId);
}

export function countComments(store: Store, postId: string): number {
  return getPost(store, postId)?.comments.length ?? 0;
}
