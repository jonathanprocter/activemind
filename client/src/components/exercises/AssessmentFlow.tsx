import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, FileText } from "lucide-react";
import { assessmentQuestions, type AssessmentType, type AssessmentResponse } from "@shared/assessmentQuestions";
import AssessmentQuestion from "./AssessmentQuestion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AssessmentFlowProps {
  assessmentType: AssessmentType;
  onComplete?: () => void;
  existingResponses?: AssessmentResponse[];
}

export default function AssessmentFlow({ 
  assessmentType, 
  onComplete,
  existingResponses = []
}: AssessmentFlowProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize with existing responses
  useEffect(() => {
    if (existingResponses.length > 0) {
      const responseMap: Record<number, number> = {};
      existingResponses.forEach(response => {
        responseMap[response.questionId] = response.rating;
      });
      setResponses(responseMap);
      
      // Check if assessment is complete
      if (existingResponses.length === assessmentQuestions.length) {
        setIsCompleted(true);
      }
    }
  }, [existingResponses]);

  const submitAssessmentMutation = useMutation({
    mutationFn: async (data: { assessmentType: AssessmentType; responses: AssessmentResponse[] }) => {
      await apiRequest('POST', '/api/assessments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
      toast({
        title: "Assessment Completed",
        description: `Your ${assessmentType}-assessment has been saved successfully.`,
      });
      setIsCompleted(true);
      onComplete?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnswerChange = (questionId: number, rating: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: rating
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < assessmentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const assessmentResponses: AssessmentResponse[] = assessmentQuestions.map(question => ({
      questionId: question.id,
      rating: responses[question.id] || 1
    }));

    submitAssessmentMutation.mutate({
      assessmentType,
      responses: assessmentResponses
    });
  };

  const currentQuestion = assessmentQuestions[currentQuestionIndex];
  const progress = Math.round(((currentQuestionIndex + 1) / assessmentQuestions.length) * 100);
  const answeredQuestions = Object.keys(responses).length;
  const canGoNext = currentQuestionIndex < assessmentQuestions.length - 1;
  const canGoPrevious = currentQuestionIndex > 0;
  const allQuestionsAnswered = answeredQuestions === assessmentQuestions.length;

  if (isCompleted) {
    return (
      <Card className="bg-card shadow-lg border border-border">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl">Assessment Complete</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your {assessmentType}-assessment has been completed and saved.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>15 questions answered</span>
          </div>
          {onComplete && (
            <Button onClick={onComplete} className="mt-4">
              Continue
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card shadow-lg border border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>{assessmentType === 'pre' ? 'Pre-Assessment' : 'Post-Assessment'}</span>
          </CardTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestionIndex + 1} of {assessmentQuestions.length}</span>
              <span>{answeredQuestions}/{assessmentQuestions.length} answered</span>
            </div>
            <Progress value={progress} className="h-2" data-testid="assessment-progress" />
          </div>
        </CardHeader>
      </Card>

      {/* Question */}
      <AssessmentQuestion
        question={currentQuestion}
        currentAnswer={responses[currentQuestion.id]}
        onAnswerChange={handleAnswerChange}
        onNext={handleNext}
        onPrevious={handlePrevious}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={assessmentQuestions.length}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
      />

      {/* Navigation & Submit */}
      <Card className="bg-card shadow-lg border border-border">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              data-testid="button-previous-question"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-2">
              {canGoNext ? (
                <Button
                  onClick={handleNext}
                  disabled={!responses[currentQuestion.id]}
                  data-testid="button-next-question"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!allQuestionsAnswered || submitAssessmentMutation.isPending}
                  data-testid="button-submit-assessment"
                  className="bg-primary hover:bg-primary/90"
                >
                  {submitAssessmentMutation.isPending ? "Submitting..." : "Complete Assessment"}
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {!allQuestionsAnswered && currentQuestionIndex === assessmentQuestions.length - 1 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Please answer all questions to complete the assessment.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}