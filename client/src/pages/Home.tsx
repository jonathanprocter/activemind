import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import ProgressBar from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Play, Clock, FileText, TrendingUp } from "lucide-react";
import { exportToPDF } from "@/lib/pdfExport";
import { useState } from "react";
import type { Chapter, WorkbookProgress } from "@shared/schema";

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

  const { data: assessments = [] } = useQuery({
    queryKey: ['/api/assessments'],
    enabled: !!user,
  });

  const { data: autoSaveStatus } = useQuery<{ savedAt?: string }>({
    queryKey: ['/api/auto-save/home'],
    enabled: !!user,
  });

  const completedChapters = chapters.filter(c => c.completionRate === 100).length;
  const overallProgress = chapters.length > 0 ? Math.round((completedChapters / chapters.length) * 100) : 0;
  const currentChapter = chapters.find(c => c.completionRate > 0 && c.completionRate < 100) || chapters[0];
  
  const preAssessment = assessments.find(a => a.assessmentType === 'pre');
  const postAssessment = assessments.find(a => a.assessmentType === 'post');

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
          <section className="bg-gradient-to-br from-background to-muted py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-8 relative">
                <img 
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=400" 
                  alt="Peaceful meditation garden" 
                  className="rounded-2xl shadow-2xl w-full h-64 object-cover" 
                />
                <div className="absolute inset-0 bg-primary/20 rounded-2xl"></div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Welcome back, {(user as any)?.firstName || 'Friend'}
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                Continue your journey toward psychological flexibility and living a values-driven life.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                {currentChapter && (
                  <Link href={`/chapter/${currentChapter.id}`}>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3" data-testid="button-continue">
                      <Play className="w-4 h-4 mr-2" />
                      Continue {currentChapter.title}
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="outline" 
                  className="px-8 py-3" 
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
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export Progress'}
                </Button>
              </div>
            </div>
          </section>

          {/* Progress Overview */}
          <section className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Overall Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{overallProgress}%</div>
                    <ProgressBar progress={overallProgress} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Chapters Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{completedChapters}/{chapters.length}</div>
                    <p className="text-sm text-muted-foreground mt-1">Keep going!</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Last Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      {autoSaveStatus?.savedAt ? 
                        new Date(autoSaveStatus.savedAt).toLocaleDateString() : 
                        'No recent activity'
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Assessments Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Assessments</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span>Pre-Assessment</span>
                        {preAssessment && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white">✓</span>
                          </div>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Establish your baseline before beginning the ACT workbook journey.
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
                            className="w-full"
                            data-testid="button-pre-assessment"
                          >
                            {preAssessment ? 'Review Pre-Assessment' : 'Start Pre-Assessment'}
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
                        <Link href="/post-assessment">
                          <Button 
                            variant={postAssessment ? "outline" : "default"}
                            className="w-full"
                            disabled={completedChapters < chapters.length && !postAssessment}
                            data-testid="button-post-assessment"
                          >
                            {postAssessment ? 'Review Post-Assessment' : 
                             completedChapters < chapters.length ? 'Complete All Chapters First' : 'Start Post-Assessment'}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Chapter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {chapters.map((chapter) => (
                  <Card 
                    key={chapter.id} 
                    className={`transition-all hover:shadow-lg ${
                      chapter.isLocked ? 'opacity-60' : 'hover:transform hover:-translate-y-1'
                    }`}
                    data-testid={`card-chapter-${chapter.id}`}
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
                        </CardTitle>
                        {chapter.isLocked ? (
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
                          {!chapter.isLocked && (
                            <Link href={`/chapter/${chapter.id}`}>
                              <Button 
                                variant={chapter.completionRate > 0 ? "default" : "outline"} 
                                size="sm"
                                data-testid={`button-chapter-${chapter.id}`}
                              >
                                {chapter.completionRate === 0 ? 'Start' : 'Continue'}
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Support Section */}
              <Card className="mt-8 bg-accent/10 border-accent/20">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-accent mb-2">Need Support?</h3>
                  <p className="text-sm text-muted-foreground mb-3">Crisis helpline resources available 24/7</p>
                  <Button variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10">
                    View Resources
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
