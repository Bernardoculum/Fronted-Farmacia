import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PlanillasService } from '../../core/services/planillas.service';
import { SucursalesService } from '../../core/services/sucursales.service';
import { NotificationService } from '../../core/services/notification.service';
import { SucursalOption } from '../../core/models/sucursal.models';

@Component({
  selector: 'app-generar-planilla-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  styles: [`
    :host {
      display: block;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      width: 100%;
    }
  `],
  template: `
    <div class="p-5 sm:p-6 w-full max-w-lg bg-white text-slate-800 rounded-2xl">
      <!-- Encabezado -->
      <div class="flex items-start justify-between pb-4 border-b border-slate-200 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs shrink-0">
            <mat-icon class="text-2xl">calculate</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded inline-block">
              Nómina Laboral
            </span>
            <h3 class="text-base sm:text-lg font-black text-slate-800 mt-0.5">Generar Planilla de Sueldos</h3>
            <p class="text-xs text-slate-500">Cálculo de ley para colaboradores activos (IGSS 4.83% y Dto. 37-2001)</p>
          </div>
        </div>
        <button
          type="button"
          mat-icon-button
          (click)="cerrar()"
          class="text-slate-400 hover:text-slate-600"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Callout informativo de reglas laborales -->
      <div class="p-3 mb-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
        <div class="font-bold text-slate-800 flex items-center gap-1">
          <mat-icon class="!text-sm !w-4 !h-4 text-teal-600">gavel</mat-icon>
          <span>Reglas Salariales de Guatemala:</span>
        </div>
        <ul class="list-disc list-inside text-3xs text-slate-500 pl-1 space-y-0.5">
          <li>Sueldo Devengado proporcional a días efectivamente laborados.</li>
          <li>Bonificación Incentivo Ley (Dto. 37-2001: Q250.00 mensual / Q125.00 quincenal, <strong>exenta de IGSS</strong>).</li>
          <li>Retención IGSS Laboral oficial: <strong>4.83%</strong> aplicado estrictamente sobre el sueldo base devengado.</li>
        </ul>
      </div>

      <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-3.5">
        
        <!-- Fila 1: Tipo de Período y Sucursal -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Periodicidad *</label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-select formControlName="tipoPeriodo" (selectionChange)="onTipoPeriodoChange($event.value)">
                <mat-option value="MENSUAL">Mes Completo (Mensual)</mat-option>
                <mat-option value="PRIMERA_QUINCENA">Primera Quincena (01 - 15)</mat-option>
                <mat-option value="SEGUNDA_QUINCENA">Segunda Quincena (16 - Fin de Mes)</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Alcance / Sucursal *</label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-select formControlName="sucursalId">
                <mat-option value="TODAS">Todas las Sucursales</mat-option>
                @for (suc of sucursales(); track suc.sucursalId) {
                  <mat-option [value]="suc.sucursalId">{{ suc.nombre }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <!-- Fila 2: Fechas Autocompletadas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Fecha Inicio del Período *</label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <input matInput type="date" formControlName="fechaInicio" />
              @if (form.get('fechaInicio')?.hasError('required') && form.get('fechaInicio')?.touched) {
                <mat-error class="text-2xs font-medium">Fecha obligatoria</mat-error>
              }
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Fecha Fin del Período *</label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <input matInput type="date" formControlName="fechaFin" />
              @if (form.get('fechaFin')?.hasError('required') && form.get('fechaFin')?.touched) {
                <mat-error class="text-2xs font-medium">Fecha obligatoria</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <!-- Fila 3: Observaciones -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Observación o Nota (Opcional)</label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <input matInput formControlName="observaciones" placeholder="Ej. Planilla Ordinaria de Octubre 2026" />
          </mat-form-field>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button type="button" mat-button (click)="cerrar()" class="!rounded-xl cursor-pointer">
            Cancelar
          </button>
          <button
            type="submit"
            mat-flat-button
            color="primary"
            [disabled]="guardando()"
            class="!rounded-xl !bg-teal-600 !text-white !font-bold !px-5 cursor-pointer"
          >
            <span>{{ guardando() ? 'Generando Liquidación...' : 'Confirmar & Generar Planilla' }}</span>
          </button>
        </div>
      </form>
    </div>
  `
})
export class GenerarPlanillaModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<GenerarPlanillaModalComponent>);
  private readonly planillasService = inject(PlanillasService);
  private readonly sucursalesService = inject(SucursalesService);
  private readonly notification = inject(NotificationService);

  readonly guardando = signal<boolean>(false);
  readonly sucursales = signal<SucursalOption[]>([]);

  readonly form: FormGroup = this.fb.group({
    tipoPeriodo: ['MENSUAL', [Validators.required]],
    sucursalId: ['TODAS', [Validators.required]],
    fechaInicio: ['', [Validators.required]],
    fechaFin: ['', [Validators.required]],
    observaciones: [''],
  });

  ngOnInit(): void {
    this.cargarSucursales();
    this.aplicarFechasPorPeriodo('MENSUAL');
  }

  private cargarSucursales(): void {
    this.sucursalesService.cargarSucursales().subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.sucursales.set(list);
      },
    });
  }

  onTipoPeriodoChange(tipo: string): void {
    this.aplicarFechasPorPeriodo(tipo);
  }

  private aplicarFechasPorPeriodo(tipo: string): void {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();

    const pad = (n: number) => n < 10 ? '0' + n : '' + n;
    const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (tipo === 'PRIMERA_QUINCENA') {
      const inicio = new Date(anio, mes, 1);
      const fin = new Date(anio, mes, 15);
      this.form.patchValue({
        fechaInicio: format(inicio),
        fechaFin: format(fin),
      });
    } else if (tipo === 'SEGUNDA_QUINCENA') {
      const inicio = new Date(anio, mes, 16);
      const fin = new Date(anio, mes + 1, 0);
      this.form.patchValue({
        fechaInicio: format(inicio),
        fechaFin: format(fin),
      });
    } else {
      // MENSUAL
      const inicio = new Date(anio, mes, 1);
      const fin = new Date(anio, mes + 1, 0);
      this.form.patchValue({
        fechaInicio: format(inicio),
        fechaFin: format(fin),
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const val = this.form.value;

    this.planillasService
      .generarPlanilla({
        fechaInicio: val.fechaInicio,
        fechaFin: val.fechaFin,
        tipoPeriodo: val.tipoPeriodo,
        sucursalId: val.sucursalId === 'TODAS' ? undefined : Number(val.sucursalId),
        observaciones: val.observaciones?.trim() || undefined,
      })
      .subscribe({
        next: (res: any) => {
          this.guardando.set(false);
          this.dialogRef.close(res);
          this.notification.success(
            'Planilla Generada',
            `Se procesó la liquidación para ${res.colaboradoresProcesados || 'los'} colaboradores con éxito.`
          );
        },
        error: (err: any) => {
          this.guardando.set(false);
          this.notification.error('Error al generar planilla', err?.error?.message || 'Error en el cálculo');
        },
      });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
