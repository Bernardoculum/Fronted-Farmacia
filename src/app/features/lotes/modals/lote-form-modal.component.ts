import { CustomValidators } from '../../../shared/validators/custom-validators';
import { OnlyNumbersDirective } from '../../../shared/directives/only-numbers.directive';
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  FormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LotesService } from '../../../core/services/lotes.service';
import { ProductosService } from '../../../core/services/productos.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductoListItem } from '../../../core/models/producto.models';
import { LoteItem, CreateLoteDto } from '../../../core/models/lote.models';

export interface ItemRecepcion {
  idTemp: string;
  productoId: number;
  codigoProducto: string;
  nombreProducto: string;
  presentacion?: string;
  numeroLote: string;
  fechaVencimiento: string;
  fechaFabricacion?: string;
  costoUnitario: number;
  precioVentaActual?: number;
  nuevoPrecioVenta?: number;
  stockInicial: number;
  subtotal: number;
}

/** Validador de coherencia cronológica en fechas */
function validadorFechas(group: AbstractControl): ValidationErrors | null {
  const fab = group.get('fechaFabricacion')?.value;
  const venc = group.get('fechaVencimiento')?.value;
  if (!venc) return null;

  const hoy = new Date().toISOString().split('T')[0];

  if (venc <= hoy) {
    return { vencimientoPasado: true };
  }

  if (fab && venc && fab >= venc) {
    return { fechaInvalida: true };
  }

  return null;
}

@Component({
  selector: 'app-lote-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    OnlyNumbersDirective,
  ],
  template: `
    <div class="p-4 sm:p-5 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      
      <!-- Encabezado Simple -->
      <div class="flex items-center justify-between border-b border-slate-200 pb-3 mb-3.5">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-indigo-50 text-teal-700 flex items-center justify-center">
            <mat-icon class="text-xl leading-none">local_shipping</mat-icon>
          </div>
          <div>
            <h2 class="text-base font-black text-slate-800 leading-tight">
              Recepción de Factura y Lotes
            </h2>
            <p class="text-xs text-slate-500">Ingreso de medicamentos al inventario</p>
          </div>
        </div>

        <button mat-icon-button (click)="dialogRef.close()" class="text-slate-400 hover:text-slate-600">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Alerta de Error -->
      @if (errorMessage()) {
        <div class="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
          <mat-icon class="text-rose-500 shrink-0 text-base">error_outline</mat-icon>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <!-- Sucursal Destino y Factura -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2.5">
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-2xs font-bold text-slate-600 uppercase">
              Sucursal Destino *
            </label>
            <div class="flex items-center gap-1.5">
              @if (sucursalDestinoId() === 1) {
                <span class="text-3xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Bodega Central
                </span>
              } @else {
                <span class="text-3xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Excepción Local
                </span>
                <button
                  type="button"
                  (click)="restaurarBodegaCentral()"
                  class="text-3xs text-teal-700 hover:text-teal-900 font-bold underline inline-flex items-center gap-0.5"
                  matTooltip="Restaurar a Bodega Central"
                >
                  <mat-icon class="!w-3 !h-3 !text-xs leading-none">undo</mat-icon> Restaurar
                </button>
              }
            </div>
          </div>
          <mat-form-field appearance="outline" class="w-full">
            <mat-select [value]="sucursalDestinoId()" (selectionChange)="sucursalDestinoId.set($event.value)">
              @for (suc of sucursales; track suc.id) {
                <mat-option [value]="suc.id">{{ suc.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-2xs font-bold text-slate-600 uppercase">
              No. Factura Proveedor
            </label>
            <button
              type="button"
              (click)="regenerarCorrelativoFactura()"
              class="text-3xs text-teal-700 font-bold hover:underline inline-flex items-center gap-0.5"
            >
              <mat-icon class="!w-3 !h-3 !text-xs leading-none">refresh</mat-icon>
              Autogenerar
            </button>
          </div>
          <mat-form-field appearance="outline" class="w-full">
            <input
              matInput
              [value]="numeroFactura()"
              (input)="numeroFactura.set($any($event.target).value)"
              placeholder="Ej. FAC-2026-0001"
            />
          </mat-form-field>
        </div>
      </div>

      <!-- Alerta preventiva con botón de restauración si eligió otra sucursal -->
      @if (sucursalDestinoId() !== 1) {
        <div class="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-amber-900 text-xs shadow-2xs">
          <div class="flex items-center gap-2">
            <mat-icon class="text-amber-600 text-base shrink-0">info</mat-icon>
            <span>
              Ingreso directo a <strong>{{ nombreSucursalSeleccionada() }}</strong> (fuera de Bodega Central).
            </span>
          </div>
          <button
            type="button"
            (click)="restaurarBodegaCentral()"
            class="text-2xs font-bold text-emerald-700 bg-white border border-amber-300 hover:bg-amber-100 px-2.5 py-1 rounded-lg shrink-0 shadow-2xs transition-colors inline-flex items-center gap-1"
          >
            <mat-icon class="!w-3.5 !h-3.5 !text-sm leading-none">undo</mat-icon>
            Volver a Bodega Central
          </button>
        </div>
      }

      <!-- Formulario para Agregar Medicamento -->
      <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-3.5 space-y-2.5">
        <div class="flex items-center gap-1.5 pb-2 border-b border-slate-200/80 text-xs font-bold text-slate-700">
          <mat-icon class="text-base text-emerald-600">medication</mat-icon>
          <span>Renglón de Compra: Medicamento y Lote Sanitario</span>
        </div>
        <form [formGroup]="formRenglon" (ngSubmit)="agregarRenglon()" class="space-y-2.5">
          
          <!-- Medicamento -->
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
              Medicamento *
            </label>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select
                formControlName="productoId"
                placeholder="Selecciona el medicamento"
                (selectionChange)="onProductoSeleccionado($event.value)"
              >
                @for (prod of listaProductos(); track prod.productoId) {
                  <mat-option [value]="prod.productoId">
                    <span class="font-bold text-slate-800">{{ prod.codigoProducto }}</span>
                    — {{ prod.nombre }}
                    <span class="text-slate-400 text-xs font-normal">({{ prod.presentacion || 'Unidad' }})</span>
                  </mat-option>
                }
              </mat-select>
              @if (formRenglon.get('productoId')?.hasError('required') && formRenglon.get('productoId')?.touched) {
                <mat-error>Selecciona un medicamento</mat-error>
              }
            </mat-form-field>
          </div>

          <!-- Lote, Costo y Precio de Venta -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-2xs font-bold text-slate-600 uppercase">
                  Número de Lote *
                </label>
                <button
                  type="button"
                  (click)="sugerirLoteParaProductoActual()"
                  class="text-3xs text-teal-700 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  <mat-icon class="!w-3 !h-3 !text-xs leading-none">auto_awesome</mat-icon>
                  Sugerir
                </button>
              </div>
              <mat-form-field appearance="outline" class="w-full">
                <input matInput formControlName="numeroLote" placeholder="Ej. LOT-PAR-2026-01" />
                @if (formRenglon.get('numeroLote')?.hasError('required') && formRenglon.get('numeroLote')?.touched) {
                  <mat-error>El lote es obligatorio</mat-error>
                }
              </mat-form-field>
            </div>

            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
                Costo Unitario (Q) *
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  matInput
                  type="text"
                  formControlName="costoUnitario"
                  appOnlyNumbers
                  [allowDecimals]="true"
                  placeholder="0.00"
                />
                @if (formRenglon.get('costoUnitario')?.hasError('required') && formRenglon.get('costoUnitario')?.touched) {
                  <mat-error>Ingresa el costo</mat-error>
                }
                @if ((formRenglon.get('costoUnitario')?.hasError('min') || formRenglon.get('costoUnitario')?.hasError('montoInvalido')) && formRenglon.get('costoUnitario')?.touched) {
                  <mat-error>El costo debe ser mayor a Q 0.00</mat-error>
                }
              </mat-form-field>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-2xs font-bold text-slate-600 uppercase">
                  Precio Venta (Q)
                </label>
                <div class="flex items-center gap-1">
                  @if (margenCalculado !== null) {
                    @if (estadoMargen === 'SALUDABLE') {
                      <span class="text-3xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded" matTooltip="Margen de ganancia saludable (>25%)">
                        {{ margenCalculado | number:'1.0-1' }}% 🟢
                      </span>
                    } @else if (estadoMargen === 'COMERCIAL') {
                      <span class="text-3xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded" matTooltip="Margen comercial normal (15%-25%)">
                        {{ margenCalculado | number:'1.0-1' }}% 🟡
                      </span>
                    } @else {
                      <span class="text-3xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded animate-pulse" matTooltip="Margen crítico: por debajo del 15% mínimo de farmacia">
                        {{ margenCalculado | number:'1.0-1' }}% 🚨
                      </span>
                    }
                  }
                  @if (!puedeEditarPrecio) {
                    <button
                      type="button"
                      (click)="desbloqueoManual.set(true)"
                      class="text-3xs text-slate-400 hover:text-teal-700 font-bold ml-1 inline-flex items-center gap-0.5 cursor-pointer"
                      matTooltip="Desbloquear para editar manualmente"
                    >
                      <mat-icon class="!w-3 !h-3 !text-xs leading-none">lock</mat-icon>
                    </button>
                  }
                </div>
              </div>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  matInput
                  type="text"
                  formControlName="nuevoPrecioVenta"
                  appOnlyNumbers
                  [allowDecimals]="true"
                  placeholder="0.00"
                  [readonly]="!puedeEditarPrecio"
                  [class.bg-slate-100]="!puedeEditarPrecio"
                  [class.text-slate-500]="!puedeEditarPrecio"
                />
                @if ((formRenglon.get('nuevoPrecioVenta')?.hasError('min') || formRenglon.get('nuevoPrecioVenta')?.hasError('montoInvalido')) && formRenglon.get('nuevoPrecioVenta')?.touched) {
                  <mat-error>Debe ser mayor a Q 0.00</mat-error>
                }
                @if (!puedeEditarPrecio) {
                  <mat-icon matSuffix class="text-slate-400 !text-sm mr-1">lock</mat-icon>
                }
              </mat-form-field>
            </div>
          </div>

          <!-- Alerta Inteligente de Margen si cae por debajo del 15% -->
          @if (estadoMargen === 'CRITICO') {
            <div class="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center justify-between gap-2 shadow-2xs">
              <div class="flex items-center gap-2">
                <mat-icon class="text-rose-600 text-base shrink-0">emergency</mat-icon>
                <span>
                  <strong>Margen Crítico ({{ margenCalculado | number:'1.0-1' }}%):</strong> 
                  El costo unitario (Q {{ formRenglon.get('costoUnitario')?.value | number:'1.2-2' }}) no cubre el 15% mínimo operativo de farmacia. Se desbloqueó la edición.
                </span>
              </div>
              @if (sugerenciaPrecioMinimo) {
                <button
                  type="button"
                  (click)="aplicarPrecioSugerido()"
                  class="text-2xs font-bold text-rose-700 bg-white border border-rose-300 hover:bg-rose-100 px-2.5 py-1 rounded-lg shrink-0 transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                  matTooltip="Ajustar precio para obtener 25% de margen"
                >
                  <mat-icon class="!w-3.5 !h-3.5 !text-sm leading-none">auto_fix_high</mat-icon>
                  Subir a Q {{ sugerenciaPrecioMinimo | number:'1.2-2' }} (25%)
                </button>
              }
            </div>
          }

          <!-- Fechas -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
                Fecha Fabricación
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  #fechaFabInput
                  matInput
                  type="date"
                  formControlName="fechaFabricacion"
                  [max]="maxFechaFabricacion()"
                  class="cursor-pointer"
                  (click)="abrirCalendario(fechaFabInput)"
                />
                <button
                  type="button"
                  mat-icon-button
                  matSuffix
                  (click)="abrirCalendario(fechaFabInput)"
                  class="text-slate-400 hover:text-teal-700"
                >
                  <mat-icon>calendar_month</mat-icon>
                </button>
              </mat-form-field>
            </div>

            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
                Fecha Vencimiento *
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  #fechaVencInput
                  matInput
                  type="date"
                  formControlName="fechaVencimiento"
                  [min]="minFechaVencimiento()"
                  class="cursor-pointer"
                  (click)="abrirCalendario(fechaVencInput)"
                />
                <button
                  type="button"
                  mat-icon-button
                  matSuffix
                  (click)="abrirCalendario(fechaVencInput)"
                  class="text-slate-400 hover:text-teal-700"
                >
                  <mat-icon>calendar_month</mat-icon>
                </button>
                @if (formRenglon.get('fechaVencimiento')?.hasError('required') && formRenglon.get('fechaVencimiento')?.touched) {
                  <mat-error>Fecha obligatoria</mat-error>
                }
              </mat-form-field>
            </div>
          </div>

          <!-- Alertas de Fecha (Solo si hay error) -->
          @if (formRenglon.hasError('fechaInvalida')) {
            <div class="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-1.5">
              <mat-icon class="text-rose-500 text-sm shrink-0">error_outline</mat-icon>
              <span>La fecha de fabricación debe ser anterior a la de vencimiento.</span>
            </div>
          }
          @if (formRenglon.hasError('vencimientoPasado')) {
            <div class="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-1.5">
              <mat-icon class="text-rose-500 text-sm shrink-0">warning</mat-icon>
              <span>La fecha de vencimiento debe ser futura.</span>
            </div>
          }

          <!-- Cajas y Botón Agregar -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
                Cajas a Ingresar *
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  matInput
                  type="text"
                  formControlName="stockInicial"
                  appOnlyNumbers
                  placeholder="0"
                />
                @if (formRenglon.get('stockInicial')?.hasError('required') && formRenglon.get('stockInicial')?.touched) {
                  <mat-error>Ingresa la cantidad</mat-error>
                }
                @if ((formRenglon.get('stockInicial')?.hasError('min') || formRenglon.get('stockInicial')?.hasError('enteroInvalido')) && formRenglon.get('stockInicial')?.touched) {
                  <mat-error>Debe ingresar un número entero mayor a 0</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="flex items-center justify-end gap-2 pb-5">
              @if (editandoId()) {
                <button
                  type="button"
                  mat-button
                  (click)="cancelarEdicion()"
                  class="!rounded-xl text-slate-500 hover:text-slate-700 !h-11 !px-3"
                >
                  Cancelar
                </button>
              }

              <button
                type="submit"
                mat-flat-button
                color="primary"
                [disabled]="formRenglon.invalid"
                class="!rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !text-white !font-bold !h-11 !px-5 shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <mat-icon class="text-base">{{ editandoId() ? 'check' : 'add' }}</mat-icon>
                <span>{{ editandoId() ? 'Actualizar' : 'Añadir' }}</span>
              </button>
            </div>
          </div>

        </form>
      </div>

      <!-- Tabla de Medicamentos Agregados -->
      <div class="border border-slate-200 rounded-xl overflow-hidden mb-3 shadow-2xs">
        <div class="bg-slate-100/70 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
          <span class="text-2xs font-bold text-slate-700 uppercase tracking-wider">
            Medicamentos en la Factura ({{ itemsRecepcion().length }})
          </span>
          @if (itemsRecepcion().length > 0) {
            <button type="button" (click)="limpiarItems()" class="text-2xs text-rose-600 font-bold hover:underline">
              Vaciar lista
            </button>
          }
        </div>

        @if (itemsRecepcion().length > 0) {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold text-2xs uppercase">
                  <th class="py-2 px-3">Medicamento</th>
                  <th class="py-2 px-3">Lote</th>
                  <th class="py-2 px-3">Vence</th>
                  <th class="py-2 px-3 text-right">Cajas</th>
                  <th class="py-2 px-3 text-right">Costo</th>
                  <th class="py-2 px-3 text-right">P. Venta</th>
                  <th class="py-2 px-3 text-right">Subtotal</th>
                  <th class="py-2 px-3 text-center w-10"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (item of itemsRecepcion(); track item.idTemp) {
                  <tr 
                    class="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                    [class.bg-emerald-50]="editandoId() === item.idTemp"
                    (click)="editarItem(item)"
                    matTooltip="Clic para editar este renglón"
                  >
                    <td class="py-2 px-3">
                      <span class="font-bold text-slate-800 group-hover:text-emerald-800">{{ item.nombreProducto }}</span>
                      <span class="text-slate-400 text-3xs font-mono ml-1">({{ item.codigoProducto }})</span>
                    </td>
                    <td class="py-2 px-3 font-mono font-bold text-slate-700">{{ item.numeroLote }}</td>
                    <td class="py-2 px-3 text-slate-600">{{ item.fechaVencimiento | date:'dd/MM/yyyy' }}</td>
                    <td class="py-2 px-3 text-right font-bold text-slate-800">{{ item.stockInicial }} u.</td>
                    <td class="py-2 px-3 text-right text-slate-600">Q {{ item.costoUnitario | number:'1.2-2' }}</td>
                    <td class="py-2 px-3 text-right font-semibold">
                      @if (item.nuevoPrecioVenta && item.precioVentaActual && item.nuevoPrecioVenta !== item.precioVentaActual) {
                        <span class="text-emerald-700 font-bold inline-flex items-center gap-0.5" [matTooltip]="'Precio actualizado de Q ' + (item.precioVentaActual | number:'1.2-2') + ' a Q ' + (item.nuevoPrecioVenta | number:'1.2-2')">
                          Q {{ item.nuevoPrecioVenta | number:'1.2-2' }} <mat-icon class="!text-xs !w-3 !h-3">north</mat-icon>
                        </span>
                      } @else {
                        <span class="text-slate-600">
                          Q {{ (item.nuevoPrecioVenta || item.precioVentaActual || 0) | number:'1.2-2' }}
                        </span>
                      }
                    </td>
                    <td class="py-2 px-3 text-right font-black text-emerald-700">Q {{ item.subtotal | number:'1.2-2' }}</td>
                    <td class="py-2 px-3 text-center whitespace-nowrap" (click)="$event.stopPropagation()">
                      <button
                        type="button"
                        mat-icon-button
                        (click)="editarItem(item)"
                        matTooltip="Editar"
                        class="text-slate-400 hover:text-emerald-700 !w-6 !h-6 mr-1"
                      >
                        <mat-icon class="!text-sm">edit</mat-icon>
                      </button>
                      <button
                        type="button"
                        mat-icon-button
                        (click)="eliminarItem(item.idTemp)"
                        matTooltip="Eliminar"
                        class="text-slate-300 hover:text-rose-600 !w-6 !h-6"
                      >
                        <mat-icon class="!text-sm">delete</mat-icon>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="p-4 text-center text-slate-400 bg-white text-xs">
            No hay medicamentos agregados a la factura todavía.
          </div>
        }
      </div>

      <!-- Resumen del Total Invertido (Limpio y Directo) -->
      @if (itemsRecepcion().length > 0) {
        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between mb-3 shadow-xs">
          <div class="text-xs text-emerald-900 font-bold">
            {{ itemsRecepcion().length }} {{ itemsRecepcion().length === 1 ? 'medicamento' : 'medicamentos' }} • {{ totalUnidades() }} cajas
          </div>
          <div class="text-right">
            <span class="text-3xs uppercase font-bold text-emerald-800 block">Total Invertido</span>
            <span class="text-lg sm:text-xl font-black text-emerald-700">
              Q {{ totalInvertido() | number:'1.2-2' }}
            </span>
          </div>
        </div>
      }

      <!-- Botones de Acción -->
      <div class="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
        <button type="button" mat-button (click)="dialogRef.close()" class="!rounded-xl text-slate-600">
          Cancelar
        </button>
        
        <button
          type="button"
          mat-flat-button
          color="primary"
          [disabled]="(itemsRecepcion().length === 0 && formRenglon.invalid) || saving()"
          (click)="guardarTodo()"
          class="!rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !text-white !font-bold !px-6 !h-10 shadow-xs cursor-pointer inline-flex items-center gap-1.5"
        >
          @if (saving()) {
            <span>Guardando...</span>
          } @else {
            <span class="inline-flex items-center gap-1.5">
              <mat-icon class="text-base">check_circle</mat-icon>
              <span>Guardar</span>
            </span>
          }
        </button>
      </div>

    </div>
  `,
})
export class LoteFormModalComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<LoteFormModalComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly lotesService = inject(LotesService);
  private readonly productosService = inject(ProductosService);
  private readonly notification = inject(NotificationService);

  readonly sucursales = [
    { id: 1, nombre: 'Sucursal Central (Atanasio Tzul Z.12) [Sede Principal]' },
    { id: 2, nombre: 'Stand Gasolinera Mixco Norte' },
    { id: 3, nombre: 'Sucursal Antigua Calzada' },
    { id: 4, nombre: 'Sucursal Xela Los Altos' },
    { id: 5, nombre: 'Stand Gasolinera Autopista Escuintla' },
  ];

  readonly hoyStr = new Date().toISOString().split('T')[0];
  readonly sucursalDestinoId = signal<number>(1);
  readonly numeroFactura = signal<string>(`FAC-${new Date().getFullYear()}-0001`);
  readonly listaProductos = signal<ProductoListItem[]>([]);
  readonly lotesExistentes = signal<LoteItem[]>([]);
  readonly itemsRecepcion = signal<ItemRecepcion[]>([]);
  readonly editandoId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly desbloqueoManual = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Formulario del renglón sin valores prellenados arbitrarios
  readonly formRenglon = this.fb.group(
    {
      productoId: [null as number | null, [Validators.required]],
      numeroLote: ['', [Validators.required]],
      fechaFabricacion: [''],
      fechaVencimiento: ['', [Validators.required]],
      costoUnitario: [null as number | null, [Validators.required, CustomValidators.montoPositivo()]],
      nuevoPrecioVenta: [null as number | null, [CustomValidators.montoPositivo()]],
      stockInicial: [null as number | null, [Validators.required, CustomValidators.enteroPositivo()]],
    },
    { validators: [validadorFechas] }
  );

  readonly minFechaVencimiento = computed(() => {
    const fab = this.formRenglon.get('fechaFabricacion')?.value;
    return fab && fab > this.hoyStr ? fab : this.hoyStr;
  });

  readonly productoActual = computed(() => {
    const pId = Number(this.formRenglon.get('productoId')?.value);
    if (!pId) return null;
    return this.listaProductos().find((p) => p.productoId === pId) || null;
  });

  get margenCalculado(): number | null {
    const costo = Number(this.formRenglon.get('costoUnitario')?.value) || 0;
    const pvp = Number(this.formRenglon.get('nuevoPrecioVenta')?.value) || Number(this.productoActual()?.precioVenta) || 0;
    if (pvp <= 0 || costo <= 0) return null;
    return ((pvp - costo) / pvp) * 100;
  }

  get estadoMargen(): 'SALUDABLE' | 'COMERCIAL' | 'CRITICO' | 'NEUTRO' {
    const m = this.margenCalculado;
    if (m === null) return 'NEUTRO';
    if (m < 15) return 'CRITICO';
    if (m < 25) return 'COMERCIAL';
    return 'SALUDABLE';
  }

  get puedeEditarPrecio(): boolean {
    return this.estadoMargen === 'CRITICO' || this.desbloqueoManual();
  }

  get sugerenciaPrecioMinimo(): number | null {
    const costo = Number(this.formRenglon.get('costoUnitario')?.value) || 0;
    if (costo <= 0) return null;
    // Margen del 25% deseado: Costo / (1 - 0.25)
    const pvpIdeal = costo / 0.75;
    return Math.round(pvpIdeal * 100) / 100;
  }

  aplicarPrecioSugerido(): void {
    const sugerido = this.sugerenciaPrecioMinimo;
    if (sugerido) {
      this.desbloqueoManual.set(true);
      this.formRenglon.patchValue({ nuevoPrecioVenta: sugerido });
    }
  }

  readonly maxFechaFabricacion = computed(() => {
    const venc = this.formRenglon.get('fechaVencimiento')?.value;
    return venc && venc < this.hoyStr ? venc : this.hoyStr;
  });

  readonly nombreSucursalSeleccionada = computed(() => {
    const s = this.sucursales.find((x) => x.id === this.sucursalDestinoId());
    return s ? s.nombre : `Sucursal #${this.sucursalDestinoId()}`;
  });

  readonly nombreSucursalCorta = computed(() => {
    const id = this.sucursalDestinoId();
    if (id === 1) return 'Bodega Central';
    if (id === 2) return 'Mixco';
    if (id === 3) return 'Antigua';
    if (id === 4) return 'Xela';
    if (id === 5) return 'Escuintla';
    return `Sucursal #${id}`;
  });

  readonly totalInvertido = computed(() => {
    return this.itemsRecepcion().reduce((acc, item) => acc + item.subtotal, 0);
  });

  readonly totalUnidades = computed(() => {
    return this.itemsRecepcion().reduce((acc, item) => acc + item.stockInicial, 0);
  });

  ngOnInit(): void {
    // 1. Cargar lotes para correlativos históricos
    this.lotesService.cargarLotes().subscribe({
      next: (res) => {
        const lotesArray = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
        this.lotesExistentes.set(lotesArray);
        this.regenerarCorrelativoFactura();
        this.sugerirLoteParaProductoActual();
      },
    });

    // 2. Cargar catálogo de productos
    this.productosService.cargarProductos({ limit: 100 }).subscribe({
      next: (res) => {
        this.listaProductos.set(res.data || []);
        if (res.data && res.data.length > 0) {
          const primerProd = res.data[0];
          this.formRenglon.patchValue({ 
            productoId: primerProd.productoId,
            nuevoPrecioVenta: primerProd.precioVenta,
          });
          this.sugerirLoteParaProductoActual();
        }
      },
    });

    // Fecha de vencimiento sugerida (2 años en adelante)
    const enDosAnos = new Date();
    enDosAnos.setFullYear(enDosAnos.getFullYear() + 2);
    this.formRenglon.patchValue({
      fechaVencimiento: enDosAnos.toISOString().split('T')[0],
    });
  }

  restaurarBodegaCentral(): void {
    this.sucursalDestinoId.set(1);
  }

  regenerarCorrelativoFactura(): void {
    const anio = new Date().getFullYear();
    const list = Array.isArray(this.lotesExistentes()) ? this.lotesExistentes() : [];
    const count = list.length + 1;
    const pad = count < 10 ? `000${count}` : count < 100 ? `00${count}` : count < 1000 ? `0${count}` : `${count}`;
    this.numeroFactura.set(`FAC-${anio}-${pad}`);
  }

  onProductoSeleccionado(prodId: number): void {
    this.desbloqueoManual.set(false);
    const prod = this.listaProductos().find((p) => p.productoId === Number(prodId));
    if (prod) {
      this.formRenglon.patchValue({
        nuevoPrecioVenta: prod.precioVenta,
      });
    }
    // Generar vencimiento predeterminado a 2 años y sugerir lote individual
    const enDosAnos = new Date();
    enDosAnos.setFullYear(enDosAnos.getFullYear() + 2);
    this.formRenglon.patchValue({
      fechaVencimiento: enDosAnos.toISOString().split('T')[0],
    });
    this.sugerirLoteParaProductoActual();
  }

  sugerirLoteParaProductoActual(): void {
    const prodId = Number(this.formRenglon.get('productoId')?.value);
    if (!prodId) return;

    const prod = this.listaProductos().find((p) => p.productoId === prodId);
    if (!prod) return;

    const baseName = (prod.principioActivo || prod.nombre || 'MED')
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase();
    const prefix = baseName.substring(0, 3) || 'MED';
    const currentYear = new Date().getFullYear();

    const list = Array.isArray(this.lotesExistentes()) ? this.lotesExistentes() : [];
    const lotesBd = list.filter((l) => l.producto?.productoId === prodId);
    const lotesEnTabla = this.itemsRecepcion().filter((it) => it.productoId === prodId);
    const nextNum = lotesBd.length + lotesEnTabla.length + 1;
    const numStr = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;

    this.formRenglon.patchValue({
      numeroLote: `LOT-${prefix}-${currentYear}-${numStr}`,
    });
  }

  abrirCalendario(input: HTMLInputElement): void {
    try {
      if (typeof input.showPicker === 'function') {
        input.showPicker();
      } else {
        input.focus();
      }
    } catch {
      input.focus();
    }
  }

  agregarRenglon(): void {
    if (this.formRenglon.invalid) {
      this.formRenglon.markAllAsTouched();
      return;
    }

    const val = this.formRenglon.getRawValue();
    const prod = this.listaProductos().find((p) => p.productoId === Number(val.productoId));

    if (!prod) return;

    const idEdicion = this.editandoId();

    // Validación: Evitar duplicar el mismo lote para el mismo producto en esta factura (ignorando la fila que se edita)
    const yaEnLista = this.itemsRecepcion().some(
      (it) => it.idTemp !== idEdicion && it.productoId === prod.productoId && it.numeroLote.toUpperCase() === val.numeroLote!.trim().toUpperCase()
    );
    if (yaEnLista) {
      this.errorMessage.set(`El lote "${val.numeroLote!.trim()}" ya fue agregado a esta factura para ${prod.nombre}.`);
      return;
    }

    const costo = Number(val.costoUnitario) || 0;
    const cant = Number(val.stockInicial) || 0;
    const nuevoPvp = val.nuevoPrecioVenta ? Number(val.nuevoPrecioVenta) : undefined;
    const subtotal = costo * cant;

    if (idEdicion) {
      // Actualización de renglón existente
      this.itemsRecepcion.update((prev) =>
        prev.map((it) =>
          it.idTemp === idEdicion
            ? {
                ...it,
                productoId: prod.productoId,
                codigoProducto: prod.codigoProducto,
                nombreProducto: prod.nombre,
                presentacion: prod.presentacion,
                numeroLote: val.numeroLote!.trim(),
                fechaVencimiento: val.fechaVencimiento!,
                fechaFabricacion: val.fechaFabricacion || undefined,
                costoUnitario: costo,
                precioVentaActual: prod.precioVenta,
                nuevoPrecioVenta: nuevoPvp,
                stockInicial: cant,
                subtotal,
              }
            : it
        )
      );
      this.editandoId.set(null);
    } else {
      const nuevoItem: ItemRecepcion = {
        idTemp: Math.random().toString(36).substring(2, 9),
        productoId: prod.productoId,
        codigoProducto: prod.codigoProducto,
        nombreProducto: prod.nombre,
        presentacion: prod.presentacion,
        numeroLote: val.numeroLote!.trim(),
        fechaVencimiento: val.fechaVencimiento!,
        fechaFabricacion: val.fechaFabricacion || undefined,
        costoUnitario: costo,
        precioVentaActual: prod.precioVenta,
        nuevoPrecioVenta: nuevoPvp,
        stockInicial: cant,
        subtotal,
      };

      this.itemsRecepcion.update((prev) => [...prev, nuevoItem]);
    }

    // Limpiar campos
    this.desbloqueoManual.set(false);
    this.formRenglon.patchValue({
      numeroLote: '',
      costoUnitario: null,
      stockInicial: null,
    });
    this.formRenglon.markAsUntouched();
    this.errorMessage.set(null);

    this.sugerirLoteParaProductoActual();
  }

  editarItem(item: ItemRecepcion): void {
    this.editandoId.set(item.idTemp);
    this.formRenglon.patchValue({
      productoId: item.productoId,
      numeroLote: item.numeroLote,
      fechaFabricacion: item.fechaFabricacion || '',
      fechaVencimiento: item.fechaVencimiento,
      costoUnitario: item.costoUnitario,
      nuevoPrecioVenta: item.nuevoPrecioVenta || item.precioVentaActual || null,
      stockInicial: item.stockInicial,
    });
    this.formRenglon.markAsUntouched();
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.desbloqueoManual.set(false);
    this.formRenglon.reset();
    this.formRenglon.markAsUntouched();
    this.sugerirLoteParaProductoActual();
  }

  eliminarItem(idTemp: string): void {
    this.itemsRecepcion.update((prev) => prev.filter((it) => it.idTemp !== idTemp));
  }

  limpiarItems(): void {
    this.itemsRecepcion.set([]);
  }

  guardarTodo(): void {
    if (this.itemsRecepcion().length === 0 && this.formRenglon.valid) {
      this.agregarRenglon();
    }

    if (this.itemsRecepcion().length === 0 || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const sucId = Number(this.sucursalDestinoId());

    const noFac = this.numeroFactura()?.trim();
    const preciosCambiados = this.itemsRecepcion().filter(
      (it) => it.nuevoPrecioVenta && it.precioVentaActual && it.nuevoPrecioVenta !== it.precioVentaActual
    ).length;

    const dtos: CreateLoteDto[] = this.itemsRecepcion().map((it) => ({
      productoId: it.productoId,
      numeroLote: it.numeroLote.trim(),
      fechaVencimiento: it.fechaVencimiento,
      fechaFabricacion: it.fechaFabricacion || undefined,
      costoUnitario: it.costoUnitario,
      nuevoPrecioVenta: it.nuevoPrecioVenta && it.nuevoPrecioVenta > 0 ? it.nuevoPrecioVenta : undefined,
      sucursalId: sucId,
      stockInicial: it.stockInicial,
      observacion: noFac ? `Factura: ${noFac} | Lote: ${it.numeroLote.trim()}` : undefined,
    }));

    this.lotesService.createLotesBatch(dtos).subscribe({
      next: (res) => {
        this.saving.set(false);
        let msg = `Factura e ingreso de ${this.itemsRecepcion().length} medicamentos guardados exitosamente.`;
        if (preciosCambiados > 0) {
          msg += ` Se actualizó el precio de venta de ${preciosCambiados} medicamento(s).`;
        }
        this.notification.success(msg);
        this.dialogRef.close({
          ...res,
          totalInvertido: this.totalInvertido(),
          totalUnidades: this.totalUnidades(),
          sucursalId: sucId,
          numeroFactura: this.numeroFactura(),
        });
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err.error?.message || 'Error al procesar el ingreso de los lotes en la base de datos.';
        this.errorMessage.set(msg);
        this.notification.error(msg);
      },
    });
  }
}
