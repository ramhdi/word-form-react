import express, { Request, Response } from 'express';
import cors from 'cors';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { convertDocxToPdf } from './utils/docxConverter';

const app = express();
const port = 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());

// Types
interface MemberData {
  name: string;
  idCardNumber: string;
  email: string;
  phone: string;
  address: string;
}

// Generate document function
const generateDoc = (memberData: MemberData) => {
  const templatePath = path.join(__dirname, '../templates/member-template.docx');
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(memberData);

  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  });
};

// Preview endpoint (returns PDF)
app.post('/api/preview-doc', async (req: Request<{}, {}, MemberData>, res: Response) => {
  try {
    const docxBuffer = generateDoc(req.body);

    // Create unique filenames for temporary files
    const timestamp = Date.now();
    const tempDocxName = `${timestamp}.docx`;
    const tempPdfName = `${timestamp}.pdf`;
    const tempDir = path.join(__dirname, '../temp');
    const tempDocxPath = path.join(tempDir, tempDocxName);
    const tempPdfPath = path.join(tempDir, tempPdfName);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write temporary DOCX file
    fs.writeFileSync(tempDocxPath, docxBuffer);

    try {
      // Convert to PDF using LibreOffice
      await convertDocxToPdf(tempDocxPath, tempPdfPath);

      // Read the generated PDF
      const pdfBuffer = fs.readFileSync(tempPdfPath);

      // Send PDF to client
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfBuffer);
    } finally {
      // Cleanup temporary files
      try {
        if (fs.existsSync(tempDocxPath)) fs.unlinkSync(tempDocxPath);
        if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary files:', cleanupError);
      }
    }
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

// Download endpoint (returns DOCX)
app.post('/api/generate-docx', async (req: Request<{}, {}, MemberData>, res: Response) => {
  try {
    const buf = generateDoc(req.body);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="member-registration-${req.body.name}.docx"`);

    res.send(buf);
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({ error: 'Failed to generate document' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});