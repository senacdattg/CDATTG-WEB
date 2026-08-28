/**
 * @module pages/lms/lmsToast
 * @description Overlay y toast al entregar, publicar, actualizar o eliminar.
 * @author Cristian Deysdayr Jiménez
 */
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import type { LmsAvisoEntrega } from './LmsEntregaExito';

/**
 * Toast corto en la esquina. El cambio ya ocurrió.
 * @param {'success' | 'info'} icono Ícono de SweetAlert.
 * @param {string} titulo Frase corta.
 * @param {string} texto Detalle.
 */
function mostrarToastLms(icono: 'success' | 'info', titulo: string, texto: string): void {
  void Promise.resolve()
    .then(() =>
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: icono,
        title: titulo,
        text: texto,
        showConfirmButton: false,
        timer: 3200,
        timerProgressBar: true,
        showClass: { popup: 'swal2-show' },
      }),
    )
    .catch(() => {
      /* el aviso es solo visual */
    });
}

/** Toast de entrega correcta. */
export function mostrarToastEntregaExitosa(): void {
  mostrarToastLms('success', 'Entrega exitosa', 'El instructor ya puede revisar su trabajo.');
}

/** Toast al deshacer: el aprendiz puede volver a enviar. */
export function mostrarToastEntregaDeshecha(): void {
  mostrarToastLms('info', 'Entrega deshecha', 'Puede adjuntar de nuevo y enviar.');
}

/** Toast al publicar una actividad. */
export function mostrarToastActividadPublicada(): void {
  mostrarToastLms('success', 'Actividad realizada con éxito', 'Ya está visible en el aula.');
}

/** Toast al guardar cambios de una actividad. */
export function mostrarToastActividadActualizada(): void {
  mostrarToastLms('success', 'Actividad actualizada', 'Los cambios ya están visibles en el aula.');
}

/** Toast al borrar una actividad. */
export function mostrarToastActividadEliminada(): void {
  mostrarToastLms('success', 'Actividad eliminada', 'Ya no aparece en el aula.');
}

const TOAST: Record<LmsAvisoEntrega, () => void> = {
  exito: mostrarToastEntregaExitosa,
  deshacer: mostrarToastEntregaDeshecha,
  publicada: mostrarToastActividadPublicada,
  actualizada: mostrarToastActividadActualizada,
  eliminada: mostrarToastActividadEliminada,
};

/**
 * Enciende overlay y toast; a los 1.8 s los apaga.
 * @param {LmsAvisoEntrega} tipo Tipo de aviso.
 * @param {(v: LmsAvisoEntrega | null) => void} setAviso Estado del overlay.
 */
export function encenderAvisoEntrega(
  tipo: LmsAvisoEntrega,
  setAviso: (v: LmsAvisoEntrega | null) => void,
): void {
  setAviso(tipo);
  TOAST[tipo]();
  globalThis.setTimeout(() => setAviso(null), 1800);
}
