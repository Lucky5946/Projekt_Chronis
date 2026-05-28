import { Link } from "react-router-dom";
import { Home, LogIn, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pozadi via-pozadi to-white flex items-center justify-center p-8">
      <section className="w-full max-w-3xl bg-white rounded-3xl shadow-md p-8 xl:p-10 text-center">
        <div className="mx-auto w-20 h-20 rounded-3xl bg-pozadi text-primary flex items-center justify-center mb-6">
          <SearchX size={42} />
        </div>

        <p className="text-gray-500 font-black uppercase mb-3">Chyba 404</p>
        <h1 className="text-4xl xl:text-5xl font-black text-black mb-4">
          Tato stránka neexistuje
        </h1>
        <p className="text-lg font-semibold text-gray-600 max-w-2xl mx-auto">
          Adresa může být špatně napsaná, nebo stránka už není dostupná.
          Vraťte se domů nebo pokračujte do systému.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/"
            className="bg-primary text-white rounded-2xl px-6 py-4 font-black flex items-center justify-center gap-3 hover:scale-105 transition"
          >
            <Home size={22} />
            Vrátit se domů
          </Link>
          <Link
            to="/login"
            className="bg-pozadi text-primary rounded-2xl px-6 py-4 font-black flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition"
          >
            <LogIn size={22} />
            Přihlášení
          </Link>
        </div>
      </section>
    </main>
  );
}
