import { jsPDF } from 'jspdf';
import logoSenaSvg from '../../../../logo-sena-verde-complementario-svg-2022.svg';
import logoColombiaUrl from '../../../assets/oficio-sena/logo-colombia.png';
import pieSenaUrl from '../../../assets/oficio-sena/pie-sena-comunica.png';
import {
  CENTRO_NOMBRE,
  CODIGO_FORMATO,
  PIE_DIRECCION,
  asuntoOficio,
  destinatariosOficio,
  encabezadoCiudadFecha,
  nombreArchivoOficio,
  parrafosOficio,
  type DatosOficioAlerta,
} from './oficioSenaAlertasTexto';

const VERDE_SENA: [number, number, number] = [57, 169, 0];
const GRIS_TEXTO: [number, number, number] = [40, 40, 40];

/** Oficio colombiano (Legal): 8.5 x 13 pulgadas, márgenes del GD-F-008. */
const PAGE: [number, number] = [215.9, 330.2];
const MARGEN = 30;
const PIE_RESERVA = 42;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar el membrete institucional.'));
    img.src = src;
  });
}

function imageToPngDataUrl(img: HTMLImageElement, longEdgePx: number): string {
  const ratio = img.naturalWidth / Math.max(1, img.naturalHeight);
  const width = ratio >= 1 ? longEdgePx : Math.max(1, Math.round(longEdgePx * ratio));
  const height = ratio >= 1 ? Math.max(1, Math.round(longEdgePx / ratio)) : longEdgePx;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo rasterizar el logo institucional.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}

function fitLogo(img: HTMLImageElement, maxW: number, maxH: number): { w: number; h: number } {
  const ratio = img.naturalWidth / Math.max(1, img.naturalHeight);
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  return { w, h };
}

function addLogo(
  doc: jsPDF,
  img: HTMLImageElement,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
): { w: number; h: number } {
  const size = fitLogo(img, maxW, maxH);
  const px = Math.round(Math.max(size.w, size.h) * 12);
  doc.addImage(imageToPngDataUrl(img, px), 'PNG', x, y, size.w, size.h, undefined, 'NONE');
  return size;
}

function addJustifiedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const isLast = i === lines.length - 1;
    if (isLast || !line.includes(' ')) {
      doc.text(line, x, y);
    } else {
      doc.text(line, x, y, { align: 'justify', maxWidth });
    }
    y += lineHeight;
  }
  return y;
}

export async function generarOficioAlertaConsecutivaPdf(datos: DatosOficioAlerta): Promise<void> {
  const [logoColombia, logoSena, pieSena] = await Promise.all([
    loadImage(logoColombiaUrl),
    loadImage(logoSenaSvg),
    loadImage(pieSenaUrl),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: PAGE });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const ancho = pageW - MARGEN * 2;
  const dest = destinatariosOficio(datos);

  const headerTop = 8;
  const colombia = addLogo(doc, logoColombia, MARGEN, headerTop + 4, 52, 16);
  const sena = fitLogo(logoSena, 26, 26);
  addLogo(doc, logoSena, pageW - MARGEN - sena.w, headerTop, 26, 26);

  const headerBottom = Math.max(headerTop + 4 + colombia.h, headerTop + sena.h) + 4;
  doc.setDrawColor(...VERDE_SENA);
  doc.setLineWidth(0.45);
  doc.line(MARGEN, headerBottom, pageW - MARGEN, headerBottom);

  let y = headerBottom + 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...GRIS_TEXTO);
  doc.text(encabezadoCiudadFecha(datos.fechaOficioIso), pageW - MARGEN, y, { align: 'right' });
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Para:', MARGEN, y);
  doc.setFont('helvetica', 'normal');
  const paraLines = doc.splitTextToSize(dest.para.toUpperCase(), ancho - 18) as string[];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(paraLines, MARGEN + 16, y);
  y += paraLines.length * 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(dest.paraCargo, MARGEN + 16, y);
  y += 5;
  doc.text(`Documento: ${datos.numeroDocumento}`, MARGEN + 16, y);
  y += 5;
  doc.text(`Programa: ${datos.programaNombre.trim() || 'No registrado'}`, MARGEN + 16, y);
  y += 5;
  doc.text(`Ficha: ${datos.fichaNumero}`, MARGEN + 16, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('C.C.:', MARGEN, y);
  doc.setFont('helvetica', 'normal');
  const copiaLines = doc.splitTextToSize(dest.copia, ancho - 18) as string[];
  doc.text(copiaLines, MARGEN + 16, y);
  y += copiaLines.length * 5 + 6;

  doc.setFont('helvetica', 'bold');
  const asuntoLines = doc.splitTextToSize(asuntoOficio(datos), ancho) as string[];
  doc.text(asuntoLines, MARGEN, y);
  y += asuntoLines.length * 5 + 6;

  doc.setFont('helvetica', 'normal');
  doc.text('Cordial saludo.', MARGEN, y);
  y += 8;

  const lineH = 5.2;
  for (const parrafo of parrafosOficio(datos)) {
    y = addJustifiedText(doc, parrafo, MARGEN, y, ancho, lineH);
    y += 4;
  }

  y += 4;
  const firmaLimite = pageH - PIE_RESERVA;
  if (y + 36 > firmaLimite) {
    y = Math.min(y, firmaLimite - 36);
  }
  doc.text('Atentamente,', MARGEN, y);
  y += 18;
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.2);
  const firmaAncho = Math.min(80, ancho);
  doc.line(MARGEN, y, MARGEN + firmaAncho, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const nombreLines = doc.splitTextToSize(datos.generadorNombre, ancho) as string[];
  doc.text(nombreLines, MARGEN, y);
  y += nombreLines.length * 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(datos.generadorCargo, MARGEN, y);

  const lineaPieY = pageH - 36;
  doc.setDrawColor(...VERDE_SENA);
  doc.setLineWidth(0.35);
  doc.line(MARGEN, lineaPieY, pageW - MARGEN, lineaPieY);

  addLogo(doc, pieSena, (pageW - 42) / 2, lineaPieY + 2, 42, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...VERDE_SENA);
  doc.text(CENTRO_NOMBRE, pageW / 2, pageH - 10, { align: 'center' });
  doc.text(PIE_DIRECCION, pageW / 2, pageH - 5.5, { align: 'center' });

  doc.setFontSize(7);
  doc.text(CODIGO_FORMATO, pageW - 8, pageH / 2, { align: 'center', angle: 90 });

  doc.save(nombreArchivoOficio(datos.aprendizNombre, datos.fichaNumero, datos.fechaOficioIso));
}