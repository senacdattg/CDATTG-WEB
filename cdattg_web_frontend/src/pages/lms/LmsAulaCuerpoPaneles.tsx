/**
 * @module pages/lms/LmsAulaCuerpoPaneles
 * @description Pinta el panel de la pestaña activa del aula.
 * Lo saqué de LmsAulaCuerpo para bajar la complejidad.
 * @author Cristian Deysdayr Jiménez
 */
import type { useLmsAula } from './useLmsAula';
import { LMS_TABS, type LmsTab } from './lmsConstants';
import { LmsAulaTablon } from './LmsAulaTablon';
import { LmsAulaTrabajos } from './LmsAulaTrabajos';
import { LmsAulaVencidas } from './LmsAulaVencidas';
import { LmsAulaAprendices } from './LmsAulaAprendices';
import { LmsAulaHistorial } from './LmsAulaHistorial';
import { LmsAulaMisActividades } from './LmsAulaMisActividades';
import { LmsPublicarActividadForm } from './LmsPublicarActividadForm';
import { lmsMuestraPanel, lmsMuestraVencidas, lmsVerInicialTablon } from './lmsAulaCuerpoVista';
import type { LmsMisPanel } from './lmsMisPanel';
import type { LmsAulaDetalle } from '../../types/lms';

type Props = Readonly<{
  tab: LmsTab;
  aula: LmsAulaDetalle;
  page: ReturnType<typeof useLmsAula>;
  veNotas: boolean;
  veStaff: boolean;
  panelInicio: LmsMisPanel | null;
  verInicial?: number | null;
}>;

/**
 * Un solo panel a la vez: pendientes, entregadas, vencidas o staff.
 */
export function LmsAulaCuerpoPaneles({
  tab,
  aula,
  page,
  veNotas,
  veStaff,
  panelInicio,
  verInicial,
}: Props) {
  return (
    <>
      {tab === LMS_TABS.tablon ? (
        <LmsAulaTablon
          fichaId={aula.ficha_id}
          actividades={aula.actividades}
          puedePublicar={aula.puede_publicar}
          puedeVerNotas={veNotas}
          verInicial={lmsVerInicialTablon(aula.puede_publicar, verInicial)}
        />
      ) : null}
      {tab === LMS_TABS.trabajos ? (
        <LmsAulaTrabajos
          fichaId={aula.ficha_id}
          actividades={aula.actividades}
          puedePublicar={aula.puede_publicar}
          puedeVerNotas={veNotas}
        />
      ) : null}
      {lmsMuestraVencidas(tab, aula.puede_publicar) ? (
        <LmsAulaVencidas fichaId={aula.ficha_id} actividades={aula.actividades} puedeVerNotas={veNotas} />
      ) : null}
      {tab === LMS_TABS.aprendices ? (
        <LmsAulaAprendices fichaId={aula.ficha_id} aprendices={aula.aprendices} soloActivos={!veNotas} />
      ) : null}
      {lmsMuestraPanel(tab, LMS_TABS.historial, veNotas) ? <LmsAulaHistorial fichaId={aula.ficha_id} /> : null}
      {lmsMuestraPanel(tab, LMS_TABS.mis, veStaff) ? (
        <LmsAulaMisActividades
          fichaId={aula.ficha_id}
          actividades={aula.actividades}
          saving={page.saving}
          onEditar={page.editar}
          onEliminar={page.eliminar}
          panelInicial={panelInicio}
          soloLectura={aula.puede_publicar === false}
        />
      ) : null}
      {lmsMuestraPanel(tab, LMS_TABS.publicar, veStaff) ? (
        <LmsPublicarActividadForm
          saving={page.saving}
          onSubmit={page.publicar}
          soloLectura={aula.puede_publicar === false}
        />
      ) : null}
    </>
  );
}
