// ===========================================
// DAJANA AI - AI Advisor Service
// Chat ide preko Supabase Edge Function (OPENAI_API_KEY u Supabase Secrets, ne u app-u)
// ===========================================

import type { BodyType } from '@/types/database';
import type { Season } from '@/types/database';
import { BODY_TYPES } from '@/constants/bodyTypes';
import { SEASONS } from '@/constants/seasons';
import { findAiResponseForSeason } from '@/constants/seasonPalettes';

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/$/, '');
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

/** Poziv Chat preko Supabase Edge Function (OpenAI). */
async function chatViaEdge(
  messages: AdvisorMessage[],
  opts: { max_tokens?: number; temperature?: number } = {}
): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Chat zahteva Supabase. U .env postavite EXPO_PUBLIC_SUPABASE_URL i EXPO_PUBLIC_SUPABASE_ANON_KEY. Deploy-ujte Edge Function "chat" i u Supabase Secrets dodajte OPENAI_API_KEY.'
    );
  }
  const edgeUrl = `${SUPABASE_URL}/functions/v1/chat`;
  const res = await fetch(edgeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
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
    throw new Error(res.ok ? 'AI nije vratio ispravan odgovor.' : (raw || `Greška ${res.status}`));
  }
  if (!res.ok) {
    throw new Error(data.error || `AI savetnik nije dostupan (${res.status})`);
  }
  if (data.content == null) throw new Error('AI nije vratio odgovor.');
  return data.content;
}

/** Analiza outfita preko Gemini (Edge Function outfit-advice) — izbegava "I can't assist" na slikama sa ljudima. */
async function outfitAdviceViaEdge(
  systemPrompt: string,
  userText: string,
  imageBase64: string
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
  const res = await fetch(edgeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
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
    throw new Error(res.ok ? 'AI nije vratio ispravan odgovor.' : (raw || `Greška ${res.status}`));
  }
  if (!res.ok) {
    throw new Error(data.error || `Analiza outfita nije dostupna (${res.status})`);
  }
  if (data.content == null) throw new Error('AI nije vratio odgovor.');
  return data.content;
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

/** Građa i sezona u srpskom za prompt (bez obzira na jezik app-a). */
function getSeasonLabel(season: Season | null | undefined): string {
  if (!season) return '';
  return SEASONS[season]?.sr ?? season;
}
function getBodyTypeLabel(bodyType: BodyType | null | undefined): string {
  if (!bodyType) return '';
  return BODY_TYPES[bodyType]?.sr ?? bodyType;
}

/**
 * Univerzalni prompt za analizu outfita (građa + sezona).
 * Odgovor MORA biti u ovom formatu čak i kada ne poznaješ osobu (nema sezone/građe).
 */
function buildSystemPrompt(season?: Season | null, bodyType?: BodyType | null): string {
  const seasonLabel = getSeasonLabel(season);
  const bodyTypeLabel = getBodyTypeLabel(bodyType);
  const hasContext = seasonLabel || bodyTypeLabel;

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

/**
 * Get style advice from Dajana AI for a generated try-on image.
 * Uses univerzalni prompt: analiza boja vs sezona, krojevi vs građa.
 */
export async function getStyleAdvice(
  imageBase64: string,
  outfitTitle?: string | null,
  userMessage?: string,
  season?: Season | null,
  bodyType?: BodyType | null
): Promise<string> {
  if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
    throw new Error('Slika za analizu nije ispravna.');
  }
  const userText =
    userMessage ||
    `[Zahtev: analiza samo odeće — boje i krojevi.] Upravo sam isprobala ovaj outfit${outfitTitle ? ` "${outfitTitle}"` : ''} virtuelno. Šta misliš, kako kombinacija stoji? Daj mi savete za stil (boje, krojevi).`;

  let systemPrompt = buildSystemPrompt(season, bodyType);
  const suggestedReply = userMessage && season ? findAiResponseForSeason(season, userMessage) : null;
  if (suggestedReply) {
    systemPrompt += `\n\nNAPOMENA: Korisnica je rekla nešto što odgovara tipičnoj situaciji za njen kolor-tip. Preporučeni ton/odgovor: "${suggestedReply}" — koristi ovaj savet u svojoj poruci ako je prikladan.`;
  }
  // Gemini (outfit-advice) umesto OpenAI — da ne dobijamo "I can't assist" na slikama sa ljudima
  console.log('[Advisor] Calling Edge Function outfit-advice (Gemini)...');
  const content = await outfitAdviceViaEdge(systemPrompt, userText, imageBase64);
  console.log('[Advisor] Response received, length:', content.length);
  return content;
}

/**
 * Continue a conversation with Dajana about the outfit.
 * Koristi isti system prompt (sezona + građa) za konzistentnost.
 */
export async function continueConversation(
  history: AdvisorMessage[],
  userMessage: string,
  imageBase64?: string,
  season?: Season | null,
  bodyType?: BodyType | null
): Promise<string> {
  const userContent: AdvisorContentPart[] = [{ type: 'text', text: userMessage }];

  if (imageBase64) {
    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:image/png;base64,${imageBase64}`,
        detail: 'low',
      },
    });
  }

  let systemPrompt = buildSystemPrompt(season, bodyType);
  const suggestedReply = season ? findAiResponseForSeason(season, userMessage) : null;
  if (suggestedReply) {
    systemPrompt += `\n\nNAPOMENA: Korisnica je rekla nešto što odgovara tipičnoj situaciji za njen kolor-tip. Preporučeni ton/odgovor: "${suggestedReply}" — koristi ovaj savet u svojoj poruci ako je prikladan.`;
  }
  const messages: AdvisorMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userContent },
  ];

  return chatViaEdge(messages, { max_tokens: 600, temperature: 0.8 });
}
