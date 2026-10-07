export interface UserItem {
  credencialId: number;
  username: string;
  estado: string; // 'ACTIVO' | 'INACTIVO'
  ultimoLogin: string | null;
  fechaRegistro: string;
  rolId: number;
  rolNombre: string;
  rolDescripcion: string | null;
  empleadoId?: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  dpi?: string | null;
  telefono?: string | null;
  sucursalId?: number;
  sucursalNombre?: string;
  puestoId?: number;
  puestoNombre?: string;
}

export interface RolOption {
  rolId: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
}

export interface CreateUserDto {
  nombre: string;
  apellido: string;
  dpi?: string;
  telefono?: string;
  username: string;
  password?: string;
  rolId: number;
  sucursalId: number;
  puestoId?: number;
}

export interface UpdateUserDto {
  nombre?: string;
  apellido?: string;
  dpi?: string;
  telefono?: string;
  username?: string;
  password?: string;
  rolId?: number;
  sucursalId?: number;
  puestoId?: number;
  estado?: string;
}

export interface ChangePasswordDto {
  newPassword: string;
}

export interface FilterUserParams {
  page?: number;
  limit?: number;
  search?: string;
  rolId?: number;
  sucursalId?: number;
  estado?: string;
}

export interface PaginatedUsersResponse {
  data: UserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  kpis: {
    total: number;
    activos: number;
    inactivos: number;
    superAdmins: number;
  };
}
