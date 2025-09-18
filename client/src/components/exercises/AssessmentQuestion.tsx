import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface AssessmentQuestionProps {
  question: {
    id: number;
    text: string;
  };
  currentAnswer?: number;
  onAnswerChange: (questionId: number, rating: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  questionNumber: number;
  totalQuestions: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export default function AssessmentQuestion({
  question,
  currentAnswer,
  onAnswerChange,
  onNext,
  onPrevious,
  questionNumber,
  totalQuestions,
  canGoNext,
  canGoPrevious,
}: AssessmentQuestionProps) {
  const [selectedRating, setSelectedRating] = useState<number | undefined>(currentAnswer);

  useEffect(() => {
    setSelectedRating(currentAnswer);
  }, [currentAnswer, question.id]);

  const handleRatingSelect = (rating: number) => {
    setSelectedRating(rating);
    onAnswerChange(question.id, rating);
  };

  const progress = Math.round((questionNumber / totalQuestions) * 100);

  return (
    <Card className="bg-card shadow-lg border border-border">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-foreground mb-4 font-medium" data-testid={`question-${question.id}`}>
              {questionNumber}. {question.text}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Strongly Disagree</span>
              <div className="flex space-x-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name={`q${question.id}`}
                      value={rating}
                      checked={selectedRating === rating}
                      onChange={() => handleRatingSelect(rating)}
                      className="sr-only"
                      data-testid={`radio-${question.id}-${rating}`}
                    />
                    <div
                      className={`w-8 h-8 rounded-full border-2 transition-colors flex items-center justify-center ${
                        selectedRating === rating
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      <span className="text-sm font-medium">{rating}</span>
                    </div>
                  </label>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">Strongly Agree</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Question {questionNumber} of {totalQuestions} • {progress}% complete
            </div>
            <div className="flex space-x-3">
              <Button
                variant="ghost"
                onClick={onPrevious}
                disabled={!canGoPrevious}
                data-testid="button-previous-question"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={onNext}
                disabled={!canGoNext || !selectedRating}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-next-question"
              >
                {questionNumber === totalQuestions ? 'Complete' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
