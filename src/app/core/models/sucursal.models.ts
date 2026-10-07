export interface SucursalItem {
  sucursalId: number;
  nombre: string;
  tipoSucursal: 'FARMACIA' | 'STAND' | 'BODEGA_CENTRAL';
  direccion: string;
  telefono?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  fechaApertura?: string;
  estado: 'ACTIVA' | 'INACTIVA';
  municipio?: {
    municipioId: number;
    nombre: string;
    departamento?: string;
  } | null;
  esBodegaCentral?: boolean;
}

export interface SucursalOption {
  sucursalId: number;
  nombre: string;
  tipoSucursal: string;
  direccion: string;
  telefono?: string;
  esBodegaCentral: boolean;
}

export interface CreateSucursalDto {
  nombre: string;
  tipoSucursal: 'FARMACIA' | 'STAND' | 'BODEGA_CENTRAL';
  direccion: string;
  telefono?: string;
  latitud?: number;
  longitud?: number;
  municipioId?: number;
  estado?: 'ACTIVA' | 'INACTIVA';
}

export interface UpdateSucursalDto extends Partial<CreateSucursalDto> {}

export interface FilterSucursalParams {
  search?: string;
  tipoSucursal?: string;
  estado?: string;
  page?: number;
  limit?: number;
}
