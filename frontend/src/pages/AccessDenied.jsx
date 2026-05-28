import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Home, ShieldX } from "lucide-react";
import SystemLayout from "../layouts/SystemLayout";

export default function AccessDenied() {
  const [auth, setAuth] = useState({ loading: true, logged: false });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch("http://localhost/api/get_user.php", {
          credentials: "include",
        });
        const data = await response.json();

        setAuth({ loading: false, logged: Boolean(data.success) });
      } catch {
        setAuth({ loading: false, logged: false });
      }
    };

    checkUser();
  }, []);

  if (auth.loading) {
    return <div className="min-h-screen bg-pozadi" />;
  }

  if (!auth.logged) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SystemLayout className="p-8 xl:p-10 flex items-center justify-center">
      <section className="w-full max-w-3xl bg-white rounded-3xl shadow-md p-8 xl:p-10 text-center">
        <div className="mx-auto w-20 h-20 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mb-6">
          <ShieldX size={42} />
        </div>

        <p className="text-gray-500 font-black uppercase mb-3">Přístup odepřen</p>
        <h1 className="text-4xl xl:text-5xl font-black text-black mb-4">
          Na tuto stránku nemáte přístup
        </h1>
        <p className="text-lg font-semibold text-gray-600 max-w-2xl mx-auto">
          Tato část systému je dostupná jen pro administrátora. Pokud sem potřebujete,
          obraťte se na správce systému.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/system_main"
            className="bg-primary text-white rounded-2xl px-6 py-4 font-black flex items-center justify-center gap-3 hover:scale-105 transition"
          >
            <Home size={22} />
            Zpět na dashboard
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="bg-pozadi text-primary rounded-2xl px-6 py-4 font-black flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition"
          >
            <ArrowLeft size={22} />
            Vrátit se zpět
          </button>
        </div>
      </section>
    </SystemLayout>
  );
}
