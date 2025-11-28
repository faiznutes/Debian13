import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { generatePDF } from '../services/pdf.service';
import { checkExportReportsAddon } from '../middlewares/addon-guard';

const router = Router();

// Helper function to set CORS headers
function setCORSHeaders(req: Request, res: Response) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

// Handle OPTIONS request for CORS preflight (MUST be before authGuard)
router.options('/generate', (req: Request, res: Response) => {
  setCORSHeaders(req, res);
  res.setHeader('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

// Generate PDF using PDFMake
router.post(
  '/generate',
  authGuard,
  checkExportReportsAddon,
  async (req: Request, res: Response) => {
    // Set CORS headers first, before any response
    setCORSHeaders(req, res);
    
    try {
      const { template, data } = req.body;
      
      // Debug: Log received template
      console.log(`Received template request: ${template}`);
      
      if (!template || !['minimalist', 'modern', 'classic', 'colorful', 'elegant'].includes(template)) {
        return res.status(400).json({ 
          message: 'Invalid template. Must be one of: minimalist, modern, classic, colorful, elegant' 
        });
      }
      
      if (!data) {
        return res.status(400).json({ message: 'Data is required' });
      }
      
      try {
        // Generate PDF using PDFMake
        console.log(`Generating PDF with template: ${template}`);
        const pdfBuffer = await generatePDF(template, data);
        
        // Send PDF as response with CORS headers already set
        res.setHeader('Content-Type', 'application/pdf');
        const filename = encodeURIComponent(data.filename || 'report.pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${filename}`);
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        
        res.send(pdfBuffer);
        
      } catch (error: any) {
        console.error('Error generating PDF with PDFMake:', error);
        return res.status(500).json({ 
          message: 'Failed to generate PDF', 
          error: error.message
        });
      }
      
    } catch (error: any) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: error.message || 'Failed to generate PDF' });
    }
  }
);

export default router;

