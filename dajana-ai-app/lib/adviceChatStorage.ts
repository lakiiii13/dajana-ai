// ===========================================
// DAJANA AI - Čuvanje ćaskanja sa Dajanom (AI Advice)
// Supabase: advice_chats tabela, RLS po korisniku
// ===========================================

import { supabase } from '@/lib/supabase';
import type { AdvisorMessage } from '@/lib/aiAdvisorService';

const MAX_CHATS = 50;

export function generateChatId(): string {
  const hex = '0123456789abcdef';
  const s = (n: number) => Array.from({ length: n }, () => hex[Math.floor(Math.random() * 16)]).join('');
  return `${s(8)}-${s(4)}-4${s(3)}-${hex[8 + Math.floor(Math.random() * 4)]}${s(3)}-${s(12)}`;
}

export interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUri?: string;
  timestamp: string;
}

export interface SavedAdviceChat {
  id: string;
  title: string;
  messages: StoredMessage[];
  conversationHistoryText: { role: 'user' | 'assistant'; content: string }[];
  createdAt: string;
}

/** Iz prvog korisničkog teksta napravi naslov (max ~28 znakova). */
export function titleFromMessages(messages?: { role: string; content: string }[] | null): string {
  const firstUser = (messages ?? []).find((m) => m.role === 'user');
  if (!firstUser || !firstUser.content?.trim()) return 'Novi razgovor';
  const text = firstUser.content.trim();
  if (text.length <= 28) return text;
  return text.slice(0, 25).trim() + '...';
}

/** AdvisorMessage[] u samo tekst za čuvanje (bez base64). */
function historyToTextOnly(history?: AdvisorMessage[] | null): { role: 'user' | 'assistant'; content: string }[] {
  return (history ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => {
      const content = typeof m.content === 'string' ? m.content : (m.content as any)?.find((p: any) => p.type === 'text')?.text ?? '';
      return { role: m.role as 'user' | 'assistant', content: content || '' };
    })
    .filter((m) => m.content.length > 0);
}

export async function loadAdviceChats(userId: string): Promise<SavedAdviceChat[]> {
  try {
    const { data, error } = await supabase
      .from('advice_chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(MAX_CHATS);

    if (error) {
      console.error('[AdviceChat] Load error:', error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      messages: (row.messages as unknown as StoredMessage[]) ?? [],
      conversationHistoryText: (row.conversation_history ?? []) as { role: 'user' | 'assistant'; content: string }[],
      createdAt: row.created_at,
    }));
  } catch (e) {
    console.error('[AdviceChat] Load exception:', e);
    return [];
  }
}

export async function saveAdviceChat(userId: string, chat: SavedAdviceChat): Promise<void> {
  try {
    const { error } = await supabase
      .from('advice_chats')
      .upsert({
        id: chat.id,
        user_id: userId,
        title: chat.title,
        messages: chat.messages as any,
        conversation_history: chat.conversationHistoryText as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('[AdviceChat] Save error:', error.message);
    }
  } catch (e) {
    console.error('[AdviceChat] Save exception:', e);
  }
}

export async function deleteAdviceChat(userId: string, chatId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('advice_chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', userId);

    if (error) {
      console.error('[AdviceChat] Delete error:', error.message);
    }
  } catch (e) {
    console.error('[AdviceChat] Delete exception:', e);
  }
}

/** Sačuvaj trenutni razgovor (naslov iz prvog user poruke). */
export function buildSavedChat(
  id: string,
  messages: { id: string; role: 'user' | 'assistant'; content: string; imageUri?: string; timestamp: Date }[],
  conversationHistory: AdvisorMessage[]
): SavedAdviceChat {
  const title = titleFromMessages(messages);
  const conversationHistoryText = historyToTextOnly(conversationHistory);
  const storedMessages: StoredMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
    imageUri: m.imageUri,
    timestamp: m.timestamp.toISOString(),
  }));
  return {
    id,
    title,
    messages: storedMessages,
    conversationHistoryText,
    createdAt: new Date().toISOString() as string,
  };
}
