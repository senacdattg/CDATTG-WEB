import { describe, expect, it } from 'vitest';
import {
  asuntoOficio,
  cargoGeneradorDesdeRoles,
  destinatariosOficio,
  encabezadoCiudadFecha,
  etiquetaBotonOficio,
  listarFechasOficio,
  nombreArchivoOficio,
  parrafosOficio,
  tipoOficio,
  type DatosOficioAlerta,
} from './oficioSenaAlertasTexto';

const base: DatosOficioAlerta = {
  aprendizId: 4,
  aprendizNombre: 'José Luis Borja Gómez',
  numeroDocumento: '1120565372',
  programaNombre: 'ADSO',
  fichaNumero: '3406451',
  sedeNombre: 'MODELO',
  totalInasistencias: 6,
  fechasRacha: ['2026-08-04', '2026-08-06'],
  rachaActiva: true,
  periodoEtiqueta: 'Últimos 30 días',
  generadorNombre: 'Ana Instructor',
  generadorCargo: 'Instructor',
  fechaOficioIso: '2026-08-11',
};

describe('cargoGeneradorDesdeRoles', () => {
  it('prioriza Bienestar sobre instructor', () => {
    expect(cargoGeneradorDesdeRoles(['INSTRUCTOR', 'BIENESTAR AL APRENDIZ'])).toBe(
      'Bienestar al Aprendiz',
    );
  });

  it('usa instructor cuando no hay bienestar', () => {
    expect(cargoGeneradorDesdeRoles(['INSTRUCTOR'])).toBe('Instructor');
  });
});

describe('tipoOficio', () => {
  it('es alerta con menos de 3 días', () => {
    expect(tipoOficio(2)).toBe('alerta_retencion');
  });

  it('es deserción con 3 o más días', () => {
    expect(tipoOficio(3)).toBe('desercion');
    expect(tipoOficio(4)).toBe('desercion');
  });
});

describe('etiquetaBotonOficio', () => {
  it('distingue alerta y deserción', () => {
    expect(etiquetaBotonOficio(2)).toBe('Oficio de alerta');
    expect(etiquetaBotonOficio(3)).toBe('Oficio de deserción');
  });
});

describe('listarFechasOficio', () => {
  it('une con y la última fecha', () => {
    expect(listarFechasOficio(['2026-08-04', '2026-08-06', '2026-08-10'])).toBe(
      '04/08/2026, 06/08/2026 y 10/08/2026',
    );
  });
});

describe('encabezadoCiudadFecha', () => {
  it('antepone la ciudad del centro', () => {
    expect(encabezadoCiudadFecha('2026-08-11')).toMatch(/^San José del Guaviare, /);
    expect(encabezadoCiudadFecha('2026-08-11')).toContain('agosto');
    expect(encabezadoCiudadFecha('2026-08-11')).toContain('2026');
  });
});

describe('nombreArchivoOficio', () => {
  it('sanitiza acentos y espacios', () => {
    expect(nombreArchivoOficio('José Luis Borja Gómez', '3406451', '2026-08-11')).toBe(
      'oficio_inasistencias_ficha_3406451_Jose_Luis_Borja_Gomez_2026-08-11.pdf',
    );
  });
});

describe('parrafosOficio', () => {
  it('con 2 días pide retención y no deserción', () => {
    const texto = parrafosOficio(base).join(' ');
    expect(texto).toContain('6 inasistencia');
    expect(texto).toContain('3406451');
    expect(texto).toContain('José Luis Borja Gómez');
    expect(texto).toContain('retención');
    expect(texto).toContain('artículo 29');
    expect(texto).not.toMatch(/iniciar el trámite de deserción/i);
    expect(destinatariosOficio(base).copia).toMatch(/Bienestar/);
    expect(asuntoOficio(base)).toMatch(/retención/i);
  });

  it('con 3 días solicita deserción y no retención', () => {
    const datos = { ...base, fechasRacha: ['2026-08-04', '2026-08-06', '2026-08-10'] };
    const texto = parrafosOficio(datos).join(' ');
    expect(texto).toContain('deserción por inasistencias continuas');
    expect(texto).toContain('artículo 30');
    expect(texto).toContain('artículo 31');
    expect(texto).not.toMatch(/estrategia de retención/i);
    expect(destinatariosOficio(datos).para).toMatch(/Comité/);
    expect(destinatariosOficio(datos).copia).toBe(base.aprendizNombre);
    expect(asuntoOficio(datos)).toMatch(/deserción/i);
  });
});