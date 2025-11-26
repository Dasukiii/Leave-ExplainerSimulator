import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExtractPoliciesRequest {
  pdfText: string;
}

interface ExtractedPolicy {
  title: string;
  category: string;
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { pdfText }: ExtractPoliciesRequest = await req.json();

    if (!pdfText || pdfText.length < 50) {
      throw new Error('Invalid or empty PDF text provided');
    }

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

    console.log('Calling OpenAI API...');
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
      throw new Error(`API request failed: ${response.status} - ${JSON.stringify(errorData)}`);
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

    return new Response(
      JSON.stringify({ policies }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error in extract-policies function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});