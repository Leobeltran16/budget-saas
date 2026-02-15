import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Layout() {
  const location = useLocation();
  const isBilling = location.pathname.startsWith("/billing");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      {/* Navbar siempre arriba y clickeable (oculto en /billing/* para evitar overlays y conflictos) */}
      {!isBilling && (
        <div className="sticky top-0 z-[9999] pointer-events-auto">
          <Navbar />
        </div>
      )}

      {/* Contenido */}
      <main className="relative z-0 pointer-events-auto">
        <Outlet />
      </main>



              
        <footer className="mt-16 border-t border-slate-200 py-6 text-center text-sm text-slate-500">
          <div className="flex justify-center gap-6">
            <a href="/terms" className="hover:text-slate-800">Términos</a>
            <a href="/privacy" className="hover:text-slate-800">Privacidad</a>
            <a href="/contact" className="hover:text-slate-800">Contacto</a>
          </div>
        </footer>

    </div>
  );
  
}
