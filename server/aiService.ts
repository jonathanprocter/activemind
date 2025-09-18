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

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No content received from AI');
      const result = JSON.parse(content);
      return result.guidance.map((g: any) => ({
        ...g,
        userId: context.userId,
        chapterId: context.chapterId,
        sectionId: context.sectionId,
        personalizedFor: { context: g.personalizedFor }
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

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No content received from AI');
      const result = JSON.parse(content);
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

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No content received from AI');
      const result = JSON.parse(content);
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

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No content received from AI');
      const result = JSON.parse(content);
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
    conversationType: 'therapeutic_guidance' | 'reflection_support' | 'general_chat' = 'therapeutic_guidance'
  ): Promise<string> {
    try {
      const systemPrompt = `You are a professional ACT (Acceptance and Commitment Therapy) therapist providing conversational support. You are warm, empathetic, and skilled in ACT principles.

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
- Recent Insights: ${context.previousInsights?.length || 0} insights generated

Guidelines:
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

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: conversationMessages,
        max_tokens: 500,
      });

      return response.choices[0].message.content || 'I understand. Could you tell me more about what you\'re experiencing?';

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
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a sentiment analysis expert specializing in therapeutic contexts. Analyze emotional state and provide supportive insights."
          },
          {
            role: "user",
            content: `Analyze the emotional sentiment and therapeutic state of this text: "${text}". Respond in JSON format: { "rating": 1-5, "confidence": 0-1, "emotional_state": "description" }`
          }
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) return { rating: 3, confidence: 0.5, emotional_state: 'neutral' };
      return JSON.parse(content);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return { rating: 3, confidence: 0.5, emotional_state: 'neutral' };
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

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
      });

      return response.choices[0].message.content || 'Session completed with meaningful therapeutic engagement.';

    } catch (error) {
      console.error('Error generating session summary:', error);
      return 'Session completed successfully.';
    }
  }
}

export const aiService = new AITherapeuticService();