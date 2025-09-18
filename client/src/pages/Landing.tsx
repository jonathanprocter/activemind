import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, Compass, Mountain, Pill, HandHeart, Puzzle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6 tracking-tight">
            Embrace Your Journey
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Welcome to your personal ACT workbook. A guided path toward psychological flexibility, 
            acceptance, and living a values-driven life.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              Start Your Journey
            </Button>
            <p className="text-sm text-muted-foreground">
              Free • Evidence-based • Self-paced
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <HandHeart className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Acceptance</CardTitle>
              <CardDescription>
                Learn to make room for difficult emotions and thoughts without struggling against them
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Cognitive Defusion</CardTitle>
              <CardDescription>
                Develop a new relationship with your thoughts, seeing them as mental events rather than facts
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Pill className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Being Present</CardTitle>
              <CardDescription>
                Foster mindfulness and awareness of the present moment without judgment
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Compass className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Values</CardTitle>
              <CardDescription>
                Identify what is truly meaningful and important in your life
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Mountain className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Committed Action</CardTitle>
              <CardDescription>
                Make behavior changes that align with your identified values
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Puzzle className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Integration</CardTitle>
              <CardDescription>
                Bring together all ACT principles for lasting psychological flexibility
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Disclaimer */}
        <Card className="bg-accent/10 border-accent/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold text-accent mb-2">Important Notice</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This is a self-help tool and educational resource. It is not a replacement for professional therapy or medical treatment.
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>If you're experiencing a crisis, please contact:</p>
                <p>National Suicide Prevention Lifeline: 988</p>
                <p>Crisis Text Line: Text HOME to 741741</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
