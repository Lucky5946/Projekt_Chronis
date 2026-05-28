import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  MessageSquareQuote,
  Send,
  ShieldCheck,
  Star,
  XCircle,
} from "lucide-react";
import SystemLayout from "../layouts/SystemLayout";
import PageHeader from "../components/system/PageHeader";

const API_URL = "http://localhost/api/reviews.php";

const statusConfig = {
  cekajici: {
    label: "Čeká na schválení",
    className: "bg-amber-100 text-amber-700",
    icon: Clock3,
  },
  schvaleno: {
    label: "Schváleno",
    className: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
  },
  zamitnuto: {
    label: "Zamítnuto",
    className: "bg-rose-100 text-rose-700",
    icon: XCircle,
  },
};

function RatingStars({ value, onChange, readonly = false }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;

        if (readonly) {
          return (
            <Star
              key={star}
              size={20}
              className={filled ? "fill-amber-400 text-amber-400" : "text-gray-300"}
            />
          );
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rounded-lg p-1 transition hover:bg-amber-50"
            aria-label={`${star} z 5`}
          >
            <Star
              size={30}
              className={filled ? "fill-amber-400 text-amber-400" : "text-gray-300"}
            />
          </button>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.cekajici;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-black ${config.className}`}>
      <Icon size={16} />
      {config.label}
    </span>
  );
}

export default function Recenze() {
  const [reviews, setReviews] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState({
    hodnoceni: 5,
    text: "",
  });

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}?mode=system`, {
        credentials: "include",
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Recenze se nepodařilo načíst.");
      }

      setReviews(data.reviews || []);
      setIsAdmin(Boolean(data.isAdmin));
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const stats = useMemo(() => {
    const approved = reviews.filter((review) => review.stav === "schvaleno").length;
    const pending = reviews.filter((review) => review.stav === "cekajici").length;
    const rejected = reviews.filter((review) => review.stav === "zamitnuto").length;
    const average =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + Number(review.hodnoceni || 0), 0) / reviews.length
        : 0;

    return {
      approved,
      pending,
      rejected,
      average: average.toFixed(1),
    };
  }, [reviews]);

  const submitReview = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Recenzi se nepodařilo odeslat.");
      }

      setForm({ hodnoceni: 5, text: "" });
      setNotice({ type: "success", text: data.message });
      await loadReviews();
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (reviewId, status) => {
    setNotice(null);

    try {
      const response = await fetch(API_URL, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_recenze: reviewId, stav: status }),
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Stav recenze se nepodařilo změnit.");
      }

      setNotice({ type: "success", text: data.message });
      await loadReviews();
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    }
  };

  return (
    <SystemLayout className="p-8 xl:p-10">
      <PageHeader eyebrow="Zpětná vazba" title="Recenze" />

      <section className={`grid grid-cols-1 gap-8 ${isAdmin ? "xl:grid-cols-[1fr_360px]" : ""}`}>
        <div className="space-y-8">
          <article className="bg-white rounded-3xl shadow-md p-7">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-7">
              <div>
                <p className="text-gray-500 font-black uppercase">Nová recenze</p>
                <h2 className="text-3xl font-black text-black mt-1">
                  Napište krátkou zpětnou vazbu
                </h2>
                <p className="font-semibold text-gray-600 mt-2 max-w-2xl">
                  Recenze se po odeslání uloží ke kontrole. Po schválení ji může Chronis
                  zobrazit na veřejné části webu.
                </p>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-system_modra_svtetlejsi text-white flex items-center justify-center">
                <MessageSquareQuote size={34} />
              </div>
            </div>

            {notice && (
              <div
                className={`mb-5 rounded-2xl px-5 py-4 font-bold ${
                  notice.type === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {notice.text}
              </div>
            )}

            <form onSubmit={submitReview} className="space-y-5">
              <div>
                <label className="block text-sm font-black text-gray-500 uppercase mb-3">
                  Hodnocení
                </label>
                <RatingStars
                  value={form.hodnoceni}
                  onChange={(hodnoceni) => setForm((prev) => ({ ...prev, hodnoceni }))}
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-500 uppercase mb-3">
                  Text recenze
                </label>
                <textarea
                  value={form.text}
                  onChange={(event) => setForm((prev) => ({ ...prev, text: event.target.value }))}
                  rows={6}
                  className="w-full rounded-2xl border border-gray-200 bg-pozadi px-5 py-4 font-semibold text-black outline-none transition focus:border-primary focus:bg-white"
                  placeholder="Napište, co vám v systému pomáhá nebo co by se mohlo zlepšit."
                />
                <div className="mt-2 flex justify-between text-sm font-bold text-gray-500">
                  <span>Minimum 20 znaků</span>
                  <span>{form.text.length} znaků</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-system_modra_svtetlejsi px-6 py-3 font-black text-white shadow-md transition hover:scale-[1.01] disabled:opacity-60"
              >
                <Send size={20} />
                {saving ? "Odesílám..." : "Odeslat recenzi"}
              </button>
            </form>
          </article>

          <article className="bg-white rounded-3xl shadow-md p-7">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <p className="text-gray-500 font-black uppercase">
                  {isAdmin ? "Všechny recenze" : "Moje odeslané recenze"}
                </p>
                <h2 className="text-3xl font-black text-black mt-1">Přehled recenzí</h2>
              </div>
              {isAdmin && (
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 font-black text-primary">
                  <ShieldCheck size={18} />
                  Moderace
                </div>
              )}
            </div>

            {loading ? (
              <div className="rounded-2xl bg-pozadi p-6 font-bold text-gray-600">
                Načítám recenze...
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-2xl bg-pozadi p-6 font-bold text-gray-600">
                Zatím tu není žádná recenze.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <article key={review.id_recenze} className="rounded-2xl border border-gray-100 bg-pozadi p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="text-xl font-black text-black">{review.name}</h3>
                          <StatusBadge status={review.stav} />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-gray-500 mb-4">
                          <span>{review.pozice || "Role neuvedena"}</span>
                          <span>{review.nazev || "Firma neuvedena"}</span>
                          <span>{new Date(review.vytvoreno).toLocaleDateString("cs-CZ")}</span>
                        </div>
                        <RatingStars value={Number(review.hodnoceni)} readonly />
                      </div>

                      {isAdmin && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => updateStatus(review.id_recenze, "schvaleno")}
                            className="rounded-xl bg-emerald-600 px-4 py-2 font-black text-white"
                          >
                            Schválit
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(review.id_recenze, "zamitnuto")}
                            className="rounded-xl bg-rose-600 px-4 py-2 font-black text-white"
                          >
                            Zamítnout
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="mt-4 font-semibold text-gray-700 leading-relaxed">
                      {review.text}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>

        {isAdmin && (
          <aside className="space-y-5">
            <article className="bg-white rounded-3xl shadow-md p-7">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-5">
                <Star size={30} />
              </div>
              <h2 className="text-3xl font-black text-black mb-2">{stats.average}</h2>
              <p className="font-black text-gray-500 uppercase">Průměrné hodnocení</p>
            </article>

            <article className="bg-white rounded-3xl shadow-md p-7">
              <h3 className="text-2xl font-black text-black mb-5">Stavy</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between font-black">
                  <span className="text-gray-600">Schválené</span>
                  <span className="text-emerald-600">{stats.approved}</span>
                </div>
                <div className="flex items-center justify-between font-black">
                  <span className="text-gray-600">Čekající</span>
                  <span className="text-amber-600">{stats.pending}</span>
                </div>
                <div className="flex items-center justify-between font-black">
                  <span className="text-gray-600">Zamítnuté</span>
                  <span className="text-rose-600">{stats.rejected}</span>
                </div>
              </div>
            </article>

            <article className="bg-white rounded-3xl shadow-md p-7">
              <h3 className="text-2xl font-black text-black mb-3">Jak to funguje</h3>
              <p className="font-semibold text-gray-600">
                Zaměstnanec nebo vedoucí odešle recenzi. Administrátor ji následně
                schválí nebo zamítne. Na hlavní stránce se zobrazují pouze schválené
                recenze.
              </p>
            </article>
          </aside>
        )}
      </section>
    </SystemLayout>
  );
}
