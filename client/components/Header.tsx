import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Target, Users, Calendar, BarChart3, Info } from "lucide-react";
import { clearToken, getMe, readToken } from "@/services/auth";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const location = useLocation();

  const navigation = [
    { name: "HOME", href: "/", icon: Target },
    { name: "FIGHTERS", href: "/fighters", icon: Users },
    { name: "EVENTS", href: "/events", icon: Calendar },
    { name: "COMPARE", href: "/compare", icon: BarChart3 },
    { name: "ABOUT", href: "/about", icon: Info },
  ];

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const token = readToken();
    if (!token) {
      setUserEmail(null);
      return;
    }
    getMe(token)
      .then((u) => setUserEmail(u.email))
      .catch(() => setUserEmail(null));
  }, [location.pathname]);

  function handleSignOut() {
    clearToken();
    setUserEmail(null);
  }

  return (
    <>
      {/* UFC Red Highlight Bar */}
      <div className="h-1 bg-gradient-to-r from-ufc-red via-ufc-red-light to-ufc-red"></div>
      
      <header className="bg-ufc-black/95 backdrop-blur-sm border-b border-ufc-metallic-dark sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fa230484a7c954874b97562fb0844df5e%2Fc51b59a230f54eafbc14219455898c7f?format=webp&width=600"
                alt="Fight Tracker logo"
                className="h-12 md:h-16 w-auto object-contain drop-shadow-lg brightness-110 contrast-125"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-4 py-3 font-oswald font-bold text-sm tracking-wider transition-all duration-300 ${
                      isActive(item.href)
                        ? "bg-ufc-red text-white border-b-2 border-white"
                        : "text-ufc-metallic hover:text-white hover:bg-ufc-red/20"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-4">
              {userEmail ? (
                <>
                  <span className="text-ufc-metallic font-oswald text-sm tracking-wide">{userEmail}</span>
                  <button onClick={handleSignOut} className="text-ufc-metallic hover:text-white font-oswald font-semibold tracking-wide transition-colors">
                    SIGN OUT
                  </button>
                </>
              ) : (
                <Link to="/signin" className="text-ufc-metallic hover:text-white font-oswald font-semibold tracking-wide transition-colors">
                  SIGN IN
                </Link>
              )}
              <a href="https://streameast.app" target="_blank" rel="noopener noreferrer" className="bg-ufc-red hover:bg-ufc-red-dark text-white px-6 py-2 font-oswald font-bold tracking-wider transition-all duration-300 hover:shadow-lg hover:shadow-ufc-red/30 border border-ufc-red hover:border-white">
                WATCH LIVE
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-ufc-metallic hover:text-white hover:bg-ufc-red/20 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-ufc-metallic-dark bg-ufc-black/98">
              <nav className="py-4 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center gap-3 px-4 py-4 font-oswald font-bold text-sm tracking-wider transition-all duration-300 ${
                        isActive(item.href)
                          ? "bg-ufc-red text-white border-l-4 border-white"
                          : "text-ufc-metallic hover:text-white hover:bg-ufc-red/20"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
                <div className="px-4 pt-4 border-t border-ufc-metallic-dark space-y-3">
                  {userEmail ? (
                    <button onClick={() => { handleSignOut(); setIsMenuOpen(false); }} className="w-full text-left py-3 text-ufc-metallic hover:text-white font-oswald font-semibold tracking-wide transition-colors">
                      SIGN OUT
                    </button>
                  ) : (
                    <Link to="/signin" className="w-full block text-left py-3 text-ufc-metallic hover:text-white font-oswald font-semibold tracking-wide transition-colors" onClick={() => setIsMenuOpen(false)}>
                      SIGN IN
                    </Link>
                  )}
                  <a href="https://streameast.app" target="_blank" rel="noopener noreferrer" className="w-full block text-center bg-ufc-red hover:bg-ufc-red-dark text-white py-3 font-oswald font-bold tracking-wider transition-all duration-300 border border-ufc-red hover:border-white">
                    WATCH LIVE
                  </a>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
