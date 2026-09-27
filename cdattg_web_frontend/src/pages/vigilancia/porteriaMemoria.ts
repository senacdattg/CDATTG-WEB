/**
 * Guardo lookups, cola y lista de adentro en el navegador.
 *
 * Lo pongo aquí para no esperar al servidor si ya vimos esa cédula.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { AccesoDentroItem, AccesoLookupResponse } from '../../types';
import { claveLookup, type ColaAccesoItem } from './porteriaColaTipos';

const memLookup = new Map<string, AccesoLookupResponse>();
const memCola: ColaAccesoItem[] = [];
const memDentro = new Map<number, AccesoDentroItem[]>();

function idbOk(): boolean {
  return typeof indexedDB !== 'undefined';
}

/** IndexedDB a veces manda null; la promesa pide un Error. */
function comoError(err: unknown): Error {
  if (err instanceof Error) return err;
  return new Error(typeof err === 'string' ? err : 'idb');
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((ok, fail) => {
    const r = indexedDB.open('porteria_acceso', 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains('lookups')) db.createObjectStore('lookups');
      if (!db.objectStoreNames.contains('cola')) db.createObjectStore('cola', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('dentro')) db.createObjectStore('dentro');
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => fail(comoError(r.error));
  });
}

/**
 * Leo el último lookup de esa cédula en esa sede.
 */
export async function leerLookupGuardado(sedeId: number, doc: string): Promise<AccesoLookupResponse | undefined> {
  const k = claveLookup(sedeId, doc);
  if (!idbOk()) return memLookup.get(k);
  const db = await abrir();
  return new Promise((ok, fail) => {
    const q = db.transaction('lookups').objectStore('lookups').get(k);
    q.onsuccess = () => ok(q.result as AccesoLookupResponse | undefined);
    q.onerror = () => fail(comoError(q.error));
  });
}

/**
 * Recuerdo el lookup que sí llegó del servidor.
 */
export async function guardarLookup(sedeId: number, doc: string, lookup: AccesoLookupResponse): Promise<void> {
  const k = claveLookup(sedeId, doc);
  memLookup.set(k, lookup);
  if (!idbOk()) return;
  const db = await abrir();
  await new Promise<void>((ok, fail) => {
    const q = db.transaction('lookups', 'readwrite').objectStore('lookups').put(lookup, k);
    q.onsuccess = () => ok();
    q.onerror = () => fail(comoError(q.error));
  });
}

export async function leerCola(): Promise<ColaAccesoItem[]> {
  if (!idbOk()) return [...memCola];
  const db = await abrir();
  return new Promise((ok, fail) => {
    const q = db.transaction('cola').objectStore('cola').getAll();
    q.onsuccess = () => {
      const rows = (q.result as ColaAccesoItem[]).slice().sort((a, b) => a.creado_en - b.creado_en);
      ok(rows);
    };
    q.onerror = () => fail(comoError(q.error));
  });
}

export async function empujarCola(item: ColaAccesoItem): Promise<void> {
  memCola.push(item);
  if (!idbOk()) return;
  const db = await abrir();
  await new Promise<void>((ok, fail) => {
    const q = db.transaction('cola', 'readwrite').objectStore('cola').put(item);
    q.onsuccess = () => ok();
    q.onerror = () => fail(comoError(q.error));
  });
}

export async function quitarCola(id: string): Promise<void> {
  const i = memCola.findIndex((c) => c.id === id);
  if (i >= 0) memCola.splice(i, 1);
  if (!idbOk()) return;
  const db = await abrir();
  await new Promise<void>((ok, fail) => {
    const q = db.transaction('cola', 'readwrite').objectStore('cola').delete(id);
    q.onsuccess = () => ok();
    q.onerror = () => fail(comoError(q.error));
  });
}

export async function leerDentroGuardado(sedeId: number): Promise<AccesoDentroItem[]> {
  if (!idbOk()) return memDentro.get(sedeId) ?? [];
  const db = await abrir();
  return new Promise((ok, fail) => {
    const q = db.transaction('dentro').objectStore('dentro').get(sedeId);
    q.onsuccess = () => ok((q.result as AccesoDentroItem[] | undefined) ?? []);
    q.onerror = () => fail(comoError(q.error));
  });
}

export async function guardarDentro(sedeId: number, items: AccesoDentroItem[]): Promise<void> {
  memDentro.set(sedeId, items);
  if (!idbOk()) return;
  const db = await abrir();
  await new Promise<void>((ok, fail) => {
    const q = db.transaction('dentro', 'readwrite').objectStore('dentro').put(items, sedeId);
    q.onsuccess = () => ok();
    q.onerror = () => fail(comoError(q.error));
  });
}
