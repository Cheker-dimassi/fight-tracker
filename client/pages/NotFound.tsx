import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, Home, Target } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

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
          <AlertTriangle className="w-16 h-16 text-white" />
        </div>
        
        <h1 className="font-anton text-8xl lg:text-9xl text-white mb-4 tracking-wider drop-shadow-lg">
          404
        </h1>
        <h2 className="font-anton text-4xl lg:text-5xl text-ufc-red mb-6 tracking-wider">
          ROUND NOT FOUND
        </h2>
        
        <p className="font-oswald text-xl lg:text-2xl text-ufc-metallic-light mb-12 leading-relaxed tracking-wide max-w-3xl mx-auto">
          LOOKS LIKE THIS PAGE GOT KNOCKED OUT! THE CONTENT YOU'RE LOOKING FOR DOESN'T EXIST OR HAS BEEN MOVED TO A DIFFERENT CORNER.
        </p>
        
        <div className="fight-card p-8 mb-12 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="w-6 h-6 text-ufc-red" />
            <h3 className="font-oswald text-2xl font-bold text-white tracking-wider">WHAT HAPPENED?</h3>
          </div>
          <p className="text-ufc-metallic font-oswald tracking-wide leading-relaxed mb-4">
            The page at <code className="bg-ufc-dark-gray text-ufc-red px-3 py-1 rounded font-bold">{location.pathname}</code> couldn't be found.
          </p>
          <p className="text-ufc-metallic font-oswald tracking-wide leading-relaxed">
            It might have been removed, renamed, or you may have mistyped the URL.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-3 bg-transparent border-2 border-ufc-metallic text-ufc-metallic hover:border-white hover:text-white px-8 py-4 font-oswald font-bold tracking-widest transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            GO BACK
          </button>
          <Link 
            to="/" 
            className="inline-flex items-center gap-3 bg-ufc-red hover:bg-ufc-red-dark text-white px-8 py-4 font-oswald font-bold tracking-widest transition-all duration-300 hover:shadow-xl hover:shadow-ufc-red/30 border border-ufc-red hover:border-white"
          >
            <Home className="w-5 h-5" />
            RETURN HOME
          </Link>
        </div>
        
        {/* Additional help */}
        <div className="mt-16 text-center">
          <p className="text-ufc-metallic font-oswald text-sm tracking-wider">
            NEED HELP? CHECK OUT OUR MAIN SECTIONS:
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {[
              { name: "FIGHTERS", href: "/fighters" },
              { name: "EVENTS", href: "/events" },
              { name: "COMPARE", href: "/compare" },
            ].map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-ufc-red hover:text-white font-oswald font-bold tracking-wider transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
