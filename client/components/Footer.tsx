import { Link } from "react-router-dom";
import { Target, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "HOME", href: "/" },
    { name: "FIGHTERS", href: "/fighters" },
    { name: "EVENTS", href: "/events" },
    { name: "COMPARE", href: "/compare" },
  ];

  const legalLinks = [
    { name: "PRIVACY POLICY", href: "/privacy" },
    { name: "TERMS OF SERVICE", href: "/terms" },
    { name: "COOKIE POLICY", href: "/cookies" },
    { name: "CONTACT US", href: "/contact" },
  ];

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "#", color: "hover:text-blue-500" },
    { name: "Twitter", icon: Twitter, href: "#", color: "hover:text-blue-400" },
    { name: "Instagram", icon: Instagram, href: "#", color: "hover:text-pink-500" },
    { name: "YouTube", icon: Youtube, href: "#", color: "hover:text-red-500" },
  ];

  return (
    <footer className="bg-ufc-dark-gray border-t border-ufc-metallic-dark">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 font-anton text-2xl tracking-wider mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-ufc-red to-ufc-red-dark rounded-lg flex items-center justify-center border-2 border-ufc-metallic">
                <Target className="w-7 h-7 text-white" />
              </div>
              <span className="text-white font-black">
                FIGHT<span className="text-ufc-red">TRACKER</span>
              </span>
            </Link>
            <p className="text-ufc-metallic font-oswald tracking-wide leading-relaxed mb-6">
              THE ULTIMATE DESTINATION FOR MMA FIGHT TRACKING. EXPERIENCE THE INTENSITY AND PRECISION OF MIXED MARTIAL ARTS DATA.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className={`w-12 h-12 bg-ufc-black border border-ufc-metallic-dark rounded-lg flex items-center justify-center transition-all duration-300 hover:border-ufc-red ${social.color}`}
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-oswald font-bold text-xl mb-6 text-white tracking-widest">
              QUICK LINKS
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-ufc-metallic hover:text-ufc-red font-oswald tracking-wide transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-oswald font-bold text-xl mb-6 text-white tracking-widest">
              SUPPORT
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-ufc-metallic hover:text-ufc-red font-oswald tracking-wide transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-oswald font-bold text-xl mb-6 text-white tracking-widest">
              CONTACT
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-ufc-metallic">
                <Phone className="w-5 h-5 text-ufc-red flex-shrink-0" />
                <span className="font-oswald tracking-wide">+1 (555) 123-FIGHT</span>
              </div>
              <div className="flex items-center gap-3 text-ufc-metallic">
                <Mail className="w-5 h-5 text-ufc-red flex-shrink-0" />
                <span className="font-oswald tracking-wide">info@fighttracker.com</span>
              </div>
              <div className="flex items-start gap-3 text-ufc-metallic">
                <MapPin className="w-5 h-5 text-ufc-red flex-shrink-0 mt-0.5" />
                <span className="font-oswald tracking-wide">
                  123 Fight Street<br />
                  Las Vegas, NV 89101
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="fight-card p-6 lg:p-8 mb-8">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-anton text-2xl lg:text-3xl mb-3 text-white tracking-wider">
              STAY IN THE <span className="text-ufc-red">RING</span>
            </h3>
            <p className="text-ufc-metallic font-oswald mb-6 tracking-wide">
              GET THE LATEST FIGHT NEWS, EXCLUSIVE CONTENT, AND EARLY ACCESS TO EVENTS.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="ENTER YOUR EMAIL"
                className="flex-1 px-4 py-3 bg-ufc-black text-white placeholder-ufc-metallic border border-ufc-metallic-dark focus:outline-none focus:border-ufc-red font-oswald tracking-wide"
              />
              <button className="bg-ufc-red hover:bg-ufc-red-dark text-white px-6 py-3 font-oswald font-bold tracking-widest transition-all duration-300 border border-ufc-red hover:border-white">
                SUBSCRIBE
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-ufc-metallic-dark pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-ufc-metallic font-oswald text-sm tracking-wide">
              © {currentYear} FIGHT TRACKER. ALL RIGHTS RESERVED.
            </p>
            <div className="flex items-center gap-6 text-sm text-ufc-metallic">
              <span className="font-oswald tracking-wider">🥊 WORLD'S #1 MMA PLATFORM</span>
              <span className="font-oswald tracking-wider">⚡ LIVE TRACKING AVAILABLE</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
