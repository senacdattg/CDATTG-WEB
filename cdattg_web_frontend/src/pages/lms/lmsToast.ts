/**
 * @module pages/lms/lmsToast
 * @description Aviso de entrega exitosa (SweetAlert2, misma pauta que asistencia).
 * @author Cristian Deysdayr Jiménez
 */
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/**
 * Toast animado de entrega correcta.
 */
export function mostrarToastEntregaExitosa(): void {
  void Promise.resolve()
    .then(() =>
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Entrega exitosa',
        text: 'El instructor ya puede revisar su trabajo.',
        showConfirmButton: false,
        timer: 3200,
        timerProgressBar: true,
        showClass: { popup: 'swal2-show' },
      }),
    )
    .catch(() => {
      /* el envío ya quedó guardado */
    });
}
