// ===========================================
// DAJANA AI - Čuvanje ćaskanja sa Dajanom (AI Advice)
// AsyncStorage: lista sačuvanih razgovora, naslov iz prvog korisničkog poruke
// ===========================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AdvisorMessage } from '@/lib/aiAdvisorService';

const STORAGE_KEY = '@dajana_advice_chats';
const MAX_CHATS = 50;

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
  /** Istorija samo tekst (za continueConversation), bez base64 slika */
  conversationHistoryText: { role: 'user' | 'assistant'; content: string }[];
  createdAt: string;
}

/** Iz prvog korisničkog teksta napravi naslov (max ~28 znakova). */
export function titleFromMessages(messages: { role: string; content: string }[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser || !firstUser.content?.trim()) return 'Novi razgovor';
  const text = firstUser.content.trim();
  if (text.length <= 28) return text;
  return text.slice(0, 25).trim() + '...';
}

/** AdvisorMessage[] u samo tekst za čuvanje (bez base64). */
function historyToTextOnly(history: AdvisorMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  return history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => {
      const content = typeof m.content === 'string' ? m.content : (m.content as any)?.find((p: any) => p.type === 'text')?.text ?? '';
      return { role: m.role as 'user' | 'assistant', content: content || '' };
    })
    .filter((m) => m.content.length > 0);
}

export async function loadAdviceChats(): Promise<SavedAdviceChat[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as SavedAdviceChat[];
    return Array.isArray(list) ? list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
  } catch {
    return [];
  }
}

export async function saveAdviceChat(chat: SavedAdviceChat): Promise<void> {
  const full: SavedAdviceChat = { ...chat, createdAt: chat.createdAt || new Date().toISOString() };
  const list = await loadAdviceChats();
  const without = list.filter((c) => c.id !== full.id);
  const next = [full, ...without].slice(0, MAX_CHATS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function deleteAdviceChat(id: string): Promise<void> {
  const list = await loadAdviceChats();
  const next = list.filter((c) => c.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
