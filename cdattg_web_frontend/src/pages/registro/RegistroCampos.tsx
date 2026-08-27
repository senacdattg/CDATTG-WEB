/**
 * @module pages/registro/RegistroCampos
 * @description Campos del formulario de registro (identidad, ubicación, clave).
 * @author CRANDEYS
 * @created 2026-08-26
 */
import type { Dispatch, SetStateAction } from 'react';
import type { RegisterPayload } from '../../services/registerApi';
import type { ParametroItem, PaisItem, DepartamentoItem, MunicipioItem } from '../../types';

type Props = Readonly<{
  form: RegisterPayload;
  setForm: Dispatch<SetStateAction<RegisterPayload>>;
  tipos: ParametroItem[];
  generos: ParametroItem[];
  cars: ParametroItem[];
  paises: PaisItem[];
  deps: DepartamentoItem[];
  muns: MunicipioItem[];
}>;

/**
 * Inputs del registro agrupados.
 */
export function RegistroCampos({ form, setForm, tipos, generos, cars, paises, deps, muns }: Props) {
  const set = (k: keyof RegisterPayload, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <select className="input-field" required value={form.tipo_documento || ''} onChange={(e) => set('tipo_documento', Number(e.target.value))}>
        <option value="">Tipo de documento</option>
        {tipos.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <input className="input-field" required placeholder="Número de documento" value={form.numero_documento} onChange={(e) => set('numero_documento', e.target.value)} />
      <input className="input-field" required placeholder="Primer nombre" value={form.primer_nombre} onChange={(e) => set('primer_nombre', e.target.value)} />
      <input className="input-field" placeholder="Segundo nombre" value={form.segundo_nombre} onChange={(e) => set('segundo_nombre', e.target.value)} />
      <input className="input-field" required placeholder="Primer apellido" value={form.primer_apellido} onChange={(e) => set('primer_apellido', e.target.value)} />
      <input className="input-field" placeholder="Segundo apellido" value={form.segundo_apellido} onChange={(e) => set('segundo_apellido', e.target.value)} />
      <input className="input-field" required type="date" value={form.fecha_nacimiento} onChange={(e) => set('fecha_nacimiento', e.target.value)} />
      <select className="input-field" required value={form.genero || ''} onChange={(e) => set('genero', Number(e.target.value))}>
        <option value="">Género</option>
        {generos.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <input className="input-field" placeholder="Teléfono" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} />
      <input className="input-field" required placeholder="Celular" value={form.celular} onChange={(e) => set('celular', e.target.value)} />
      <input className="input-field sm:col-span-2" required type="email" placeholder="Correo" value={form.email} onChange={(e) => set('email', e.target.value)} />
      <select className="input-field" required value={form.pais_id || ''} onChange={(e) => setForm((f) => ({ ...f, pais_id: Number(e.target.value), departamento_id: 0, municipio_id: 0 }))}>
        <option value="">País</option>
        {paises.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
      </select>
      <select className="input-field" required value={form.departamento_id || ''} onChange={(e) => setForm((f) => ({ ...f, departamento_id: Number(e.target.value), municipio_id: 0 }))}>
        <option value="">Departamento</option>
        {deps.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
      </select>
      <select className="input-field" required value={form.municipio_id || ''} onChange={(e) => set('municipio_id', Number(e.target.value))}>
        <option value="">Municipio</option>
        {muns.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
      </select>
      <select className="input-field" required value={form.parametro_id || ''} onChange={(e) => set('parametro_id', Number(e.target.value))}>
        <option value="">Caracterización</option>
        {cars.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <input className="input-field sm:col-span-2" placeholder="Dirección" value={form.direccion} onChange={(e) => set('direccion', e.target.value)} />
      <input className="input-field" required type="password" placeholder="Contraseña" value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
      <input className="input-field" required type="password" placeholder="Confirmar contraseña" value={form.password_confirm} onChange={(e) => set('password_confirm', e.target.value)} autoComplete="new-password" />
    </div>
  );
}
