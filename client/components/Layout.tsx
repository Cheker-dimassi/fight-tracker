import { ReactNode, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  useEffect(() => {
    function onUnauthorized() {
      toast.error("Session expired. Please sign in again.");
      navigate("/signin");
    }
    window.addEventListener("auth:unauthorized", onUnauthorized as EventListener);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized as EventListener);
  }, [navigate]);
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
