/**
 * @module pages/semillero/InvestigacionEditorialCampos
 * @description Campos según el submódulo editorial.
 * @author Cristian Deysdayr Jiménez
 */
import { portalApi, portalMediaUrl } from '../../services/portalApi';
import type { BiogjgasItem, EditorialKind } from '../../types/biogjgas';
import { EstadoPublicacionSelect } from './EstadoPublicacionSelect';

type Props = Readonly<{
  kind: EditorialKind;
  form: BiogjgasItem;
  setForm: (next: BiogjgasItem) => void;
}>;

/**
 * Sube un adjunto y guarda la URL en el campo indicado.
 */
async function subir(file: File, form: BiogjgasItem, setForm: (n: BiogjgasItem) => void, campo: keyof BiogjgasItem) {
  const up = await portalApi.subirArchivo(file);
  setForm({ ...form, [campo]: up.url });
}

/**
 * Formulario dinámico (imagen, textos, vigencia, semillero opcional).
 */
export function InvestigacionEditorialCampos({ kind, form, setForm }: Props) {
  const set = (patch: Partial<BiogjgasItem>) => setForm({ ...form, ...patch });
  return (
    <>
      <input className="input-field" required placeholder="Título" value={form.titulo} onChange={(e) => set({ titulo: e.target.value })} />
      {kind === 'revistas' ? <input className="input-field" placeholder="Slug (vacío = automático)" value={form.slug ?? ''} onChange={(e) => set({ slug: e.target.value })} /> : null}
      {kind === 'banners' ? <textarea className="input-field" placeholder="Subtítulo" value={form.subtitulo ?? ''} onChange={(e) => set({ subtitulo: e.target.value })} /> : null}
      {kind === 'revistas' || kind === 'boletines' ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <input className="input-field" placeholder="Volumen" value={form.volumen ?? ''} onChange={(e) => set({ volumen: e.target.value })} />
          <input className="input-field" placeholder="Número" value={form.numero ?? ''} onChange={(e) => set({ numero: e.target.value })} />
          <input className="input-field" type="number" placeholder="Año" value={form.anio ?? ''} onChange={(e) => set({ anio: Number(e.target.value) })} />
        </div>
      ) : null}
      <textarea className="input-field" rows={3} placeholder="Resumen o descripción" value={form.resumen || form.descripcion || ''} onChange={(e) => set({ resumen: e.target.value, descripcion: e.target.value })} />
      {kind === 'convocatorias' || kind === 'actividades' ? (
        <input className="input-field" type="number" placeholder="ID semillero (opcional)" value={form.semillero_id ?? ''} onChange={(e) => set({ semillero_id: e.target.value ? Number(e.target.value) : null })} />
      ) : null}
      {kind === 'banners' ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="input-field" type="date" value={form.vigente_desde ?? ''} onChange={(e) => set({ vigente_desde: e.target.value })} />
          <input className="input-field" type="date" value={form.vigente_hasta ?? ''} onChange={(e) => set({ vigente_hasta: e.target.value })} />
        </div>
      ) : null}
      <label className="block text-sm">Imagen / portada
        {(form.portada_url || form.imagen_url) ? <img src={portalMediaUrl(form.portada_url || form.imagen_url || '')} alt="" className="my-2 h-24 w-full rounded object-cover" /> : null}
        <input type="file" accept="image/*" className="mt-1" onChange={(e) => { const f = e.target.files?.[0]; if (f) void subir(f, form, setForm, kind === 'banners' ? 'imagen_url' : 'portada_url'); }} />
      </label>
      {kind === 'banners' ? <input className="input-field" placeholder="Enlace (/ruta o https://)" value={form.enlace_url ?? ''} onChange={(e) => set({ enlace_url: e.target.value })} /> : null}
      {kind === 'podcasts' ? <input className="input-field" placeholder="URL de audio" value={form.audio_url ?? ''} onChange={(e) => set({ audio_url: e.target.value })} /> : null}
      <EstadoPublicacionSelect value={form.estado_publicacion} onChange={(estado_publicacion) => set({ estado_publicacion })} />
    </>
  );
}
