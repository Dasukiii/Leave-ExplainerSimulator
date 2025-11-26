import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
// Using unpkg as a reliable CDN for the worker file
const PDFJS_VERSION = '5.4.394'; // Match the installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

console.log('PDF.js configured with worker:', pdfjsLib.GlobalWorkerOptions.workerSrc);

export interface ExtractedPolicy {
  title: string;
  category: string;
  content: string;
}

const extractTextFromPDFBuffer = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        console.log('ArrayBuffer size:', arrayBuffer.byteLength);

        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          verbosity: 0
        });

        console.log('Loading PDF document...');
        const pdf = await loadingTask.promise;
        console.log('PDF loaded successfully. Pages:', pdf.numPages);

        let fullText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          console.log(`Processing page ${pageNum}/${pdf.numPages}`);
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n';
        }

        fullText = fullText.replace(/\s+/g, ' ').trim();
        console.log('Total text extracted:', fullText.length, 'characters');

        if (!fullText || fullText.length < 50) {
          reject(new Error('Could not extract text from PDF. The file may be empty or image-based.'));
          return;
        }

        resolve(fullText);
      } catch (error) {
        console.error('PDF extraction error details:', error);
        if (error instanceof Error) {
          reject(new Error(`Failed to read PDF: ${error.message}`));
        } else {
          reject(new Error('Failed to read PDF file. Please ensure it is a valid PDF document.'));
        }
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(new Error('Failed to read PDF file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const extractPoliciesFromPDF = async (file: File): Promise<ExtractedPolicy[]> => {
  try {
    console.log('Extracting text from PDF...');
    const pdfText = await extractTextFromPDFBuffer(file);
    console.log(`Extracted ${pdfText.length} characters from PDF`);

    console.log('Calling Supabase Edge Function...');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration not found');
    }

    const functionUrl = `${supabaseUrl}/functions/v1/extract-policies`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ pdfText })
    });

    console.log('Edge Function response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Edge Function Error:', errorData);
      throw new Error(`API request failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Received response from Edge Function');

    if (!data.policies || !Array.isArray(data.policies)) {
      throw new Error('Invalid response from Edge Function');
    }

    const policies: ExtractedPolicy[] = data.policies;
    console.log('Parsed policies:', policies.length);

    if (policies.length === 0) {
      throw new Error('No policies extracted from PDF');
    }

    return policies;

  } catch (error) {
    console.error('Error extracting policies:', error);
    throw error;
  }
};
