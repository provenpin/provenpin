import { GraphQLClient, gql, ClientError } from "graphql-request";

export const client = (url: string, token: string) => new GraphQLClient(url, { headers: { authorization: `Bearer ${token}` } });

const GetRepo = gql`query GetRepo($name: String!) { repo(name: $name) { name stars } }`;
const Star = gql`mutation Star($name: String!) { star(name: $name) { name stars } }`;
type Repo = { name: string; stars: number };

export const getRepo = async (c: GraphQLClient, name: string) => (await c.request<{ repo: Repo | null }>(GetRepo, { name })).repo;
export const star = async (c: GraphQLClient, name: string) => (await c.request<{ star: Repo }>(Star, { name })).star;

export function errorCode(e: unknown) {
  return e instanceof ClientError ? (e.response.errors?.[0]?.extensions as any)?.code ?? "UNKNOWN" : "NETWORK";
}
