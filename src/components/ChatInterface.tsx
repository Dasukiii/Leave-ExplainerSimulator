import React, { useState, useRef, useEffect } from 'react';
import { Message, User } from '../types';
import { sendMessageToOpenAI } from '../services/openaiClient';
import { getAllPolicies } from '../services/policyService';
import { getOrCreateChatSession, updateChatSession, ChatSession } from '../services/chatSessionService';
import { Send, Bot, User as UserIcon, Sparkles, AlertCircle, RefreshCw, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  user: User;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatSession();
  }, [user.id]);

  const loadChatSession = async () => {
    try {
      console.log('[ChatInterface] Loading chat session for user:', user.id);
      const session = await getOrCreateChatSession(user.id);
      setSessionId(session.id);
      setMessages(session.messages || []);
      console.log('[ChatInterface] Loaded', session.messages?.length || 0, 'messages');
    } catch (error) {
      console.error('[ChatInterface] Error loading chat session:', error);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const saveChatSession = async (updatedMessages: Message[]) => {
    if (!sessionId) return;
    try {
      await updateChatSession(sessionId, updatedMessages);
    } catch (error) {
      console.error('[ChatInterface] Error saving chat session:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const policies = await getAllPolicies(user.id);
      const policyContext = policies.map(p => `${p.title} (${p.category}): ${p.text_doc}`).join('\n\n');

      const responseText = await sendMessageToOpenAI(messages, input, user, policyContext);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };

      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);
      await saveChatSession(finalMessages);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "How much annual leave do I have?",
    "Simulate 5 days leave in August",
    "Am I eligible for parental leave?",
    "Can I carry over unused leave?"
  ];

  const exportToPDF = () => {
    const content = messages.map(msg => {
      const role = msg.role === 'user' ? 'You' : 'AI Assistant';
      const time = new Date(msg.timestamp).toLocaleString();
      return `${role} (${time}):\n${msg.text}\n\n`;
    }).join('---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoadingSession) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading chat session...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-slate-950">
      {messages.length > 0 && (
        <div className="absolute top-4 right-6 z-30">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition-all shadow-lg"
          >
            <Download size={16} />
            <span className="text-sm">Export Chat</span>
          </button>
        </div>
      )}

      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 z-10 relative">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700 shadow-2xl">
                <Sparkles className="text-blue-400 w-10 h-10" />
              </div>
            </div>
            
            <div className="space-y-2 max-w-lg">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Hi {user.name.split(' ')[0]}!
              </h2>
              <p className="text-slate-400 text-lg">
                Ask me anything about leave policies or run a simulation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(suggestion);
                    // Optional: auto-send
                  }}
                  className="p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-xl text-left transition-all duration-300 group"
                >
                  <span className="text-slate-300 group-hover:text-white text-sm">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6 pt-10">
             {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20">
                    <Bot size={16} className="text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-none backdrop-blur-sm'
                  }`}
                >
                  {msg.role === 'model' ? (
                     <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                     </div>
                  ) : (
                    <p className="text-sm">{msg.text}</p>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                    <UserIcon size={16} className="text-slate-400" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
                    <RefreshCw size={16} className="text-white animate-spin" />
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></span>
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-950 border-t border-slate-800/50 relative z-20">
        <div className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question here..."
            className="w-full bg-slate-900/50 border border-slate-800 text-slate-200 rounded-2xl pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-slate-500 transition-all shadow-lg"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
          >
            <Send size={20} />
          </button>
        </div>
        <div className="text-center mt-3 text-xs text-slate-600">
          AI responses may vary. Check official policy documents for binding rules.
        </div>
      </div>
    </div>
  );
};