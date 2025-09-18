import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Download, User, Clock, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleExport = () => {
    // TODO: Implement PDF export
    console.log("Exporting progress...");
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <button 
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">ACT Workbook</h1>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span data-testid="text-auto-saved">Auto-saved 2 min ago</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-primary rounded-full" data-testid="progress-overall"></div>
              </div>
              <span className="text-sm text-muted-foreground" data-testid="text-progress">33% Complete</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              data-testid="button-export-nav"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progress</span>
              <Badge variant="secondary">33%</Badge>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleExport} className="flex-1">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex-1">
                <User className="w-4 h-4 mr-1" />
                Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
