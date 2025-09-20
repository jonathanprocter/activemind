// AI service for therapeutic features
// Using OpenAI integration for ACT workbook
import OpenAI from "openai";
import type { 
  AiConversation, 
  AiInsight, 
  AiGuidance, 
  AiPrompt, 
  AdaptiveRecommendation,
  Assessment,
  WorkbookProgress 
} from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TherapeuticContext {
  userId: string;
  chapterId?: number;
  sectionId?: string;
  userResponses?: any;
  assessmentHistory?: Assessment[];
  progressHistory?: WorkbookProgress[];
  previousInsights?: AiInsight[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class AITherapeuticService {
  
  // Shared OpenAI helper with robust error handling, timeouts, and retries
  private async robustOpenAICall<T>(
    messages: { role: string; content: string }[],
    options: {
      maxTokens?: number;
      requireJSON?: boolean;
      retries?: number;
      timeoutMs?: number;
      parseResult?: (content: string) => T;
    } = {}
  ): Promise<T | string> {
    const {
      maxTokens = 1000,
      requireJSON = false,
      retries = 2,
      timeoutMs = 12000,
      parseResult
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const requestOptions: any = {
          model: "gpt-4-turbo", // Use supported model with JSON mode capabilities
          messages: messages.map(msg => ({
            role: msg.role as "system" | "user" | "assistant",
            content: msg.content
          })),
          max_tokens: maxTokens,
        };

        if (requireJSON) {
          requestOptions.response_format = { type: "json_object" };
        }

        const response = await openai.chat.completions.create(requestOptions, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const content = response.choices[0]?.message?.content;
        
        if (!content) {
          throw new Error('No content received from AI');
        }

        // If JSON parsing is required
        if (requireJSON && parseResult) {
          try {
            return parseResult(content);
          } catch (parseError) {
            console.error(`JSON parse error (attempt ${attempt + 1}):`, parseError instanceof Error ? parseError.message : String(parseError));
            if (attempt === retries) {
              throw new Error('Invalid AI response format after all retries');
            }
            continue; // Retry on JSON parse error
          }
        }

        // If JSON is required but no parser provided
        if (requireJSON) {
          try {
            return JSON.parse(content);
          } catch (parseError) {
            console.error(`JSON parse error (attempt ${attempt + 1}):`, parseError instanceof Error ? parseError.message : String(parseError));
            if (attempt === retries) {
              throw new Error('Invalid AI response format after all retries');
            }
            continue; // Retry on JSON parse error
          }
        }

        // Return raw content for non-JSON responses
        return content;

      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on certain errors
        if (error instanceof Error && error.name === 'AbortError') {
          console.error(`Request timeout (attempt ${attempt + 1}):`, error.message);
        } else if (error instanceof Error && error.message?.includes('401')) {
          // Don't retry on auth errors
          throw error;
        } else {
          console.error(`OpenAI call failed (attempt ${attempt + 1}):`, error instanceof Error ? error.message : String(error));
        }

        // Add exponential backoff with jitter
        if (attempt < retries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 5000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    throw lastError || new Error('All OpenAI call attempts failed');
  }

  // 1. AI-powered therapeutic guidance
  async generateTherapeuticGuidance(
    context: TherapeuticContext,
    specificChallenges?: string[]
  ): Promise<AiGuidance[]> {
    try {
      const prompt = `You are a professional ACT (Acceptance and Commitment Therapy) therapist. Based on the user's context, provide personalized therapeutic guidance.

User Context:
- Chapter: ${context.chapterId}
- Section: ${context.sectionId}
- User Responses: ${JSON.stringify(context.userResponses)}
- Previous Progress: ${context.progressHistory?.length || 0} completed sections
- Specific Challenges: ${specificChallenges?.join(', ') || 'None specified'}

Generate 2-3 personalized therapeutic guidance suggestions in JSON format:
{
  "guidance": [
    {
      "guidanceType": "exercise_suggestion" | "coping_strategy" | "mindfulness_technique" | "values_exploration" | "behavioral_change",
      "title": "Brief title",
      "content": "Detailed therapeutic guidance (2-3 paragraphs)",
      "personalizedFor": "Why this is specifically relevant to this user"
    }
  ]
}

Focus on ACT principles: psychological flexibility, acceptance, mindfulness, values clarification, and committed action.`;

      const result = await this.robustOpenAICall(
        [{ role: "user", content: prompt }],
        {
          requireJSON: true,
          maxTokens: 800,
          parseResult: (content: string) => {
            const parsed = JSON.parse(content);
            if (!parsed.guidance || !Array.isArray(parsed.guidance)) {
              throw new Error('Invalid AI response format: missing guidance array');
            }
            return parsed;
          }
        }
      ) as { guidance: any[] };
      
      return result.guidance.map((g: any) => ({
        ...g,
        userId: context.userId,
        chapterId: context.chapterId,
        sectionId: context.sectionId,
        personalizedFor: { context: g.personalizedFor || 'general guidance' }
      }));

    } catch (error) {
      console.error('Error generating therapeutic guidance:', error);
      throw new Error('Failed to generate therapeutic guidance');
    }
  }

  // 2. Intelligent reflection prompts
  async generateReflectionPrompts(
    context: TherapeuticContext,
    previousResponse?: string
  ): Promise<AiPrompt[]> {
    try {
      const prompt = `You are an expert ACT therapist specializing in deep reflection exercises. Generate intelligent, thought-provoking reflection prompts.

Context:
- Chapter: ${context.chapterId}
- Previous Response: ${previousResponse || 'None'}
- User's Progress: ${context.progressHistory?.length || 0} sections completed

Generate 2-3 progressive reflection prompts in JSON format:
{
  "prompts": [
    {
      "promptType": "reflection_question" | "exploration_prompt" | "values_clarification" | "mindfulness_cue" | "behavioral_inquiry",
      "promptText": "Deep, open-ended question that encourages self-exploration",
      "depth": 1-3,
      "followUpPrompts": ["Follow-up question 1", "Follow-up question 2"]
    }
  ]
}

Make prompts progressively deeper, building on previous responses. Focus on ACT core processes.`;

      const result = await this.robustOpenAICall(
        [{ role: "user", content: prompt }],
        {
          requireJSON: true,
          maxTokens: 800,
          parseResult: (content: string) => {
            const parsed = JSON.parse(content);
            if (!parsed.prompts || !Array.isArray(parsed.prompts)) {
              throw new Error('Invalid AI response format: missing prompts array');
            }
            return parsed;
          }
        }
      ) as { prompts: any[] };
      
      return result.prompts.map((p: any) => ({
        ...p,
        userId: context.userId,
        chapterId: context.chapterId,
        sectionId: context.sectionId,
        followUpPrompts: p.followUpPrompts
      }));

    } catch (error) {
      console.error('Error generating reflection prompts:', error);
      throw new Error('Failed to generate reflection prompts');
    }
  }

  // 3. Progress insights analysis
  async analyzeProgressInsights(
    context: TherapeuticContext
  ): Promise<AiInsight[]> {
    try {
      const prompt = `You are an expert ACT therapist analyzing client progress patterns. Analyze the user's therapeutic journey and provide actionable insights.

Progress Data:
- Assessment History: ${JSON.stringify(context.assessmentHistory)}
- Progress History: ${JSON.stringify(context.progressHistory)}
- Recent Responses: ${JSON.stringify(context.userResponses)}

Analyze patterns and generate insights in JSON format:
{
  "insights": [
    {
      "insightType": "progress_analysis" | "pattern_recognition" | "therapeutic_recommendation" | "growth_opportunity",
      "title": "Clear insight title",
      "description": "Detailed analysis (2-3 paragraphs)",
      "confidence": 1-100,
      "actionable": true/false,
      "data": "Supporting evidence"
    }
  ]
}

Focus on psychological flexibility growth, behavioral patterns, and therapeutic progress.`;

      const result = await this.robustOpenAICall(
        [{ role: "user", content: prompt }],
        {
          requireJSON: true,
          maxTokens: 1000,
          parseResult: (content: string) => {
            const parsed = JSON.parse(content);
            if (!parsed.insights || !Array.isArray(parsed.insights)) {
              throw new Error('Invalid AI response format: missing insights array');
            }
            return parsed;
          }
        }
      ) as { insights: any[] };
      
      return result.insights.map((i: any) => ({
        ...i,
        userId: context.userId,
        data: { analysis: i.data }
      }));

    } catch (error) {
      console.error('Error analyzing progress insights:', error);
      throw new Error('Failed to analyze progress insights');
    }
  }

  // 4. Adaptive content system
  async generateAdaptiveRecommendations(
    context: TherapeuticContext
  ): Promise<AdaptiveRecommendation[]> {
    try {
      const prompt = `You are an expert ACT therapist designing adaptive therapeutic interventions. Based on user progress and responses, recommend personalized adaptations.

User Context:
- Current Progress: ${context.progressHistory?.length || 0} sections
- Assessment Scores: ${JSON.stringify(context.assessmentHistory)}
- Response Patterns: ${JSON.stringify(context.userResponses)}

Generate adaptive recommendations in JSON format:
{
  "recommendations": [
    {
      "recommendationType": "exercise_modification" | "difficulty_adjustment" | "focus_area" | "learning_path" | "practice_frequency",
      "title": "Adaptation title",
      "description": "Detailed recommendation (2-3 paragraphs)",
      "adaptationReason": "Why this adaptation is recommended",
      "priority": 1-5,
      "parameters": "Specific adaptation parameters"
    }
  ]
}

Focus on optimizing learning and therapeutic outcomes based on individual progress patterns.`;

      const result = await this.robustOpenAICall(
        [{ role: "user", content: prompt }],
        {
          requireJSON: true,
          maxTokens: 1000,
          parseResult: (content: string) => {
            const parsed = JSON.parse(content);
            if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
              throw new Error('Invalid AI response format: missing recommendations array');
            }
            return parsed;
          }
        }
      ) as { recommendations: any[] };
      
      return result.recommendations.map((r: any) => ({
        ...r,
        userId: context.userId,
        targetChapterId: context.chapterId,
        targetSectionId: context.sectionId,
        parameters: { adaptation: r.parameters }
      }));

    } catch (error) {
      console.error('Error generating adaptive recommendations:', error);
      throw new Error('Failed to generate adaptive recommendations');
    }
  }

  // 5. Conversational therapy support
  async processConversation(
    context: TherapeuticContext,
    messages: ConversationMessage[],
    conversationType: 'therapeutic_guidance' | 'crisis_support' | 'reflection' | 'goal_setting' = 'therapeutic_guidance'
  ): Promise<string> {
    try {
      // CRITICAL SAFETY: Check for crisis keywords in ALL conversation types
      const lastMessage = messages[messages.length - 1]?.content || '';
      const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'hurt myself', 'self-harm', 'can\'t go on', 'want to die', 'no point in living'];
      const hasCrisisContent = crisisKeywords.some(keyword => 
        lastMessage.toLowerCase().includes(keyword)
      );
      
      if (hasCrisisContent) {
        return `I'm very concerned about what you're sharing. Your safety is the most important thing right now. 

Please reach out for immediate support:
• National Suicide Prevention Lifeline: 988 or 1-800-273-8255
• Crisis Text Line: Text HOME to 741741
• Emergency Services: 911

You are valuable and your life matters. Professional crisis counselors are available 24/7 to help you through this difficult time. Please don't hesitate to reach out to them right now.

While I'm here to support your therapeutic journey, I want to make sure you have access to the immediate, specialized help you deserve.`;
      }

      // Customize system prompt based on conversation type
      let systemPrompt = `You are a professional ACT (Acceptance and Commitment Therapy) therapist providing conversational support. You are warm, empathetic, and skilled in ACT principles.

Core ACT Principles to integrate:
1. Psychological Flexibility
2. Acceptance and Mindfulness
3. Values Clarification
4. Committed Action
5. Cognitive Defusion
6. Self-as-Context

User Context:
- Current Chapter: ${context.chapterId}
- Section: ${context.sectionId}
- Progress: ${context.progressHistory?.length || 0} sections completed
- Recent Insights: ${context.previousInsights?.length || 0} insights generated`;

      // Add conversation-type specific guidance
      switch (conversationType) {
        case 'crisis_support':
          systemPrompt += `\n\nCRISIS SUPPORT MODE: Prioritize safety and stability. Validate emotions, encourage seeking professional help, and provide crisis resources when appropriate. Never provide advice that could be harmful.`;
          break;
        case 'reflection':
          systemPrompt += `\n\nREFLECTION MODE: Focus on helping the user explore their thoughts, feelings, and experiences. Ask open-ended questions that encourage deeper self-exploration and mindfulness.`;
          break;
        case 'goal_setting':
          systemPrompt += `\n\nGOAL SETTING MODE: Help the user identify values-based goals and create committed action plans. Focus on realistic, achievable steps aligned with their core values.`;
          break;
        default:
          systemPrompt += `\n\nTHERAPEUTIC GUIDANCE MODE: Provide general therapeutic support and guidance using ACT principles.`;
      }

      systemPrompt += `\n\nSAFETY GUIDELINES (ALWAYS ACTIVE):
- IMMEDIATE SAFETY: If user mentions self-harm, suicide, or crisis, prioritize safety and recommend professional crisis resources
- Never provide medical advice or diagnoses
- Stay within therapeutic support boundaries
- Encourage seeking professional help when appropriate

THERAPEUTIC GUIDELINES:
- Be warm, professional, and therapeutic
- Ask thoughtful follow-up questions
- Encourage self-reflection and mindfulness
- Help connect responses to ACT principles
- Provide gentle guidance without being prescriptive
- Validate emotions while encouraging growth
- Focus on values and committed action`;

      const conversationMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }))
      ];

      const result = await this.robustOpenAICall(
        conversationMessages.map(msg => ({ role: msg.role, content: msg.content })),
        {
          requireJSON: false,
          maxTokens: 500,
          timeoutMs: 15000 // Longer timeout for conversations
        }
      ) as string;
      
      return result || 'I understand. Could you tell me more about what you\'re experiencing?';

    } catch (error) {
      console.error('Error processing conversation:', error);
      throw new Error('Failed to process conversation');
    }
  }

  // Utility method to analyze user sentiment for adaptive responses
  async analyzeSentiment(text: string): Promise<{
    rating: number;
    confidence: number;
    emotional_state: string;
  }> {
    try {
      const result = await this.robustOpenAICall(
        [
          {
            role: "system",
            content: "You are a sentiment analysis expert specializing in therapeutic contexts. Analyze emotional state and provide supportive insights."
          },
          {
            role: "user",
            content: `Analyze the emotional sentiment and therapeutic state of this text: "${text}". Respond in JSON format: { "rating": 1-5, "confidence": 0-1, "emotional_state": "description" }`
          }
        ],
        {
          requireJSON: true,
          maxTokens: 150,
          parseResult: (content: string) => {
            const parsed = JSON.parse(content);
            if (typeof parsed.rating !== 'number' || typeof parsed.confidence !== 'number' || typeof parsed.emotional_state !== 'string') {
              throw new Error('Invalid AI response format: missing required sentiment fields');
            }
            return parsed;
          }
        }
      ) as { rating: number; confidence: number; emotional_state: string };
      
      return result;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return { rating: 3, confidence: 0.5, emotional_state: 'neutral' };
    }
  }

  // 6. Contextual assistance for deeper exploration
  async generateContextualQuestions(
    chapterId: number,
    chapterTitle: string,
    currentSection?: string,
    questionCount: number = 6
  ): Promise<{ questions: any[] }> {
    try {
      const prompt = `You are an expert ACT therapist helping users understand chapter concepts through thoughtful questions.

Chapter: ${chapterId} - ${chapterTitle}
Current Section: ${currentSection || 'General chapter content'}

Generate ${questionCount} contextual questions that help users:
1. Understand key concepts
2. Apply techniques in their life  
3. Explore personal connections
4. Learn practical methods

Generate questions in this JSON format:
{
  "questions": [
    {
      "id": "1",
      "text": "The actual question text",
      "category": "concept" | "application" | "personal" | "technique",
      "reasoning": "Brief explanation of why this question is helpful"
    }
  ]
}

Categories:
- "concept": Understanding theoretical aspects and definitions
- "application": How to use concepts in real-life situations
- "personal": Exploring individual experiences and connections
- "technique": Learning specific methods and exercises

Guidelines:
- Make questions accessible and non-judgmental
- Focus on ACT principles relevant to this chapter
- Encourage curiosity and exploration
- Vary question types across categories
- Keep questions concise but meaningful`;

      const result = await this.robustOpenAICall(
        [{ role: "user", content: prompt }],
        {
          requireJSON: true,
          maxTokens: 800,
          parseResult: (content: string) => {
            const parsed = JSON.parse(content);
            if (!parsed.questions || !Array.isArray(parsed.questions)) {
              throw new Error('Invalid AI response format: missing questions array');
            }
            return parsed;
          }
        }
      ) as { questions: any[] };
      
      return result;

    } catch (error) {
      console.error('Error generating contextual questions:', error);
      return { questions: [] };
    }
  }

  // 7. Answer questions about chapter material
  async answerMaterialQuestion(
    chapterId: number,
    chapterTitle: string,
    currentSection: string | undefined,
    question: string,
    conversationHistory: Array<{role: string, content: string}> = []
  ): Promise<{ answer: string }> {
    try {
      const contextHistory = conversationHistory.length > 0 
        ? `\n\nConversation Context:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
        : '';

      const prompt = `You are an expert ACT therapist providing clear, helpful answers about chapter material.

Chapter: ${chapterId} - ${chapterTitle}
Current Section: ${currentSection || 'General chapter content'}
User Question: "${question}"${contextHistory}

Provide a helpful, therapeutic answer that:
1. Addresses the specific question clearly
2. Connects to ACT principles
3. Offers practical guidance when appropriate
4. Uses accessible, non-technical language
5. Maintains a supportive, therapeutic tone

Guidelines:
- Be specific and practical
- Include examples when helpful
- Connect concepts to real-life application
- Acknowledge if something is challenging
- Encourage continued exploration
- Keep response focused but comprehensive
- Use warm, professional tone

Respond directly with your answer (no JSON format needed).`;

      const result = await this.robustOpenAICall(
        [{ role: "user", content: prompt }],
        {
          requireJSON: false,
          maxTokens: 600
        }
      ) as string;
      
      return { answer: result || 'I apologize, but I\'m having trouble processing your question right now. Could you try rephrasing it or asking about a specific aspect of the material?' };

    } catch (error) {
      console.error('Error answering material question:', error);
      return { answer: 'I apologize, but I\'m having trouble processing your question right now. Please try again in a moment.' };
    }
  }

  // 8. Contextual assistance for deeper exploration
  async generateContextualAssistance(
    context: TherapeuticContext,
    questionText: string,
    currentResponse: string
  ): Promise<{ suggestions: any[] }> {
    try {
      const prompt = `You are an expert ACT therapist providing gentle, contextual assistance to help a user deepen their self-reflection. 

Context:
- Chapter: ${context.chapterId}
- Section: ${context.sectionId}
- Question: "${questionText}"
- User's Current Response: "${currentResponse}"

Your role is to:
1. Analyze the user's response for depth and authenticity
2. Generate 1-3 gentle suggestions to help them explore deeper
3. Ask clarifying questions that encourage meaningful reflection
4. Provide therapeutic insights when appropriate

Generate contextual assistance in this JSON format:
{
  "suggestions": [
    {
      "type": "clarifying_question" | "deeper_prompt" | "therapeutic_insight",
      "content": "The specific suggestion, question, or insight",
      "reasoning": "Brief explanation of why this would be helpful"
    }
  ]
}

Guidelines:
- Be gentle, non-judgmental, and supportive
- Focus on ACT principles: acceptance, mindfulness, values, psychological flexibility
- Ask open-ended questions that encourage exploration
- If the response seems surface-level, gently invite deeper reflection
- If the response shows insight, acknowledge it and help them explore further
- Keep suggestions concise but meaningful
- Maximum 3 suggestions to avoid overwhelming the user

Types to use:
- "clarifying_question": When you want to help them be more specific or explore an aspect further
- "deeper_prompt": When encouraging them to go beyond surface-level responses
- "therapeutic_insight": When you want to offer a therapeutic perspective or reframe`;

      const result = await this.robustOpenAICall(
        [{ role: "user", content: prompt }],
        {
          requireJSON: true,
          maxTokens: 800,
          parseResult: (content: string) => {
            const parsed = JSON.parse(content);
            if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
              throw new Error('Invalid AI response format: missing suggestions array');
            }
            return parsed;
          }
        }
      ) as { suggestions: any[] };
      
      return result;

    } catch (error) {
      console.error('Error generating contextual assistance:', error);
      return { suggestions: [] };
    }
  }

  // Generate session summary for continuity
  async generateSessionSummary(
    conversations: AiConversation[],
    insights: AiInsight[],
    guidance: AiGuidance[]
  ): Promise<string> {
    try {
      const prompt = `Generate a brief therapeutic session summary based on the AI interactions:

Conversations: ${JSON.stringify(conversations)}
Insights: ${JSON.stringify(insights)}
Guidance: ${JSON.stringify(guidance)}

Create a concise summary highlighting:
1. Key themes discussed
2. Progress made
3. Areas for continued focus
4. Next steps

Keep it professional and therapeutic in tone.`;

      const result = await this.robustOpenAICall(
        [{ role: "user", content: prompt }],
        {
          requireJSON: false,
          maxTokens: 300
        }
      ) as string;
      
      return result || 'Session completed with meaningful therapeutic engagement.';

    } catch (error) {
      console.error('Error generating session summary:', error);
      return 'Session completed successfully.';
    }
  }
}

export const aiService = new AITherapeuticService();