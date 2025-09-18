import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowLeft } from "lucide-react";
import AssessmentFlow from "@/components/exercises/AssessmentFlow";
import { useQuery } from "@tanstack/react-query";

export default function PreAssessment() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Fetch existing assessments to check if pre-assessment already completed
  const { data: assessments = [] } = useQuery({
    queryKey: ['/api/assessments'],
    enabled: !!user,
  });

  const preAssessment = assessments.find(a => a.assessmentType === 'pre');

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-warm-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <Card className="bg-card shadow-lg border border-border">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Pre-Assessment</CardTitle>
              <CardDescription className="text-lg max-w-2xl mx-auto">
                Before beginning your ACT journey, please complete this brief assessment. 
                It will help track your progress throughout the workbook.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-muted/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground">
                  <strong>Instructions:</strong> Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree) 
                  based on how true it feels for you right now. There are no right or wrong answers.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-primary/20 rounded"></div>
                  <span>15 Questions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-primary/20 rounded"></div>
                  <span>5-10 Minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-primary/20 rounded"></div>
                  <span>Anonymous & Secure</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Flow */}
        <AssessmentFlow 
          assessmentType="pre"
          existingResponses={preAssessment?.responses}
          onComplete={() => {
            toast({
              title: "Pre-Assessment Complete!",
              description: "You can now begin your ACT workbook journey.",
            });
            setTimeout(() => {
              window.location.href = "/";
            }, 2000);
          }}
        />
      </div>
    </div>
  );
}