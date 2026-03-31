import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Generates a standard styled PDF from text and saves it.
 * @param {string} text - The clean, finalized policy text.
 * @param {string} title - Policy title.
 * @param {string} outputPath - The path to save the generated PDF.
 * @returns {Promise<void>}
 */
export const generateStandardPdf = (text, title, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });
      
      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // Add a nice header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text(title || 'Policy Document', { align: 'center' })
         .moveDown(1.5);

      // Add standard text (Helvetica, 12pt is perfect for AI ingestion)
      doc.fontSize(12)
         .font('Helvetica')
         .text(text, {
           align: 'left',
           lineGap: 4
         });

      doc.end();

      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};
