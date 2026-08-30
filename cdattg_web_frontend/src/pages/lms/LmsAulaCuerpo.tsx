/**
 * @module pages/lms/LmsAulaCuerpo
 * @description Contenido del aula según la pestaña activa.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { labelTipoFormacion } from '../../constants/tipoFormacion';
import { LMS_TABS, type LmsTab } from './lmsConstants';
import type { useLmsAula } from './useLmsAula';
import { LmsAulaTabs } from './LmsAulaTabs';
import { LmsAulaTablon } from './LmsAulaTablon';
import { LmsAulaTrabajos } from './LmsAulaTrabajos';
import { LmsAulaAprendices } from './LmsAulaAprendices';
import { LmsAulaHistorial } from './LmsAulaHistorial';
import { LmsAulaVencidas } from './LmsAulaVencidas';
import { LmsAulaMisActividades } from './LmsAulaMisActividades';
import { LmsPublicarActividadForm } from './LmsPublicarActividadForm';
import { LmsSoloConsultaAviso } from './LmsSoloConsultaAviso';
import { lmsEsSuperAdmin } from './lmsAuditoriaRol';
import { lmsVeNotas } from './lmsActividadVista';
import { lmsTabInicialAula } from './lmsHistorialTab';
import { lmsPanelEditar, type LmsMisPanel } from './lmsMisPanel';
import type { LmsAulaDetalle } from '../../types/lms';

type Props = Readonly<{
  aula: LmsAulaDetalle;
  page: ReturnType<typeof useLmsAula>;
  panelInicial?: LmsMisPanel | null;
  verInicial?: number | null;
  tabHistorial?: boolean;
}>;

/**
 * Pendientes, trabajos, aprendices, historial, mis actividades o publicar.
 */
export function LmsAulaCuerpo({ aula, page, panelInicial = null, verInicial = null, tabHistorial = false }: Props) {
  const { roles } = useAuth();
  const esSuper = lmsEsSuperAdmin(roles);
  const veNotas = lmsVeNotas(aula);
  const [tab, setTab] = useState<LmsTab>(() =>
    lmsTabInicialAula(panelInicial, tabHistorial, veNotas, aula.puede_publicar),
  );
  const [editarId, setEditarId] = useState<number | null>(panelInicial?.id ?? null);

  function abrirEditar(id: number) {
    setEditarId(id);
    setTab(LMS_TABS.mis);
  }

  return (
    <>
      <header>
        <p className="text-xs font-semibold uppercase text-primary-600">{labelTipoFormacion(aula.tipo_formacion)}</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ficha {aula.numero_ficha}</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">{aula.nombre_programa || '—'}</p>
      </header>
      {!aula.puede_publicar && aula.puede_entregar === false ? (
        <LmsSoloConsultaAviso>
          Solo consulta: puede ver el aula y lo que ya entregó. No puede subir archivos.
        </LmsSoloConsultaAviso>
      ) : null}
      {esSuper && !aula.puede_publicar ? (
        <LmsSoloConsultaAviso>
          Solo consulta: ve todos los módulos. No puede publicar ni editar si no está asignado a esta ficha.
        </LmsSoloConsultaAviso>
      ) : null}
      <LmsAulaTabs tab={tab} onTab={setTab} puedePublicar={aula.puede_publicar} puedeVerHistorial={veNotas} esSuperAdmin={esSuper} />
      {tab === LMS_TABS.tablon ? (
        <LmsAulaTablon
          fichaId={aula.ficha_id}
          actividades={aula.actividades}
          puedePublicar={aula.puede_publicar}
          onAbrirEditar={aula.puede_publicar ? abrirEditar : undefined}
          verInicial={verInicial}
        />
      ) : null}
      {tab === LMS_TABS.trabajos ? (
        <LmsAulaTrabajos fichaId={aula.ficha_id} actividades={aula.actividades} puedePublicar={aula.puede_publicar} />
      ) : null}
      {tab === LMS_TABS.vencidas && !aula.puede_publicar ? (
        <LmsAulaVencidas fichaId={aula.ficha_id} actividades={aula.actividades} />
      ) : null}
      {tab === LMS_TABS.aprendices ? (
        <LmsAulaAprendices fichaId={aula.ficha_id} aprendices={aula.aprendices} soloActivos={!aula.puede_publicar} />
      ) : null}
      {tab === LMS_TABS.historial && veNotas ? (
        <LmsAulaHistorial fichaId={aula.ficha_id} />
      ) : null}
      {tab === LMS_TABS.mis && (aula.puede_publicar || esSuper) ? (
        <LmsAulaMisActividades
          fichaId={aula.ficha_id}
          actividades={aula.actividades}
          saving={page.saving}
          onEditar={page.editar}
          onEliminar={page.eliminar}
          panelInicial={editarId == null ? null : lmsPanelEditar(editarId)}
          onCerrarPanel={() => setEditarId(null)}
          soloLectura={!aula.puede_publicar}
        />
      ) : null}
      {tab === LMS_TABS.publicar && (aula.puede_publicar || esSuper) ? (
        <LmsPublicarActividadForm saving={page.saving} onSubmit={page.publicar} soloLectura={!aula.puede_publicar} />
      ) : null}
    </>
  );
}
