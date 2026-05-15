const BASE_URL = 'http://localhost:8080/api/v1';

export interface AuthResponse {
  userId: number;
  username: string;
  nickname: string;
  token?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const result = await response.json();

  if (result.code !== 200) {
    throw new Error(result.message || `请求失败 (code: ${result.code})`);
  }

  return result.data as T;
}

export interface LoginDTO {
  username: string;
  password: string;
}

export interface RegisterDTO {
  username: string;
  password: string;
  nickname?: string;
  email?: string;
}

export const login = (data: LoginDTO): Promise<AuthResponse> => {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
};

export const register = (data: RegisterDTO): Promise<AuthResponse> => {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
};

export const getMe = (): Promise<AuthResponse> => {
  return request('/auth/me');
};
