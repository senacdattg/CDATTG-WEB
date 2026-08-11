import { useMemo, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { canViewCasosBienestar, MENSAJE_SIN_PERMISO_CASOS_BIENESTAR } from '../../casos/casosBienestarPermissions';
import {
  agruparAlertasPorFicha,
  filtrarGruposAlertas,
  programasUnicosDesdeGruposAlertas,
} from '../alertasConsecutivasUtils';
import { useAlertasConsecutivas } from './useAlertasConsecutivas';

export function useAlertasConsecutivasListaPage() {
  const { roles } = useAuth();
  const canView = canViewCasosBienestar(roles);
  const [dias, setDias] = useState(30);
  const [tipoFormacion, setTipoFormacion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [programaFiltroIndex, setProgramaFiltroIndex] = useState(0);

  const { data, loading, error } = useAlertasConsecutivas({
    enabled: canView,
    dias,
    tipoFormacion,
  });

  const alertasPorFicha = useMemo(
    () => (data && Array.isArray(data.alertas) ? agruparAlertasPorFicha(data.alertas) : []),
    [data],
  );

  const programasOpciones = useMemo(
    () => programasUnicosDesdeGruposAlertas(alertasPorFicha),
    [alertasPorFicha],
  );

  const programaNombreFiltro =
    programaFiltroIndex > 0 ? (programasOpciones[programaFiltroIndex - 1] ?? '') : '';

  const gruposFiltrados = useMemo(
    () => filtrarGruposAlertas(alertasPorFicha, searchQuery, programaNombreFiltro),
    [alertasPorFicha, searchQuery, programaNombreFiltro],
  );

  const filtrosActivos = Boolean(searchQuery.trim() || programaNombreFiltro);

  return {
    canView,
    permissionError: canView ? '' : MENSAJE_SIN_PERMISO_CASOS_BIENESTAR,
    dias,
    setDias,
    tipoFormacion,
    setTipoFormacion,
    searchQuery,
    setSearchQuery,
    programaFiltroIndex,
    setProgramaFiltroIndex,
    programasOpciones,
    data,
    loading,
    error: canView ? error : MENSAJE_SIN_PERMISO_CASOS_BIENESTAR,
    alertasPorFicha,
    gruposFiltrados,
    filtrosActivos,
  };
}
