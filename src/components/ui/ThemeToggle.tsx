import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from './Button';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial state on mount
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cn-visualizer-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cn-visualizer-theme', 'light');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={toggleTheme}
        className="rounded-full shadow-md w-12 h-12 bg-surface border border-border text-text hover:bg-surfaceHover hover:text-accent transition-colors"
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </Button>
    </div>
  );
}
