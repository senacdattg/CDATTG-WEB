/**
 * @module pages/lms/LmsSoloConsultaAviso.test
 * @description El aviso de solo consulta muestra el texto que le paso.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsSoloConsultaAviso } from './LmsSoloConsultaAviso';

describe('LmsSoloConsultaAviso', () => {
  it('muestra el mensaje', () => {
    const html = renderToStaticMarkup(createElement(LmsSoloConsultaAviso, null, 'Solo consulta'));
    expect(html).toContain('Solo consulta');
  });
});
