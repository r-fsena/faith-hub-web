function rgb(hex: string | undefined, fallback: [number, number, number]): [number, number, number] {
  const normalized = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return fallback;
  return [Number.parseInt(normalized.slice(0, 2), 16), Number.parseInt(normalized.slice(2, 4), 16), Number.parseInt(normalized.slice(4, 6), 16)];
}

async function imageData(url?: string | null): Promise<string | null> {
  if (!url || !url.startsWith('https://')) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function imageFormat(data: string): string {
  if (data.startsWith('data:image/jpeg') || data.startsWith('data:image/jpg')) return 'JPEG';
  if (data.startsWith('data:image/webp')) return 'WEBP';
  return 'PNG';
}

export async function downloadSecretariatPdf(item: any, verificationUrl?: string): Promise<string> {
  const [{ GState, jsPDF }, qrModule] = await Promise.all([import('jspdf'), import('qrcode')]);
  const QRCode = qrModule.default;
  const snapshot = item?.template_snapshot || {};
  const rendered = snapshot.rendered || snapshot.schema || {};
  const design = rendered.design || snapshot.schema?.design || {};
  const orientation = rendered.orientation === 'landscape' ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4', compress: true });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = Math.max(8, Math.min(40, Number(design.margin_mm || 20)));
  const primary = rgb(design.primary_color, [15, 118, 110]);
  const secondary = rgb(design.secondary_color, [212, 175, 55]);
  const text = rgb(design.text_color, [30, 41, 59]);
  const background = rgb(design.background_color, [255, 255, 255]);
  const border = rgb(design.border_color, primary);
  const font = ['helvetica', 'times', 'courier'].includes(design.font_family) ? design.font_family : 'times';

  pdf.setFillColor(...background);
  pdf.rect(0, 0, width, height, 'F');

  const watermark = await imageData(design.watermark_url);
  if (watermark) {
    try {
      const size = Math.min(width, height) * 0.46;
      pdf.saveGraphicsState();
      pdf.setGState(new GState({ opacity: Math.max(0, Math.min(.3, Number(design.watermark_opacity || .08))) }));
      pdf.addImage(watermark, imageFormat(watermark), (width - size) / 2, (height - size) / 2, size, size, undefined, 'FAST');
      pdf.restoreGraphicsState();
    } catch { /* imagem opcional */ }
  }

  if (design.border_style !== 'none') {
    pdf.setDrawColor(...border);
    pdf.setLineWidth(Math.max(.3, Number(design.border_width || 2) / 2));
    pdf.rect(7, 7, width - 14, height - 14);
    if (['double', 'classic'].includes(design.border_style)) {
      pdf.setDrawColor(...secondary);
      pdf.setLineWidth(.45);
      pdf.rect(10, 10, width - 20, height - 20);
    }
  }

  let y = margin;
  const logo = await imageData(design.logo_url);
  if (logo) {
    try { pdf.addImage(logo, imageFormat(logo), (width - 28) / 2, y, 28, 22, undefined, 'FAST'); y += 28; } catch { /* imagem opcional */ }
  }

  pdf.setTextColor(...primary);
  pdf.setFont(font, 'bold');
  pdf.setFontSize(Math.max(16, Math.min(48, Number(design.title_font_size || 26))));
  const title = String(rendered.title || 'Documento Eclesiástico');
  const titleLines = pdf.splitTextToSize(title, width - margin * 2);
  pdf.text(titleLines, width / 2, y, { align: 'center' });
  y += titleLines.length * 8 + 3;

  if (rendered.subtitle) {
    pdf.setTextColor(...secondary);
    pdf.setFont(font, 'normal');
    pdf.setFontSize(11);
    const subtitleLines = pdf.splitTextToSize(String(rendered.subtitle), width - margin * 2);
    pdf.text(subtitleLines, width / 2, y, { align: 'center' });
    y += subtitleLines.length * 5 + 8;
  } else {
    y += 6;
  }

  if (design.show_document_number !== false && item.document_number) {
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(`Documento ${item.document_number}`, width - margin, margin - 4, { align: 'right' });
  }

  pdf.setTextColor(...text);
  pdf.setFont(font, 'normal');
  pdf.setFontSize(Math.max(9, Math.min(22, Number(design.body_font_size || 13))));
  const bodyLines = pdf.splitTextToSize(String(rendered.body || ''), width - margin * 2);
  pdf.text(bodyLines, margin, y, {
    align: design.text_align === 'center' ? 'center' : design.text_align === 'left' ? 'left' : 'justify',
    maxWidth: width - margin * 2,
    lineHeightFactor: 1.55
  });

  const signatory = snapshot.signatory;
  const footerY = height - margin - 24;
  if (signatory?.name) {
    const signatureX = design.signature_layout === 'double' ? width * .68 : width / 2;
    const signatureImage = await imageData(signatory.signature_object_key);
    if (signatureImage) {
      try { pdf.addImage(signatureImage, imageFormat(signatureImage), signatureX - 22, footerY - 28, 44, 17, undefined, 'FAST'); } catch { /* imagem opcional */ }
    }
    pdf.setDrawColor(...primary);
    pdf.setLineWidth(.35);
    pdf.line(signatureX - 32, footerY - 10, signatureX + 32, footerY - 10);
    pdf.setTextColor(...text);
    pdf.setFont(font, 'bold');
    pdf.setFontSize(10);
    pdf.text(String(signatory.name), signatureX, footerY - 5, { align: 'center' });
    pdf.setFont(font, 'normal');
    pdf.setFontSize(8);
    pdf.text(String(signatory.title || ''), signatureX, footerY, { align: 'center' });
  }

  if (rendered.footer) {
    pdf.setTextColor(71, 85, 105);
    pdf.setFont(font, 'normal');
    pdf.setFontSize(8);
    const footerLines = pdf.splitTextToSize(String(rendered.footer), width - margin * 2 - 34);
    pdf.text(footerLines, width / 2, height - margin, { align: 'center' });
  }

  if (verificationUrl && design.show_qr_code !== false) {
    const qr = await QRCode.toDataURL(verificationUrl, { width: 240, margin: 1, errorCorrectionLevel: 'M' });
    pdf.addImage(qr, 'PNG', margin, height - margin - 27, 24, 24);
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.text('Verifique a autenticidade', margin + 12, height - margin - 1, { align: 'center' });
  }

  if (snapshot.metadata?.content_checksum) {
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(5.5);
    pdf.text(`Conteúdo: ${snapshot.metadata.content_checksum}`, width - margin, height - 5, { align: 'right' });
  }

  const filename = String(item.document_number || rendered.title || 'documento-faith-hub')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-');
  const bytes = pdf.output('arraybuffer');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const checksum = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
  const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `${filename}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  return checksum;
}
