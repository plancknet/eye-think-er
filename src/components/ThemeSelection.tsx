import { Button } from "@/components/ui/button";
import { Globe, Apple, Squirrel } from "lucide-react";
import { Theme } from "@/types/mindreader";

interface ThemeSelectionProps {
  onSelect: (theme: Theme) => void;
}

export const ThemeSelection = ({ onSelect }: ThemeSelectionProps) => {
  const themes: { id: Theme; icon: any; label: string; color: string }[] = [
    { id: 'countries', icon: Globe, label: 'Países', color: 'from-blue-500 to-cyan-500' },
    { id: 'fruits', icon: Apple, label: 'Frutas', color: 'from-green-500 to-emerald-500' },
    { id: 'animals', icon: Squirrel, label: 'Animais', color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-4xl w-full text-center space-y-8 sm:space-y-12 animate-fade-in">
        <div className="space-y-2 sm:space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            O que está pensando?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
            Escolha um tema para começar
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {themes.map((theme) => {
            const Icon = theme.icon;
            return (
              <button
                key={theme.id}
                onClick={() => onSelect(theme.id)}
                className="group relative p-6 sm:p-8 rounded-2xl border-2 border-border hover:border-primary transition-all hover:scale-105 bg-card"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
                
                <div className="relative space-y-3 sm:space-y-4">
                  <div className="flex justify-center">
                    <div className={`p-4 sm:p-6 rounded-full bg-gradient-to-br ${theme.color}`}>
                      <Icon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold">{theme.label}</h3>
                  
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Pense em um {theme.label.toLowerCase().slice(0, -1)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        
        <p className="text-sm text-muted-foreground">
          Escolha um tema e pense em uma palavra. Não revele para ninguém! 🤫
        </p>
      </div>
    </div>
  );
};
