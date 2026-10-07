import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UsersService } from '../../core/services/users.service';
import { NotificationService } from '../../core/services/notification.service';
import { CustomValidators } from '../../shared/validators/custom-validators';
import { UserItem } from '../../core/models/users.models';

@Component({
  selector: 'app-usuario-password-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
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
    <div class="p-5 sm:p-6 w-full bg-white text-slate-800">
      <!-- Cabecera del Modal -->
      <div class="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs shrink-0">
            <mat-icon class="text-2xl">key</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded inline-block">
              Seguridad & Credenciales
            </span>
            <h3 class="text-base sm:text-lg font-black text-slate-800 mt-0.5">Restablecer Contraseña</h3>
            <p class="text-xs text-slate-500">
              Colaborador: <span class="font-bold text-slate-700">{{ data.nombreCompleto }}</span> (<span class="font-mono text-teal-700">@{{ data.username }}</span>)
            </p>
          </div>
        </div>
        <button
          type="button"
          mat-icon-button
          (click)="dialogRef.close(false)"
          class="text-slate-400 hover:text-slate-600"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="space-y-3.5">
        <div>
          <label class="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Nueva Contraseña *
          </label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <input
              matInput
              [type]="showPassword ? 'text' : 'password'"
              [(ngModel)]="newPassword"
              (ngModelChange)="onPasswordChange($event)"
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
          </mat-form-field>
        </div>

        <div>
          <label class="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Confirmar Nueva Contraseña *
          </label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <input
              matInput
              [type]="showPassword ? 'text' : 'password'"
              [(ngModel)]="confirmPassword"
              placeholder="Repita la nueva contraseña"
            />
          </mat-form-field>
        </div>

        <!-- Panel Ejecutivo de Requisitos de Contraseña -->
        <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <mat-icon class="!w-4 !h-4 !text-sm text-teal-600">shield</mat-icon>
              <span class="text-2xs font-extrabold uppercase tracking-wider text-slate-700">Políticas Exigidas</span>
            </div>
            
            @if (pwdState().isValid) {
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <mat-icon class="!w-3 !h-3 !text-xs">check_circle</mat-icon>
                <span>Contraseña Robusta</span>
              </span>
            } @else if (newPassword) {
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

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
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

        @if (newPassword && confirmPassword && newPassword !== confirmPassword) {
          <div class="text-3xs text-rose-600 font-semibold flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
            <mat-icon class="!w-3.5 !h-3.5 !text-xs">error_outline</mat-icon>
            <span>Las contraseñas no coinciden.</span>
          </div>
        }
      </div>

      <!-- Botones -->
      <div class="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
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
          color="primary"
          [disabled]="loading()"
          (click)="cambiarPassword()"
          class="!rounded-xl !bg-teal-600 !text-white !font-bold !px-5"
        >
          <span>{{ loading() ? 'Actualizando...' : 'Guardar Clave' }}</span>
        </button>
      </div>
    </div>
  `
})
export class UsuarioPasswordModalComponent {
  readonly dialogRef = inject(MatDialogRef<UsuarioPasswordModalComponent>);
  readonly data: UserItem = inject(MAT_DIALOG_DATA);
  private readonly usersService = inject(UsersService);
  private readonly notification = inject(NotificationService);

  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  loading = signal<boolean>(false);

  readonly pwdVal = signal<string>('');
  readonly pwdState = computed(() => {
    return CustomValidators.evaluarPassword(this.pwdVal());
  });

  onPasswordChange(val: string): void {
    this.pwdVal.set(val || '');
  }

    cambiarPassword(): void {
    if (!this.newPassword) return;

    const evaluation = CustomValidators.evaluarPassword(this.newPassword);
    if (!evaluation.isValid) return;

    if (this.newPassword !== this.confirmPassword) return;

    this.loading.set(true);
    this.usersService
      .cambiarPassword(this.data.credencialId, {
        newPassword: this.newPassword,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.dialogRef.close(true);
          this.notification.success('Contraseña Actualizada', 'La contraseña ha sido actualizada con éxito.');
        },
        error: (err) => {
          this.loading.set(false);
          this.notification.error('Error', err?.error?.message || 'No se pudo actualizar la contraseña.');
        },
      });
  }
}
