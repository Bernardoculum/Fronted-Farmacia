export interface ClienteItem {
  clienteId: number;
  nombre: string;
  apellido: string | null;
  nombreCompleto: string;
  telefono: string;
  email: string | null;
  direccion: string;
  referenciaDireccion: string | null;
  municipio?: string;
  departamento?: string;
  fechaRegistro: string;
  estado: string; // 'ACTIVO' | 'INACTIVO'
}

export interface LaboratorioItem {
  laboratorioId: number;
  nombre: string;
  telefono: string;
  estado: string; // 'ACTIVO' | 'INACTIVO'
  totalMedicamentos: number;
}

export interface FilterClienteParams {
  page?: number;
  limit?: number;
  search?: string;
  estado?: string;
}

export interface PaginatedClientesResponse {
  data: ClienteItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  kpis: {
    total: number;
    activos: number;
    inactivos: number;
  };
}

export interface CreateClienteDto {
  nombre: string;
  apellido?: string;
  telefono: string;
  email?: string;
  direccion: string;
  referenciaDireccion?: string;
  municipioId?: number;
}

export interface CreateLaboratorioDto {
  nombre: string;
  telefono?: string;
}

export interface UpdateLaboratorioDto {
  nombre?: string;
  telefono?: string;
  estado?: string;
}
