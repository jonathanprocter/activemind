import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PenTool, Save, Check } from "lucide-react";

interface ReflectionExerciseProps {
  title: string;
  description: string;
  questions: string[];
  sectionId: string;
  onSave: (sectionId: string, responses: any, completed?: boolean) => void;
  existingResponses?: Record<string, string>;
}

export default function ReflectionExercise({
  title,
  description,
  questions,
  sectionId,
  onSave,
  existingResponses = {},
}: ReflectionExerciseProps) {
  const [responses, setResponses] = useState<Record<string, string>>(existingResponses);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setResponses(existingResponses);
  }, [existingResponses]);

  const handleResponseChange = (questionIndex: number, value: string) => {
    const key = `question_${questionIndex}`;
    setResponses(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const filledResponses = Object.values(responses).filter(response => response.trim()).length;
    const isCompleted = filledResponses >= questions.length * 0.8; // 80% completion threshold
    
    onSave(sectionId, responses, isCompleted);
    setHasChanges(false);
  };

  const completionRate = Math.round(
    (Object.values(responses).filter(response => response.trim()).length / questions.length) * 100
  );

  return (
    <Card className="bg-card shadow-lg border border-border hover:shadow-xl transition-all">
      <CardHeader>
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
            <PenTool className="w-5 h-5 text-accent" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((question, index) => {
          const key = `question_${index}`;
          return (
            <div key={index} className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                {question}
              </Label>
              <Textarea
                value={responses[key] || ''}
                onChange={(e) => handleResponseChange(index, e.target.value)}
                placeholder="Share your thoughts..."
                className="min-h-[100px] resize-none focus:ring-2 focus:ring-primary focus:border-primary bg-input"
                data-testid={`textarea-${sectionId}-${index}`}
              />
            </div>
          );
        })}

        <div className="pt-6 border-t border-border flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              {completionRate}% complete
            </div>
            {!hasChanges && completionRate > 0 && (
              <div className="flex items-center space-x-1 text-sm text-primary">
                <Check className="w-4 h-4" />
                <span>Saved</span>
              </div>
            )}
          </div>
          <Button 
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!hasChanges && completionRate === 0}
            data-testid={`button-save-${sectionId}`}
          >
            <Save className="w-4 h-4 mr-2" />
            {completionRate >= 80 ? 'Mark Complete' : 'Save Progress'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
