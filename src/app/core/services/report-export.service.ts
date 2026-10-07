import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { PedidoItem } from '../models/pedido.models';

export interface ReporteTabularOptions {
  titulo: string;
  subtitulo?: string;
  sucursal?: string;
  filtrosAplicados?: string;
  columnas: string[];
  filas: (string | number)[][];
  totales?: { label: string; valor: string | number }[];
  resumenKpis?: { titulo: string; valor: string; color?: string }[];
  notasPie?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportExportService {
  private authService = inject(AuthService);

  /**
   * Exporta cualquier conjunto de datos tabulares a formato CSV compatible con Microsoft Excel (UTF-8 con BOM).
   */
  exportarCsv(nombreArchivo: string, encabezados: string[], filas: (string | number)[][]): void {
    const separador = ';';
    let contenidoCsv = '\uFEFF'; // BOM UTF-8 para apertura directa en Excel en español

    // Encabezados
    contenidoCsv += encabezados.map((h) => `"${(h || '').toString().replace(/"/g, '""')}"`).join(separador) + '\r\n';

    // Filas
    filas.forEach((fila) => {
      const filaStr = fila
        .map((celda) => {
          if (celda === null || celda === undefined) return '""';
          return `"${celda.toString().replace(/"/g, '""')}"`;
        })
        .join(separador);
      contenidoCsv += filaStr + '\r\n';
    });

    const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `${nombreArchivo}_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Genera e imprime un reporte formal con diseño corporativo farmacéutico aislado del DOM general.
   */
    /**
   * Obtiene exclusivamente el primer nombre y un apellido del empleado para formalidad en reportes
   */
  getNombreYApellidoOperador(): string {
    const usuario = this.authService.currentUser();
    if (!usuario) return 'Personal Farmacéutico';

    // Mapeo seguro si la sesión activa aún tiene 'Super Culum' en caché
    if (
      usuario.username?.toLowerCase() === 'culum' ||
      (usuario.nombre?.toLowerCase() === 'super' && usuario.apellido?.toLowerCase() === 'culum')
    ) {
      return 'Bernardo Culum';
    }

    const primerNombre = (usuario.nombre || '').trim().split(' ')[0] || '';
    const primerApellido = (usuario.apellido || '').trim().split(' ')[0] || '';

    if (primerNombre && primerApellido) {
      return `${primerNombre} ${primerApellido}`;
    }
    if (usuario.nombre?.trim()) {
      return usuario.nombre.trim();
    }
    if (usuario.username?.trim()) {
      return usuario.username.trim();
    }
    return 'Personal Farmacéutico';
  }

  imprimirReporteTabular(opciones: ReporteTabularOptions): void {
    const fechaHora = new Date().toLocaleDateString('es-GT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const usuario = this.authService.currentUser();
    const operadorNombre = this.getNombreYApellidoOperador();
    const sucursalNombre = opciones.sucursal || (usuario?.sucursal ? usuario.sucursal : 'Sucursal Central (Consolidado)');

    let kpisHtml = '';
    if (opciones.resumenKpis && opciones.resumenKpis.length > 0) {
      kpisHtml = `
        <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
          ${opciones.resumenKpis
            .map(
              (k) => `
            <div style="flex: 1; min-width: 140px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
              <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">${k.titulo}</div>
              <div style="font-size: 16px; font-weight: 900; color: ${k.color || '#0f172a'}; margin-top: 4px;">${k.valor}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }

    const thsHtml = opciones.columnas
      .map(
        (col) => `
        <th style="background: #f1f5f9; color: #334155; font-size: 11px; text-transform: uppercase; font-weight: 800; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: left;">
          ${col}
        </th>
      `
      )
      .join('');

    const trsHtml = opciones.filas
      .map(
        (fila, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 11px; page-break-inside: avoid;">
          ${fila
            .map((celda) => {
              const str = (celda ?? '').toString();
              const esMonedaONumero = str.startsWith('Q') || str.startsWith('Q ') || (!isNaN(Number(str.replace(/[%,]/g, ''))) && str.trim() !== '');
              const align = esMonedaONumero ? 'right' : 'left';
              return `<td style="padding: 7px 10px; color: #1e293b; text-align: ${align};">${celda ?? ''}</td>`;
            })
            .join('')}
        </tr>
      `
      )
      .join('');

    let tfootHtml = '';
    if (opciones.totales && opciones.totales.length > 0) {
      tfootHtml = `
        <tfoot style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1;">
          <tr>
            <td colspan="${Math.max(1, opciones.columnas.length - opciones.totales.length)}" style="padding: 8px 10px; text-align: right; color: #475569; font-size: 11px; font-weight: 800;">
              TOTALES GENERALES:
            </td>
            ${opciones.totales
              .map(
                (tot) => `
              <td style="padding: 8px 10px; text-align: right; color: #0f172a; font-size: 12px; font-weight: 900;">
                <span style="font-size: 9px; color: #64748b; display: block;">${tot.label}</span>
                ${tot.valor}
              </td>
            `
              )
              .join('')}
          </tr>
        </tfoot>
      `;
    }

    const ventana = window.open('', '_blank', 'width=1000,height=750');
    if (!ventana) return;

    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>${opciones.titulo} - Red Central Farmacias</title>
          <style>
            @page {
              size: letter landscape;
              margin: 12mm 15mm 15mm 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 20px;
              background: #fff;
              font-size: 11px;
            }
            .header-banner {
              border-bottom: 2px solid #059669;
              padding-bottom: 12px;
              margin-bottom: 14px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .brand-title {
              font-size: 18px;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: -0.5px;
            }
            .brand-subtitle {
              font-size: 11px;
              color: #059669;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 2px;
            }
            .meta-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px 14px;
              font-size: 11px;
              margin-bottom: 16px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
            }
            .meta-item strong {
              color: #475569;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            .signature-block {
              margin-top: 35px;
              display: flex;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            .signature-line {
              width: 240px;
              border-top: 1px solid #94a3b8;
              text-align: center;
              padding-top: 6px;
              font-size: 10px;
              color: #475569;
            }
            .footer-info {
              margin-top: 25px;
              border-top: 1px dashed #cbd5e1;
              padding-top: 8px;
              font-size: 9px;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
            }
            @media print {
              .no-print { display: none !important; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 18px; display: flex; justify-content: flex-end; gap: 10px;">
            <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
              <span>🖨️ Imprimir / Guardar PDF</span>
            </button>
            <button onclick="window.close()" style="background: #e2e8f0; color: #334155; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">
              Cerrar
            </button>
          </div>

          <div class="header-banner">
            <div style="display: flex; align-items: center; gap: 14px;">
              <img src="/logo.png" alt="Farmacia Red Central" style="width: 54px; height: 54px; object-fit: contain;" />
              <div>
                <div class="brand-title">FARMACIA RED CENTRAL</div>
                <div class="brand-subtitle">RED FARMA • Sistema Integral de Control Farmacéutico</div>
                <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 4px;">${opciones.titulo}</div>
                ${opciones.subtitulo ? `<div style="font-size: 11px; color: #64748b;">${opciones.subtitulo}</div>` : ''}
              </div>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 11px;">
                REPORTE OFICIAL
              </span>
              <div style="font-size: 10px; color: #64748b; margin-top: 6px;">Control y Auditoría Interna</div>
            </div>
          </div>

          <div class="meta-box">
            <div class="meta-item">
              <strong>Sucursal / Ámbito:</strong>
              <span style="color: #059669; font-weight: 700;">${sucursalNombre}</span>
            </div>
            <div class="meta-item">
              <strong>Fecha y Hora de Emisión:</strong>
              <span style="font-weight: 700;">${fechaHora}</span>
            </div>
            <div class="meta-item">
              <strong>Generado por:</strong>
              <span>${operadorNombre}</span>
            </div>
            <div class="meta-item">
              <strong>Filtros Aplicados:</strong>
              <span>${opciones.filtrosAplicados || 'Todos los registros'}</span>
            </div>
          </div>

          ${kpisHtml}

          <table>
            <thead>
              <tr>${thsHtml}</tr>
            </thead>
            <tbody>
              ${trsHtml}
            </tbody>
            ${tfootHtml}
          </table>

          <div class="signature-block">
            <div class="signature-line">
              <strong>${operadorNombre}</strong><br>
              Generador del Reporte
            </div>
            <div class="signature-line">
              <strong>Firma y Sello de Autorización</strong><br>
              Regente Farmacéutico / Gerencia
            </div>
          </div>

          <div class="footer-info">
            <span>Red Central Farmacias &copy; 2026 - Trazabilidad y Seguridad Farmacéutica (FEFO)</span>
            <span>Sistema Web de Control Farmacéutico</span>
          </div>
        </body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();
    setTimeout(() => {
      ventana.print();
    }, 400);
  }

  /**
   * Imprime un ticket térmico POS (80mm) aislado e impecable sin capturar pantalla ni fondo oscuro.
   */
  imprimirTicketTermico(pedido: PedidoItem): void {
    const operadorNombre = this.getNombreYApellidoOperador();
    const fechaHora = pedido.fechaPedido
      ? new Date(pedido.fechaPedido).toLocaleString('es-GT', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleString('es-GT');

    const total = Number(pedido.total) || 0;
    const subtotalSinIva = pedido.subtotalSinIva !== undefined ? Number(pedido.subtotalSinIva) : total / 1.12;
    const iva = pedido.iva !== undefined ? Number(pedido.iva) : total - subtotalSinIva;

    const sucursalNombre = pedido.sucursal?.nombre || 'RED CENTRAL FARMACIAS';
    const sucursalDir = pedido.sucursal?.direccion || 'Ciudad de Guatemala';
    const sucursalTel = pedido.sucursal?.telefono || 'PBX: 2200-0000';

    const detallesHtml = (pedido.detalles || [])
      .map(
        (item) => `
        <div style="border-bottom: 1px dotted #ccc; padding: 4px 0;">
          <div style="font-weight: bold; font-size: 11px;">${item.nombre}</div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #333;">
            <span>Lote: ${item.numeroLote || 'N/A'}${item.fechaVencimiento ? ' (Vence: ' + item.fechaVencimiento.slice(0, 7) + ')' : ''}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px;">
            <span>${item.cantidad} x Q ${Number(item.precioUnitario).toFixed(2)}</span>
            <span style="font-weight: bold;">Q ${Number(item.subtotal).toFixed(2)}</span>
          </div>
        </div>
      `
      )
      .join('');

    const ventana = window.open('', '_blank', 'width=420,height=650');
    if (!ventana) return;

    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>Ticket #${pedido.pedidoId} - Red Central Farmacias</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 3mm 4mm;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 72mm;
              margin: 0 auto;
              padding: 4px;
              color: #000;
              font-size: 11px;
              line-height: 1.25;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .double-divider { border-top: 2px solid #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; }
            @media print {
              .no-print { display: none !important; }
              body { width: 100%; margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 12px; text-align: center;">
            <button onclick="window.print()" style="background: #059669; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px;">
              🖨️ Imprimir Ticket (80mm)
            </button>
            <button onclick="window.close()" style="background: #ccc; border: none; padding: 6px 12px; border-radius: 4px; margin-left: 6px; cursor: pointer; font-size: 12px;">
              Cerrar
            </button>
          </div>

          <div class="center">
            <img src="/logo.png" alt="Logo" style="width: 52px; height: 52px; object-fit: contain; margin: 0 auto 4px auto; display: block;" />
            <div class="bold" style="font-size: 14px;">FARMACIA RED CENTRAL</div>
            <div class="bold" style="font-size: 11px; color: #059669;">RED FARMA</div>
            <div style="font-size: 10px;">NIT: 10584732-9</div>
            <div class="bold" style="font-size: 11px; margin-top: 2px;">${sucursalNombre}</div>
            <div style="font-size: 10px;">${sucursalDir}</div>
            <div style="font-size: 10px;">${sucursalTel}</div>
          </div>

          <div class="divider"></div>

          <div class="row">
            <span>TICKET NO.:</span>
            <span class="bold">#${pedido.pedidoId}</span>
          </div>
          <div class="row">
            <span>ATENDIDO POR:</span>
            <span class="bold">${operadorNombre}</span>
          </div>
          <div class="row">
            <span>CANAL:</span>
            <span class="bold">${pedido.origen === 'CALL_CENTER' ? 'CALL CENTER' : 'POS MOSTRADOR'}</span>
          </div>
          <div class="row">
            <span>FECHA:</span>
            <span>${fechaHora}</span>
          </div>
          <div class="row">
            <span>PAGO:</span>
            <span>${pedido.metodoPago || 'EFECTIVO'}</span>
          </div>

          <div class="divider"></div>

          <div>
            <div class="bold">CLIENTE:</div>
            <div>${pedido.cliente?.nombre || 'Consumidor Final'}</div>
            ${pedido.cliente?.telefono ? `<div>Tel: ${pedido.cliente.telefono}</div>` : ''}
            ${pedido.origen === 'CALL_CENTER' && pedido.cliente?.direccion ? `<div style="font-size: 10px;">Dir. Entrega: ${pedido.cliente.direccion}</div>` : ''}
          </div>

          <div class="divider"></div>

          <div style="margin-bottom: 4px;" class="bold">DETALLE DE MEDICAMENTOS (FEFO)</div>
          ${detallesHtml}

          <div class="divider"></div>

          <div class="row">
            <span>Subtotal (Sin IVA):</span>
            <span>Q ${subtotalSinIva.toFixed(2)}</span>
          </div>
          <div class="row">
            <span>IVA (12%):</span>
            <span>Q ${iva.toFixed(2)}</span>
          </div>
          <div class="double-divider"></div>
          <div class="row bold" style="font-size: 14px;">
            <span>TOTAL A PAGAR:</span>
            <span>Q ${total.toFixed(2)}</span>
          </div>
          <div class="double-divider"></div>

          ${
            pedido.origen === 'CALL_CENTER' && pedido.entrega
              ? `
            <div style="font-size: 10px; margin: 4px 0;">
              <div class="bold">DESPACHO A DOMICILIO:</div>
              <div>Estado: ${pedido.entrega.estado || 'EN RUTA'}</div>
              ${pedido.entrega.personaRecibe ? `<div>Recibe: ${pedido.entrega.personaRecibe}</div>` : ''}
            </div>
            <div class="divider"></div>
          `
              : ''
          }

          <div class="center" style="font-size: 10px; margin-top: 8px;">
            <div class="bold">¡GRACIAS POR SU COMPRA!</div>
            <div>Verifique su producto antes de retirarse.</div>
            <div>Conserve este ticket para cualquier cambio o garantía.</div>
            <div style="margin-top: 4px;">*** ROTACIÓN CERTIFICADA FEFO ***</div>
          </div>
        </body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();
    setTimeout(() => {
      ventana.print();
    }, 400);
  }
}
