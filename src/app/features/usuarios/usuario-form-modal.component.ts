import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsersService } from '../../core/services/users.service';
import { SucursalesService } from '../../core/services/sucursales.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { FormatEnumPipe } from '../../shared/pipes/format-enum.pipe';
import { OnlyNumbersDirective } from '../../shared/directives/only-numbers.directive';
import { OnlyLettersDirective } from '../../shared/directives/only-letters.directive';
import { CustomValidators } from '../../shared/validators/custom-validators';
import { UserItem, RolOption, ColaboradorDisponible } from '../../core/models/users.models';

@Component({
  selector: 'app-usuario-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    FormatEnumPipe,
    OnlyNumbersDirective,
    OnlyLettersDirective,
  ],
  styles: [`
    :host {
      display: block;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      width: 100%;
    }
    ::ng-deep .usuario-dialog-field .mat-mdc-form-field-subscript-wrapper {
      padding-top: 2px !important;
      font-size: 0.72rem !important;
    }
  `],
  template: `
    <div class="p-5 sm:p-6 w-full bg-white text-slate-800">
      
      <!-- Encabezado Estandarizado -->
      <div class="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs shrink-0">
            <mat-icon class="text-2xl">{{ isEditing ? 'badge' : 'person_add' }}</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded inline-block">
              Seguridad & Usuarios
            </span>
            <h2 class="text-base sm:text-lg font-black text-slate-800 mt-0.5">
              {{ isEditing ? (isCurrentUser ? 'Modificar Mi Perfil' : 'Modificar Colaborador') : 'Nuevo Colaborador' }}
            </h2>
            <p class="text-xs text-slate-500">
              {{ isEditing ? (isCurrentUser ? 'Actualiza tu información personal o credenciales de acceso' : 'Actualiza los datos del colaborador') : 'Registra un nuevo colaborador con credenciales de acceso al sistema' }}
            </p>
          </div>
        </div>

        <button
          type="button"
          (click)="dialogRef.close(false)"
          class="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Tabs Selector Interactivo -->
      <div class="flex border-b border-slate-200 bg-slate-50/70 px-2 pt-1 mb-4 gap-2 rounded-t-lg">
        <button
          type="button"
          (click)="activeTab = 'generales'"
          [class.border-teal-600]="activeTab === 'generales'"
          [class.text-teal-700]="activeTab === 'generales'"
          [class.font-bold]="activeTab === 'generales'"
          [class.border-transparent]="activeTab !== 'generales'"
          [class.text-slate-500]="activeTab !== 'generales'"
          class="px-4 py-2.5 text-xs border-b-2 transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <mat-icon class="!w-4 !h-4 !text-sm">badge</mat-icon>
          <span>Datos Personales</span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'seguridad'"
          [class.border-teal-600]="activeTab === 'seguridad'"
          [class.text-teal-700]="activeTab === 'seguridad'"
          [class.font-bold]="activeTab === 'seguridad'"
          [class.border-transparent]="activeTab !== 'seguridad'"
          [class.text-slate-500]="activeTab !== 'seguridad'"
          class="px-4 py-2.5 text-xs border-b-2 transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <mat-icon class="!w-4 !h-4 !text-sm">lock</mat-icon>
          <span>Seguridad y Credenciales</span>
        </button>
      </div>

      <!-- Form Container con CSS Grid -->
      <form [formGroup]="userForm" class="space-y-4">
        
        <!-- PESTAÑA 1: DATOS PERSONALES -->
        @if (activeTab === 'generales') {
          <div class="space-y-3.5 animate-in fade-in duration-150">

            <!-- Selector de Origen de Colaborador (Solo al Crear) -->
            @if (!isEditing) {
              <div class="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5">
                <div>
                  <span class="text-3xs font-extrabold uppercase tracking-wider text-slate-500">Origen del Colaborador:</span>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    (click)="setModoColaborador('EXISTENTE')"
                    [class]="modoColaborador() === 'EXISTENTE' ? 'bg-white border-emerald-500 text-emerald-800 shadow-2xs font-black' : 'bg-slate-100/70 border-slate-200 text-slate-600 font-semibold hover:bg-slate-200/50'"
                    class="p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all cursor-pointer text-left"
                  >
                    <mat-icon class="!w-4 !h-4 !text-base" [class.text-emerald-600]="modoColaborador() === 'EXISTENTE'">how_to_reg</mat-icon>
                    <div>
                      <div class="text-xs leading-tight">Colaborador en Nómina</div>
                      <div class="text-3xs text-slate-400 font-normal">Ya registrado en Planillas</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    (click)="setModoColaborador('NUEVO')"
                    [class]="modoColaborador() === 'NUEVO' ? 'bg-white border-emerald-500 text-emerald-800 shadow-2xs font-black' : 'bg-slate-100/70 border-slate-200 text-slate-600 font-semibold hover:bg-slate-200/50'"
                    class="p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all cursor-pointer text-left"
                  >
                    <mat-icon class="!w-4 !h-4 !text-base" [class.text-emerald-600]="modoColaborador() === 'NUEVO'">person_add</mat-icon>
                    <div>
                      <div class="text-xs leading-tight">Crear Nuevo Colaborador</div>
                      <div class="text-3xs text-slate-400 font-normal">Ingresar datos manualmente</div>
                    </div>
                  </button>
                </div>

                <!-- Dropdown de Colaboradores Existentes -->
                @if (modoColaborador() === 'EXISTENTE') {
                  <div class="pt-2 border-t border-slate-200/70">
                    <label class="block text-2xs font-bold text-slate-700 uppercase mb-1">
                      Seleccionar Colaborador sin Cuenta de Acceso *
                    </label>

                    @if (cargandoColaboradores()) {
                      <div class="p-2.5 text-xs text-slate-500 flex items-center gap-2 bg-white rounded-xl border border-slate-200">
                        <mat-spinner diameter="16"></mat-spinner>
                        <span>Cargando colaboradores disponibles en nómina...</span>
                      </div>
                    } @else if (colaboradoresDisponibles().length === 0) {
                      <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
                        <mat-icon class="!text-base !w-4 !h-4 text-amber-600 shrink-0 mt-0.5">info</mat-icon>
                        <div>
                          <div class="font-bold">No hay colaboradores pendientes</div>
                          <div class="text-3xs text-amber-700 mt-0.5">Todos los colaboradores activos ya tienen una cuenta asignada. Puedes seleccionar "Crear Nuevo Colaborador".</div>
                        </div>
                      </div>
                    } @else {
                      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full usuario-dialog-field">
                        <mat-select
                          [value]="empleadoSeleccionadoId()"
                          (selectionChange)="onSeleccionarColaborador($event.value)"
                          placeholder="Selecciona un colaborador..."
                        >
                          @for (c of colaboradoresDisponibles(); track c.empleadoId) {
                            <mat-option [value]="c.empleadoId">
                              <span class="font-bold text-slate-800">{{ c.nombreCompleto }}</span>
                              <span class="text-2xs text-slate-500 ml-2">({{ c.puestoNombre }} • {{ c.sucursalNombre }})</span>
                            </mat-option>
                          }
                        </mat-select>
                        <mat-icon matPrefix class="text-slate-400 !text-sm mr-1">badge</mat-icon>
                      </mat-form-field>


                    }
                  </div>
                }
              </div>
            }
            
            <!-- Grid 2 Columnas: Nombres y Apellidos Separados -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <!-- Nombres -->
              <div>
                <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
                  Nombres *
                </label>
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full usuario-dialog-field">
                  <input
                    matInput
                    type="text"
                    appOnlyLetters
                    formControlName="nombre"
                    placeholder="Ej. Carlos Alberto"
                  />
                  <mat-icon matPrefix class="text-slate-400 !text-sm mr-1">person</mat-icon>
                  @if (userForm.get('nombre')?.hasError('required') && userForm.get('nombre')?.touched) {
                    <mat-error class="text-2xs font-medium">Los nombres son obligatorios</mat-error>
                  }
                  @if (userForm.get('nombre')?.hasError('soloLetras') && userForm.get('nombre')?.touched) {
                    <mat-error class="text-2xs font-medium">Solo letras válidas</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Apellidos -->
              <div>
                <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
                  Apellidos *
                </label>
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full usuario-dialog-field">
                  <input
                    matInput
                    type="text"
                    appOnlyLetters
                    formControlName="apellido"
                    placeholder="Ej. Gómez Morales"
                  />
                  <mat-icon matPrefix class="text-slate-400 !text-sm mr-1">person_outline</mat-icon>
                  @if (userForm.get('apellido')?.hasError('required') && userForm.get('apellido')?.touched) {
                    <mat-error class="text-2xs font-medium">Los apellidos son obligatorios</mat-error>
                  }
                  @if (userForm.get('apellido')?.hasError('soloLetras') && userForm.get('apellido')?.touched) {
                    <mat-error class="text-2xs font-medium">Solo letras válidas</mat-error>
                  }
                </mat-form-field>
              </div>
            </div>

            <!-- Grid 2 Columnas: DPI y Teléfono (Alineación Perfecta al Píxel) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <!-- DPI -->
              <div>
                <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
                  DPI (CUI)
                </label>
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full usuario-dialog-field">
                  <input
                    matInput
                    type="text"
                    appOnlyNumbers
                    maxDigits="13"
                    maxlength="13"
                    formControlName="dpi"
                    placeholder="Ej. 2541987450101 (13 dígitos)"
                  />
                  <mat-icon matPrefix class="text-slate-400 !text-sm mr-1">badge</mat-icon>
                  @if (userForm.get('dpi')?.hasError('dpiInvalido') && userForm.get('dpi')?.touched) {
                    <mat-error class="text-2xs font-semibold text-rose-600">Debe contener exactamente 13 dígitos</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Teléfono -->
              <div>
                <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
                  Teléfono
                </label>
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full usuario-dialog-field">
                  <input
                    matInput
                    type="text"
                    appOnlyNumbers
                    maxDigits="8"
                    maxlength="8"
                    formControlName="telefono"
                    placeholder="Ej. 55551234 (8 dígitos)"
                  />
                  <mat-icon matPrefix class="text-slate-400 !text-sm mr-1">phone</mat-icon>
                  @if (userForm.get('telefono')?.hasError('telefonoInvalido') && userForm.get('telefono')?.touched) {
                    <mat-error class="text-2xs font-semibold text-rose-600">El teléfono debe tener 8 dígitos</mat-error>
                  }
                </mat-form-field>
              </div>
            </div>

            <!-- Sucursal Asignada -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
                Sucursal Asignada *
              </label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full usuario-dialog-field">
                <mat-select formControlName="sucursalId" placeholder="Seleccione una sucursal...">
                  @for (s of sucursales(); track s.sucursalId) {
                    <mat-option [value]="s.sucursalId">{{ s.nombre }}</mat-option>
                  }
                </mat-select>
                @if (userForm.get('sucursalId')?.hasError('required') && userForm.get('sucursalId')?.touched) {
                  <mat-error class="text-2xs font-medium">Debe seleccionar una sucursal</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- Botones Pestaña 1 -->
            <div class="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                mat-button
                (click)="dialogRef.close(false)"
                class="!rounded-xl"
              >
                Cancelar
              </button>

              <button
                type="button"
                mat-flat-button
                (click)="guardarDatosGenerales()"
                [disabled]="submitting()"
                class="!rounded-xl !bg-teal-600 !text-white !font-bold !px-5 cursor-pointer"
              >
                <mat-icon class="!w-4 !h-4 !text-sm mr-1">{{ isEditing ? 'save' : 'arrow_forward' }}</mat-icon>
                <span>{{ submitting() ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Siguiente: Credenciales') }}</span>
              </button>
            </div>
          </div>
        }

        <!-- PESTAÑA 2: SEGURIDAD Y CREDENCIALES -->
        @if (activeTab === 'seguridad') {
          <div class="space-y-3.5 animate-in fade-in duration-150">
            
            <!-- Grid 2 Columnas: Username y Rol -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <!-- Username -->
              <div>
                <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
                  Usuario (@username) *
                </label>
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full usuario-dialog-field">
                  <span matPrefix class="text-slate-400 font-mono text-xs mr-1">@</span>
                  <input
                    matInput
                    type="text"
                    formControlName="username"
                    [readonly]="isEditing"
                    placeholder="Ej. cgomez"
                  />
                  @if (userForm.get('username')?.hasError('required') && userForm.get('username')?.touched) {
                    <mat-error class="text-2xs font-medium">El usuario es obligatorio</mat-error>
                  }
                  @if (userForm.get('username')?.hasError('minlength') && userForm.get('username')?.touched) {
                    <mat-error class="text-2xs font-medium">Mínimo 3 caracteres</mat-error>
                  }
                  @if (userForm.get('username')?.hasError('pattern') && userForm.get('username')?.touched) {
                    <mat-error class="text-2xs font-medium">Solo letras, números, puntos y guiones</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Rol del Sistema -->
              <div>
                <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
                  Rol del Sistema *
                </label>
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full usuario-dialog-field">
                  <mat-select formControlName="rolId" placeholder="Seleccione rol...">
                    @for (r of roles(); track r.rolId) {
                      <mat-option [value]="r.rolId">{{ r.nombre | formatEnum }}</mat-option>
                    }
                  </mat-select>
                  @if (userForm.get('rolId')?.hasError('required') && userForm.get('rolId')?.touched) {
                    <mat-error class="text-2xs font-medium">Debe seleccionar un rol</mat-error>
                  }
                </mat-form-field>
              </div>
            </div>

            @if (isCurrentUser) {
              <div class="text-3xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 font-medium flex items-center gap-2">
                <mat-icon class="!w-4 !h-4 !text-sm text-amber-600 shrink-0">lock</mat-icon>
                <span><strong>Tu propia cuenta activa:</strong> Tu rol y nombre de usuario están bloqueados para proteger tu acceso de Administrador contra auto-democión o bloqueos accidentales.</span>
              </div>
            }

            <!-- Grid 2 Columnas: Contraseña y Confirmación Limpias (Sin Generar Segura) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
                  {{ isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña *' }}
                </label>
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full usuario-dialog-field">
                  <input
                    matInput
                    [type]="showPassword ? 'text' : 'password'"
                    formControlName="nuevaPassword"
                    (input)="onPasswordInput()"
                    placeholder="Mínimo 8 caracteres variados"
                  />
                  <button
                    type="button"
                    mat-icon-button
                    matSuffix
                    (click)="showPassword = !showPassword"
                    class="text-slate-400 hover:text-slate-600"
                  >
                    <mat-icon class="!w-4 !h-4 !text-sm">{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  @if (userForm.get('nuevaPassword')?.hasError('required') && userForm.get('nuevaPassword')?.touched) {
                    <mat-error class="text-2xs font-medium">Contraseña obligatoria</mat-error>
                  }
                </mat-form-field>
              </div>

              <div>
                <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
                  {{ isEditing ? 'Confirmar Nueva Contraseña' : 'Confirmar Contraseña *' }}
                </label>
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full usuario-dialog-field">
                  <input
                    matInput
                    [type]="showPassword ? 'text' : 'password'"
                    formControlName="confirmarPassword"
                    placeholder="Repita la contraseña"
                  />
                  @if (userForm.get('confirmarPassword')?.hasError('required') && userForm.get('confirmarPassword')?.touched) {
                    <mat-error class="text-2xs font-medium">Debe confirmar la contraseña</mat-error>
                  }
                </mat-form-field>
              </div>
            </div>

            <!-- Panel Ejecutivo de Seguridad de la Contraseña (En 2 Columnas Cómodas y Limpias) -->
            <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <mat-icon class="!w-4 !h-4 !text-sm text-teal-600">shield</mat-icon>
                  <span class="text-2xs font-extrabold uppercase tracking-wider text-slate-700">Políticas de Seguridad</span>
                </div>
                
                @if (pwdState().isValid) {
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <mat-icon class="!w-3 !h-3 !text-xs">check_circle</mat-icon>
                    <span>Contraseña Robusta</span>
                  </span>
                } @else if (currentPasswordValue()) {
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <mat-icon class="!w-3 !h-3 !text-xs text-amber-600">warning</mat-icon>
                    <span>Requisitos Pendientes</span>
                  </span>
                } @else {
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-medium bg-slate-200 text-slate-600">
                    <span>Mínimo 8 caracteres variados</span>
                  </span>
                }
              </div>

              <!-- Requisitos en 2 Columnas Holgadas (Sin Viñetas Raras ni Texto Cortado) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                
                <!-- 1. Mínimo 8 caracteres -->
                <div
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all"
                  [class.bg-emerald-50]="pwdState().minLength"
                  [class.border-emerald-200]="pwdState().minLength"
                  [class.text-emerald-800]="pwdState().minLength"
                  [class.bg-white]="!pwdState().minLength"
                  [class.border-slate-200]="!pwdState().minLength"
                  [class.text-slate-500]="!pwdState().minLength"
                >
                  <mat-icon class="!w-4 !h-4 !text-sm shrink-0" [class.text-emerald-600]="pwdState().minLength" [class.text-slate-300]="!pwdState().minLength">
                    {{ pwdState().minLength ? 'check_circle' : 'radio_button_unchecked' }}
                  </mat-icon>
                  <span [class.font-semibold]="pwdState().minLength">Mínimo 8 caracteres</span>
                </div>

                <!-- 2. Mayúscula -->
                <div
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all"
                  [class.bg-emerald-50]="pwdState().hasUpper"
                  [class.border-emerald-200]="pwdState().hasUpper"
                  [class.text-emerald-800]="pwdState().hasUpper"
                  [class.bg-white]="!pwdState().hasUpper"
                  [class.border-slate-200]="!pwdState().hasUpper"
                  [class.text-slate-500]="!pwdState().hasUpper"
                >
                  <mat-icon class="!w-4 !h-4 !text-sm shrink-0" [class.text-emerald-600]="pwdState().hasUpper" [class.text-slate-300]="!pwdState().hasUpper">
                    {{ pwdState().hasUpper ? 'check_circle' : 'radio_button_unchecked' }}
                  </mat-icon>
                  <span [class.font-semibold]="pwdState().hasUpper">Letras mayúsculas (A-Z)</span>
                </div>

                <!-- 3. Minúscula -->
                <div
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all"
                  [class.bg-emerald-50]="pwdState().hasLower"
                  [class.border-emerald-200]="pwdState().hasLower"
                  [class.text-emerald-800]="pwdState().hasLower"
                  [class.bg-white]="!pwdState().hasLower"
                  [class.border-slate-200]="!pwdState().hasLower"
                  [class.text-slate-500]="!pwdState().hasLower"
                >
                  <mat-icon class="!w-4 !h-4 !text-sm shrink-0" [class.text-emerald-600]="pwdState().hasLower" [class.text-slate-300]="!pwdState().hasLower">
                    {{ pwdState().hasLower ? 'check_circle' : 'radio_button_unchecked' }}
                  </mat-icon>
                  <span [class.font-semibold]="pwdState().hasLower">Letras minúsculas (a-z)</span>
                </div>

                <!-- 4. Números -->
                <div
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all"
                  [class.bg-emerald-50]="pwdState().hasNumber"
                  [class.border-emerald-200]="pwdState().hasNumber"
                  [class.text-emerald-800]="pwdState().hasNumber"
                  [class.bg-white]="!pwdState().hasNumber"
                  [class.border-slate-200]="!pwdState().hasNumber"
                  [class.text-slate-500]="!pwdState().hasNumber"
                >
                  <mat-icon class="!w-4 !h-4 !text-sm shrink-0" [class.text-emerald-600]="pwdState().hasNumber" [class.text-slate-300]="!pwdState().hasNumber">
                    {{ pwdState().hasNumber ? 'check_circle' : 'radio_button_unchecked' }}
                  </mat-icon>
                  <span [class.font-semibold]="pwdState().hasNumber">Números (0-9)</span>
                </div>

                <!-- 5. Caracteres especiales -->
                <div
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg border col-span-1 sm:col-span-2 transition-all"
                  [class.bg-emerald-50]="pwdState().hasSpecial"
                  [class.border-emerald-200]="pwdState().hasSpecial"
                  [class.text-emerald-800]="pwdState().hasSpecial"
                  [class.bg-white]="!pwdState().hasSpecial"
                  [class.border-slate-200]="!pwdState().hasSpecial"
                  [class.text-slate-500]="!pwdState().hasSpecial"
                >
                  <mat-icon class="!w-4 !h-4 !text-sm shrink-0" [class.text-emerald-600]="pwdState().hasSpecial" [class.text-slate-300]="!pwdState().hasSpecial">
                    {{ pwdState().hasSpecial ? 'check_circle' : 'radio_button_unchecked' }}
                  </mat-icon>
                  <span [class.font-semibold]="pwdState().hasSpecial">Caracteres especiales (ej. &#64;, #, $, %, *, .)</span>
                </div>

              </div>
            </div>

            @if (userForm.value.nuevaPassword && userForm.value.confirmarPassword && userForm.value.nuevaPassword !== userForm.value.confirmarPassword) {
              <div class="text-3xs text-rose-600 font-semibold flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                <mat-icon class="!w-3.5 !h-3.5 !text-xs">error_outline</mat-icon>
                <span>Las contraseñas no coinciden. Verifique nuevamente antes de registrar.</span>
              </div>
            }

            <!-- Botones Pestaña 2 -->
            <div class="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                mat-button
                (click)="activeTab = 'generales'"
                class="!rounded-xl cursor-pointer"
              >
                Volver a Personales
              </button>

              <button
                type="button"
                mat-flat-button
                (click)="actualizarAcceso()"
                [disabled]="submitting()"
                class="!rounded-xl !bg-teal-600 !text-white !font-bold !px-5 cursor-pointer"
              >
                <mat-icon class="!w-4 !h-4 !text-sm mr-1">check_circle</mat-icon>
                <span>{{ submitting() ? 'Procesando...' : (isEditing ? 'Guardar Credenciales' : 'Registrar Colaborador') }}</span>
              </button>
            </div>
          </div>
        }

      </form>
    </div>
  `
})
export class UsuarioFormModalComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<UsuarioFormModalComponent>);
  readonly data: UserItem | null = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly sucursalesService = inject(SucursalesService);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);

  readonly isEditing = !!this.data;
  activeTab: 'generales' | 'seguridad' = 'generales';
  showPassword = false;

  readonly submitting = signal<boolean>(false);
  readonly roles = signal<RolOption[]>([]);
  readonly modoColaborador = signal<'EXISTENTE' | 'NUEVO'>('EXISTENTE');
  readonly colaboradoresDisponibles = signal<ColaboradorDisponible[]>([]);
  readonly cargandoColaboradores = signal<boolean>(false);
  readonly empleadoSeleccionadoId = signal<number | null>(null);
  readonly colaboradorSeleccionado = signal<ColaboradorDisponible | null>(null);
  readonly sucursales = signal<any[]>([]);

  readonly currentPasswordValue = signal<string>('');
  readonly pwdState = computed(() => {
    return CustomValidators.evaluarPassword(this.currentPasswordValue());
  });

  userForm!: FormGroup;

  get isCurrentUser(): boolean {
    const current = this.authService.currentUser();
    if (!current || !this.data) return false;
    return (
      Number(current.credencialId) === Number(this.data.credencialId) ||
      (!!current.username && !!this.data.username && current.username.toLowerCase() === this.data.username.toLowerCase())
    );
  }

  ngOnInit(): void {
    this.initForm();
    this.cargarCatalogos();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      nombre: [this.data?.nombre || '', [Validators.required, CustomValidators.nombrePersona()]],
      apellido: [this.data?.apellido || '', [Validators.required, CustomValidators.nombrePersona()]],
      dpi: [this.data?.dpi || '', [CustomValidators.dpiGuatemala()]],
      telefono: [this.data?.telefono || '', [CustomValidators.telefonoGuatemala()]],
      sucursalId: [this.data?.sucursalId || '', [Validators.required]],
      username: [
        this.data?.username || '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern(/^[a-zA-Z0-9._]+$/)
        ]
      ],
      rolId: [this.data?.rolId || '', [Validators.required]],
      nuevaPassword: ['', this.isEditing ? [CustomValidators.passwordFuerte()] : [Validators.required, CustomValidators.passwordFuerte()]],
      confirmarPassword: ['', this.isEditing ? [] : [Validators.required]],
    });

    if (this.isCurrentUser) {
      this.userForm.get('rolId')?.disable();
      this.userForm.get('username')?.disable();
    } else if (this.isEditing) {
      this.userForm.get('username')?.disable();
    }

    this.userForm.get('nuevaPassword')?.valueChanges.subscribe((val) => {
      this.currentPasswordValue.set(val || '');
    });
  }

  onPasswordInput(): void {
    this.currentPasswordValue.set(this.userForm.get('nuevaPassword')?.value || '');
  }

  cargarColaboradoresDisponibles(): void {
    this.cargandoColaboradores.set(true);
    this.usersService.getColaboradoresDisponibles().subscribe({
      next: (res) => {
        const lista = res || [];
        this.colaboradoresDisponibles.set(lista);
        this.cargandoColaboradores.set(false);
        // Si no hay colaboradores sin usuario, cambiamos automáticamente a modo nuevo
        if (lista.length === 0) {
          this.modoColaborador.set('NUEVO');
        }
      },
      error: () => this.cargandoColaboradores.set(false),
    });
  }

  setModoColaborador(modo: 'EXISTENTE' | 'NUEVO'): void {
    this.modoColaborador.set(modo);
    if (modo === 'NUEVO') {
      this.empleadoSeleccionadoId.set(null);
      this.colaboradorSeleccionado.set(null);
      this.userForm.patchValue({
        nombre: '',
        apellido: '',
        dpi: '',
        telefono: '',
        sucursalId: '',
        username: '',
      });
    } else {
      if (this.colaboradoresDisponibles().length > 0 && !this.empleadoSeleccionadoId()) {
        this.onSeleccionarColaborador(this.colaboradoresDisponibles()[0].empleadoId);
      }
    }
  }

  onSeleccionarColaborador(empleadoId: number): void {
    this.empleadoSeleccionadoId.set(empleadoId);
    const colab = this.colaboradoresDisponibles().find((c) => c.empleadoId === empleadoId) || null;
    this.colaboradorSeleccionado.set(colab);
    if (colab) {
      this.userForm.patchValue({
        nombre: colab.nombre,
        apellido: colab.apellido,
        dpi: colab.dpi || '',
        telefono: colab.telefono || '',
        sucursalId: colab.sucursalId || '',
      });

      // Sugerir username limpio
      const primerNombre = (colab.nombre || '').trim().split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const primerApellido = (colab.apellido || '').trim().split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (primerNombre && primerApellido) {
        const sugerido = `${primerNombre[0]}${primerApellido}`.replace(/[^a-z0-9]/g, '');
        this.userForm.patchValue({ username: sugerido });
      }
    }
  }

  private cargarCatalogos(): void {
    if (!this.isEditing) {
      this.cargarColaboradoresDisponibles();
    }

    this.usersService.cargarRoles().subscribe({
      next: (res) => this.roles.set(res || []),
    });

    this.sucursalesService.cargarListaCombo().subscribe({
      next: (res) => {
        if (Array.isArray(res) && res.length > 0) {
          this.sucursales.set(res);
        } else {
          this.sucursalesService.cargarSucursales().subscribe({
            next: (dataRes) => {
              const list = Array.isArray(dataRes) ? dataRes : (dataRes?.data || []);
              this.sucursales.set(list);
            },
          });
        }
      },
    });
  }

    guardarDatosGenerales(): void {
    if (!this.isEditing && this.modoColaborador() === 'EXISTENTE') {
      if (!this.empleadoSeleccionadoId()) {
        this.notification.warning('Seleccionar Colaborador', 'Por favor selecciona un colaborador de la lista antes de continuar.');
        return;
      }
      this.activeTab = 'seguridad';
      return;
    }

    const invalidNombre = this.userForm.get('nombre')?.invalid;
    const invalidApellido = this.userForm.get('apellido')?.invalid;
    const invalidSucursal = this.userForm.get('sucursalId')?.invalid;
    const invalidDpi = this.userForm.get('dpi')?.invalid;
    const invalidTelefono = this.userForm.get('telefono')?.invalid;

    // Si falta algún campo, solo marcamos como touched para mostrar mat-error en rojo sin SweetAlert
    if (invalidNombre || invalidApellido || invalidSucursal || invalidDpi || invalidTelefono) {
      this.userForm.get('nombre')?.markAsTouched();
      this.userForm.get('apellido')?.markAsTouched();
      this.userForm.get('sucursalId')?.markAsTouched();
      this.userForm.get('dpi')?.markAsTouched();
      this.userForm.get('telefono')?.markAsTouched();
      return;
    }

    const formVal = this.userForm.getRawValue();

    if (this.isEditing && this.data) {
      this.submitting.set(true);
      const dto = {
        nombre: formVal.nombre.trim(),
        apellido: formVal.apellido.trim(),
        dpi: formVal.dpi?.trim() || undefined,
        telefono: formVal.telefono?.trim() || undefined,
        sucursalId: Number(formVal.sucursalId),
        username: this.data.username,
        rolId: this.data.rolId,
      };

      this.usersService.actualizarUsuario(this.data.credencialId, dto).subscribe({
        next: () => {
          this.submitting.set(false);
          this.notification.success(
            'Datos Personales Guardados',
            `Los datos del colaborador "${formVal.nombre} ${formVal.apellido}" han sido guardados con éxito.`
          );
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.submitting.set(false);
          this.notification.error('Error al Guardar', err?.error?.message || 'No se pudieron actualizar los datos.');
        },
      });
    } else {
      // Pasa a la siguiente pestaña de inmediato
      this.activeTab = 'seguridad';
    }
  }

  actualizarAcceso(): void {
    // Si faltan datos en la pestaña 1, regresamos y los marcamos en rojo
    if (this.userForm.get('nombre')?.invalid || this.userForm.get('apellido')?.invalid || this.userForm.get('sucursalId')?.invalid || this.userForm.get('dpi')?.invalid || this.userForm.get('telefono')?.invalid) {
      this.activeTab = 'generales';
      this.userForm.get('nombre')?.markAsTouched();
      this.userForm.get('apellido')?.markAsTouched();
      this.userForm.get('sucursalId')?.markAsTouched();
      this.userForm.get('dpi')?.markAsTouched();
      this.userForm.get('telefono')?.markAsTouched();
      return;
    }

    // Si faltan datos de acceso, los marcamos en rojo
    if (this.userForm.get('rolId')?.invalid || this.userForm.get('username')?.invalid) {
      this.userForm.get('rolId')?.markAsTouched();
      this.userForm.get('username')?.markAsTouched();
      return;
    }

    const formVal = this.userForm.value;

    // Validación de contraseñas de forma inline (sin SweetAlert)
    if (formVal.nuevaPassword) {
      const evaluation = CustomValidators.evaluarPassword(formVal.nuevaPassword);
      if (!evaluation.isValid) {
        this.userForm.get('nuevaPassword')?.markAsTouched();
        return;
      }
      if (formVal.nuevaPassword !== formVal.confirmarPassword) {
        this.userForm.get('confirmarPassword')?.markAsTouched();
        return;
      }
    }

    if (this.isEditing && this.data) {
      this.submitting.set(true);
      const dtoRol = this.isCurrentUser ? {} : { rolId: Number(formVal.rolId) };

      const ejecutarActualizacionPassword = () => {
        if (formVal.nuevaPassword) {
          this.usersService.cambiarPassword(this.data!.credencialId, {
            newPassword: formVal.nuevaPassword,
          }).subscribe({
            next: () => {
              this.submitting.set(false);
              this.notification.success(
                'Credenciales Actualizadas',
                `Contraseña actualizada exitosamente para "${this.data!.nombreCompleto}".`
              );
              this.dialogRef.close(true);
            },
            error: (err) => {
              this.submitting.set(false);
              this.notification.error('Error al Actualizar Contraseña', err?.error?.message || 'No se pudo actualizar la clave.');
            },
          });
        } else {
          this.submitting.set(false);
          this.notification.success('Acceso Actualizado', 'Los accesos del colaborador se actualizaron con éxito.');
          this.dialogRef.close(true);
        }
      };

      if (!this.isCurrentUser && dtoRol.rolId) {
        this.usersService.actualizarUsuario(this.data.credencialId, dtoRol).subscribe({
          next: () => ejecutarActualizacionPassword(),
          error: (err) => {
            this.submitting.set(false);
            this.notification.error('Error al Actualizar Rol', err?.error?.message || 'No se pudo actualizar el rol.');
          },
        });
      } else {
        ejecutarActualizacionPassword();
      }
    } else {
      // Modo Nuevo Colaborador
      if (!formVal.nuevaPassword) {
        this.userForm.get('nuevaPassword')?.markAsTouched();
        this.userForm.get('confirmarPassword')?.markAsTouched();
        return;
      }

      const evaluation = CustomValidators.evaluarPassword(formVal.nuevaPassword);
      if (!evaluation.isValid) {
        this.userForm.get('nuevaPassword')?.markAsTouched();
        return;
      }

      if (formVal.nuevaPassword !== formVal.confirmarPassword) {
        this.userForm.get('confirmarPassword')?.markAsTouched();
        return;
      }

      this.submitting.set(true);
      const dto = this.modoColaborador() === 'EXISTENTE' && this.empleadoSeleccionadoId()
        ? {
            empleadoId: this.empleadoSeleccionadoId()!,
            username: formVal.username.trim().toLowerCase(),
            password: formVal.nuevaPassword,
            rolId: Number(formVal.rolId),
          }
        : {
            nombre: formVal.nombre.trim(),
            apellido: formVal.apellido.trim(),
            dpi: formVal.dpi?.trim() || undefined,
            telefono: formVal.telefono?.trim() || undefined,
            username: formVal.username.trim().toLowerCase(),
            password: formVal.nuevaPassword,
            rolId: Number(formVal.rolId),
            sucursalId: Number(formVal.sucursalId),
          };

      this.usersService.crearUsuario(dto).subscribe({
        next: () => {
          this.submitting.set(false);
          this.dialogRef.close(true);
          this.notification.success('Colaborador Creado', `El usuario "@${dto.username}" fue registrado exitosamente.`);
        },
        error: (err) => {
          this.submitting.set(false);
          this.notification.error('Error al Crear Usuario', err?.error?.message || 'No se pudo crear la cuenta.');
        },
      });
    }
  }
}
