import { ArrowLeft, Construction, Target } from "lucide-react";
import { Link } from "react-router-dom";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen bg-ufc-black flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(229,9,20,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(229,9,20,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        ></div>
      </div>
      
      <div className="relative text-center max-w-4xl mx-auto px-4">
        <div className="w-32 h-32 bg-gradient-to-br from-ufc-red to-ufc-red-dark rounded-full mx-auto mb-8 flex items-center justify-center border-4 border-ufc-metallic shadow-xl shadow-ufc-red/20">
          <Construction className="w-16 h-16 text-white" />
        </div>
        
        <h1 className="font-anton text-5xl lg:text-7xl text-white mb-6 tracking-wider">
          {title.toUpperCase()}
        </h1>
        
        <p className="font-oswald text-xl lg:text-2xl text-ufc-metallic-light mb-12 leading-relaxed tracking-wide max-w-3xl mx-auto">
          {description}
        </p>
        
        <div className="fight-card p-8 mb-12 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="w-6 h-6 text-ufc-red" />
            <h3 className="font-oswald text-2xl font-bold text-white tracking-wider">UNDER CONSTRUCTION</h3>
          </div>
          <p className="text-ufc-metallic font-oswald tracking-wide leading-relaxed">
            This section is currently being built to deliver the ultimate fight tracking experience. 
            Check back soon for comprehensive fighter profiles, detailed analytics, and real-time fight data.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-3 bg-ufc-red hover:bg-ufc-red-dark text-white px-8 py-4 font-oswald font-bold tracking-widest transition-all duration-300 hover:shadow-xl hover:shadow-ufc-red/30 border border-ufc-red hover:border-white"
          >
            <ArrowLeft className="w-5 h-5" />
            BACK TO HOME
          </Link>
          <button className="bg-transparent border-2 border-ufc-metallic text-ufc-metallic hover:border-white hover:text-white px-8 py-4 font-oswald font-bold tracking-widest transition-all duration-300">
            STAY UPDATED
          </button>
        </div>
        
        {/* Additional UFC-style elements */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4">
            <div className="text-ufc-red font-anton text-3xl mb-2">24/7</div>
            <div className="text-ufc-metallic font-oswald tracking-wide">FIGHT COVERAGE</div>
          </div>
          <div className="p-4">
            <div className="text-ufc-red font-anton text-3xl mb-2">LIVE</div>
            <div className="text-ufc-metallic font-oswald tracking-wide">REAL-TIME STATS</div>
          </div>
          <div className="p-4">
            <div className="text-ufc-red font-anton text-3xl mb-2">PRO</div>
            <div className="text-ufc-metallic font-oswald tracking-wide">FIGHTER ANALYSIS</div>
          </div>
        </div>
      </div>
    </div>
  );
}
