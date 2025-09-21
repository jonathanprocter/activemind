import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import ProgressBar from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Play, Clock, FileText, TrendingUp, Brain, Target } from "lucide-react";
import { exportToPDF } from "@/lib/pdfExport";
import { useState } from "react";
import type { Chapter, WorkbookProgress, Assessment } from "@shared/schema";

interface ChapterWithProgress extends Chapter {
  progress?: WorkbookProgress[];
  completionRate: number;
}

export default function Home() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  
  const { data: chapters = [], isLoading } = useQuery<ChapterWithProgress[]>({
    queryKey: ['/api/chapters'],
    enabled: !!user,
  });

  const { data: userProgress } = useQuery({
    queryKey: ['/api/progress'],
    enabled: !!user,
  });

  const { data: assessments = [] } = useQuery<Assessment[]>({
    queryKey: ['/api/assessments'],
    enabled: !!user,
  });

  const { data: autoSaveStatus } = useQuery<{ savedAt?: string }>({
    queryKey: ['/api/auto-save/home'],
    enabled: !!user,
  });

  const completedChapters = chapters.filter(c => c.completionRate === 100).length;
  const overallProgress = chapters.length > 0 ? Math.round((completedChapters / chapters.length) * 100) : 0;
  const currentChapter = chapters.find(c => c.completionRate > 0 && c.completionRate < 100);
  
  const preAssessment = assessments.find(a => a.assessmentType === 'pre');
  const postAssessment = assessments.find(a => a.assessmentType === 'post');
  
  // Determine user's next step for better guidance
  const isFirstTimeUser = !preAssessment && overallProgress === 0;
  const hasStartedJourney = preAssessment || overallProgress > 0;
  const nextChapter = currentChapter || chapters[0];

  if (isLoading) {
    return <div className="min-h-screen bg-background" data-testid="loading-home">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex">
        <Sidebar chapters={chapters} currentChapterId={currentChapter?.id} />
        <main className="flex-1 overflow-y-auto">
          {/* Hero Section */}
          <section className="relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-muted/20 to-transparent pointer-events-none"></div>
            
            <div className="relative py-16 px-4 sm:px-6 lg:px-8 z-10">
              <div className="max-w-5xl mx-auto text-center">
                {/* Hero Image with Enhanced Styling */}
                <div className="mb-12 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl transform scale-110 opacity-70 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none"></div>
                  <div className="relative overflow-hidden rounded-3xl shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-500">
                    <img 
                      src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=400" 
                      alt="Peaceful meditation garden" 
                      className="w-full h-72 object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
                    <div className="absolute inset-0 bg-primary/10 pointer-events-none"></div>
                  </div>
                </div>
                
                {/* Enhanced Typography */}
                <div className="mb-8 animate-slide-in-up">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight tracking-tight">
                    <span className="gradient-text">
                      {isFirstTimeUser ?
                        `Welcome, ${(user as any)?.firstName || 'Friend'}!` :
                        `Welcome back, ${(user as any)?.firstName || 'Friend'}`
                      }
                    </span>
                  </h1>
                  <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                    {isFirstTimeUser ? 
                      'Begin your transformative journey toward psychological flexibility and living a values-driven life. Start with your personalized assessment below.' :
                      'Continue your transformative journey toward psychological flexibility and living a values-driven life.'
                    }
                  </p>
                </div>
              {/* Enhanced CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 animate-slide-in-up" style={{animationDelay: '0.2s'}}>
                {isFirstTimeUser ? (
                  // First-time user: Start with pre-assessment
                  <Button className="bg-gradient-to-r from-primary to-accent text-white hover:from-primary/90 hover:to-accent/90 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" data-testid="button-start-here" asChild>
                    <Link href="/pre-assessment">
                      <Play className="w-5 h-5 mr-3" />
                      Start Your Journey
                    </Link>
                  </Button>
                ) : currentChapter ? (
                  // Returning user with progress: Continue chapter
                  <Button className="bg-gradient-to-r from-primary to-accent text-white hover:from-primary/90 hover:to-accent/90 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" data-testid="button-continue" asChild>
                    <Link href={`/chapter/${currentChapter.id}`}>
                      <Play className="w-5 h-5 mr-3" />
                      Continue {currentChapter.title}
                    </Link>
                  </Button>
                ) : nextChapter ? (
                  // Returning user, assessment done but no chapters started: Start first chapter
                  <Button className="bg-gradient-to-r from-primary to-accent text-white hover:from-primary/90 hover:to-accent/90 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" data-testid="button-start-chapter" asChild>
                    <Link href={`/chapter/${nextChapter.id}`}>
                      <Play className="w-5 h-5 mr-3" />
                      Start {nextChapter.title}
                    </Link>
                  </Button>
                ) : null}
                
                {hasStartedJourney && (
                  <Button 
                    variant="outline" 
                    className="px-8 py-4 text-lg border-2 border-primary/50 hover:border-primary hover:bg-primary/10 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" 
                    data-testid="button-export"
                    disabled={isExporting}
                    onClick={async () => {
                      setIsExporting(true);
                      try {
                        await exportToPDF();
                      } catch (error) {
                        console.error('Export failed:', error);
                      } finally {
                        setIsExporting(false);
                      }
                    }}
                  >
                    <Download className="w-5 h-5 mr-3" />
                    {isExporting ? 'Exporting...' : 'Export Progress'}
                  </Button>
                )}
              </div>
              </div>
            </div>
          </section>

          {/* Progress Overview */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
            <div className="max-w-6xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Your Progress</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Track your journey and celebrate your achievements</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <Card className="card-hover bg-gradient-to-br from-card to-muted/20 border-0 shadow-xl backdrop-blur-sm animate-slide-in-up">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-primary" />
                      Overall Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold gradient-text mb-3">{overallProgress}%</div>
                    <ProgressBar progress={overallProgress} className="mt-2 h-3 rounded-full" />
                    <p className="text-xs text-muted-foreground mt-2">Keep going strong!</p>
                  </CardContent>
                </Card>

                <Card className="card-hover bg-gradient-to-br from-card to-muted/20 border-0 shadow-xl backdrop-blur-sm animate-slide-in-up" style={{animationDelay: '0.1s'}}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                      <Target className="w-4 h-4 mr-2 text-accent" />
                      Chapters Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground mb-3">{completedChapters}<span className="text-2xl text-muted-foreground">/{chapters.length}</span></div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="bg-gradient-to-r from-accent to-primary h-2 rounded-full transition-all duration-500" style={{width: `${chapters.length > 0 ? (completedChapters / chapters.length) * 100 : 0}%`}}></div>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{Math.round(chapters.length > 0 ? (completedChapters / chapters.length) * 100 : 0)}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover bg-gradient-to-br from-card to-muted/20 border-0 shadow-xl backdrop-blur-sm animate-slide-in-up" style={{animationDelay: '0.2s'}}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      Last Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-foreground mb-2">
                      {autoSaveStatus?.savedAt ? 
                        new Date(autoSaveStatus.savedAt).toLocaleDateString() : 
                        'Welcome!'
                      }
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      {autoSaveStatus?.savedAt ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          Auto-saved
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></div>
                          Ready to begin
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Assessments Section */}
              <div className="mb-16">
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    {isFirstTimeUser ? 'Start Your Journey' : 'Assessments'}
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {isFirstTimeUser ? 'Begin with a personalized assessment to tailor your experience' : 'Track your psychological flexibility progress'}
                  </p>
                </div>
                
                {isFirstTimeUser && (
                  <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl card-natural shadow-lg animate-slide-in-up">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                        1
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">First Step: Take Your Assessment</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Start with a quick assessment to establish your baseline and personalize your therapeutic experience. This helps us tailor content to your specific needs.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className={`card-hover animate-slide-in-left ${isFirstTimeUser ? 'border-0 bg-gradient-to-br from-primary/10 to-accent/10 shadow-xl backdrop-blur-sm' : 'border-0 bg-gradient-to-br from-card to-muted/20 shadow-xl backdrop-blur-sm'}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span>Pre-Assessment</span>
                        {preAssessment && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white">✓</span>
                          </div>
                        )}
                        {isFirstTimeUser && (
                          <div className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full font-medium">
                            START HERE
                          </div>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {isFirstTimeUser ? 
                          'Required first step: Establish your baseline before beginning your ACT workbook journey.' :
                          'Establish your baseline before beginning the ACT workbook journey.'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          15 questions • 5-10 minutes
                        </div>
                        <Link href="/pre-assessment">
                          <Button 
                            variant={preAssessment ? "outline" : "default"}
                            className={`w-full ${isFirstTimeUser && !preAssessment ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                            data-testid="button-pre-assessment"
                          >
                            {preAssessment ? 'Review Pre-Assessment' : 'Take Pre-Assessment'}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span>Post-Assessment</span>
                        {postAssessment && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white">✓</span>
                          </div>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Measure your progress and growth after completing the workbook.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          {completedChapters < chapters.length ? 
                            `Complete ${chapters.length - completedChapters} more chapters to unlock` :
                            "15 questions • 5-10 minutes"
                          }
                        </div>
                        {completedChapters >= chapters.length || postAssessment ? (
                          <Button 
                            variant={postAssessment ? "outline" : "default"}
                            className="w-full"
                            data-testid="button-post-assessment"
                            asChild
                          >
                            <Link href="/post-assessment">
                              {postAssessment ? 'Review Post-Assessment' : 'Start Post-Assessment'}
                            </Link>
                          </Button>
                        ) : (
                          <Button 
                            variant="outline"
                            className="w-full"
                            disabled
                            data-testid="button-post-assessment"
                          >
                            Complete All Chapters First
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* AI-Powered Tools Section */}
              {(hasStartedJourney || isFirstTimeUser) && (
                <div className="mb-16">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">AI-Powered Tools</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Transform your values into committed action with intelligent coaching and insights
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="card-hover bg-gradient-to-br from-primary/5 via-background to-accent/5 border-0 shadow-xl backdrop-blur-sm animate-slide-in-up overflow-hidden relative">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Brain className="w-5 h-5 text-primary" />
                          <span>Personal Change Coach</span>
                          <div className="px-3 py-1 bg-gradient-to-r from-primary/20 to-accent/20 text-primary text-xs rounded-full font-bold border border-primary/30 animate-pulse-gentle">
                            AI-POWERED
                          </div>
                        </CardTitle>
                        <CardDescription>
                          Transform your values into committed action with personalized AI guidance, daily accountability, and progress insights.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Target className="w-4 h-4" />
                              <span>Action Plans</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Daily Commitments</span>
                            </div>
                          </div>
                          <Button className="w-full bg-gradient-to-r from-primary to-accent text-white hover:from-primary/90 hover:to-accent/90 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" data-testid="button-ai-coach" asChild>
                            <Link href="/coach">
                              <Brain className="w-5 h-5 mr-3" />
                              Start Your Change Journey
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Chapter Grid */}
              <div className="mb-16">
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    {isFirstTimeUser ? 'Next Steps: Chapters' : 'Your Chapters'}
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {isFirstTimeUser ? 'Complete your assessment to unlock these powerful therapeutic modules' : 'Continue your journey through these ACT-based therapeutic modules'}
                  </p>
                </div>
                
                {isFirstTimeUser && (
                  <div className="mb-8 p-6 bg-gradient-to-r from-accent/10 to-secondary/10 border border-accent/20 rounded-2xl card-natural shadow-lg animate-slide-in-up">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-accent to-secondary text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                        2
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">After Your Assessment</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Complete your assessment first, then these therapeutic chapters will become available to guide your personalized ACT journey through the six core principles.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {chapters.map((chapter, index) => {
                    const isFirstChapter = index === 0;
                    const shouldHighlight = hasStartedJourney && !currentChapter && isFirstChapter;
                    
                    return (
                      <Card 
                        key={chapter.id} 
                        className={`card-hover animate-slide-in-up border-0 shadow-xl backdrop-blur-sm ${
                          chapter.isLocked || (isFirstTimeUser && !preAssessment) ? 'opacity-60 bg-gradient-to-br from-muted/30 to-muted/50' : 
                          shouldHighlight ? 'bg-gradient-to-br from-primary/10 to-accent/10 shadow-2xl scale-105' :
                          chapter.completionRate === 100 ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' :
                          chapter.completionRate > 0 ? 'bg-gradient-to-br from-primary/5 to-accent/5' :
                          'bg-gradient-to-br from-card to-muted/20 hover:from-primary/5 hover:to-accent/5'
                        }`}
                        data-testid={`card-chapter-${chapter.id}`}
                        style={{animationDelay: `${index * 0.1}s`}}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2">
                              <span>{chapter.title}</span>
                              {chapter.completionRate === 100 && (
                                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                  <span className="text-xs text-primary-foreground">✓</span>
                                </div>
                              )}
                              {shouldHighlight && (
                                <div className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full font-medium">
                                  NEXT
                                </div>
                              )}
                            </CardTitle>
                            {chapter.isLocked || (isFirstTimeUser && !preAssessment) ? (
                              <div className="text-muted-foreground">🔒</div>
                            ) : chapter.completionRate > 0 && chapter.completionRate < 100 ? (
                              <div className="text-accent">⏱️</div>
                            ) : null}
                          </div>
                          <CardDescription>{chapter.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <ProgressBar progress={chapter.completionRate} />
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                {chapter.completionRate}% complete
                              </span>
                              {!chapter.isLocked && !(isFirstTimeUser && !preAssessment) ? (
                                <Button 
                                  variant={chapter.completionRate > 0 || shouldHighlight ? "default" : "outline"} 
                                  size="sm"
                                  data-testid={`button-chapter-${chapter.id}`}
                                  asChild
                                >
                                  <Link href={`/chapter/${chapter.id}`}>
                                    {chapter.completionRate === 0 ? 'Start' : 'Continue'}
                                  </Link>
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled
                                  data-testid={`button-chapter-${chapter.id}-disabled`}
                                >
                                  {isFirstTimeUser && !preAssessment ? 'Complete Assessment First' : 'Locked'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Support Section */}
              <div className="mt-16 text-center">
                <Card className="bg-gradient-to-br from-accent/10 via-secondary/5 to-accent/10 border-0 shadow-xl backdrop-blur-sm animate-slide-in-up overflow-hidden relative">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent"></div>
                  <CardContent className="relative pt-8 pb-8 px-8">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-accent to-secondary rounded-full flex items-center justify-center shadow-lg">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                          <span className="text-accent font-bold text-lg">💚</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Need Support?</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                          Your mental health matters. Crisis helpline resources are available 24/7 for immediate support and guidance.
                        </p>
                      </div>
                      <Button variant="outline" className="px-8 py-3 text-accent border-2 border-accent/50 hover:border-accent hover:bg-accent/10 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold">
                        View Crisis Resources
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
