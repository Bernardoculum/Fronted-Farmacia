export interface AuditoriaItem {
  auditoriaId: number;
  usuarioBd: string;
  tablaAfectada: string;
  registroId?: number;
  operacion: string;
  modulo: string;
  ipCliente: string;
  host?: string;
  fechaEvento: string;
  descripcion: string;
}

export interface AuditoriaKPIs {
  total: number;
  logins: number;
  inserts: number;
  updates: number;
  ajustes: number;
}

export interface AuditoriaListResponse {
  data: AuditoriaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  kpis: AuditoriaKPIs;
}

export interface CatalogosFiltros {
  tablas: string[];
  operaciones: string[];
  usuarios: string[];
}
