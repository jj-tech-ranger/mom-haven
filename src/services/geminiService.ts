// src/services/geminiService.ts
import { GoogleGenAI } from '@google/genai';
import { evaluateLayer1Deterministic, validateAiResponse, InterceptorResult } from './safetyInterceptor';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'haven';
  text: string;
  timestamp: string;
  isEscalation?: boolean;
  escalationData?: InterceptorResult;
  provenanceTag?: string;
  suggestedFollowups?: string[];
}

export interface MaternalContext {
  mode: 'PREGNANCY' | 'CHILD';
  gestationalWeeks?: number;
  edd?: string;
  childName?: string;
  childAgeMonths?: number;
  childAgeFormatted?: string;
  parity?: number;
  language?: 'en' | 'sw';
}

export async function askHavenChat(
  userPrompt: string,
  history: ChatMessage[],
  context: MaternalContext
): Promise<ChatMessage> {
  const preferredLang = context.language || 'en';

  // Step 1: Layer 1 Deterministic Pre-Check BEFORE making any AI network call
  const safetyCheck = evaluateLayer1Deterministic(userPrompt);
  if (safetyCheck.blocked) {
    return {
      id: `haven-${Date.now()}`,
      sender: 'haven',
      text: safetyCheck.emergencyActionText || (preferredLang === 'sw' ? 'Swali hili linahitaji tathmini ya haraka ya daktari kituo cha afya.' : 'This query requires clinical escalation.'),
      timestamp: new Date().toISOString(),
      isEscalation: true,
      escalationData: safetyCheck,
      provenanceTag: preferredLang === 'sw' ? 'Itifaki ya Usalama wa Kitabibu · Miongozo ya MOH Kenya' : 'Clinical Safety Protocol · Kenya MOH Guidelines',
    };
  }

  // Step 2: Formulate System Instruction grounded in Kenya Ministry of Health guidelines
  let contextSnippet = '';
  if (context.mode === 'PREGNANCY') {
    contextSnippet = `The user is an expectant mother in Kenya at ${context.gestationalWeeks || 24} weeks of pregnancy (Estimated Due Date: ${context.edd || 'Upcoming'}).`;
  } else {
    contextSnippet = `The user is a mother in Kenya caring for her child ${context.childName || 'Baby'} (${context.childAgeFormatted || '4 months old'}).`;
  }

  const systemInstruction = `
You are Haven, a compassionate, culturally grounded maternal and child health care companion for mothers in Kenya.
${contextSnippet}
The user's current interface language preference is: ${preferredLang === 'sw' ? 'Kiswahili (SW)' : 'English (EN)'}.

LANGUAGE RULES:
- Default to the selected UI language (${preferredLang === 'sw' ? 'Kiswahili' : 'English'}).
- However, if the user asks a question in English, respond in English. If the user asks in Swahili, respond in clear, warm, authentic Kiswahili.
- When responding in Swahili, use culturally authentic Kenyan Swahili terminology (e.g., 'Mama', 'kliniki ya wajawazito', 'vidonge vya IFAS', 'vyakula vya kuongeza damu', 'dalili za hatari').

STRICT CLINICAL RULES:
1. Ground all guidance in Kenya Ministry of Health (MOH) Mother & Child Health Handbook and WHO antenatal/postnatal guidelines.
2. Maintain a warm, encouraging tone. Use Kenyan context when appropriate (e.g. mention sukuma wiki, managu, terere, beans, liver for iron; local clinic visits; M-Pesa logistics).
3. NEVER diagnose medical conditions or give prescriptive medical diagnoses.
4. NEVER provide specific milligram medication dosages or tell the user to take prescription medications without clinic consultation.
5. If the user mentions any danger signs, immediately advise them to visit their local antenatal clinic or hospital.
6. Keep answers concise, scannable with bullet points, and highlight 1-2 practical action steps.
`;

  try {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      // Return safe offline / fallback response grounded in MOH guidance
      const fallbackResponse = getContextualFallbackResponse(userPrompt, context);
      return {
        id: `haven-${Date.now()}`,
        sender: 'haven',
        text: fallbackResponse.text,
        timestamp: new Date().toISOString(),
        suggestedFollowups: fallbackResponse.suggestedFollowups,
        provenanceTag: 'Based on Kenya MOH Mother & Child Health Handbook guidelines',
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Prepare conversation contents
    const contents: any[] = [];
    
    // Append last 4 history messages for multi-turn context
    const recentHistory = history.slice(-4);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }
    
    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
        maxOutputTokens: 600,
      }
    });

    const rawText = response.text || 'I am here with you. Please consult your local health center for personalized care.';
    const validatedText = validateAiResponse(rawText);

    return {
      id: `haven-${Date.now()}`,
      sender: 'haven',
      text: validatedText,
      timestamp: new Date().toISOString(),
      provenanceTag: 'Based on Kenya MOH Mother & Child Health Handbook guidelines',
      suggestedFollowups: generateSuggestedFollowups(userPrompt, context),
    };
  } catch (err) {
    console.error('Gemini call error, using grounded MOH fallback:', err);
    const fallbackResponse = getContextualFallbackResponse(userPrompt, context);
    return {
      id: `haven-${Date.now()}`,
      sender: 'haven',
      text: fallbackResponse.text,
      timestamp: new Date().toISOString(),
      suggestedFollowups: fallbackResponse.suggestedFollowups,
      provenanceTag: 'Based on Kenya MOH Mother & Child Health Handbook guidelines',
    };
  }
}

function getContextualFallbackResponse(prompt: string, context: MaternalContext): { text: string; suggestedFollowups: string[] } {
  const p = prompt.toLowerCase();
  if (p.includes('iron') || p.includes('food') || p.includes('diet') || p.includes('eat')) {
    return {
      text: `**Nutritional Guidance (Kenya MOH Guidelines):**\n\n- **Iron-rich traditional greens**: Sukuma wiki, managu, terere, and kunde cooked with a little healthy oil.\n- **Protein & minerals**: Beans, dengu (green grams), eggs, small fish (omena), and liver.\n- **Vitamin C enhancement**: Eat oranges, passion fruit, or baobab juice with meals to help your body absorb plant iron.\n- **IFAS Supplements**: Remember to take your daily Iron and Folic Acid supplement prescribed at your ANC clinic with water, not tea or milk!`,
      suggestedFollowups: ['What foods help with morning sickness?', 'Can I drink tea with my iron tablets?']
    };
  }
  if (p.includes('pain') || p.includes('back') || p.includes('cramp')) {
    return {
      text: `Mild lower back and pelvic stretching can be common around ${context.gestationalWeeks || 24} weeks as your ligaments loosen and baby grows.\n\n**Self-care steps:**\n- Sleep on your left side with a pillow between your knees.\n- Wear comfortable flat shoes.\n- Avoid lifting heavy loads (water jerricans/firewood).\n\n⚠️ **Warning:** If the pain is sharp, accompanied by cramps that come and go like contractions, or accompanied by any vaginal bleeding or fluid leakage, please go to your nearest clinic immediately.`,
      suggestedFollowups: ['How can I sleep more comfortably on my left side?', 'When do Braxton Hicks contractions start?']
    };
  }
  if (p.includes('vaccine') || p.includes('immuniz') || p.includes('kepi') || p.includes('injection')) {
    return {
      text: `**KEPI Immunization Guidance:**\n\nAll vaccines under the Kenya Expanded Programme on Immunization (KEPI) are free at public health centers and dispensaries.\n\n- **Birth**: BCG & Oral Polio (OPV 0)\n- **6, 10 & 14 Weeks**: Oral Polio, Pentavalent (DPT-HepB-Hib), PCV10 (pneumonia), and Rotavirus\n- **6 & 12 Months**: Vitamin A supplementation\n- **9 & 18 Months**: Measles-Rubella (MR)\n\nAlways bring your Child Health Handbook to every visit!`,
      suggestedFollowups: ['What should I do if my baby misses a scheduled dose?', 'Are mild fever symptoms after vaccines normal?']
    };
  }
  return {
    text: `Hello Mama! Based on the **Kenya Ministry of Health Maternal & Child Health Guidelines**, keeping up with your scheduled clinic appointments and resting well are the most important priorities right now.\n\nAlways feel free to ask about nutrition, common trimester symptoms, labor preparation, breastfeeding, or your child's immunization milestones.`,
    suggestedFollowups: ['What foods build strong blood in pregnancy?', 'What should I pack in my hospital birth bag?', 'When should baby start complementary foods?']
  };
}

function generateSuggestedFollowups(prompt: string, context: MaternalContext): string[] {
  if (context.mode === 'PREGNANCY') {
    return [
      'What are the 8 ANC contact milestones in Kenya?',
      'How do I prepare my birth plan logistics?',
      'What signs show true labor has started?'
    ];
  }
  return [
    'How do I know baby is getting enough breastmilk?',
    'When is the next KEPI vaccine dose due?',
    'What are normal 4-month developmental milestones?'
  ];
}
