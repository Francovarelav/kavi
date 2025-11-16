import { useState } from "react";
import { Button } from "@/components/ui/button";
import Spline from "@splinetool/react-spline";
import { IconSparkles } from "@tabler/icons-react";
import KaviExperience from "./KaviExperience";

export default function PublicUser() {
  const [started, setStarted] = useState(false);

  if (started) {
    return <KaviExperience onExit={() => setStarted(false)} />;
  }

  return (
    <main className="min-h-screen bg-black flex flex-col overflow-hidden">
      {/* Spline 3D en la parte superior */}
      <div className="h-[60vh] w-full relative pointer-events-none">
        <Spline scene="https://prod.spline.design/DCeeOA3pXfZ3ZrA6/scene.splinecode" />
      </div>

      {/* Content abajo con fondo negro */}
      <div className="flex-1 bg-black flex flex-col items-center justify-center p-6 pb-16 relative z-10">
        <div className="w-full max-w-3xl text-center space-y-8">
          {/* Title */}
          <div className="space-y-5 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
              Hola, soy <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">Kavi</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Tu asistente personal dentro de la tienda. <br /> ¿Estás listo para encontrar tu próximo auto?
            </p>
          </div>

          {/* CTA Button */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-12 py-7 text-xl rounded-full shadow-2xl shadow-blue-500/50 transition-all hover:scale-105 border border-blue-400/30"
              onClick={() => setStarted(true)}
            >
              <IconSparkles className="w-6 h-6 mr-3" />
              Comenzar experiencia
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
