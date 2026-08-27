/**
 * @module pages/lms/LmsAulaCuerpo
 * @description Contenido del aula según la pestaña activa.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { useState } from 'react';
import { labelTipoFormacion } from '../../constants/tipoFormacion';
import { LMS_TABS, type LmsTab } from './lmsConstants';
import type { useLmsAula } from './useLmsAula';
import { LmsAulaTabs } from './LmsAulaTabs';
import { LmsAulaTablon } from './LmsAulaTablon';
import { LmsAulaTrabajos } from './LmsAulaTrabajos';
import { LmsAulaAprendices } from './LmsAulaAprendices';
import type { LmsAulaDetalle } from '../../types/lms';

type Props = Readonly<{
  aula: LmsAulaDetalle;
  page: ReturnType<typeof useLmsAula>;
}>;

/**
 * Tablón del aula.
 */
export function LmsAulaCuerpo({ aula }: Props) {
  const [tab, setTab] = useState<LmsTab>(LMS_TABS.tablon);
  return (
    <>
      <header>
        <p className="text-xs font-semibold uppercase text-primary-600">{labelTipoFormacion(aula.tipo_formacion)}</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ficha {aula.numero_ficha}</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">{aula.nombre_programa || '—'}</p>
      </header>
      <LmsAulaTabs tab={tab} onTab={setTab} puedePublicar={aula.puede_publicar} />
      {tab === LMS_TABS.tablon ? <LmsAulaTablon fichaId={aula.ficha_id} actividades={aula.actividades} /> : null}
      {tab === LMS_TABS.trabajos ? <LmsAulaTrabajos fichaId={aula.ficha_id} actividades={aula.actividades} /> : null}
      {tab === LMS_TABS.aprendices ? (
        <LmsAulaAprendices fichaId={aula.ficha_id} aprendices={aula.aprendices} />
      ) : null}
    </>
  );
}
