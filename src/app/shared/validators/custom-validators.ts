import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Validador para nombres de personas (Solo letras, tildes, diéresis, espacios y guiones).
   * Bloquea terminantemente números (ej. '323', 'Pedro123') y símbolos.
   */
  static nombrePersona(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = control.value;
      if (raw === null || raw === undefined || raw === '') return null;
      const val = String(raw).trim();
      if (!val) return null;

      // Rechaza si contiene números
      if (/[0-9]/.test(val)) {
        return {
          soloLetras: 'No se permiten números en nombres de personas.',
          soloNumeros: 'El nombre no puede contener números.',
        };
      }

      // Permite letras (con tildes, diéresis y eñes), espacios, puntos y guiones
      const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]+$/;
      if (!regex.test(val)) {
        return { soloLetras: 'Solo se permiten letras y espacios, sin símbolos especiales.' };
      }
      if (val.length < 2) {
        return { minLength: 'Debe contener al menos 2 letras.' };
      }
      return null;
    };
  }

  /**
   * Validador para campos de texto (Nombres de productos, descripciones, sucursales, direcciones, motivos).
   * RECHAZA ENTRADAS COMPUESTAS EXCLUSIVAMENTE POR NÚMEROS (ej. '323', '12345').
   * Exige texto descriptivo con al menos una letra válida.
   */
  static textoConLetras(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = control.value;
      if (raw === null || raw === undefined || raw === '') return null;
      const val = String(raw).trim();
      if (!val) return null;

      // Rechaza si la cadena está compuesta exclusivamente por dígitos y signos/espacios sin letras
      if (/^[0-9\s.,\-_#]+$/.test(val) || /^\d+$/.test(val)) {
        return {
          soloNumeros: 'No se permiten entradas compuestas exclusivamente por números (ej. 323). Debe incluir texto descriptivo.',
          requiereLetras: true,
        };
      }

      // Debe contener al menos una letra válida
      const tieneLetras = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(val);
      if (!tieneLetras) {
        return {
          soloNumeros: 'El campo debe contener texto descriptivo con letras.',
          requiereLetras: true,
        };
      }

      return null;
    };
  }

  /**
   * Alias de compatibilidad para textoConLetras
   */
  static nombreConLetras(): ValidatorFn {
    return CustomValidators.textoConLetras();
  }

  /**
   * Validador para montos monetarios, precios o costos: Número positivo estrictamente mayor a 0 (> 0).
   */
  static montoPositivo(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === undefined || control.value === '') return null;
      const num = Number(control.value);
      if (isNaN(num) || num <= 0) {
        return {
          montoInvalido: 'Debe ingresar un valor numérico positivo mayor a 0.',
          min: { min: 0.01, actual: num },
        };
      }
      return null;
    };
  }

  /**
   * Validador para cantidades enteras (Stock, unidades): Entero positivo estrictamente mayor a 0 (> 0).
   */
  static enteroPositivo(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === undefined || control.value === '') return null;
      const val = String(control.value).trim();
      const num = Number(val);
      if (!/^[1-9][0-9]*$/.test(val) || isNaN(num) || num <= 0) {
        return {
          enteroInvalido: 'Debe ingresar un número entero positivo mayor a 0.',
          min: { min: 1, actual: num },
        };
      }
      return null;
    };
  }

  /**
   * Validador estricto para teléfono en Guatemala: exactamente 8 dígitos numéricos.
   */
  static telefonoGuatemala(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = control.value;
      if (raw === null || raw === undefined || raw === '') return null;
      const val = String(raw).trim();
      if (!val) return null;

      if (!/^[0-9]{8}$/.test(val)) {
        return { telefonoInvalido: 'El número de teléfono debe tener exactamente 8 dígitos numéricos.' };
      }
      return null;
    };
  }

  /**
   * Validador estricto para DPI en Guatemala: exactamente 13 dígitos numéricos.
   */
  static dpiGuatemala(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = control.value;
      if (raw === null || raw === undefined || raw === '') return null;
      const val = String(raw).trim();
      if (!val) return null;

      if (!/^[0-9]{13}$/.test(val)) {
        return { dpiInvalido: 'El DPI debe contener exactamente 13 dígitos numéricos.' };
      }
      return null;
    };
  }

  /**
   * Evaluador del estado de una contraseña segura para feedback reactivo en UI.
   */
  static evaluarPassword(val: string) {
    const str = String(val || '');
    const minLength = str.length >= 8;
    const hasUpper = /[A-Z]/.test(str);
    const hasLower = /[a-z]/.test(str);
    const hasNumber = /[0-9]/.test(str);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(str);
    const isValid = minLength && hasUpper && hasLower && hasNumber && hasSpecial;
    return { isValid, minLength, hasUpper, hasLower, hasNumber, hasSpecial };
  }

  /**
   * Validador estricto de contraseña corporativa:
   * - Mínimo 8 caracteres
   * - Al menos una letra mayúscula (A-Z)
   * - Al menos una letra minúscula (a-z)
   * - Al menos un número (0-9)
   * - Al menos un carácter especial (@, #, $, %, *, ., etc.)
   */
  static passwordFuerte(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = control.value;
      if (raw === null || raw === undefined || raw === '') return null;
      const evaluation = CustomValidators.evaluarPassword(String(raw));
      if (!evaluation.isValid) {
        return {
          passwordInsegura: true,
          requisitos: evaluation,
        };
      }
      return null;
    };
  }

  /**
   * Validador para número de cuenta bancaria: entre 8 y 14 dígitos numéricos.
   */
  static cuentaBancaria(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = control.value;
      if (raw === null || raw === undefined || raw === '') return null;
      const val = String(raw).trim();
      if (!val) return null;

      if (!/^[0-9]{8,14}$/.test(val)) {
        return { cuentaInvalida: 'El número de cuenta debe contener entre 8 y 14 dígitos numéricos.' };
      }
      return null;
    };
  }
  /**
   * Validador estricto para NIT en Guatemala (Ej. 1234567-8, 12345678 o CF).
   */
  static nitGuatemala(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = control.value;
      if (raw === null || raw === undefined || raw === '') return null;
      const val = String(raw).trim().toUpperCase();
      if (!val) return null;
      if (val === 'CF' || val === 'C/F') return null;
      if (!/^[0-9]{4,10}(-?[0-9K])?$/.test(val)) {
        return { nitInvalido: 'NIT no válido (Ej. 1234567-8 o CF, máx 10 dígitos)' };
      }
      return null;
    };
  }
}
