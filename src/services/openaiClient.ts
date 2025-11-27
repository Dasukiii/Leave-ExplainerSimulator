import { Message, User } from '../types';
import { SYSTEM_INSTRUCTION_TEMPLATE } from '../constants';

export async function sendMessageToOpenAI(
  messages: Message[],
  currentInput: string,
  user: User,
  policyContext: string = ''
): Promise<string> {
  const systemPrompt = SYSTEM_INSTRUCTION_TEMPLATE
    .replace('{{USER_NAME}}', user.name)
    .replace('{{USER_TENURE}}', user.tenureYears.toString())
    .replace('{{BALANCE_ANNUAL}}', user.balances.annual.toString())
    .replace('{{BALANCE_SICK}}', user.balances.sick.toString())
    .replace('{{POLICY_TEXT}}', policyContext || 'No policies available.');

  let openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

  // Note: Deno.env.get is only available in Deno/edge function environments
  // In browser, we use import.meta.env
  if (!openaiApiKey && typeof Deno !== 'undefined') {
    try {
      openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';
    } catch (e) {
      // Deno.env not available in this context
    }
  }

  if (!openaiApiKey) {
    return 'Error: OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to Bolt secrets or OPENAI_API_KEY to edge function environment.';
  }

  const conversationHistory = messages.map(m => ({
    role: m.role === 'model' ? 'assistant' : m.role,
    content: m.text
  }));

  try {
    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
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
            ...conversationHistory,
            {
              role: 'user',
              content: currentInput
            }
          ],
          temperature: 0.7,
          max_tokens: 2048,
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API Error:', errorData);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    }

    return 'Sorry, I could not generate a response. Please try again.';
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return 'An error occurred while connecting to the AI service. Please check your API key and try again.';
  }
}
