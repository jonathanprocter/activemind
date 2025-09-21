import { BehavioralChangeCoach } from '@/components/ai/BehavioralChangeCoach';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Coach() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 gradient-text">
              Your Personal Change Coach
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your values into committed action with AI-powered guidance, 
              daily accountability, and personalized insights for lasting change.
            </p>
          </div>
        </div>
        
        <BehavioralChangeCoach />
      </div>
    </div>
  );
}