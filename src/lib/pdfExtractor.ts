import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { createWorker } from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type PDFTextItem = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
};

export type ExtractedPDF = {
  text: string;
  items: PDFTextItem[];
};

function extractNativeItems(
  textContent: any,
  pageNumber: number,
  pageHeight: number
): PDFTextItem[] {
  return textContent.items
    .filter(
      (item: any) =>
        typeof item.str === 'string' && item.str.trim().length > 0
    )
    .map((item: any) => ({
      text: item.str.trim(),
      x: Number(item.transform?.[4] ?? 0),
      y: pageHeight - Number(item.transform?.[5] ?? 0),
      width: Number(item.width ?? 0),
      height: Number(item.height ?? 0),
      page: pageNumber,
    }));
}

async function extractOCRItems(
  page: any,
  pageNumber: number
): Promise<{ text: string; items: PDFTextItem[] }> {
  const scale = 2;

  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to create canvas context for OCR.');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvas,
    canvasContext: context,
    viewport,
  }).promise;

  const worker = await createWorker('eng');

  try {
    const result = await worker.recognize(canvas, {}, { tsv: true });

    const tsv = (result.data as any).tsv ?? '';

    const items: PDFTextItem[] = [];

    for (const row of tsv.split('\n').slice(1)) {
      const columns = row.split('\t');

      if (columns.length < 12) continue;

      // OCR level 5 = word
      if (Number(columns[0]) !== 5) continue;

      const text = columns.slice(11).join('\t').trim();
      const confidence = Number(columns[10]);

      if (!text || confidence < 30) continue;

      items.push({
        text,
        x: Number(columns[6]) / scale,
        y: Number(columns[7]) / scale,
        width: Number(columns[8]) / scale,
        height: Number(columns[9]) / scale,
        page: pageNumber,
      });
    }

    return {
      text: result.data.text ?? '',
      items,
    };
  } finally {
    await worker.terminate();
  }
}

export async function extractPDFData(
  file: File
): Promise<ExtractedPDF> {
  try {
    const pdf = await pdfjsLib.getDocument({
      data: await file.arrayBuffer(),
    }).promise;

    let fullText = '';
    const allItems: PDFTextItem[] = [];

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {
      const page = await pdf.getPage(pageNumber);

      const viewport = page.getViewport({ scale: 1 });

      const content = await page.getTextContent();

      const nativeItems = extractNativeItems(
        content,
        pageNumber,
        viewport.height
      );

      const nativeText = nativeItems
        .map((item) => item.text)
        .join(' ');

      // Use the actual embedded PDF text whenever possible.
      if (
        nativeItems.length >= 5 &&
        nativeText.trim().length >= 15
      ) {
        allItems.push(...nativeItems);

        fullText +=
          `\n--- Page ${pageNumber} ---\n${nativeText}\n`;
      } else {
        // Scanned PDF fallback
        const ocr = await extractOCRItems(
          page,
          pageNumber
        );

        allItems.push(...ocr.items);

        fullText +=
          `\n--- Page ${pageNumber} ---\n${ocr.text}\n`;
      }
    }

    if (!allItems.length) {
      throw new Error(
        'No readable text was found in this PDF.'
      );
    }

    return {
      text: fullText.trim(),
      items: allItems,
    };
  } catch (error) {
    console.error('PDF extraction error:', error);

    throw new Error(
      error instanceof Error
        ? `PDF extraction failed: ${error.message}`
        : 'Unable to extract PDF data.'
    );
  }
}