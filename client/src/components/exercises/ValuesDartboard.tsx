import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Save } from "lucide-react";

interface DartboardMarker {
  id: string;
  x: number;
  y: number;
  domain: string;
  alignment: number; // 1-4 (center to outer)
}

interface ValuesDartboardProps {
  onSave: (sectionId: string, responses: any, completed?: boolean) => void;
  existingMarkers?: DartboardMarker[];
}

const domains = [
  { name: "Career & Work", color: "#8B9D83", position: { x: 150, y: 30 } },
  { name: "Personal Growth", color: "#C9A78E", position: { x: 220, y: 80 } },
  { name: "Health & Fitness", color: "#E8DCC4", position: { x: 220, y: 220 } },
  { name: "Spirituality", color: "#8B9D83", position: { x: 150, y: 270 } },
  { name: "Family Relations", color: "#C9A78E", position: { x: 80, y: 220 } },
  { name: "Friendships", color: "#E8DCC4", position: { x: 80, y: 80 } },
  { name: "Education", color: "#8B9D83", position: { x: 120, y: 60 } },
  { name: "Leisure & Fun", color: "#C9A78E", position: { x: 180, y: 180 } },
];

export default function ValuesDartboard({ onSave, existingMarkers = [] }: ValuesDartboardProps) {
  const [markers, setMarkers] = useState<DartboardMarker[]>(existingMarkers);

  useEffect(() => {
    if (existingMarkers.length > 0 && JSON.stringify(existingMarkers) !== JSON.stringify(markers)) {
      setMarkers(existingMarkers);
    }
  }, [JSON.stringify(existingMarkers)]); // Prevent render loops

  const handleDartboardClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * 300) / rect.width;
    const y = ((event.clientY - rect.top) * 300) / rect.height;

    // Calculate distance from center
    const centerX = 150;
    const centerY = 150;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

    // Determine alignment level based on distance
    let alignment = 4; // Outer ring
    if (distance <= 35) alignment = 1; // Center
    else if (distance <= 70) alignment = 2; // Inner ring  
    else if (distance <= 105) alignment = 3; // Middle ring

    // Find which domain this position is closest to
    let closestDomain = domains[0];
    let minDistance = Number.MAX_VALUE;
    domains.forEach(domain => {
      const domainDistance = Math.sqrt(
        (x - domain.position.x) ** 2 + (y - domain.position.y) ** 2
      );
      if (domainDistance < minDistance) {
        minDistance = domainDistance;
        closestDomain = domain;
      }
    });

    const newMarker: DartboardMarker = {
      id: Date.now().toString(),
      x,
      y,
      domain: closestDomain.name,
      alignment,
    };

    setMarkers(prev => [...prev, newMarker]);
  };

  const removeMarker = (id: string) => {
    setMarkers(prev => prev.filter(marker => marker.id !== id));
  };

  const handleSave = () => {
    const responses = { markers };
    const isCompleted = markers.length >= 4; // At least 4 domains marked
    onSave('values-dartboard', responses, isCompleted);
  };

  return (
    <Card className="bg-card shadow-lg border border-border hover:shadow-xl transition-all">
      <CardHeader>
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-accent" />
          </div>
          <CardTitle className="text-xl">Values Alignment Dashboard</CardTitle>
        </div>
        <p className="text-muted-foreground">
          Click on the dartboard to indicate how aligned your current life is with each value area. 
          Center = fully aligned, outer ring = needs attention.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
          {/* SVG Dartboard */}
          <div className="flex-shrink-0">
            <svg 
              width="300" 
              height="300" 
              viewBox="0 0 300 300" 
              className="border border-border rounded-full cursor-crosshair"
              onClick={handleDartboardClick}
              data-testid="dartboard-svg"
            >
              {/* Concentric circles */}
              <circle cx="150" cy="150" r="140" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2"/>
              <circle cx="150" cy="150" r="105" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2"/>
              <circle cx="150" cy="150" r="70" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="2"/>
              <circle cx="150" cy="150" r="35" fill="hsl(var(--primary))" stroke="hsl(var(--border))" strokeWidth="2"/>
              
              {/* Section dividers */}
              <line x1="150" y1="10" x2="150" y2="290" stroke="hsl(var(--border))" strokeWidth="2"/>
              <line x1="10" y1="150" x2="290" y2="150" stroke="hsl(var(--border))" strokeWidth="2"/>
              <line x1="45" y1="45" x2="255" y2="255" stroke="hsl(var(--border))" strokeWidth="2"/>
              <line x1="255" y1="45" x2="45" y2="255" stroke="hsl(var(--border))" strokeWidth="2"/>
              
              {/* Markers */}
              {markers.map((marker) => (
                <circle
                  key={marker.id}
                  cx={marker.x}
                  cy={marker.y}
                  r="6"
                  fill="hsl(var(--accent))"
                  stroke="hsl(var(--accent-foreground))"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-8 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMarker(marker.id);
                  }}
                  data-testid={`marker-${marker.id}`}
                />
              ))}
            </svg>
          </div>

          {/* Legend and Controls */}
          <div className="flex-1 space-y-4">
            <h4 className="font-medium text-foreground mb-4">Life Domains</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {domains.map((domain, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: domain.color }}
                  ></div>
                  <span className="text-sm font-medium">{domain.name}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h5 className="font-medium text-foreground mb-2">Alignment Levels</h5>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span>Center: Fully aligned with values</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-secondary rounded-full"></div>
                  <span>Middle: Somewhat aligned</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-muted border border-border rounded-full"></div>
                  <span>Outer: Needs attention</span>
                </div>
              </div>
            </div>

            {markers.length > 0 && (
              <div className="mt-4 p-3 bg-accent/5 rounded-lg border border-accent/10">
                <h5 className="font-medium text-foreground mb-2">Your Markers ({markers.length})</h5>
                <div className="space-y-1 text-sm">
                  {markers.map((marker) => (
                    <div key={marker.id} className="flex justify-between items-center">
                      <span>{marker.domain}</span>
                      <span className="text-muted-foreground">
                        Level {marker.alignment}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-save-dartboard">
            <Save className="w-4 h-4 mr-2" />
            Save Values Assessment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
