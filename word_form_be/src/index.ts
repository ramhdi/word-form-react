import express, { Request, Response } from 'express';
import cors from 'cors';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
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

// Generate DOCX endpoint
app.post('/api/generate-docx', async (req: Request<{}, {}, MemberData>, res: Response) => {
  try {
    const memberData = req.body;

    // Load the template
    const templatePath = path.join(__dirname, '../templates/member-template.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Render the document with data
    doc.render(memberData);

    // Generate the document
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="member-registration-${memberData.name}.docx"`);

    // Send the document
    res.send(buf);
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({ error: 'Failed to generate document' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});