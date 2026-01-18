import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function Profile() {
  const { user } = useContext(AuthContext);

  const nombre = user?.nombre || user?.name || "Usuario";
  const email = user?.email || "—";
  const role = user?.role || "user";
  const createdAt = user?.createdAt ? new Date(user.createdAt).toLocaleString() : "—";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Perfil</h1>
        <p className="mt-1 text-sm text-slate-200/70">
          Bienvenido {nombre} 👋
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Datos */}
        <div className="rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Tu cuenta</h3>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-slate-600">Nombre</span>
              <span className="font-semibold text-slate-900">{nombre}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-slate-600">Email</span>
              <span className="font-semibold text-slate-900">{email}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-slate-600">Plan</span>
              <span className="font-semibold text-slate-900">Free</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-slate-600">Rol</span>
              <span className="font-semibold text-slate-900">{role}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-slate-600">Creado</span>
              <span className="font-semibold text-slate-900">{createdAt}</span>
            </div>
          </div>
        </div>

        {/* Próximas mejoras */}
        <div className="rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Próximos pasos</h3>

          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Deploy (Render + Vercel) para que quede online.</li>
            <li>Demo user para que cualquiera pueda probar.</li>
            <li>Planes Free / Pro (fase 2).</li>
          </ul>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Tip: los botones de “probar endpoints” son útiles en desarrollo,
            pero en un SaaS real se eliminan para que se vea profesional.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
