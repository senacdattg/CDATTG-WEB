import JSZip from 'jszip';
import templateUrl from '../../assets/oficio-sena/Formato_SENA.dotx?url';
import { CODIGO_FORMATO } from '../bienestar/alertas-consecutivas/oficioSenaAlertasTexto';
import { hoyISOColombia } from '../../utils/formatFecha';
import type { AprendizResponse, FichaCaracterizacionResponse } from '../../types';

export function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function wTextRun(text: string, opts?: { bold?: boolean; size?: number }): string {
  const size = opts?.size ?? 20;
  const bold = opts?.bold ? '<w:b/>' : '';
  return `<w:r><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/>${bold}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

function wParagraph(
  runs: string,
  opts?: { align?: 'left' | 'center' | 'both'; spacingAfter?: number },
): string {
  const align = opts?.align ? `<w:jc w:val="${opts.align}"/>` : '';
  const spacing =
    opts?.spacingAfter != null ? `<w:spacing w:after="${opts.spacingAfter}"/>` : '';
  return `<w:p><w:pPr>${align}${spacing}</w:pPr>${runs}</w:p>`;
}

function wTableCell(text: string, opts?: { header?: boolean; widthPct?: number }): string {
  const width =
    opts?.widthPct != null
      ? `<w:tcW w:w="${opts.widthPct * 50}" w:type="pct"/>`
      : '';
  const shading = opts?.header
    ? '<w:shd w:val="clear" w:color="auto" w:fill="E8F5E0"/>'
    : '';
  return `<w:tc><w:tcPr>${width}<w:tcBorders>
    <w:top w:val="single" w:sz="4" w:space="0" w:color="39A900"/>
    <w:left w:val="single" w:sz="4" w:space="0" w:color="39A900"/>
    <w:bottom w:val="single" w:sz="4" w:space="0" w:color="39A900"/>
    <w:right w:val="single" w:sz="4" w:space="0" w:color="39A900"/>
  </w:tcBorders>${shading}</w:tcPr>${wParagraph(wTextRun(text, { bold: opts?.header }), { align: 'center' })}</w:tc>`;
}

function wTableRow(cells: string[]): string {
  return `<w:tr>${cells.join('')}</w:tr>`;
}

function buildDocumentBody(ficha: FichaCaracterizacionResponse, aprendices: AprendizResponse[]): string {
  const programa = ficha.programa_formacion_nombre || ficha.nombre || '—';
  const jornada = ficha.jornada_nombre || '—';
  const instructor = ficha.instructor_nombre || '—';
  const sede = ficha.sede_nombre || '—';
  const fecha = hoyISOColombia();

  const activos = aprendices
    .filter((a) => a.estado)
    .slice()
    .sort((a, b) => (a.persona_nombre || '').localeCompare(b.persona_nombre || '', 'es'));

  const info = [
    wParagraph(wTextRun('LISTA DE APRENDICES', { bold: true, size: 28 }), { align: 'center', spacingAfter: 200 }),
    wParagraph(
      wTextRun(`Ficha de caracterización: ${ficha.ficha}`, { bold: true }) +
        wTextRun(`   Programa: ${programa}`),
      { spacingAfter: 80 },
    ),
    wParagraph(
      wTextRun(`Jornada: ${jornada}`) +
        wTextRun(`   Instructor líder: ${instructor}`) +
        wTextRun(`   Sede: ${sede}`),
      { spacingAfter: 80 },
    ),
    wParagraph(wTextRun(`Fecha de generación: ${fecha}   Total aprendices: ${activos.length}`), {
      spacingAfter: 200,
    }),
  ];

  const header = wTableRow([
    wTableCell('No.', { header: true, widthPct: 8 }),
    wTableCell('Nombre completo', { header: true, widthPct: 46 }),
    wTableCell('Documento', { header: true, widthPct: 26 }),
    wTableCell('Estado', { header: true, widthPct: 20 }),
  ]);

  const rows = activos.map((a, idx) =>
    wTableRow([
      wTableCell(String(idx + 1)),
      wTableCell(a.persona_nombre || '—'),
      wTableCell(a.persona_documento || '—'),
      wTableCell(a.oculto_en_asistencia ? 'Oculto en asistencia' : 'Activo'),
    ]),
  );

  const table = `<w:tbl><w:tblPr>
    <w:tblW w:w="5000" w:type="pct"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="4" w:space="0" w:color="39A900"/>
      <w:left w:val="single" w:sz="4" w:space="0" w:color="39A900"/>
      <w:bottom w:val="single" w:sz="4" w:space="0" w:color="39A900"/>
      <w:right w:val="single" w:sz="4" w:space="0" w:color="39A900"/>
      <w:insideH w:val="single" w:sz="4" w:space="0" w:color="39A900"/>
      <w:insideV w:val="single" w:sz="4" w:space="0" w:color="39A900"/>
    </w:tblBorders>
  </w:tblPr>${header}${rows.join('')}</w:tbl>`;

  const pie = wParagraph(
    wTextRun(`Documento generado con plantilla institucional ${CODIGO_FORMATO}.`, { size: 16 }),
    { align: 'both', spacingAfter: 0 },
  );

  const sectPr = `<w:sectPr w:rsidR="00782DE1" w:rsidRPr="00233081" w:rsidSect="00D25C0C">
    <w:headerReference w:type="default" r:id="rId11"/>
    <w:footerReference w:type="default" r:id="rId12"/>
    <w:pgSz w:w="12240" w:h="18720" w:code="14"/>
    <w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="1701" w:header="709" w:footer="227" w:gutter="0"/>
    <w:cols w:space="708"/>
    <w:docGrid w:linePitch="360"/>
  </w:sectPr>`;

  return `${info.join('')}${table}${pie}${sectPr}`;
}

function sanitizarNombreArchivo(valor: string): string {
  return valor.replaceAll(/[^\w.-]+/g, '_').replaceAll(/_+/g, '_').slice(0, 80);
}

export function nombreArchivoListaAprendices(fichaNumero: string): string {
  return `lista_aprendices_ficha_${sanitizarNombreArchivo(fichaNumero)}.docx`;
}

export async function exportarListaAprendicesSenaDocx(
  ficha: FichaCaracterizacionResponse,
  aprendices: AprendizResponse[],
): Promise<void> {
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error('No se pudo cargar la plantilla institucional SENA.');
  }
  const templateBuffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(templateBuffer);
  const documentFile = zip.file('word/document.xml');
  if (!documentFile) {
    throw new Error('Plantilla institucional inválida (falta document.xml).');
  }
  const documentXml = await documentFile.async('string');
  const bodyContent = buildDocumentBody(ficha, aprendices);
  const updatedXml = documentXml.replace(
    /<w:body>[\s\S]*<\/w:body>/,
    `<w:body>${bodyContent}</w:body>`,
  );
  zip.file('word/document.xml', updatedXml);

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = nombreArchivoListaAprendices(ficha.ficha);
  anchor.click();
  URL.revokeObjectURL(url);
}
