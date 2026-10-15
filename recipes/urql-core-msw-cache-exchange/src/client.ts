import { Client, cacheExchange, fetchExchange, gql, mapExchange, type CombinedError } from "@urql/core";

export const CoursesQuery = gql`
  query Courses { courses { __typename id title } }
`;
export const RenameMutation = gql`
  mutation Rename($id: ID!, $title: String!) { renameCourse(id: $id, title: $title) { __typename id title } }
`;

export function makeClient(url: string, getToken: () => string, onError: (e: CombinedError) => void = () => {}) {
  return new Client({
    url,
    preferGetMethod: false,
    exchanges: [mapExchange({ onError }), cacheExchange, fetchExchange],
    fetchOptions: () => ({ headers: { authorization: `Bearer ${getToken()}` } }),
  });
}
