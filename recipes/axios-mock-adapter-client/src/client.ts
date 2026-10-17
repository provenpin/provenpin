import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export interface CreateTodoInput {
  title: string;
  completed?: boolean;
}

export interface ApiClientOptions {
  baseURL: string;
  token: string;
  timeoutMs?: number;
}

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, options: { status?: number; code?: string } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
  }
}

export interface ApiClient {
  http: AxiosInstance;
  listTodos(): Promise<Todo[]>;
  getTodo(id: number): Promise<Todo>;
  createTodo(input: CreateTodoInput): Promise<Todo>;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const { baseURL, token, timeoutMs = 1000 } = options;

  const http = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: { "Content-Type": "application/json" },
  });

  http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    config.headers.set("Authorization", `Bearer ${token}`);
    return config;
  });

  http.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const isTimeout =
        error.code === "ECONNABORTED" || /timeout/i.test(error.message);
      if (isTimeout) {
        return Promise.reject(
          new ApiError("Request timed out", { code: error.code ?? "ECONNABORTED" }),
        );
      }
      if (!error.response) {
        return Promise.reject(new ApiError("Network error", { code: error.code }));
      }
      return Promise.reject(
        new ApiError(`Request failed with status ${error.response.status}`, {
          status: error.response.status,
          code: error.code,
        }),
      );
    },
  );

  return {
    http,
    async listTodos() {
      const response = await http.get<Todo[]>("/todos");
      return response.data;
    },
    async getTodo(id) {
      const response = await http.get<Todo>(`/todos/${id}`);
      return response.data;
    },
    async createTodo(input) {
      const response = await http.post<Todo>("/todos", input);
      return response.data;
    },
  };
}
