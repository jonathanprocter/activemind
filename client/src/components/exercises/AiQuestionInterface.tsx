import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Sparkles, Send, MessageCircle, Lightbulb, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface PrefilledQuestion {
  id: string;
  text: string;
  category: 'concept' | 'application' | 'personal' | 'technique';
  reasoning?: string;
}

interface AiQuestionInterfaceProps {
  chapterId: number;
  chapterTitle: string;
  currentSection?: string;
}

export default function AiQuestionInterface({ 
  chapterId, 
  chapterTitle, 
  currentSection 
}: AiQuestionInterfaceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefilledQuestions, setPrefilledQuestions] = useState<PrefilledQuestion[]>([]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPrefilled, setLoadingPrefilled] = useState(false);
  const { user } = useAuth();

  // Generate contextual pre-filled questions when modal opens
  useEffect(() => {
    if (isOpen && user && prefilledQuestions.length === 0) {
      generatePrefilledQuestions();
    }
  }, [isOpen, user]);

  const generatePrefilledQuestions = async () => {
    try {
      setLoadingPrefilled(true);
      
      const response = await apiRequest('POST', '/api/ai/contextual-questions', {
        chapterId,
        chapterTitle,
        currentSection,
        questionCount: 6
      });

      const data = await response.json();
      setPrefilledQuestions(data.questions || []);
    } catch (error) {
      console.error('Error generating prefilled questions:', error);
      // Fallback questions based on chapter
      setPrefilledQuestions(getFallbackQuestions(chapterId));
    } finally {
      setLoadingPrefilled(false);
    }
  };

  const getFallbackQuestions = (chapterId: number): PrefilledQuestion[] => {
    const questionSets: Record<number, PrefilledQuestion[]> = {
      1: [ // Acceptance
        { id: '1', text: 'What does acceptance mean in ACT, and how is it different from giving up?', category: 'concept' },
        { id: '2', text: 'How can I practice acceptance when I\'m feeling overwhelmed by difficult emotions?', category: 'technique' },
        { id: '3', text: 'What are some practical ways to stop fighting against my thoughts and feelings?', category: 'application' }
      ],
      2: [ // Cognitive Defusion
        { id: '1', text: 'What is cognitive defusion and how does it help with negative thoughts?', category: 'concept' },
        { id: '2', text: 'Can you give me some specific techniques for distancing myself from my thoughts?', category: 'technique' },
        { id: '3', text: 'How do I know when I\'m "fused" with my thoughts versus observing them?', category: 'personal' }
      ],
      3: [ // Being Present
        { id: '1', text: 'What are the key principles of mindfulness in ACT?', category: 'concept' },
        { id: '2', text: 'How can I use grounding techniques when my mind is racing?', category: 'technique' },
        { id: '3', text: 'What should I do when I notice my mind wandering during mindfulness practice?', category: 'application' }
      ],
      4: [ // Self as Context
        { id: '1', text: 'What does "self as context" mean and why is it important?', category: 'concept' },
        { id: '2', text: 'How can I develop a stronger sense of my "observing self"?', category: 'technique' },
        { id: '3', text: 'What\'s the difference between my thinking self and my observing self?', category: 'personal' }
      ],
      5: [ // Values
        { id: '1', text: 'How do I identify my true values versus what others expect of me?', category: 'personal' },
        { id: '2', text: 'What\'s the difference between values and goals?', category: 'concept' },
        { id: '3', text: 'How can I use my values to guide difficult decisions?', category: 'application' }
      ],
      6: [ // Committed Action
        { id: '1', text: 'How do I create sustainable behavior changes aligned with my values?', category: 'application' },
        { id: '2', text: 'What should I do when I keep failing to follow through on my commitments?', category: 'personal' },
        { id: '3', text: 'How can I break down big value-based goals into manageable steps?', category: 'technique' }
      ],
      7: [ // Integration
        { id: '1', text: 'How do I integrate all the ACT principles into my daily life?', category: 'application' },
        { id: '2', text: 'Which ACT skills should I focus on most as I continue my journey?', category: 'personal' },
        { id: '3', text: 'How can I maintain my progress and continue growing after completing this workbook?', category: 'application' }
      ]
    };

    return questionSets[chapterId] || [
      { id: '1', text: 'Can you explain this concept in simpler terms?', category: 'concept' },
      { id: '2', text: 'How does this apply to everyday situations?', category: 'application' },
      { id: '3', text: 'What are some practical exercises I can try?', category: 'technique' }
    ];
  };

  const askQuestion = async (questionText: string) => {
    if (!user || !questionText.trim()) return;

    try {
      setIsLoading(true);
      
      // Add user question to conversation
      const newConversation = [...conversation, { role: 'user' as const, content: questionText }];
      setConversation(newConversation);
      
      const response = await apiRequest('POST', '/api/ai/material-questions', {
        chapterId,
        chapterTitle,
        currentSection,
        question: questionText,
        conversationHistory: newConversation.slice(-5) // Last 5 messages for context
      });

      const data = await response.json();
      
      // Add AI response to conversation
      setConversation(prev => [...prev, { role: 'assistant', content: data.answer }]);
      setCustomQuestion('');
      
    } catch (error) {
      console.error('Error asking question:', error);
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I\'m having trouble processing your question right now. Please try again in a moment.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'concept': return <Lightbulb className="w-4 h-4" />;
      case 'application': return <ArrowRight className="w-4 h-4" />;
      case 'personal': return <MessageCircle className="w-4 h-4" />;
      case 'technique': return <Sparkles className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'concept': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'application': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'personal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'technique': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="btn-enhanced border-accent/30 hover:border-accent text-accent hover:text-accent-foreground hover:bg-accent/10"
          data-testid="ai-question-button"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Ask AI About This Material
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-in-up">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-accent animate-pulse-gentle" />
            <span>Ask About: {chapterTitle}</span>
          </DialogTitle>
          {currentSection && (
            <p className="text-sm text-muted-foreground">Current section: {currentSection}</p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Conversation Display */}
          {conversation.length > 0 && (
            <div className="border rounded-lg p-4 flex-1 overflow-y-auto space-y-4 bg-muted/5">
              {conversation.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in-up`} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground ml-4' 
                      : 'bg-card border border-border mr-4'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-card border border-border mr-4 p-3 rounded-lg">
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pre-filled Questions */}
          {conversation.length === 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">Suggested Questions</span>
              </div>
              
              {loadingPrefilled ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 skeleton rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {prefilledQuestions.map((question) => (
                    <Card 
                      key={question.id} 
                      className="cursor-pointer transition-all hover:shadow-md hover:border-accent/30 animate-slide-in-left"
                      onClick={() => askQuestion(question.text)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-2 mb-2">
                          {getCategoryIcon(question.category)}
                          <Badge className={`text-xs ${getCategoryColor(question.category)}`}>
                            {question.category}
                          </Badge>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">{question.text}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom Question Input */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Ask Your Own Question</span>
            </div>
            
            <div className="flex space-x-2">
              <Textarea
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Type your question about this chapter's concepts, techniques, or how to apply them..."
                className="flex-1 min-h-[60px] form-field"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    askQuestion(customQuestion);
                  }
                }}
                data-testid="custom-question-input"
              />
              <Button
                onClick={() => askQuestion(customQuestion)}
                disabled={!customQuestion.trim() || isLoading}
                className="btn-enhanced"
                data-testid="send-question"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line. Ask about concepts, techniques, or how to apply them in your life.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}