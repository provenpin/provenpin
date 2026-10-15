import axios, { type AxiosError } from "axios";
import axiosRetry, { isNetworkOrIdempotentRequestError } from "axios-retry";

export function createClient(baseURL: string, retries = 3) {
  const client = axios.create({ baseURL, timeout: 5000 });
  axiosRetry(client, {
    retries,
    retryDelay: (n) => (process.env.NODE_ENV === "test" ? 0 : axiosRetry.exponentialDelay(n)),
    retryCondition: (err: AxiosError) => isNetworkOrIdempotentRequestError(err) || err.response?.status === 429,
  });
  return client;
}
