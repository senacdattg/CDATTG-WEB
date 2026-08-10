import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AsistenciaCollapsibleCard, asistenciaPanelId } from './AsistenciaCollapsibleCard';

describe('asistenciaPanelId', () => {
  it('normaliza espacios y mayúsculas', () => {
    expect(asistenciaPanelId('Mi Título Extra')).toBe('asistencia-panel-mi-título-extra');
  });
});

describe('AsistenciaCollapsibleCard', () => {
  it('renderiza cerrado sin badge ni icono ni panel', () => {
    const html = renderToStaticMarkup(
      createElement(
        AsistenciaCollapsibleCard,
        {
          title: 'QR',
          description: 'Escanear',
          open: false,
          onToggle: vi.fn(),
          children: 'contenido',
        },
      ),
    );
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="asistencia-panel-qr"');
    expect(html).toContain('border-gray-200');
    expect(html).not.toContain('id="asistencia-panel-qr"');
    expect(html).not.toContain('contenido');
  });

  it('renderiza abierto con badge, icono y children', () => {
    const html = renderToStaticMarkup(
      createElement(AsistenciaCollapsibleCard, {
        title: 'Manual',
        description: 'Por documento',
        badge: '3',
        icon: createElement('span', null, 'I'),
        open: true,
        onToggle: vi.fn(),
        children: 'panel-body',
      }),
    );
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('id="asistencia-panel-manual"');
    expect(html).toContain('border-primary-300');
    expect(html).toContain('rotate-180');
    expect(html).toContain('>3<');
    expect(html).toContain('panel-body');
  });
});
