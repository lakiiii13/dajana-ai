// ===========================================
// DAJANA AI - AI Advisor Service
// Uses OpenAI GPT-4 Vision for style advice
// Univerzalni prompt za analizu outfita: sezonski kolor-tip + građa (oblik tijela)
// ===========================================

import type { BodyType } from '@/types/database';
import type { Season } from '@/types/database';
import { BODY_TYPES } from '@/constants/bodyTypes';
import { SEASONS } from '@/constants/seasons';
import { findAiResponseForSeason } from '@/constants/seasonPalettes';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

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
 * Struktura odgovora: boje vs sezona, krojevi vs građa, zaključak. Ton: profesionalan, jasan, konkretan.
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
    : '\nKorisnica nije unela sezonu ili građu — analiziraj outfit opšte, a istakni šta bi bilo korisno znati (npr. koja sezona/građa bi najbolje odgovarala).\n';

  return `Ti si Dajana — profesionalni stilista i ekspert za žensku modu. Razgovaraš sa klijentkom koja je isprobala outfit virtuelno (AI Try-On).
Koristiš srpski (latinicu), obraćaš se sa "ti". Na kraju uvek potpiši "— Dajana 💋"

${contextBlock}

Kada analiziraš kombinaciju na slici, OBAVEZNO strukturiraj odgovor ovako:

1. DA LI BOJE ODGOVARAJU SEZONI?${seasonLabel ? ` (npr. ${seasonLabel})` : ''}
   – Jasno navedi da li odgovaraju ili ne.
   – Šta je pogođeno ✔️
   – Na šta obratiti pažnju (nijanse, greške) ⚠️
   – Kratak zaključak za boje.

2. DA LI KROJEVI ODGOVARAJU GRAĐI?${bodyTypeLabel ? ` (${bodyTypeLabel})` : ''}
   – Šta je dobro i zašto ✔️
   – Gde treba biti oprezna ⚠️
   – Kako lako popraviti (konkretni saveti) 👌
   – Kratak zaključak za građu.

3. ZAKLJUČAK
   – Da li kombinacija radi; pod kojim uslovima izgleda najbolje.

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
    `Upravo sam isprobala ovaj outfit${outfitTitle ? ` "${outfitTitle}"` : ''} virtuelno. Šta misliš, kako mi stoji? Daj mi savete za stil.`;

  let systemPrompt = buildSystemPrompt(season, bodyType);
  const suggestedReply = userMessage && season ? findAiResponseForSeason(season, userMessage) : null;
  if (suggestedReply) {
    systemPrompt += `\n\nNAPOMENA: Korisnica je rekla nešto što odgovara tipičnoj situaciji za njen kolor-tip. Preporučeni ton/odgovor: "${suggestedReply}" — koristi ovaj savet u svojoj poruci ako je prikladan.`;
  }
  const messages: AdvisorMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        { type: 'text', text: userText },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${imageBase64}`,
            detail: 'high',
          },
        },
      ],
    },
  ];

  console.log('[Advisor] Calling OpenAI GPT-4 Vision...');

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 1200,
      temperature: 0.7,
    }),
  });

  console.log('[Advisor] Response status:', response.status);

  const rawBody = await response.text();

  if (!response.ok) {
    console.error('[Advisor] API error:', rawBody.substring(0, 300));
    if (response.status === 429) {
      throw new Error('Previše zahteva. Sačekajte malo i pokušajte ponovo.');
    } else if (response.status === 401) {
      throw new Error('API ključ nije validan.');
    } else if (response.status >= 500) {
      throw new Error('AI savetnik je privremeno nedostupan. Pokušajte ponovo za nekoliko minuta.');
    }
    throw new Error(`AI savetnik nije dostupan (${response.status})`);
  }

  let data: { choices?: Array<{ message?: { content?: string } }> };
  try {
    data = JSON.parse(rawBody);
  } catch {
    console.error('[Advisor] Invalid JSON response');
    throw new Error('AI savetnik nije vratio ispravan odgovor.');
  }

  const choice = data.choices?.[0];
  if (!choice?.message?.content) {
    throw new Error('AI nije vratio odgovor.');
  }

  console.log('[Advisor] Response received, length:', choice.message.content.length);
  return choice.message.content;
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

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 600,
      temperature: 0.8,
    }),
  });

  const rawBody = await response.text();
  if (!response.ok) {
    console.error('[Advisor] continueConversation error:', response.status, rawBody.substring(0, 200));
    throw new Error(`AI savetnik nije dostupan (${response.status})`);
  }

  let data: { choices?: Array<{ message?: { content?: string } }> };
  try {
    data = JSON.parse(rawBody);
  } catch {
    throw new Error('AI savetnik nije vratio ispravan odgovor.');
  }
  return data.choices?.[0]?.message?.content || 'Nema odgovora.';
}
