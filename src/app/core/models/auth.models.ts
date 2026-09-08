export interface User {
  credencialId: number;
  username: string;
  empleadoId?: number;
  nombre?: string;
  apellido?: string;
  rol: string;
  sucursal?: string;
  sucursalId?: number;
  ultimoLogin?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}
