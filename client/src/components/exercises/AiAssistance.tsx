import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageCircle, Lightbulb, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface AiSuggestion {
  type: 'clarifying_question' | 'deeper_prompt' | 'therapeutic_insight';
  content: string;
  reasoning?: string;
}

interface AiAssistanceProps {
  chapterId: number;
  sectionId: string;
  currentResponse: string;
  questionText: string;
  onSuggestionApplied?: (suggestion: string) => void;
}

export default function AiAssistance({ 
  chapterId, 
  sectionId, 
  currentResponse, 
  questionText,
  onSuggestionApplied 
}: AiAssistanceProps) {
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastAnalyzedResponse, setLastAnalyzedResponse] = useState('');
  const { user } = useAuth();

  // Debounced analysis when user stops typing
  useEffect(() => {
    if (!currentResponse.trim() || currentResponse === lastAnalyzedResponse) return;
    if (currentResponse.length < 20) return; // Wait for meaningful content

    const timeoutId = setTimeout(() => {
      analyzeResponse();
    }, 2000); // 2 second delay after user stops typing

    return () => clearTimeout(timeoutId);
  }, [currentResponse]);

  const analyzeResponse = async () => {
    if (!user || isLoading) return;

    try {
      setIsLoading(true);
      
      const response = await apiRequest('POST', '/api/ai/contextual-assistance', {
        chapterId,
        sectionId,
        questionText,
        currentResponse,
        analysisType: 'response_enhancement'
      });

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setLastAnalyzedResponse(currentResponse);
      
      // Auto-expand if we have suggestions
      if (data.suggestions?.length > 0) {
        setIsExpanded(true);
      }
    } catch (error) {
      console.error('Error getting AI assistance:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestionIcon = (type: AiSuggestion['type']) => {
    switch (type) {
      case 'clarifying_question':
        return <HelpCircle className="w-4 h-4" />;
      case 'deeper_prompt':
        return <Lightbulb className="w-4 h-4" />;
      case 'therapeutic_insight':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getSuggestionLabel = (type: AiSuggestion['type']) => {
    switch (type) {
      case 'clarifying_question':
        return 'Clarifying Question';
      case 'deeper_prompt':
        return 'Deeper Exploration';
      case 'therapeutic_insight':
        return 'Therapeutic Insight';
      default:
        return 'Suggestion';
    }
  };

  const getSuggestionBadgeColor = (type: AiSuggestion['type']) => {
    switch (type) {
      case 'clarifying_question':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'deeper_prompt':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'therapeutic_insight':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
  };

  const handleApplySuggestion = (suggestion: AiSuggestion) => {
    if (onSuggestionApplied) {
      // For clarifying questions, append to the response
      if (suggestion.type === 'clarifying_question') {
        onSuggestionApplied(`${currentResponse}\n\n${suggestion.content}\n\n`);
      } else {
        // For other suggestions, provide context for reflection
        onSuggestionApplied(`${currentResponse}\n\n[Reflecting on: ${suggestion.content}]\n\n`);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="mt-4 animate-slide-in-up" data-testid="ai-assistance">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-accent animate-pulse-gentle" />
          <span className="text-sm font-medium text-muted-foreground">
            AI Therapeutic Assistant
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 px-2"
          data-testid="toggle-ai-assistance"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <Card className="border border-accent/20 bg-accent/5 animate-fade-in">
          <CardContent className="p-4">
            {isLoading && (
              <div className="flex items-center space-x-2 text-muted-foreground animate-pulse">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="text-sm">Analyzing your response...</span>
              </div>
            )}

            {!isLoading && suggestions.length === 0 && currentResponse.length > 0 && (
              <div className="text-center py-4">
                <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Continue writing to receive personalized suggestions
                </p>
              </div>
            )}

            {!isLoading && suggestions.length === 0 && currentResponse.length === 0 && (
              <div className="text-center py-4">
                <Lightbulb className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Start writing your response to receive AI-powered guidance and clarifying questions
                </p>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">
                  Based on your response, here are some suggestions to deepen your reflection:
                </p>
                
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="border border-border/50 rounded-lg p-3 bg-background/50 animate-slide-in-left" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex items-start justify-between space-x-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          {getSuggestionIcon(suggestion.type)}
                          <Badge className={`text-xs ${getSuggestionBadgeColor(suggestion.type)}`}>
                            {getSuggestionLabel(suggestion.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {suggestion.content}
                        </p>
                        {suggestion.reasoning && (
                          <p className="text-xs text-muted-foreground italic">
                            {suggestion.reasoning}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplySuggestion(suggestion)}
                        className="shrink-0 btn-enhanced"
                        data-testid={`apply-suggestion-${index}`}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground text-center">
                  These suggestions are designed to help you explore your thoughts more deeply. 
                  Take your time and reflect on what feels most meaningful to you.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}