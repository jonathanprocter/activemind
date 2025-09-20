import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Calendar, CheckCircle, TrendingUp, Heart, Brain, MessageCircle, Send } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ActionPlan {
  id: string;
  goal: string;
  value: string;
  specificActions: string[];
  timeframe: string;
  barriers: string[];
  strategies: string[];
  dailyCommitment: string;
  progress: number;
  createdAt: string;
}

interface DailyCommitment {
  id: string;
  actionPlanId: string;
  date: string;
  commitment: string;
  completed: boolean;
  reflection: string;
  difficulty: number;
  satisfaction: number;
}

interface CoachingInsight {
  type: 'encouragement' | 'strategy' | 'adjustment' | 'celebration';
  message: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export function BehavioralChangeCoach() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('plans');
  const [newGoal, setNewGoal] = useState('');
  const [selectedValue, setSelectedValue] = useState('');

  // Fetch user's action plans
  const { data: actionPlans = [], isLoading: plansLoading } = useQuery<ActionPlan[]>({
    queryKey: ['/api/ai/action-plans'],
    enabled: !!user,
  });

  // Fetch daily commitments
  const { data: dailyCommitments = [], isLoading: commitmentsLoading } = useQuery<DailyCommitment[]>({
    queryKey: ['/api/ai/daily-commitments'],
    enabled: !!user,
  });

  // Fetch coaching insights
  const { data: coachingInsights = [], isLoading: insightsLoading } = useQuery<CoachingInsight[]>({
    queryKey: ['/api/ai/coaching-insights'],
    enabled: !!user,
  });

  // Create new action plan
  const createActionPlanMutation = useMutation({
    mutationFn: async (goal: string) => {
      return apiRequest('/api/ai/create-action-plan', 'POST', { goal, value: selectedValue });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/action-plans'] });
      setNewGoal('');
      setSelectedValue('');
      toast({
        title: "Action Plan Created",
        description: "Your AI-powered action plan is ready to help you create meaningful change!",
      });
    },
  });

  // Complete daily commitment
  const completeCommitmentMutation = useMutation({
    mutationFn: async ({ commitmentId, reflection, difficulty, satisfaction }: {
      commitmentId: string;
      reflection: string;
      difficulty: number;
      satisfaction: number;
    }) => {
      return apiRequest('/api/ai/complete-commitment', 'POST', { commitmentId, reflection, difficulty, satisfaction });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/daily-commitments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/coaching-insights'] });
      toast({
        title: "Progress Recorded",
        description: "Your commitment has been logged. Keep building that momentum!",
      });
    },
  });

  const handleCreateActionPlan = () => {
    if (!newGoal.trim()) return;
    createActionPlanMutation.mutate(newGoal);
  };

  const coreValues = [
    'Relationships & Connection',
    'Health & Vitality',
    'Personal Growth',
    'Creativity & Expression',
    'Achievement & Success',
    'Adventure & Discovery',
    'Service & Contribution',
    'Spirituality & Meaning',
    'Financial Security',
    'Freedom & Independence'
  ];

  if (!user) {
    return (
      <Card className="bg-card border border-border">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to access your personal behavioral change coach.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">AI Behavioral Change Coach</CardTitle>
              <p className="text-muted-foreground">
                Transform your values into committed action with personalized AI guidance
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plans" data-testid="tab-action-plans">
            <Target className="w-4 h-4 mr-2" />
            Action Plans
          </TabsTrigger>
          <TabsTrigger value="daily" data-testid="tab-daily-commitments">
            <Calendar className="w-4 h-4 mr-2" />
            Daily Commitments
          </TabsTrigger>
          <TabsTrigger value="progress" data-testid="tab-progress">
            <TrendingUp className="w-4 h-4 mr-2" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="insights" data-testid="tab-coaching-insights">
            <Heart className="w-4 h-4 mr-2" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Action Plan</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tell the AI about a change you want to make, and it will create a personalized action plan
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Core Value</label>
                <select 
                  value={selectedValue} 
                  onChange={(e) => setSelectedValue(e.target.value)}
                  className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                  data-testid="select-core-value"
                >
                  <option value="">Select a core value...</option>
                  {coreValues.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
              <Textarea
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Describe a change you want to make in your life that aligns with this value..."
                className="min-h-[100px]"
                data-testid="textarea-new-goal"
              />
              <Button 
                onClick={handleCreateActionPlan}
                disabled={!newGoal.trim() || !selectedValue || createActionPlanMutation.isPending}
                className="w-full"
                data-testid="button-create-action-plan"
              >
                {createActionPlanMutation.isPending ? 'Creating Your Plan...' : 'Create AI Action Plan'}
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {plansLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              actionPlans.map((plan: ActionPlan) => (
                <Card key={plan.id} className="border border-border hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{plan.goal}</h3>
                        <Badge variant="secondary" className="mt-1">
                          <Heart className="w-3 h-3 mr-1" />
                          {plan.value}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Progress</div>
                        <div className="text-2xl font-bold text-primary">{plan.progress}%</div>
                      </div>
                    </div>
                    
                    <Progress value={plan.progress} className="mb-4" />
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Daily Commitment</h4>
                        <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                          {plan.dailyCommitment}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Key Strategies</h4>
                        <div className="flex flex-wrap gap-2">
                          {plan.strategies.slice(0, 3).map((strategy, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {strategy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Commitments</CardTitle>
              <p className="text-sm text-muted-foreground">
                Small daily actions create lasting change. Track your progress here.
              </p>
            </CardHeader>
            <CardContent>
              {commitmentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-16 bg-muted rounded"></div>
                  ))}
                </div>
              ) : dailyCommitments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No commitments for today. Create an action plan to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dailyCommitments.map((commitment: DailyCommitment) => (
                    <CommitmentCard 
                      key={commitment.id} 
                      commitment={commitment}
                      onComplete={completeCommitmentMutation.mutate}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <ProgressDashboard actionPlans={actionPlans} dailyCommitments={dailyCommitments} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Coaching Insights</CardTitle>
              <p className="text-sm text-muted-foreground">
                Personalized guidance based on your progress and patterns
              </p>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-20 bg-muted rounded"></div>
                  ))}
                </div>
              ) : coachingInsights.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {coachingInsights.map((insight: CoachingInsight, index: number) => (
                    <InsightCard key={index} insight={insight} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground mb-6">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Create action plans and complete commitments to unlock AI insights!</p>
                </div>
              )}
              
              {/* AI Chat Interface */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Ask Your AI Coach
                </h3>
                <AiChatInterface />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Commitment Card Component
function CommitmentCard({ 
  commitment, 
  onComplete 
}: { 
  commitment: DailyCommitment;
  onComplete: (data: any) => void;
}) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [reflection, setReflection] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [satisfaction, setSatisfaction] = useState(3);

  const handleComplete = () => {
    onComplete({
      commitmentId: commitment.id,
      reflection,
      difficulty,
      satisfaction
    });
    setIsCompleting(false);
  };

  if (commitment.completed) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <div className="flex-1">
          <p className="font-medium">{commitment.commitment}</p>
          <p className="text-sm text-muted-foreground">Completed today</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-medium">{commitment.commitment}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCompleting(!isCompleting)}
            data-testid={`button-complete-commitment-${commitment.id}`}
          >
            {isCompleting ? 'Cancel' : 'Complete'}
          </Button>
        </div>
        
        {isCompleting && (
          <div className="space-y-4 pt-3 border-t border-border">
            <Textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="How did this commitment go? What did you learn?"
              className="min-h-[80px]"
              data-testid={`textarea-reflection-${commitment.id}`}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Difficulty (1-5)</label>
                <select 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                  data-testid={`select-difficulty-${commitment.id}`}
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? '(Easy)' : n === 5 ? '(Very Hard)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Satisfaction (1-5)</label>
                <select 
                  value={satisfaction} 
                  onChange={(e) => setSatisfaction(Number(e.target.value))}
                  className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                  data-testid={`select-satisfaction-${commitment.id}`}
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? '(Low)' : n === 5 ? '(High)' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button 
              onClick={handleComplete}
              className="w-full"
              data-testid={`button-submit-completion-${commitment.id}`}
            >
              Record Completion
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Progress Dashboard Component
function ProgressDashboard({ 
  actionPlans, 
  dailyCommitments 
}: { 
  actionPlans: ActionPlan[];
  dailyCommitments: DailyCommitment[];
}) {
  const completedToday = dailyCommitments.filter(c => c.completed).length;
  const totalToday = dailyCommitments.length;
  const overallProgress = actionPlans.length > 0 
    ? Math.round(actionPlans.reduce((sum, plan) => sum + plan.progress, 0) / actionPlans.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary">{completedToday}/{totalToday}</div>
            <p className="text-sm text-muted-foreground">Today's Commitments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary">{overallProgress}%</div>
            <p className="text-sm text-muted-foreground">Overall Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary">{actionPlans.length}</div>
            <p className="text-sm text-muted-foreground">Active Plans</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Progress Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actionPlans.map((plan: ActionPlan) => (
              <div key={plan.id}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{plan.goal}</span>
                  <span className="text-sm text-muted-foreground">{plan.progress}%</span>
                </div>
                <Progress value={plan.progress} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Insight Card Component
function InsightCard({ insight }: { insight: CoachingInsight }) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'encouragement': return <Heart className="w-5 h-5" />;
      case 'strategy': return <Brain className="w-5 h-5" />;
      case 'adjustment': return <Target className="w-5 h-5" />;
      case 'celebration': return <CheckCircle className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'encouragement': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'strategy': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      case 'adjustment': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'celebration': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <Card className={`border-l-4 ${insight.priority === 'high' ? 'border-l-primary' : insight.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-gray-300'}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-full ${getInsightColor(insight.type)}`}>
            {getInsightIcon(insight.type)}
          </div>
          <div className="flex-1">
            <p className="text-sm leading-relaxed">{insight.message}</p>
            {insight.actionable && (
              <Badge variant="outline" className="mt-2 text-xs">
                Actionable Insight
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// AI Chat Interface Component
function AiChatInterface() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const { toast } = useToast();

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);
    
    // Add user message to chat
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await apiRequest('POST', '/api/ai/conversation', {
        message: userMessage,
        conversationType: 'therapeutic_guidance',
        sessionId: 'behavioral-change-coach'
      });
      
      // Add AI response to chat
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: "Failed to get response from AI coach. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-4">
      {/* Chat Messages */}
      {chatHistory.length > 0 && (
        <div className="max-h-96 overflow-y-auto space-y-3 border rounded-lg p-4 bg-muted/20">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background border border-border'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-background border border-border p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse">AI is thinking...</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat Input */}
      <div className="flex space-x-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask your AI coach for guidance, encouragement, or strategies..."
          className="flex-1"
          disabled={isLoading}
          data-testid="input-ai-coach-message"
        />
        <Button 
          onClick={sendMessage}
          disabled={!message.trim() || isLoading}
          size="icon"
          data-testid="button-send-coach-message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      
      {chatHistory.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Start a conversation with your AI coach for personalized guidance and support!</p>
        </div>
      )}
    </div>
  );
}