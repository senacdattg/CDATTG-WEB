/**
 * @module pages/registro/useRegistroCatalogos
 * @description Carga tipos, géneros, caracterización y ubicación.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { portalApi } from '../../services/portalApi';
import { axiosErrorMessage } from '../../utils/httpError';
import type { ParametroItem, PaisItem, DepartamentoItem, MunicipioItem } from '../../types';

/**
 * Catálogos públicos del registro, con cascada país → departamento → municipio.
 */
export function useRegistroCatalogos(paisId: number, departamentoId: number) {
  const [tipos, setTipos] = useState<ParametroItem[]>([]);
  const [generos, setGeneros] = useState<ParametroItem[]>([]);
  const [cars, setCars] = useState<ParametroItem[]>([]);
  const [paises, setPaises] = useState<PaisItem[]>([]);
  const [deps, setDeps] = useState<DepartamentoItem[]>([]);
  const [muns, setMuns] = useState<MunicipioItem[]>([]);
  const [errorCatalogo, setErrorCatalogo] = useState('');

  useEffect(() => {
    void Promise.all([
      portalApi.catalogoTiposDocumento(), portalApi.catalogoGeneros(),
      portalApi.catalogoCaracterizacion(), portalApi.catalogoPaises(),
    ]).then(([t, g, c, p]) => { setTipos(t); setGeneros(g); setCars(c); setPaises(p); })
      .catch((cause: unknown) => setErrorCatalogo(axiosErrorMessage(cause, 'No se pudieron cargar los catálogos')));
  }, []);

  useEffect(() => {
    if (!paisId) { setDeps([]); return; }
    portalApi.catalogoDepartamentos(paisId).then(setDeps).catch(() => setDeps([]));
  }, [paisId]);

  useEffect(() => {
    if (!departamentoId) { setMuns([]); return; }
    portalApi.catalogoMunicipios(departamentoId).then(setMuns).catch(() => setMuns([]));
  }, [departamentoId]);

  return { tipos, generos, cars, paises, deps, muns, errorCatalogo };
}
