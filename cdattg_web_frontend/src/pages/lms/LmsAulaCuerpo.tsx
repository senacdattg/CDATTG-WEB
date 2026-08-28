/**
 * @module pages/lms/LmsAulaCuerpo
 * @description Contenido del aula según la pestaña activa.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { labelTipoFormacion } from '../../constants/tipoFormacion';
import { LMS_TABS, type LmsTab } from './lmsConstants';
import type { useLmsAula } from './useLmsAula';
import { LmsAulaTabs } from './LmsAulaTabs';
import { LmsAulaTablon } from './LmsAulaTablon';
import { LmsAulaTrabajos } from './LmsAulaTrabajos';
import { LmsAulaAprendices } from './LmsAulaAprendices';
import { LmsAulaMisActividades } from './LmsAulaMisActividades';
import { LmsPublicarActividadForm } from './LmsPublicarActividadForm';
import { LmsSoloConsultaAviso } from './LmsSoloConsultaAviso';
import type { LmsAulaDetalle } from '../../types/lms';

type Props = Readonly<{
  aula: LmsAulaDetalle;
  page: ReturnType<typeof useLmsAula>;
}>;

/**
 * Tablón, trabajos, aprendices o publicar.
 */
export function LmsAulaCuerpo({ aula, page }: Props) {
  const [tab, setTab] = useState<LmsTab>(LMS_TABS.tablon);
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
      <LmsAulaTabs tab={tab} onTab={setTab} puedePublicar={aula.puede_publicar} />
      {tab === LMS_TABS.tablon ? <LmsAulaTablon fichaId={aula.ficha_id} actividades={aula.actividades} /> : null}
      {tab === LMS_TABS.trabajos ? <LmsAulaTrabajos fichaId={aula.ficha_id} actividades={aula.actividades} /> : null}
      {tab === LMS_TABS.aprendices ? (
        <LmsAulaAprendices fichaId={aula.ficha_id} aprendices={aula.aprendices} soloActivos={!aula.puede_publicar} />
      ) : null}
      {tab === LMS_TABS.mis && aula.puede_publicar ? (
        <LmsAulaMisActividades fichaId={aula.ficha_id} actividades={aula.actividades} />
      ) : null}
      {tab === LMS_TABS.publicar && aula.puede_publicar ? (
        <LmsPublicarActividadForm saving={page.saving} onSubmit={page.publicar} />
      ) : null}
    </>
  );
}
