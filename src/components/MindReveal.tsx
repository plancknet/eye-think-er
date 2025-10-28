import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw } from "lucide-react";

interface MindRevealProps {
  word: string;
  onRestart: () => void;
}

export const MindReveal = ({ word, onRestart }: MindRevealProps) => {
  const [isRevealing, setIsRevealing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealing(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-4xl w-full text-center space-y-8 sm:space-y-12">
        {isRevealing ? (
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            <div className="text-6xl sm:text-7xl md:text-8xl animate-pulse">🧠</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary animate-pulse">
              Lendo sua mente...
            </h2>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-12 animate-scale-in">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-center">
                <Sparkles className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 text-primary animate-pulse" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                Sua mente foi lida com sucesso!
              </h2>
              
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground">
                A palavra em que você pensou é:
              </p>
            </div>
            
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
              <div className="relative px-8 py-6 sm:px-12 sm:py-10 md:px-16 md:py-12 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-500 animate-pulse-glow">
                <p className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-2xl">
                  {word}
                </p>
              </div>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
                ✨ Incrível, não é? ✨
              </p>
              
              <Button 
                size="lg"
                onClick={onRestart}
                className="text-base sm:text-lg md:text-xl px-8 sm:px-10 md:px-12 py-6 sm:py-7 md:py-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-primary/50"
              >
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
