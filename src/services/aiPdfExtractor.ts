import * as pdfjsLib from 'pdfjs-dist';

const PDFJS_VERSION = '5.4.394';
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

    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment.');
    }

    console.log('Calling OpenAI API for policy extraction...');

    const systemPrompt = `You are an expert HR policy analyst. Your task is to extract and structure leave policies from documents.

When given a document text, you must:
1. Read and understand all leave-related policies in the document
2. Extract each distinct policy section
3. Categorize each policy appropriately
4. Return the policies in a structured JSON format

Categories you should use:
- Annual Leave
- Sick Leave
- Parental Leave
- Special Leave
- Public Holiday
- Unpaid Leave
- General

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Policy Title",
    "category": "Category Name",
    "content": "Full policy content text with all details, rules, and conditions"
  }
]

Important:
- Include ALL details from each policy section
- Keep the content comprehensive and complete
- Ensure each policy has a clear, descriptive title
- Use proper categorization
- Return ONLY the JSON array, no other text`;

    const userPrompt = `Please extract all leave policies from this document text. Return them as a JSON array following the specified format.\n\nDocument text:\n${pdfText}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2048,
      })
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API Error:', errorData);
      throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Received response from OpenAI');

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI API');
    }

    const content = data.choices[0].message.content.trim();
    console.log('AI response content length:', content.length);

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Could not find JSON in response:', content.substring(0, 500));
      throw new Error('Could not find JSON array in AI response');
    }

    const policies: ExtractedPolicy[] = JSON.parse(jsonMatch[0]);
    console.log('Parsed policies:', policies.length);

    if (!Array.isArray(policies) || policies.length === 0) {
      throw new Error('No policies extracted from PDF');
    }

    return policies;

  } catch (error) {
    console.error('Error extracting policies:', error);
    throw error;
  }
};
