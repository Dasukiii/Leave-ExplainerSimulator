import { Message } from '../types';

export interface ChatSession {
  id: string;
  user_profile_id: string;
  session_label: string;
  messages: Message[];
  created_at: string;
}

const STORAGE_KEY = 'chat_sessions';

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const getChatSessions = (): ChatSession[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveChatSessions = (sessions: ChatSession[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const getChatSession = async (userProfileId: string): Promise<ChatSession | null> => {
  console.log('[chatSessionService] Getting chat session for user:', userProfileId);

  const sessions = getChatSessions();
  const userSessions = sessions
    .filter(s => s.user_profile_id === userProfileId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const session = userSessions[0] || null;
  console.log('[chatSessionService] Found chat session:', session ? 'Yes' : 'No');
  return session;
};

export const createChatSession = async (
  userProfileId: string,
  messages: Message[] = []
): Promise<ChatSession> => {
  console.log('[chatSessionService] Creating new chat session for user:', userProfileId);

  const sessions = getChatSessions();

  const newSession: ChatSession = {
    id: generateId(),
    user_profile_id: userProfileId,
    session_label: `Chat ${new Date().toLocaleDateString()}`,
    messages: messages,
    created_at: new Date().toISOString(),
  };

  sessions.push(newSession);
  saveChatSessions(sessions);

  console.log('[chatSessionService] Chat session created:', newSession.id);
  return newSession;
};

export const updateChatSession = async (
  sessionId: string,
  messages: Message[]
): Promise<void> => {
  console.log('[chatSessionService] Updating chat session:', sessionId, 'with', messages.length, 'messages');

  const sessions = getChatSessions();
  const index = sessions.findIndex(s => s.id === sessionId);

  if (index === -1) {
    throw new Error('Chat session not found');
  }

  sessions[index].messages = messages;
  saveChatSessions(sessions);

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
