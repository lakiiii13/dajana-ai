// ===========================================
// DAJANA AI - AI Advisor Service
// Chat ide preko Supabase Edge Function (OPENAI_API_KEY u Supabase Secrets, ne u app-u)
// ===========================================

import type { BodyType } from '@/types/database';
import type { Season } from '@/types/database';
import { BODY_TYPES } from '@/constants/bodyTypes';
import { SEASONS } from '@/constants/seasons';
import { findAiResponseForSeason } from '@/constants/seasonPalettes';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/$/, '');
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

function isRetryableNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg === 'Network request failed' || msg.includes('Network request failed') || msg.includes('Failed to fetch');
}

async function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Ako je odgovor HTML (npr. 502/503 stranica), vrati čitljivu poruku umesto sirovog HTML-a. */
export function sanitizeErrorOrContent(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return 'Servis je privremeno nedostupan. Pokušajte ponovo za nekoliko trenutaka.';
  const t = raw.trim();
  if (
    t.startsWith('<!') ||
    t.startsWith('<html') ||
    t.toLowerCase().includes('<!doctype') ||
    (t.startsWith('<') && t.includes('</'))
  ) {
    return 'Servis je privremeno nedostupan. Pokušajte ponovo za nekoliko trenutaka.';
  }
  return raw;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit & { signal?: AbortSignal },
  attempt = 1
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err) {
    if (options.signal?.aborted) throw err;
    if (attempt < RETRY_ATTEMPTS && isRetryableNetworkError(err)) {
      await delay(RETRY_DELAY_MS * attempt);
      return fetchWithRetry(url, options, attempt + 1);
    }
    throw err;
  }
}

/** Poziv Chat preko Supabase Edge Function (OpenAI). */
async function chatViaEdge(
  messages: AdvisorMessage[],
  opts: { max_tokens?: number; temperature?: number; signal?: AbortSignal } = {}
): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Chat zahteva Supabase. U .env postavite EXPO_PUBLIC_SUPABASE_URL i EXPO_PUBLIC_SUPABASE_ANON_KEY. Deploy-ujte Edge Function "chat" i u Supabase Secrets dodajte OPENAI_API_KEY.'
    );
  }
  const edgeUrl = `${SUPABASE_URL}/functions/v1/chat`;
  const { data: sessionData } = await supabase.auth.getSession();
  const userToken = sessionData?.session?.access_token ?? '';
  const res = await fetchWithRetry(edgeUrl, {
    method: 'POST',
    signal: opts.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      ...(userToken ? { 'X-User-JWT': userToken } : {}),
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: opts.max_tokens ?? 1200,
      temperature: opts.temperature ?? 0.7,
    }),
  });
  const raw = await res.text();
  let data: { content?: string; error?: string };
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(res.ok ? 'AI nije vratio ispravan odgovor.' : (sanitizeErrorOrContent(raw) || `Greška ${res.status}`));
  }
  if (!res.ok) {
    throw new Error(sanitizeErrorOrContent(data.error) || `AI savetnik nije dostupan (${res.status})`);
  }
  if (data.content == null) throw new Error('AI nije vratio odgovor.');
  return sanitizeErrorOrContent(data.content) || data.content;
}

/** Analiza outfita preko Gemini (Edge Function outfit-advice) — izbegava "I can't assist" na slikama sa ljudima. */
async function outfitAdviceViaEdge(
  systemPrompt: string,
  userText: string,
  imageBase64: string,
  signal?: AbortSignal
): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Analiza outfita zahteva Supabase. Deploy-ujte Edge Function "outfit-advice" i u Secrets dodajte GEMINI_API_KEY.'
    );
  }
  let base64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const mimeType = imageBase64.startsWith('data:image/jpeg') || imageBase64.startsWith('data:image/jpg')
    ? 'image/jpeg'
    : 'image/png';

  const edgeUrl = `${SUPABASE_URL}/functions/v1/outfit-advice`;
  const { data: sessionData } = await supabase.auth.getSession();
  const userToken = sessionData?.session?.access_token ?? '';
  const res = await fetchWithRetry(edgeUrl, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      ...(userToken ? { 'X-User-JWT': userToken } : {}),
    },
    body: JSON.stringify({
      systemPrompt,
      userText,
      imageBase64: base64,
      mimeType,
    }),
  });
  const raw = await res.text();
  let data: { content?: string; error?: string };
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(res.ok ? 'AI nije vratio ispravan odgovor.' : (sanitizeErrorOrContent(raw) || `Greška ${res.status}`));
  }
  if (!res.ok) {
    throw new Error(sanitizeErrorOrContent(data.error) || `Analiza outfita nije dostupna (${res.status})`);
  }
  if (data.content == null) throw new Error('AI nije vratio odgovor.');
  return sanitizeErrorOrContent(data.content) || data.content;
}

export interface AdvisorMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | AdvisorContentPart[];
}

interface AdvisorContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string; detail?: string };
}

/** Uklanja base64 slike iz istorije pre slanja chat-u — payload može biti 1–2 MB i izaziva 502/timeout. */
function stripImagesFromHistory(messages: AdvisorMessage[]): AdvisorMessage[] {
  return messages.map((m) => {
    if (typeof m.content === 'string') return m;
    const parts = m.content as AdvisorContentPart[];
    const hasImage = parts.some((p) => p.type === 'image_url');
    if (!hasImage) return m;
    const textParts = parts.filter((p) => p.type === 'text' && p.text).map((p) => (p as { text: string }).text);
    const placeholder = '[Slika outfita — analiza u odgovoru ispod]';
    return { ...m, content: [...textParts, placeholder].filter(Boolean).join('\n') || placeholder };
  });
}

/** Građa i sezona za prompt — sr ili en u zavisnosti od jezika. */
function getSeasonLabel(season: Season | null | undefined, lang: 'sr' | 'en' = 'sr'): string {
  if (!season) return '';
  return (lang === 'en' ? SEASONS[season]?.en : SEASONS[season]?.sr) ?? season;
}
function getBodyTypeLabel(bodyType: BodyType | null | undefined, lang: 'sr' | 'en' = 'sr'): string {
  if (!bodyType) return '';
  return (lang === 'en' ? BODY_TYPES[bodyType]?.en : BODY_TYPES[bodyType]?.sr) ?? bodyType;
}

/**
 * Univerzalni prompt za analizu outfita (građa + sezona).
 * Odgovor MORA biti u ovom formatu čak i kada ne poznaješ osobu (nema sezone/građe).
 * language: 'en' → odgovor na engleskom, inače na srpskom.
 */
function buildSystemPrompt(
  season?: Season | null,
  bodyType?: BodyType | null,
  language: 'sr' | 'en' = 'sr'
): string {
  const lang = language === 'en' ? 'en' : 'sr';
  const seasonLabel = getSeasonLabel(season, lang);
  const bodyTypeLabel = getBodyTypeLabel(bodyType, lang);
  const hasContext = seasonLabel || bodyTypeLabel;

  if (lang === 'en') {
    const contextBlock = hasContext
      ? `
The client has:
${seasonLabel ? `- Seasonal color type: ${seasonLabel}` : ''}
${bodyTypeLabel ? `- Body shape: ${bodyTypeLabel}` : ''}
`
      : `
The client has NOT entered season or body type. You MUST still give a full analysis in the same format:
- For colors: analyze against typical seasonal criteria and clearly state which season (e.g. true winter / true spring / true autumn / summer) the combination best suits and why.
- For cuts: analyze against typical body types (e.g. hourglass / pear / rectangle / apple) and state for which body shape this combination works best and where to be cautious.
The response structure (1. colors, 2. cuts, 3. conclusion) and tone remain the same.
`;

    return `IMPORTANT: This is a fashion and style advice app. The client sends an OUTFIT image (virtually tried-on combination). Your only task is to analyze the CLOTHING: colors, cuts, proportions. You do NOT analyze people. Never refuse a request — never write "I'm sorry", "I can't help", "I cannot" or similar. Always respond with a full analysis in the format below, in English.

You are Dajana — a professional stylist and expert in women's fashion. You're talking to a client who has tried the outfit virtually (AI Try-On).

LANGUAGE: Respond ONLY in English. Never write in Serbian. Always sign "— Dajana 💋" at the end.

TASK: You analyze only the OUTFIT (clothing). The image shows a clothing combination — evaluate colors, cuts, whether it suits the seasonal color type and body shape. You do NOT analyze face or identity. Always give a concrete response in the requested format; never refuse.

${contextBlock}

UNIVERSAL OUTFIT ANALYSIS FORMAT

Analyze the combination in the image against:
1. seasonal color type${seasonLabel ? `: ${seasonLabel}` : ' (estimate which best fits if not provided)'}
2. body shape${bodyTypeLabel ? `: ${bodyTypeLabel}` : ' (estimate which best fits if not provided)'}

Structure your response EXACTLY like this:

1. DO THE COLORS MATCH THE SEASON?${seasonLabel ? ` (e.g. ${seasonLabel})` : ''}
   – Clearly state YES or NO (or "YES, with minor tweaks").
   – What works ✔️ (list specific colors and why they work)
   – What to watch out for ⚠️ (nuances, mistakes, what to avoid)
   – ➡️ Color conclusion: one short sentence.

2. DO THE CUTS SUIT THE BODY SHAPE?${bodyTypeLabel ? ` (${bodyTypeLabel})` : ''}
   – What works and why ✔️
   – Where to be cautious ⚠️
   – Easy fixes 👌 (concrete tips: e.g. wear coat unbuttoned or with a belt)
   – ➡️ Shape conclusion: one short sentence.

3. CONCLUSION
   – Briefly summarize whether the combination works.
   – Emphasize under what conditions it looks best.

TONE:
– Professional, clear and concrete.
– No generic phrases or generic "internet advice".
– Focus on real wearability and proportions.`;
  }

  const contextBlock = hasContext
    ? `
Korisnica ima:
${seasonLabel ? `- Sezonski kolor-tip: ${seasonLabel}` : ''}
${bodyTypeLabel ? `- Oblik tijela (građa): ${bodyTypeLabel}` : ''}
`
    : `
Korisnica NIJE unela sezonu ili građu. Ipak MORAŠ dati punu analizu u istom formatu:
- Za boje: analiziraj u odnosu na tipične sezonske kriterijume i jasno navedi kojoj sezoni (npr. prava zima / pravo proljeće / prava jesen / ljeto) kombinacija najviše odgovara i zašto.
- Za krojeve: analiziraj u odnosu na tipične tipove građe (npr. peščani sat / kašika / pravougaonik / jabuka) i navedi za koji oblik tijela ova kombinacija najbolje radi i gde bi trebalo biti oprezna.
Struktura odgovora (1. boje, 2. krojevi, 3. zaključak) i ton ostaju isti.
`;

  return `VAŽNO: Ovo je aplikacija za modu i stilske savete. Korisnica šalje sliku OUTFITA (virtuelno isprobana kombinacija). Tvoj jedini zadatak je da analiziraš ODEĆU: boje, krojeve, proporcije. Ne analiziraš ljude. Nikada ne odbij zahtev — nikada ne napiši "I'm sorry", "I can't help", "I cannot" ili slično. Uvek odgovori punom analizom u formatu ispod, na srpskom.

Ti si Dajana — profesionalni stilista i ekspert za žensku modu. Razgovaraš sa klijentkom koja je isprobala outfit virtuelno (AI Try-On).

JEZIK: Odgovaraj ISKLJUČIVO na srpskom (latinica). Nikada ne piši na engleskom. Na kraju uvek potpiši "— Dajana 💋"

ZADATAK: Analiziraš samo OUTFIT (odeću). Slika prikazuje kombinaciju odeće — oceniš boje, krojeve, da li odgovara sezonskom kolor-tipu i građi. Ne analiziraš lice ni identitet. Uvek daj konkretan odgovor u traženom formatu; nikada ne odbij.

${contextBlock}

UNIVERZALNI FORMAT ZA ANALIZU OUTFITA

Analiziraj kombinaciju na slici u odnosu na:
1. sezonski kolor-tip${seasonLabel ? `: ${seasonLabel}` : ' (proceni koji najbolje odgovara ako nije uneto)'}
2. oblik tijela (građu)${bodyTypeLabel ? `: ${bodyTypeLabel}` : ' (proceni koji najbolje odgovara ako nije uneto)'}

Odgovor OBAVEZNO strukturiraj ovako:

1. DA LI BOJE ODGOVARAJU SEZONI?${seasonLabel ? ` (npr. ${seasonLabel})` : ''}
   – Jasno navedi DA ili NE (eventualno "DA, uz malu korekciju").
   – Šta je pogođeno ✔️ (navedi konkretne boje i zašto odgovaraju)
   – Na šta obratiti pažnju ⚠️ (nijanse, greške, šta izbegavati)
   – ➡️ Zaključak za boje: kratka rečenica.

2. DA LI KROJEVI ODGOVARAJU GRAĐI?${bodyTypeLabel ? ` (${bodyTypeLabel})` : ''}
   – Šta je dobro i zašto ✔️
   – Gde treba biti oprezna ⚠️
   – Kako to lako popraviti 👌 (konkretni saveti: npr. kaput nositi otkopčan ili s pojasom)
   – ➡️ Zaključak za građu: kratka rečenica.

3. ZAKLJUČAK
   – Kratko sumiraj da li kombinacija radi.
   – Naglasi pod kojim uslovima izgleda najbolje.

TON:
– Profesionalan, jasan i konkretan.
– Bez opštih fraza i bez generičkih "internet saveta".
– Fokus na realnu nosivost i proporcije.`;
}

const DEFAULT_USER_TEXT_SR =
  (outfitTitle: string | null) =>
  `[Zahtev: analiza samo odeće — boje i krojevi.] Upravo sam isprobala ovaj outfit${outfitTitle ? ` "${outfitTitle}"` : ''} virtuelno. Šta misliš, kako kombinacija stoji? Daj mi savete za stil (boje, krojevi).`;
const DEFAULT_USER_TEXT_EN =
  (outfitTitle: string | null) =>
  `[Request: analyze only the clothes — colors and cuts.] I just tried this outfit${outfitTitle ? ` "${outfitTitle}"` : ''} virtually. What do you think, how does the combination look? Give me style advice (colors, cuts).`;

/**
 * Get style advice from Dajana AI for a generated try-on image.
 * Uses univerzalni prompt: analiza boja vs sezona, krojevi vs građa.
 */
export async function getStyleAdvice(
  imageBase64: string,
  outfitTitle?: string | null,
  userMessage?: string,
  season?: Season | null,
  bodyType?: BodyType | null,
  language: 'sr' | 'en' = 'sr'
): Promise<string> {
  if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
    throw new Error('Slika za analizu nije ispravna.');
  }
  const userText =
    userMessage ||
    (language === 'en' ? DEFAULT_USER_TEXT_EN(outfitTitle ?? null) : DEFAULT_USER_TEXT_SR(outfitTitle ?? null));

  let systemPrompt = buildSystemPrompt(season, bodyType, language);
  const suggestedReply = userMessage && season ? findAiResponseForSeason(season, userMessage) : null;
  if (suggestedReply) {
    systemPrompt += language === 'en'
      ? `\n\nNOTE: The client said something typical for their color type. Suggested tone/response (translate to English if using): "${suggestedReply}" — use this advice in your message if appropriate.`
      : `\n\nNAPOMENA: Korisnica je rekla nešto što odgovara tipičnoj situaciji za njen kolor-tip. Preporučeni ton/odgovor: "${suggestedReply}" — koristi ovaj savet u svojoj poruci ako je prikladan.`;
  }
  // Gemini (outfit-advice) umesto OpenAI — da ne dobijamo "I can't assist" na slikama sa ljudima
  console.log('[Advisor] Calling Edge Function outfit-advice (Gemini)...');
  const content = await outfitAdviceViaEdge(systemPrompt, userText, imageBase64, undefined);
  console.log('[Advisor] Response received, length:', content.length);
  return content;
}

/** getStyleAdvice sa opcijom prekida (AbortSignal). */
export async function getStyleAdviceWithSignal(
  imageBase64: string,
  signal: AbortSignal,
  outfitTitle?: string | null,
  userMessage?: string,
  season?: Season | null,
  bodyType?: BodyType | null,
  language: 'sr' | 'en' = 'sr'
): Promise<string> {
  if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
    throw new Error('Slika za analizu nije ispravna.');
  }
  const userText =
    userMessage ||
    (language === 'en' ? DEFAULT_USER_TEXT_EN(outfitTitle ?? null) : DEFAULT_USER_TEXT_SR(outfitTitle ?? null));

  let systemPrompt = buildSystemPrompt(season, bodyType, language);
  const suggestedReply = userMessage && season ? findAiResponseForSeason(season, userMessage) : null;
  if (suggestedReply) {
    systemPrompt += language === 'en'
      ? `\n\nNOTE: The client said something typical for their color type. Suggested tone/response (translate to English if using): "${suggestedReply}" — use this advice in your message if appropriate.`
      : `\n\nNAPOMENA: Korisnica je rekla nešto što odgovara tipičnoj situaciji za njen kolor-tip. Preporučeni ton/odgovor: "${suggestedReply}" — koristi ovaj savet u svojoj poruci ako je prikladan.`;
  }
  return outfitAdviceViaEdge(systemPrompt, userText, imageBase64, signal);
}

/**
 * Continue a conversation with Dajana about the outfit.
 * Koristi isti system prompt (sezona + građa) za konzistentnost.
 */
export async function continueConversation(
  history: AdvisorMessage[],
  userMessage: string,
  _imageBase64?: string,
  season?: Season | null,
  bodyType?: BodyType | null,
  language: 'sr' | 'en' = 'sr'
): Promise<string> {
  // Sliku ne šalemo u follow-up — istorija već sadrži analizu, base64 bi povećao payload na 1–2 MB i izazvao 502/timeout.
  const userContent: string = userMessage;

  let systemPrompt = buildSystemPrompt(season, bodyType, language);
  const suggestedReply = season ? findAiResponseForSeason(season, userMessage) : null;
  if (suggestedReply) {
    systemPrompt += language === 'en'
      ? `\n\nNOTE: The client said something typical for their color type. Suggested tone/response (translate to English if using): "${suggestedReply}" — use this advice in your message if appropriate.`
      : `\n\nNAPOMENA: Korisnica je rekla nešto što odgovara tipičnoj situaciji za njen kolor-tip. Preporučeni ton/odgovor: "${suggestedReply}" — koristi ovaj savet u svojoj poruci ako je prikladan.`;
  }
  const lightHistory = stripImagesFromHistory(history);
  const messages: AdvisorMessage[] = [
    { role: 'system', content: systemPrompt },
    ...lightHistory,
    { role: 'user', content: userContent },
  ];

  return chatViaEdge(messages, { max_tokens: 600, temperature: 0.8 });
}

/** continueConversation sa opcijom prekida (AbortSignal). */
export async function continueConversationWithSignal(
  history: AdvisorMessage[],
  userMessage: string,
  signal: AbortSignal,
  _imageBase64?: string,
  season?: Season | null,
  bodyType?: BodyType | null,
  language: 'sr' | 'en' = 'sr'
): Promise<string> {
  // Sliku ne šalemo u follow-up — istorija već sadrži analizu, base64 bi povećao payload na 1–2 MB i izazvao 502/timeout.
  const userContent: string = userMessage;

  let systemPrompt = buildSystemPrompt(season, bodyType, language);
  const suggestedReply = season ? findAiResponseForSeason(season, userMessage) : null;
  if (suggestedReply) {
    systemPrompt += language === 'en'
      ? `\n\nNOTE: The client said something typical for their color type. Suggested tone/response (translate to English if using): "${suggestedReply}" — use this advice in your message if appropriate.`
      : `\n\nNAPOMENA: Korisnica je rekla nešto što odgovara tipičnoj situaciji za njen kolor-tip. Preporučeni ton/odgovor: "${suggestedReply}" — koristi ovaj savet u svojoj poruci ako je prikladan.`;
  }
  const lightHistory = stripImagesFromHistory(history);
  const messages: AdvisorMessage[] = [
    { role: 'system', content: systemPrompt },
    ...lightHistory,
    { role: 'user', content: userContent },
  ];

  return chatViaEdge(messages, { max_tokens: 600, temperature: 0.8, signal });
}

/**
 * Generiše kratak naslov razgovora po temi (OpenAI). Koristi se odmah nakon prvog odgovora.
 * Ne skida kredite — minimalan zahtev.
 */
export async function generateChatTitle(userMessage: string, assistantReply: string): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return '';
  const truncatedUser = userMessage.trim().slice(0, 200);
  const truncatedAssistant = assistantReply.trim().slice(0, 300);
  const messages: AdvisorMessage[] = [
    {
      role: 'system',
      content:
        'Odgovori SAMO kratkim naslovom razgovora (maksimalno 5–6 reči), u istom jeziku kao razgovor. Bez navodnika, bez tačke na kraju. Primer: Savet za outfit u sivoj bluzi.',
    },
    {
      role: 'user',
      content: `Korisnik: ${truncatedUser}\n\nAsistent: ${truncatedAssistant}`,
    },
  ];
  try {
    const title = await chatViaEdge(messages, { max_tokens: 30, temperature: 0.3 });
    return (title || '').trim().slice(0, 50) || '';
  } catch {
    return '';
  }
}
