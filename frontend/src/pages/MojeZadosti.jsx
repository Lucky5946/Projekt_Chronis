import { useEffect, useState } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  FileText,
  PlusCircle,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import SystemLayout from "../layouts/SystemLayout";
import PageHeader from "../components/system/PageHeader";

const statusStyles = {
  pending: {
    label: "Čeká",
    icon: Clock3,
    badge: "bg-yellow-100 text-yellow-700",
    card: "border-yellow-200",
  },
  approved: {
    label: "Schváleno",
    icon: CheckCircle2,
    badge: "bg-green-100 text-green-700",
    card: "border-green-200",
  },
  rejected: {
    label: "Zamítnuto",
    icon: XCircle,
    badge: "bg-red-100 text-red-700",
    card: "border-red-200",
  },
};

export default function MojeZadosti() {
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        setMessage(null);

        const response = await fetch("http://localhost/api/moje_zadosti.php", {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Žádosti se nepodařilo načíst.");
        }

        setRequests(data.requests || []);
        setSummary(data.summary || { pending: 0, approved: 0, rejected: 0 });
      } catch (error) {
        setMessage(error.message || "Chyba při načítání žádostí.");
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  return (
    <SystemLayout className="p-8 xl:p-10">
      <PageHeader eyebrow="Docházka" title="Moje žádosti" />

      {message && (
        <div className="mb-8 rounded-2xl bg-red-100 text-red-700 px-5 py-4 font-bold">
          {message}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <article className="bg-white rounded-3xl shadow-md p-6">
          <Clock3 className="text-yellow-500 mb-4" size={38} />
          <p className="text-gray-500 font-bold">Čeká na schválení</p>
          <p className="text-4xl font-black text-black">{loading ? "..." : summary.pending}</p>
        </article>
        <article className="bg-white rounded-3xl shadow-md p-6">
          <CheckCircle2 className="text-green-500 mb-4" size={38} />
          <p className="text-gray-500 font-bold">Schváleno</p>
          <p className="text-4xl font-black text-black">{loading ? "..." : summary.approved}</p>
        </article>
        <article className="bg-white rounded-3xl shadow-md p-6">
          <XCircle className="text-red-500 mb-4" size={38} />
          <p className="text-gray-500 font-bold">Zamítnuto</p>
          <p className="text-4xl font-black text-black">{loading ? "..." : summary.rejected}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
        <div className="bg-white rounded-3xl shadow-md p-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <p className="text-gray-500 font-black uppercase">Přehled</p>
              <h2 className="text-3xl font-black text-black">Historie žádostí</h2>
            </div>
            <Link
              to="/zadost_o_absenci"
              className="bg-primary text-white rounded-2xl px-5 py-3 font-black flex items-center justify-center gap-3 hover:scale-105 transition"
            >
              <PlusCircle size={22} />
              Nová žádost
            </Link>
          </div>

          <div className="space-y-4">
            {loading && (
              <div className="rounded-3xl bg-pozadi p-8 text-center">
                <p className="text-2xl font-black text-black">Načítání žádostí...</p>
              </div>
            )}

            {!loading && requests.length === 0 && (
              <div className="rounded-3xl bg-pozadi p-8 text-center">
                <p className="text-2xl font-black text-black">Zatím nemáte žádné žádosti.</p>
              </div>
            )}

            {!loading &&
              requests.map((request) => {
                const style = statusStyles[request.status] || statusStyles.pending;
                const Icon = style.icon;

                return (
                  <article
                    key={request.id}
                    className={`rounded-3xl border-2 ${style.card} p-5`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-pozadi text-primary flex items-center justify-center shrink-0">
                          <Icon size={25} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h3 className="text-2xl font-black text-black">
                              {request.type}
                            </h3>
                            <span className={`rounded-full px-3 py-1 text-sm font-black ${style.badge}`}>
                              {style.label}
                            </span>
                          </div>
                          <p className="font-bold text-gray-600">
                            {request.from} - {request.to} | {request.days} dny
                          </p>
                          {request.time && (
                            <p className="font-bold text-gray-600">Čas: {request.time}</p>
                          )}
                          {request.place && (
                            <p className="font-bold text-gray-600">Místo: {request.place}</p>
                          )}
                          <p className="font-semibold text-gray-700 mt-2">
                            {request.reason || "Bez poznámky."}
                          </p>
                          {request.approvalNote && (
                            <p className="font-semibold text-gray-500 mt-2">
                              Poznámka: {request.approvalNote}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>
        </div>

        <aside className="bg-white rounded-3xl shadow-md p-7 h-max">
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-5">
            <FileText size={30} />
          </div>
          <h2 className="text-3xl font-black text-black mb-4">Jak to funguje</h2>
          <p className="font-semibold text-gray-600 mb-5">
            Vidíte svoje žádosti, aktuální stav schválení i případnou poznámku od administrátora.
          </p>
          <div className="rounded-3xl bg-pozadi p-5">
            <div className="flex items-center gap-3 mb-2">
              <CalendarCheck2 className="text-primary" size={24} />
              <h3 className="text-xl font-black text-black">Další krok</h3>
            </div>
            <p className="font-semibold text-gray-600">
              Novou žádost založíte přes formulář a po schválení se stav automaticky propíše sem.
            </p>
          </div>
        </aside>
      </section>
    </SystemLayout>
  );
}
