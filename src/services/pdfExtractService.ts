export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);

        let text = '';
        for (let i = 0; i < uint8Array.length; i++) {
          const char = String.fromCharCode(uint8Array[i]);
          if (char.match(/[\x20-\x7E\n\r\t]/)) {
            text += char;
          }
        }

        text = text.replace(/\s+/g, ' ').trim();

        if (!text || text.length < 50) {
          reject(new Error('Could not extract text from PDF. The file may be image-based or encrypted.'));
          return;
        }

        resolve(text);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read PDF file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const parsePolicyText = (text: string): Array<{ title: string; content: string; category: string }> => {
  const policies: Array<{ title: string; content: string; category: string }> = [];

  const lines = text.split(/\n+/);
  let currentPolicy: { title: string; content: string; category: string } | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) continue;

    const isTitleLine =
      /^[A-Z][A-Za-z\s]+(?:Policy|Leave|Entitlement|Guidelines?|Procedure)$/i.test(trimmedLine) ||
      /^\d+\.\s+[A-Z]/.test(trimmedLine) ||
      /^[IVX]+\.\s+[A-Z]/.test(trimmedLine);

    if (isTitleLine && trimmedLine.length < 100) {
      if (currentPolicy && currentPolicy.content.length > 50) {
        policies.push(currentPolicy);
      }

      const category = determineCategory(trimmedLine);

      currentPolicy = {
        title: trimmedLine.replace(/^\d+\.\s*|^[IVX]+\.\s*/i, '').trim(),
        content: '',
        category: category
      };
    } else if (currentPolicy) {
      currentPolicy.content += (currentPolicy.content ? ' ' : '') + trimmedLine;
    }
  }

  if (currentPolicy && currentPolicy.content.length > 50) {
    policies.push(currentPolicy);
  }

  if (policies.length === 0 && text.length > 100) {
    policies.push({
      title: 'Company Leave Policy',
      content: text.substring(0, 5000),
      category: 'General'
    });
  }

  return policies;
};

const determineCategory = (title: string): string => {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('annual') || titleLower.includes('vacation')) {
    return 'Annual Leave';
  } else if (titleLower.includes('sick')) {
    return 'Sick Leave';
  } else if (titleLower.includes('parental') || titleLower.includes('maternity') || titleLower.includes('paternity')) {
    return 'Parental Leave';
  } else if (titleLower.includes('compassionate') || titleLower.includes('bereavement')) {
    return 'Special Leave';
  } else if (titleLower.includes('public') || titleLower.includes('holiday')) {
    return 'Public Holiday';
  } else if (titleLower.includes('unpaid')) {
    return 'Unpaid Leave';
  } else if (titleLower.includes('study') || titleLower.includes('education')) {
    return 'Special Leave';
  } else {
    return 'General';
  }
};
