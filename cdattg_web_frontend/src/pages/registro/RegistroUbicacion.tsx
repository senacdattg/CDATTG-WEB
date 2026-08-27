/**
 * @module pages/registro/RegistroUbicacion
 * @description Paso 4: país, departamento y municipio (3 campos).
 * @author Cristian Deysdayr Jiménez
 */
import { MapPinIcon } from '@heroicons/react/24/outline';
import type { RegisterPayload } from '../../services/registerApi';
import type { PaisItem, DepartamentoItem, MunicipioItem } from '../../types';
import { claseInput, RegistroCampo } from './RegistroCampo';
import { RegistroSeccion } from './RegistroSeccion';
import type { RegistroCampoBind, RegistroSetForm } from './registroForm';

type Props = Readonly<{
  form: RegisterPayload;
  setForm: RegistroSetForm;
  paises: PaisItem[];
  deps: DepartamentoItem[];
  muns: MunicipioItem[];
  bind: RegistroCampoBind;
}>;

/**
 * Ubicación geográfica. La dirección residencial no se captura.
 */
export function RegistroUbicacion({ form, setForm, paises, deps, muns, bind }: Props) {
  const { errores, tocar } = bind;
  return (
    <RegistroSeccion titulo="Ubicación" icono={<MapPinIcon className="h-5 w-5 text-primary-600" aria-hidden />}>
      <RegistroCampo htmlFor="reg-pais" texto="País" error={errores.pais_id}>
        <select id="reg-pais" className={claseInput(errores.pais_id)} value={form.pais_id || ''} onChange={(e) => setForm((f) => ({ ...f, pais_id: Number(e.target.value), departamento_id: 0, municipio_id: 0 }))} onBlur={() => tocar('pais_id')} aria-invalid={Boolean(errores.pais_id)} aria-required>
          <option value="">Seleccione</option>
          {paises.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
      </RegistroCampo>
      <RegistroCampo htmlFor="reg-depto" texto="Departamento" error={errores.departamento_id}>
        <select id="reg-depto" className={claseInput(errores.departamento_id)} value={form.departamento_id || ''} onChange={(e) => setForm((f) => ({ ...f, departamento_id: Number(e.target.value), municipio_id: 0 }))} onBlur={() => tocar('departamento_id')} aria-invalid={Boolean(errores.departamento_id)} aria-required>
          <option value="">Seleccione</option>
          {deps.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
      </RegistroCampo>
      <RegistroCampo htmlFor="reg-mun" texto="Municipio" error={errores.municipio_id}>
        <select id="reg-mun" className={claseInput(errores.municipio_id)} value={form.municipio_id || ''} onChange={(e) => setForm((f) => ({ ...f, municipio_id: Number(e.target.value) }))} onBlur={() => tocar('municipio_id')} aria-invalid={Boolean(errores.municipio_id)} aria-required>
          <option value="">Seleccione</option>
          {muns.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
      </RegistroCampo>
      <p className="rounded-lg bg-gray-100 p-3 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300">
        Dirección deshabilitada temporalmente. Por lineamientos internos no se está capturando la dirección residencial. El registro continuará sin esta información.
      </p>
    </RegistroSeccion>
  );
}
