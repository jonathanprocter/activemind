import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Save } from "lucide-react";

interface GroundingItem {
  id: string;
  text: string;
  completed: boolean;
}

interface GroundingExerciseProps {
  onSave: (sectionId: string, responses: any, completed?: boolean) => void;
  existingResponses?: any;
}

export default function GroundingExercise({ onSave, existingResponses }: GroundingExerciseProps) {
  const [seeItems, setSeeItems] = useState<GroundingItem[]>([
    { id: '1', text: '', completed: false },
    { id: '2', text: '', completed: false },
    { id: '3', text: '', completed: false },
    { id: '4', text: '', completed: false },
    { id: '5', text: '', completed: false },
  ]);

  const [touchItems, setTouchItems] = useState<GroundingItem[]>([
    { id: '1', text: '', completed: false },
    { id: '2', text: '', completed: false },
    { id: '3', text: '', completed: false },
    { id: '4', text: '', completed: false },
  ]);

  const [hearItems, setHearItems] = useState<GroundingItem[]>([
    { id: '1', text: '', completed: false },
    { id: '2', text: '', completed: false },
    { id: '3', text: '', completed: false },
  ]);

  const [smellItems, setSmellItems] = useState<GroundingItem[]>([
    { id: '1', text: '', completed: false },
    { id: '2', text: '', completed: false },
  ]);

  const [tasteItems, setTasteItems] = useState<GroundingItem[]>([
    { id: '1', text: '', completed: false },
  ]);

  // Load existing responses
  useEffect(() => {
    if (existingResponses) {
      if (existingResponses.seeItems) setSeeItems(existingResponses.seeItems);
      if (existingResponses.touchItems) setTouchItems(existingResponses.touchItems);
      if (existingResponses.hearItems) setHearItems(existingResponses.hearItems);
      if (existingResponses.smellItems) setSmellItems(existingResponses.smellItems);
      if (existingResponses.tasteItems) setTasteItems(existingResponses.tasteItems);
    }
  }, [existingResponses]);

  const updateItem = (
    items: GroundingItem[], 
    setItems: React.Dispatch<React.SetStateAction<GroundingItem[]>>, 
    id: string, 
    updates: Partial<GroundingItem>
  ) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleSave = () => {
    const responses = {
      seeItems,
      touchItems,
      hearItems,
      smellItems,
      tasteItems,
    };

    const allItems = [...seeItems, ...touchItems, ...hearItems, ...smellItems, ...tasteItems];
    const completedItems = allItems.filter(item => item.completed && item.text.trim());
    const isCompleted = completedItems.length >= 10; // At least 10 items completed

    onSave('grounding-5-4-3-2-1', responses, isCompleted);
  };

  const renderSenseSection = (
    title: string,
    count: number,
    color: string,
    items: GroundingItem[],
    setItems: React.Dispatch<React.SetStateAction<GroundingItem[]>>,
    placeholder: string
  ) => (
    <div className="space-y-3">
      <h4 className="font-medium text-foreground flex items-center">
        <span className={`w-6 h-6 ${color} text-white rounded-full flex items-center justify-center text-sm mr-3 font-bold`}>
          {count}
        </span>
        {title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <Checkbox
              checked={item.completed}
              onCheckedChange={(checked) => 
                updateItem(items, setItems, item.id, { completed: !!checked })
              }
              className={`rounded border-border ${color.replace('bg-', 'text-')} focus:ring-primary`}
              data-testid={`checkbox-${title.toLowerCase()}-${item.id}`}
            />
            <Input
              value={item.text}
              onChange={(e) => 
                updateItem(items, setItems, item.id, { text: e.target.value })
              }
              placeholder={placeholder}
              className="flex-1 border-0 bg-transparent focus:ring-0 text-sm"
              data-testid={`input-${title.toLowerCase()}-${item.id}`}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="bg-card shadow-lg border border-border hover:shadow-xl transition-all">
      <CardHeader>
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-xl">Grounding Exercise: 5-4-3-2-1</CardTitle>
        </div>
        <p className="text-muted-foreground">
          Use your senses to ground yourself in the present moment. Check off each item as you notice it:
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {renderSenseSection(
          "Five things you can see",
          5,
          "bg-primary",
          seeItems,
          setSeeItems,
          "Describe what you see..."
        )}

        {renderSenseSection(
          "Four things you can touch",
          4,
          "bg-accent",
          touchItems,
          setTouchItems,
          "Describe the texture..."
        )}

        {renderSenseSection(
          "Three things you can hear",
          3,
          "bg-secondary",
          hearItems,
          setHearItems,
          "Describe the sound..."
        )}

        {renderSenseSection(
          "Two things you can smell",
          2,
          "bg-muted",
          smellItems,
          setSmellItems,
          "Describe the smell..."
        )}

        {renderSenseSection(
          "One thing you can taste",
          1,
          "bg-primary/70",
          tasteItems,
          setTasteItems,
          "Describe the taste..."
        )}

        <div className="pt-6 border-t border-border">
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-save-grounding">
            <Save className="w-4 h-4 mr-2" />
            Save Progress
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
