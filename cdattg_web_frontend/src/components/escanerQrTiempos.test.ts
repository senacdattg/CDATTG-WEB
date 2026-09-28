import { describe, expect, it } from 'vitest';
import { DEBOUNCE_MISMO_QR_MS, PAUSA_TRAS_ESCANEO_MS } from './escanerQrTiempos';

describe('tiempos del escáner QR', () => {
  it('reanuda la cámara sin esperar 3 segundos', () => {
    expect(PAUSA_TRAS_ESCANEO_MS).toBeLessThan(500);
  });

  it('el mismo QR no se lee otra vez al instante', () => {
    expect(DEBOUNCE_MISMO_QR_MS).toBeGreaterThan(0);
    expect(DEBOUNCE_MISMO_QR_MS).toBeLessThan(2000);
  });
});
