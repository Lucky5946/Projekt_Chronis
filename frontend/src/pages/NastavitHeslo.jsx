import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, KeyRound, Loader2, LockKeyhole, AlertCircle } from "lucide-react";

export default function NastavitHeslo() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({ heslo: "", hesloZnovu: "" });

  const passwordOk = useMemo(() => form.heslo.length >= 8, [form.heslo]);
  const passwordsMatch = form.heslo !== "" && form.heslo === form.hesloZnovu;

  useEffect(() => {
    const verifyToken = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost/api/overit_token_hesla.php?token=${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Odkaz se nepodařilo ověřit.");
        }

        setUser(data.user);
      } catch (error) {
        setMessage({ type: "error", text: error.message || "Odkaz není platný." });
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const submitPassword = async (event) => {
    event.preventDefault();

    if (!passwordOk || !passwordsMatch) {
      setMessage({ type: "error", text: "Hesla se musí shodovat a mít alespoň 8 znaků." });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      const response = await fetch("http://localhost/api/nastavit_heslo.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, heslo: form.heslo }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Heslo se nepodařilo nastavit.");
      }

      setMessage({ type: "success", text: data.message || "Heslo bylo nastaveno." });
      window.setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Heslo se nepodařilo nastavit." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-pozadi flex items-center justify-center p-6">
      <section className="w-full max-w-xl bg-white rounded-3xl shadow-md p-8">
        <div className="w-16 h-16 rounded-3xl bg-primary text-white flex items-center justify-center mb-6">
          <LockKeyhole size={34} />
        </div>

        <p className="text-gray-500 font-black uppercase mb-2">Chronis</p>
        <h1 className="text-4xl font-black text-black mb-3">Nastavení hesla</h1>
        <p className="font-semibold text-gray-600 mb-8">
          {user ? `Účet: ${user.name} (${user.email})` : "Ověřuji platnost odkazu."}
        </p>

        {message && (
          <div
            className={`mb-6 rounded-2xl px-5 py-4 font-bold flex gap-3 ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.type === "success" ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-pozadi p-8 flex items-center gap-4">
            <Loader2 className="animate-spin text-primary" size={30} />
            <p className="text-xl font-black text-black">Ověřuji odkaz...</p>
          </div>
        ) : user ? (
          <form onSubmit={submitPassword} className="space-y-5">
            <label className="block">
              <span className="block font-black text-gray-600 mb-2">Nové heslo</span>
              <input
                type="password"
                value={form.heslo}
                onChange={(event) => setForm((prev) => ({ ...prev, heslo: event.target.value }))}
                className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                autoComplete="new-password"
              />
            </label>

            <label className="block">
              <span className="block font-black text-gray-600 mb-2">Heslo znovu</span>
              <input
                type="password"
                value={form.hesloZnovu}
                onChange={(event) => setForm((prev) => ({ ...prev, hesloZnovu: event.target.value }))}
                className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                autoComplete="new-password"
              />
            </label>

            <div className="rounded-2xl bg-pozadi p-4 font-semibold text-gray-600">
              Heslo musí mít alespoň 8 znaků.
            </div>

            <button
              type="submit"
              disabled={saving || !passwordOk || !passwordsMatch}
              className="w-full bg-gradient-to-r from-primary to-system_modra_svtetlejsi text-white rounded-2xl px-6 py-4 font-black flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="animate-spin" size={22} /> : <KeyRound size={22} />}
              Nastavit heslo
            </button>
          </form>
        ) : (
          <Link
            to="/login"
            className="w-full bg-primary text-white rounded-2xl px-6 py-4 font-black flex items-center justify-center"
          >
            Zpět na přihlášení
          </Link>
        )}
      </section>
    </main>
  );
}
