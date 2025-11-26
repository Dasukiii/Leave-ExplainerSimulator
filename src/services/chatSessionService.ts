import { supabase } from '../lib/supabaseClient';
import { Message } from '../types';

export interface ChatSession {
  id: string;
  user_profile_id: string;
  session_label: string;
  messages: Message[];
  created_at: string;
}

export const getChatSession = async (userProfileId: string): Promise<ChatSession | null> => {
  console.log('[chatSessionService] Getting chat session for user:', userProfileId);

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_profile_id', userProfileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[chatSessionService] Error fetching chat session:', error);
    throw error;
  }

  console.log('[chatSessionService] Found chat session:', data ? 'Yes' : 'No');
  return data;
};

export const createChatSession = async (
  userProfileId: string,
  messages: Message[] = []
): Promise<ChatSession> => {
  console.log('[chatSessionService] Creating new chat session for user:', userProfileId);

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert([
      {
        user_profile_id: userProfileId,
        session_label: `Chat ${new Date().toLocaleDateString()}`,
        messages: messages,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('[chatSessionService] Error creating chat session:', error);
    throw error;
  }

  console.log('[chatSessionService] Chat session created:', data.id);
  return data;
};

export const updateChatSession = async (
  sessionId: string,
  messages: Message[]
): Promise<void> => {
  console.log('[chatSessionService] Updating chat session:', sessionId, 'with', messages.length, 'messages');

  const { error } = await supabase
    .from('chat_sessions')
    .update({ messages })
    .eq('id', sessionId);

  if (error) {
    console.error('[chatSessionService] Error updating chat session:', error);
    throw error;
  }

  console.log('[chatSessionService] Chat session updated successfully');
};

export const getOrCreateChatSession = async (
  userProfileId: string
): Promise<ChatSession> => {
  const existingSession = await getChatSession(userProfileId);

  if (existingSession) {
    return existingSession;
  }

  return await createChatSession(userProfileId);
};
