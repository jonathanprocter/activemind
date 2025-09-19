
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProgressBar from "./ProgressBar";
import { 
  Home, 
  ClipboardCheck, 
  HandHeart, 
  Brain, 
  Pill, 
  UserCircle, 
  Compass, 
  Mountain, 
  Puzzle, 
  GraduationCap,
  CheckCircle,
  Clock,
  Lock,
  Phone,
  Menu,
  X
} from "lucide-react";
import type { Chapter } from "@shared/schema";

interface ChapterWithProgress extends Chapter {
  progress?: any[];
  completionRate: number;
}

interface SidebarProps {
  chapters: ChapterWithProgress[];
  currentChapterId?: number;
}

// Create a context for mobile sidebar state if needed globally
interface SidebarState {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const chapterIcons = {
  1: HandHeart,
  2: Brain, 
  3: Pill,
  4: UserCircle,
  5: Compass,
  6: Mountain,
  7: Puzzle,
};

export default function Sidebar({ chapters, currentChapterId }: SidebarProps) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const completedChapters = chapters.filter(c => c.completionRate === 100).length;
  const overallProgress = chapters.length > 0 ? Math.round((completedChapters / chapters.length) * 100) : 0;

  const getStatusIcon = (chapter: ChapterWithProgress) => {
    if (chapter.isLocked) return <Lock className="w-4 h-4" />;
    if (chapter.completionRate === 100) return <CheckCircle className="w-4 h-4 text-primary" />;
    if (chapter.completionRate > 0) return <Clock className="w-4 h-4 text-accent" />;
    return null;
  };

  const isActive = (path: string) => location === path;

  const handleMobileNavClick = () => {
    // Auto-close sidebar on mobile when navigation occurs
    setIsMobileOpen(false);
  };

  // Auto-close sidebar on any route change for robustness
  useEffect(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  }, [location]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-card border shadow-md"
        data-testid="button-mobile-menu"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Mobile/Tablet Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-card border-r border-border shadow-xl z-40 transform transition-transform duration-300 ease-in-out md:static md:max-w-none md:shadow-none md:transform-none overflow-y-auto ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
      <div className="p-6">
        {/* Mobile Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 md:hidden"
          data-testid="button-close-mobile-menu"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </Button>
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">Your Journey</h2>
          <ProgressBar progress={overallProgress} className="mb-2" />
          <p className="text-sm text-muted-foreground">
            Chapter {chapters.findIndex(c => c.id === currentChapterId) + 1 || 1} of {chapters.length} - Keep going!
          </p>
        </div>

        <nav className="space-y-1">
          <Link href="/">
            <div 
              className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                isActive('/') 
                  ? 'bg-muted text-foreground font-medium' 
                  : 'hover:bg-muted'
              }`} 
              data-testid="link-home"
              onClick={handleMobileNavClick}
            >
              <div className="flex items-center space-x-3">
                <Home className="w-5 h-5" />
                <span>Introduction</span>
              </div>
              <CheckCircle className="w-4 h-4 text-primary" />
            </div>
          </Link>

          <Link href="/assessment">
            <div 
              className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                isActive('/assessment') 
                  ? 'bg-muted text-foreground font-medium' 
                  : 'hover:bg-muted'
              }`} 
              data-testid="link-assessment"
              onClick={handleMobileNavClick}
            >
              <div className="flex items-center space-x-3">
                <ClipboardCheck className="w-5 h-5" />
                <span>Pre-Assessment</span>
              </div>
              <CheckCircle className="w-4 h-4 text-primary" />
            </div>
          </Link>

          {chapters.map((chapter) => {
            const IconComponent = chapterIcons[chapter.id as keyof typeof chapterIcons] || Home;
            const isCurrentChapter = chapter.id === currentChapterId;
            const chapterPath = `/chapter/${chapter.id}`;

            return (
              <Link key={chapter.id} href={chapterPath}>
                <div 
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                    isCurrentChapter 
                      ? 'bg-primary/10 text-primary font-medium border border-primary/20' 
                      : chapter.isLocked 
                      ? 'text-muted-foreground cursor-not-allowed'
                      : 'hover:bg-muted'
                  }`} 
                  data-testid={`link-chapter-${chapter.id}`}
                  onClick={chapter.isLocked ? undefined : handleMobileNavClick}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className="w-5 h-5" />
                    <span>{chapter.orderIndex}. {chapter.title}</span>
                  </div>
                  {getStatusIcon(chapter)}
                </div>
              </Link>
            );
          })}

          <Link href="/conclusion">
            <div className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer text-muted-foreground ${
              isActive('/conclusion') 
                ? 'bg-muted text-foreground font-medium' 
                : 'hover:bg-muted cursor-not-allowed'
            }`} data-testid="link-conclusion">
              <div className="flex items-center space-x-3">
                <GraduationCap className="w-5 h-5" />
                <span>Conclusion</span>
              </div>
              <Lock className="w-4 h-4" />
            </div>
          </Link>
        </nav>

        <div className="mt-8 p-4 bg-accent/10 rounded-lg border border-accent/20">
          <h3 className="font-medium text-accent mb-2">Need Support?</h3>
          <p className="text-sm text-muted-foreground mb-3">Crisis helpline resources available 24/7</p>
          <Button variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10">
            <Phone className="w-4 h-4 mr-1" />
            View Resources
          </Button>
        </div>
      </div>
    </aside>
    </>
  );
}
