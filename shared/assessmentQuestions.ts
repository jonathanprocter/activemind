// ACT Therapy Pre/Post Assessment Questions
// Based on Acceptance and Commitment Therapy assessment scales

export interface AssessmentQuestion {
  id: number;
  text: string;
  category: string;
}

export const assessmentQuestions: AssessmentQuestion[] = [
  // Psychological Flexibility & Acceptance
  {
    id: 1,
    text: "I am able to accept my thoughts and feelings without struggling against them",
    category: "acceptance"
  },
  {
    id: 2,
    text: "I can notice difficult emotions without being overwhelmed by them",
    category: "acceptance"
  },
  {
    id: 3,
    text: "I find it easy to be fully present in the current moment",
    category: "mindfulness"
  },
  
  // Cognitive Defusion
  {
    id: 4,
    text: "I can observe my thoughts without being controlled by them",
    category: "defusion"
  },
  {
    id: 5,
    text: "I recognize that my thoughts are just mental events, not facts",
    category: "defusion"
  },
  {
    id: 6,
    text: "I can step back from my thoughts and see them for what they are",
    category: "defusion"
  },
  
  // Values & Committed Action
  {
    id: 7,
    text: "I know what is truly important and meaningful to me in life",
    category: "values"
  },
  {
    id: 8,
    text: "I act in ways that are consistent with my personal values",
    category: "values"
  },
  {
    id: 9,
    text: "I persist in goal-directed behavior even when facing obstacles",
    category: "commitment"
  },
  {
    id: 10,
    text: "I can commit to actions that serve my long-term well-being",
    category: "commitment"
  },
  
  // Self-as-Context & Present Moment
  {
    id: 11,
    text: "I have a clear sense of who I am beyond my thoughts and feelings",
    category: "self-context"
  },
  {
    id: 12,
    text: "I can maintain perspective even during difficult times",
    category: "self-context"
  },
  {
    id: 13,
    text: "I am able to focus my attention on what I'm doing right now",
    category: "mindfulness"
  },
  
  // Psychological Flexibility
  {
    id: 14,
    text: "I can adapt my behavior based on what the situation requires",
    category: "flexibility"
  },
  {
    id: 15,
    text: "I feel capable of handling whatever life brings my way",
    category: "flexibility"
  }
];

export type AssessmentType = 'pre' | 'post';

export interface AssessmentResponse {
  questionId: number;
  rating: number; // 1-5 scale
}

export interface AssessmentSubmission {
  assessmentType: AssessmentType;
  responses: AssessmentResponse[];
}