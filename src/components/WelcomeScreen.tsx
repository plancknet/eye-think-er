import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-2xl w-full text-center space-y-6 sm:space-y-8 animate-fade-in">
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="relative">
            <Brain className="w-20 h-20 sm:w-24 md:w-32 sm:h-24 md:h-32 text-primary animate-pulse-glow" />
            <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            MindReader
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground">
            Prepare-se para ter sua mente lida
          </p>
        </div>
        
        <div className="space-y-4 sm:space-y-6 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto">
          <p>
            Pense em uma palavra. Apenas olhe para ela na tela.
          </p>
          <p className="text-primary font-medium">
            Eu vou descobrir qual é. 🧠✨
          </p>
        </div>
        
        <Button 
          size="lg" 
          onClick={onStart}
          className="text-base sm:text-lg md:text-xl px-8 sm:px-10 md:px-12 py-6 sm:py-7 md:py-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-primary/50 transition-all hover:scale-105"
        >
          <Brain className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
          Conectar a mente
        </Button>
        
        <p className="text-xs sm:text-sm text-muted-foreground mt-6 sm:mt-8">
          * Precisaremos acessar sua câmera para rastrear seu olhar
        </p>
      </div>
    </div>
  );
};
