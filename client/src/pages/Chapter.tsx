import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import GroundingExercise from "@/components/exercises/GroundingExercise";
import ValuesDartboard from "@/components/exercises/ValuesDartboard";
import AssessmentQuestion from "@/components/exercises/AssessmentQuestion";
import ReflectionExercise from "@/components/exercises/ReflectionExercise";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Play, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Chapter, WorkbookProgress } from "@shared/schema";

interface ChapterWithProgress extends Chapter {
  progress?: WorkbookProgress[];
  completionRate: number;
}

export default function Chapter() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<ChapterWithProgress[]>({
    queryKey: ['/api/chapters'],
    enabled: !!user,
  });

  const { data: chapterProgress } = useQuery<WorkbookProgress[]>({
    queryKey: ['/api/chapters', chapterId, 'progress'],
    enabled: !!user && !!chapterId,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/progress', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chapters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chapters', chapterId, 'progress'] });
      toast({
        title: "Progress Saved",
        description: "Your progress has been saved successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  if (authLoading || chaptersLoading) {
    return <div className="min-h-screen bg-background" data-testid="loading-chapter">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const currentChapter = chapters.find(c => c.id === parseInt(chapterId || '0'));
  const chapterIndex = chapters.findIndex(c => c.id === parseInt(chapterId || '0'));
  const previousChapter = chapterIndex > 0 ? chapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex < chapters.length - 1 ? chapters[chapterIndex + 1] : null;

  if (!currentChapter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chapter Not Found</h1>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveProgress = (sectionId: string, responses: any, completed: boolean = false) => {
    updateProgressMutation.mutate({
      chapterId: parseInt(chapterId || '0'), // Ensure chapterId is an integer
      sectionId,
      responses,
      completed,
    });
  };

  const renderChapterContent = () => {
    const chapterId = currentChapter.id;
    
    switch (chapterId) {
      case 1: // Acceptance
        return (
          <div className="space-y-8">
            <ReflectionExercise
              title="Exercise 1.1: Barriers to Acceptance"
              description="Consider the barriers that stand in your way of accepting your thoughts and feelings."
              questions={[
                "What beliefs do you have about negative emotions?",
                "How do you typically react when uncomfortable feelings arise?",
                "What behaviors do you use to avoid difficult thoughts?",
                "What would happen if you stopped fighting these experiences?",
                "What support do you need to practice acceptance?"
              ]}
              sectionId="acceptance-barriers"
              onSave={handleSaveProgress}
              existingResponses={chapterProgress?.find(p => p.sectionId === 'acceptance-barriers')?.responses as Record<string, string>}
            />
            <ReflectionExercise
              title="Exercise 1.2: Situation Analysis"
              description="Think about a recent situation where you found it hard to accept your feelings, thoughts, or sensations."
              questions={[
                "Describe the situation:",
                "How did you respond?",
                "Why was acceptance difficult?",
                "How did your response affect the situation?"
              ]}
              sectionId="acceptance-situation"
              onSave={handleSaveProgress}
              existingResponses={chapterProgress?.find(p => p.sectionId === 'acceptance-situation')?.responses as Record<string, string>}
            />
          </div>
        );
      case 2: // Cognitive Defusion
        return (
          <div className="space-y-8">
            <ReflectionExercise
              title="Thought Observation Exercise"
              description="Practice observing your thoughts without getting caught up in them."
              questions={[
                "What recurring negative thought do you struggle with?",
                "Practice labeling: 'I'm having the thought that...'",
                "Try thanking your mind: 'Thanks, mind, for this thought.'",
                "Visualize the thought as a cloud passing by. How does this feel?",
                "What did you notice about your relationship with this thought?"
              ]}
              sectionId="defusion-observation"
              onSave={handleSaveProgress}
              existingResponses={chapterProgress?.find(p => p.sectionId === 'defusion-observation')?.responses as Record<string, string>}
            />
          </div>
        );
      case 3: // Being Present
        return (
          <div className="space-y-8">
            <GroundingExercise
              onSave={handleSaveProgress}
              existingResponses={chapterProgress?.find(p => p.sectionId === 'grounding-5-4-3-2-1')?.responses}
            />
            <ReflectionExercise
              title="Reflection Exercise 3.1: Present Moment Challenges"
              description="Think about a recent situation where you found it hard to stay present."
              questions={[
                "Describe the situation:",
                "What pulled your attention away from the present?",
                "How did it feel when your mind wandered?",
                "What would you do differently next time?"
              ]}
              sectionId="present-moment-reflection"
              onSave={handleSaveProgress}
              existingResponses={chapterProgress?.find(p => p.sectionId === 'present-moment-reflection')?.responses as Record<string, string>}
            />
          </div>
        );
      case 4: // Self as Context
        return (
          <div className="space-y-8">
            <ReflectionExercise
              title="Observer Self Exercise"
              description="Explore the difference between your thinking self and your observing self."
              questions={[
                "Describe a strong emotion you've experienced recently:",
                "Who or what was observing that emotion?",
                "What thoughts arose about the emotion?",
                "Who was watching those thoughts?",
                "What does this tell you about your sense of self?"
              ]}
              sectionId="observer-self"
              onSave={handleSaveProgress}
              existingResponses={chapterProgress?.find(p => p.sectionId === 'observer-self')?.responses as Record<string, string>}
            />
          </div>
        );
      case 5: // Values
        return (
          <div className="space-y-8">
            <ValuesDartboard
              onSave={handleSaveProgress}
              existingMarkers={chapterProgress?.find(p => p.sectionId === 'values-dartboard')?.responses ? (chapterProgress?.find(p => p.sectionId === 'values-dartboard')?.responses as any)?.markers : undefined}
            />
            <ReflectionExercise
              title="Values Reflection"
              description="Reflect on your values and how they guide your actions."
              questions={[
                "Which life domain needs the most attention?",
                "What actions could better align with your values?",
                "What barriers prevent you from living your values?",
                "How would your life change if you lived more aligned with your values?"
              ]}
              sectionId="values-reflection"
              onSave={handleSaveProgress}
              existingResponses={chapterProgress?.find(p => p.sectionId === 'values-reflection')?.responses as Record<string, string>}
            />
          </div>
        );
      case 6: // Committed Action
        return (
          <div className="space-y-8">
            <ReflectionExercise
              title="SMART Goals Exercise"
              description="Create specific, measurable, achievable, relevant, and time-bound goals aligned with your values."
              questions={[
                "What value-based goal do you want to achieve?",
                "How will you measure progress?",
                "What makes this goal achievable?",
                "Why is this goal relevant to your values?",
                "When will you complete this goal?"
              ]}
              sectionId="smart-goals"
              onSave={handleSaveProgress}
              existingResponses={chapterProgress?.find(p => p.sectionId === 'smart-goals')?.responses as Record<string, string>}
            />
          </div>
        );
      case 7: // Integration
        return (
          <div className="space-y-8">
            <ReflectionExercise
              title="Integration Reflection"
              description="Reflect on your journey through the ACT principles and plan for the future."
              questions={[
                "Which ACT principle has been most helpful?",
                "What insights have you gained about yourself?",
                "How will you continue practicing these skills?",
                "What support do you need going forward?",
                "How will you know you're living a valued life?"
              ]}
              sectionId="integration-reflection"
              onSave={handleSaveProgress}
              existingResponses={chapterProgress?.find(p => p.sectionId === 'integration-reflection')?.responses as Record<string, string>}
            />
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chapter content coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex">
        <Sidebar chapters={chapters} currentChapterId={currentChapter.id} />
        <main className="flex-1 overflow-y-auto">
          <section className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Chapter Header */}
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <Badge className="bg-primary/10 text-primary" data-testid={`badge-chapter-${currentChapter.id}`}>
                    Chapter {currentChapter.id}
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className={`${
                      currentChapter.completionRate === 100 
                        ? 'bg-green-100 text-green-800' 
                        : currentChapter.completionRate > 0 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {currentChapter.completionRate === 100 
                      ? 'Complete' 
                      : currentChapter.completionRate > 0 
                      ? 'In Progress'
                      : 'Not Started'
                    }
                  </Badge>
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4" data-testid={`title-chapter-${currentChapter.id}`}>
                  {currentChapter.title}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {currentChapter.description}
                </p>
              </div>

              {/* Chapter Content */}
              {renderChapterContent()}

              {/* Navigation Footer */}
              <div className="flex justify-between items-center pt-8 mt-12 border-t border-border">
                {previousChapter ? (
                  <Link href={`/chapter/${previousChapter.id}`}>
                    <Button variant="outline" className="flex items-center space-x-2" data-testid="button-previous">
                      <ArrowLeft className="w-4 h-4" />
                      <span>{previousChapter.title}</span>
                    </Button>
                  </Link>
                ) : (
                  <Link href="/">
                    <Button variant="outline" className="flex items-center space-x-2" data-testid="button-home">
                      <ArrowLeft className="w-4 h-4" />
                      <span>Home</span>
                    </Button>
                  </Link>
                )}

                {nextChapter && !nextChapter.isLocked ? (
                  <Link href={`/chapter/${nextChapter.id}`}>
                    <Button className="flex items-center space-x-2" data-testid="button-next">
                      <span>{nextChapter.title}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/">
                    <Button className="flex items-center space-x-2" data-testid="button-finish">
                      <span>Return Home</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
