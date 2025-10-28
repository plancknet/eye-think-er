import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WebcamSetupProps {
  onComplete: () => void;
}

export const WebcamSetup = ({ onComplete }: WebcamSetupProps) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeWebGazer();
  }, []);

  const initializeWebGazer = async () => {
    try {
      // @ts-ignore - WebGazer library
      if (typeof window.webgazer === 'undefined') {
        // Load WebGazer dynamically
        const script = document.createElement('script');
        script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
        script.async = true;
        document.body.appendChild(script);
        
        script.onload = async () => {
          await setupWebGazer();
        };
        
        script.onerror = () => {
          setError('Erro ao carregar sistema de rastreamento');
          setIsInitializing(false);
        };
      } else {
        await setupWebGazer();
      }
    } catch (err) {
      setError('Erro ao inicializar câmera');
      setIsInitializing(false);
    }
  };

  const setupWebGazer = async () => {
    try {
      // @ts-ignore
      await window.webgazer
        .setGazeListener((data: any, _: any) => {
          // Eye tracking data will be used later
        })
        .begin();
      
      // @ts-ignore
      window.webgazer.showVideoPreview(true)
        .showPredictionPoints(true);
      
      toast.success('Câmera conectada com sucesso!');
      setIsInitializing(false);
    } catch (err) {
      setError('Não foi possível acessar a câmera');
      setIsInitializing(false);
    }
  };

  const handleContinue = () => {
    // @ts-ignore
    if (window.webgazer) {
      // @ts-ignore
      window.webgazer.showVideoPreview(false).showPredictionPoints(false);
    }
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-2xl w-full text-center space-y-6 sm:space-y-8 animate-fade-in">
        <div className="flex justify-center mb-6 sm:mb-8">
          <Camera className="w-16 h-16 sm:w-20 md:w-24 sm:h-20 md:h-24 text-primary" />
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Configurando sua mente</h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
            Posicione seu rosto na câmera e olhe para a tela
          </p>
        </div>
        
        {isInitializing && (
          <div className="flex items-center justify-center space-x-3 text-primary">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
            <span className="text-sm sm:text-base">Inicializando câmera...</span>
          </div>
        )}
        
        {error && (
          <div className="p-3 sm:p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-sm sm:text-base text-destructive">{error}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Você pode usar o modo de teste com cliques do mouse
            </p>
          </div>
        )}
        
        {!isInitializing && !error && (
          <div className="space-y-4 sm:space-y-6">
            <div className="p-4 sm:p-6 bg-primary/10 border border-primary rounded-lg">
              <p className="text-sm sm:text-base md:text-lg">
                ✅ Câmera conectada! Ajuste sua posição até ficar confortável.
              </p>
            </div>
            
            <Button 
              size="lg" 
              onClick={handleContinue}
              className="text-base sm:text-lg md:text-xl px-8 sm:px-10 md:px-12 py-6 sm:py-7 md:py-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Continuar
            </Button>
          </div>
        )}
        
        {error && (
          <Button 
            size="lg" 
            onClick={handleContinue}
            variant="outline"
            className="text-base sm:text-lg md:text-xl px-8 sm:px-10 md:px-12 py-6 sm:py-7 md:py-8"
          >
            Usar modo de teste (clique)
          </Button>
        )}
      </div>
    </div>
  );
};
