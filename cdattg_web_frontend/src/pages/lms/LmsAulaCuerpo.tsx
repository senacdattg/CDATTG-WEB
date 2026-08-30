/**
 * @module pages/lms/LmsAulaCuerpo
 * @description Contenido del aula según la pestaña activa.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { labelTipoFormacion } from '../../constants/tipoFormacion';
import { lmsEsSuperAdmin } from './lmsAuditoriaRol';
import type { LmsTab } from './lmsConstants';
import type { useLmsAula } from './useLmsAula';
import { LmsAulaTabs } from './LmsAulaTabs';
import { LmsAulaCuerpoPaneles } from './LmsAulaCuerpoPaneles';
import { LmsSoloConsultaAviso } from './LmsSoloConsultaAviso';
import { lmsAvisoAprendizConsulta, lmsAvisoSuperConsulta } from './lmsAulaCuerpoVista';
import { lmsTabInicialAula } from './lmsHistorialTab';
import { lmsVeNotas } from './lmsActividadVista';
import { lmsPanelInicioAula, type LmsMisPanel } from './lmsMisPanel';
import type { LmsAulaDetalle } from '../../types/lms';

type Props = Readonly<{
  aula: LmsAulaDetalle;
  page: ReturnType<typeof useLmsAula>;
  panelInicial?: LmsMisPanel | null;
  verInicial?: number | null;
  tabHistorial?: boolean;
}>;

/**
 * Encabezado, avisos, pestañas y el panel de la pestaña.
 */
export function LmsAulaCuerpo({ aula, page, panelInicial = null, verInicial = null, tabHistorial = false }: Props) {
  const { roles } = useAuth();
  const esSuper = lmsEsSuperAdmin(roles);
  const veNotas = lmsVeNotas(aula);
  const veStaff = aula.puede_publicar || esSuper;
  const panelInicio = lmsPanelInicioAula(panelInicial, verInicial);
  const [tab, setTab] = useState<LmsTab>(() =>
    lmsTabInicialAula(panelInicio, tabHistorial, veNotas, aula.puede_publicar),
  );

  return (
    <>
      <header>
        <p className="text-xs font-semibold uppercase text-primary-600">{labelTipoFormacion(aula.tipo_formacion)}</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ficha {aula.numero_ficha}</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">{aula.nombre_programa || '—'}</p>
      </header>
      {lmsAvisoAprendizConsulta(veNotas, aula.puede_entregar) ? (
        <LmsSoloConsultaAviso>
          Solo consulta: puede ver el aula y lo que ya entregó. No puede subir archivos.
        </LmsSoloConsultaAviso>
      ) : null}
      {lmsAvisoSuperConsulta(esSuper, aula.puede_publicar) ? (
        <LmsSoloConsultaAviso>
          Solo consulta: ve todos los módulos. No puede publicar ni editar si no está asignado a esta ficha.
        </LmsSoloConsultaAviso>
      ) : null}
      <LmsAulaTabs
        tab={tab}
        onTab={setTab}
        puedePublicar={aula.puede_publicar}
        puedeVerHistorial={veNotas}
        esSuperAdmin={esSuper}
      />
      <LmsAulaCuerpoPaneles
        tab={tab}
        aula={aula}
        page={page}
        veNotas={veNotas}
        veStaff={veStaff}
        panelInicio={panelInicio}
        verInicial={verInicial}
      />
    </>
  );
}
