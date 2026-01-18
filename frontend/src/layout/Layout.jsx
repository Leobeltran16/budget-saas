import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Mobile topbar */}
      <div className="lg:hidden sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <Navbar variant="topbar" />
      </div>

      <div className="lg:grid lg:grid-cols-[280px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block h-screen sticky top-0 border-r border-white/10 bg-slate-950/60 backdrop-blur">
          <div className="p-4">
            <Navbar variant="sidebar" />
          </div>
        </aside>

        {/* Main */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
