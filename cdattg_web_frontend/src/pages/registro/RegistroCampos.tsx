/**
 * @module pages/registro/RegistroCampos
 * @description Muestra solo el paso activo del registro.
 * @author Cristian Deysdayr Jiménez
 */
import type { RegisterPayload } from '../../services/registerApi';
import type { ParametroItem, PaisItem, DepartamentoItem, MunicipioItem } from '../../types';
import { RegistroAcceso } from './RegistroAcceso';
import { RegistroCaracterizacion } from './RegistroCaracterizacion';
import { RegistroContacto } from './RegistroContacto';
import { RegistroIdentidad } from './RegistroIdentidad';
import { RegistroNombre } from './RegistroNombre';
import { RegistroUbicacion } from './RegistroUbicacion';
import type { RegistroCampoBind, RegistroSetCampo, RegistroSetForm } from './registroForm';

type Props = Readonly<{
  paso: number;
  form: RegisterPayload;
  set: RegistroSetCampo;
  setForm: RegistroSetForm;
  bind: RegistroCampoBind;
  tipos: ParametroItem[];
  generos: ParametroItem[];
  cars: ParametroItem[];
  paises: PaisItem[];
  deps: DepartamentoItem[];
  muns: MunicipioItem[];
  ids: readonly number[];
  onToggle: (id: number) => void;
}>;

/**
 * Un paso a la vez para bajar la carga cognitiva.
 */
export function RegistroCampos(p: Props) {
  const bind = p.bind;
  if (p.paso === 0) {
    return <RegistroIdentidad form={p.form} set={p.set} tipos={p.tipos} generos={p.generos} bind={bind} />;
  }
  if (p.paso === 1) {
    return <RegistroNombre form={p.form} set={p.set} bind={bind} />;
  }
  if (p.paso === 2) {
    return <RegistroContacto form={p.form} set={p.set} bind={bind} />;
  }
  if (p.paso === 3) {
    return <RegistroUbicacion form={p.form} setForm={p.setForm} paises={p.paises} deps={p.deps} muns={p.muns} bind={bind} />;
  }
  return (
    <div className="space-y-10">
      <RegistroCaracterizacion cars={p.cars} ids={p.ids} onToggle={p.onToggle} error={bind.errores.parametro_id} />
      <RegistroAcceso form={p.form} set={p.set} bind={bind} />
    </div>
  );
}
