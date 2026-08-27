/**
 * @module pages/registro/useRegistroWizard
 * @description Estado del asistente: paso, borrador y validación al salir del campo.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import type { RegisterPayload } from '../../services/registerApi';
import { alternarCaracterizacion, idNinguna, parametroIdDesdeChecks } from './caracterizacionSeleccion';
import { borrarBorrador, guardarBorrador, leerBorrador } from './registroBorrador';
import { registroVacio, TOTAL_PASOS, type RegistroErrores } from './registroForm';
import { mensajeCampoRegistro, mensajePasoInvalido, mensajeRegistroInvalido, CAMPOS_POR_PASO } from './registroValidate';
import type { ParametroItem } from '../../types';

function estadoInicial() {
  const d = leerBorrador();
  return {
    form: { ...registroVacio, ...d?.form, password: '', password_confirm: '' },
    paso: d?.paso ?? 0,
    ids: d?.ids ?? [],
  };
}

/**
 * Orquesta el flujo por pasos del registro.
 */
export function useRegistroWizard() {
  const [ini] = useState(estadoInicial);
  const [form, setForm] = useState<RegisterPayload>(ini.form);
  const [paso, setPaso] = useState(ini.paso);
  const [ids, setIds] = useState<number[]>(ini.ids);
  const [errores, setErrores] = useState<RegistroErrores>({});
  const [error, setError] = useState('');

  useEffect(() => {
    const hayDatos = form.numero_documento || form.email || paso > 0;
    if (hayDatos) guardarBorrador(form, paso, ids);
  }, [form, paso, ids]);

  const setCampo = (k: keyof RegisterPayload, v: string | number) => {
    const next = { ...form, [k]: v };
    setForm(next);
    setErrores((e) => (e[k] ? { ...e, [k]: mensajeCampoRegistro(next, k) } : e));
  };

  const tocar = (k: keyof RegisterPayload) => {
    setErrores((e) => ({ ...e, [k]: mensajeCampoRegistro(form, k) }));
  };

  const onToggle = (id: number, cars: ParametroItem[]) => {
    const next = alternarCaracterizacion(ids, id, idNinguna(cars));
    setIds(next);
    setCampo('parametro_id', parametroIdDesdeChecks(next));
  };

  const avanzar = (): boolean => {
    const delPaso = CAMPOS_POR_PASO[paso] ?? [];
    const marcados: RegistroErrores = {};
    delPaso.forEach((k) => {
      const m = mensajeCampoRegistro(form, k);
      if (m) marcados[k] = m;
    });
    setErrores((e) => ({ ...e, ...marcados }));
    const msg = mensajePasoInvalido(paso, form);
    if (msg) { setError(msg); return false; }
    setError('');
    setPaso((n) => Math.min(n + 1, TOTAL_PASOS - 1));
    return true;
  };

  const atras = () => { setError(''); setPaso((n) => Math.max(n - 1, 0)); };

  const puedeEnviar = (): string => {
    const msg = mensajeRegistroInvalido(form);
    if (msg) setError(msg);
    else setError('');
    return msg;
  };

  return {
    form, setForm, setCampo, paso, ids, errores, tocar, error, setError,
    onToggle, avanzar, atras, puedeEnviar, limpiarBorrador: borrarBorrador,
  };
}
