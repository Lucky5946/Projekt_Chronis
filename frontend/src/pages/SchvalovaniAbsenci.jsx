import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Search,
  X,
} from "lucide-react";
import SystemLayout from "../layouts/SystemLayout";
import PageHeader from "../components/system/PageHeader";
import {
  absenceStatusStyles,
  monthNames,
  weekdayLabels,
} from "../data/absenceApprovalMock";
import { buildCalendarDays, eachDateInRange, toDateKey } from "../utils/calendar";

export default function SchvalovaniAbsenci() {
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [approvalNote, setApprovalNote] = useState("");

  const selectedRequest = requests.find((request) => request.id === selectedId);

  useEffect(() => {
    setApprovalNote(selectedRequest?.approvalNote || "");
  }, [selectedRequest?.id, selectedRequest?.approvalNote]);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      setMessage(null);

      try {
        const response = await fetch("http://localhost/api/absence_admin.php", {
          credentials: "include",
        });
        const data = await response.json();

        if (!data.success) {
          setMessage({
            type: "error",
            text: data.message || "Žádosti se nepodařilo načíst.",
          });
          setRequests([]);
          return;
        }

        setRequests(data.requests || []);
        setSelectedId(data.requests?.[0]?.id ?? null);
      } catch (error) {
        console.error(error);
        setMessage({
          type: "error",
          text: "Chyba při připojení k serveru.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth]
  );

  const requestsByDay = useMemo(() => {
    const map = new Map();

    requests.forEach((request) => {
      eachDateInRange(request.from, request.to).forEach((dateKey) => {
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey).push(request);
      });
    });

    return map;
  }, [requests]);

  const monthRequests = requests.filter((request) => {
    const requestDays = eachDateInRange(request.from, request.to);
    return requestDays.some((dateKey) => {
      const date = new Date(`${dateKey}T00:00:00`);
      return (
        date.getFullYear() === visibleMonth.getFullYear() &&
        date.getMonth() === visibleMonth.getMonth()
      );
    });
  });

  const pendingCount = requests.filter((request) => request.status === "pending").length;

  const changeMonth = (offset) => {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1)
    );
  };

  const updateStatus = async (id, status, note = "") => {
    setMessage(null);

    try {
      const response = await fetch("http://localhost/api/absence_update.php", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idAbsence: id, status, note }),
      });
      const data = await response.json();

      if (!data.success) {
        setMessage({
          type: "error",
          text: data.message || "Stav žádosti se nepodařilo změnit.",
        });
        return;
      }

      setRequests((prev) =>
        prev.map((request) =>
          request.id === id ? { ...request, status, approvalNote: note } : request
        )
      );
      setMessage({
        type: "success",
        text: status === "approved" ? "Žádost byla schválena." : "Žádost byla zamítnuta.",
      });
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Chyba při připojení k serveru.",
      });
    }
  };

  return (
    <SystemLayout className="p-8 xl:p-10">
        <PageHeader eyebrow="Docházka" title="Schvalování absencí" />

        <section className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-8 mb-8">
          <div className="bg-white rounded-3xl shadow-md p-7">
            <div className="flex items-center justify-between gap-4 mb-7">
              <div>
                <p className="text-gray-500 font-black uppercase">Kalendář absencí</p>
                <h2 className="text-3xl font-black text-black">
                  {monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="w-11 h-11 rounded-2xl bg-pozadi text-black flex items-center justify-center hover:bg-primary hover:text-white transition"
                  aria-label="Předchozí měsíc"
                >
                  <ChevronLeft />
                </button>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="w-11 h-11 rounded-2xl bg-pozadi text-black flex items-center justify-center hover:bg-primary hover:text-white transition"
                  aria-label="Další měsíc"
                >
                  <ChevronRight />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekdayLabels.map((day) => (
                <div key={day} className="text-center text-sm font-black text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="min-h-20 rounded-2xl" />;
                }

                const dateKey = toDateKey(day);
                const dayRequests = requestsByDay.get(dateKey) || [];
                const primaryRequest = dayRequests[0];
                const dayStyle = primaryRequest
                  ? absenceStatusStyles[primaryRequest.status].day
                  : "bg-pozadi border-transparent text-black";

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => primaryRequest && setSelectedId(primaryRequest.id)}
                    className={`min-h-20 rounded-2xl border-2 p-2 text-left transition hover:scale-[1.02] ${dayStyle}`}
                  >
                    <span className="text-lg font-black">{day.getDate()}</span>
                    {dayRequests.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {dayRequests.slice(0, 3).map((request) => (
                          <span
                            key={`${dateKey}-${request.id}`}
                            className={`w-2.5 h-2.5 rounded-full ${absenceStatusStyles[request.status].dot}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {Object.entries(absenceStatusStyles).map(([key, style]) => (
                <div key={key} className="flex items-center gap-2 font-bold text-gray-600">
                  <span className={`w-3 h-3 rounded-full ${style.dot}`} />
                  {style.label}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-5">
            <article className="bg-white rounded-3xl shadow-md p-6">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mb-4">
                <Clock3 />
              </div>
              <p className="text-gray-500 font-bold">Čeká na schválení</p>
              <p className="text-4xl font-black text-black">{pendingCount}</p>
            </article>
            <article className="bg-white rounded-3xl shadow-md p-6">
              <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center mb-4">
                <Check />
              </div>
              <p className="text-gray-500 font-bold">Schváleno</p>
              <p className="text-4xl font-black text-black">
                {requests.filter((request) => request.status === "approved").length}
              </p>
            </article>
            <article className="bg-white rounded-3xl shadow-md p-6">
              <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center mb-4">
                <X />
              </div>
              <p className="text-gray-500 font-bold">Zamítnuto</p>
              <p className="text-4xl font-black text-black">
                {requests.filter((request) => request.status === "rejected").length}
              </p>
            </article>
          </div>
        </section>

        {message && (
          <div
            className={`mb-8 rounded-2xl px-5 py-4 font-bold ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
          <div className="bg-white rounded-3xl shadow-md p-7">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-black text-black">Přehled požadavků</h2>
                <p className="text-gray-600 font-semibold">
                  Žádosti vztažené k aktuálně zobrazenému měsíci.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-3 bg-pozadi rounded-2xl px-4 py-3 text-gray-600 font-bold">
                <Search size={20} />
                Filtrování později
              </div>
            </div>

            <div className="space-y-4">
              {loading && (
                <div className="rounded-3xl bg-pozadi p-8 text-center">
                  <p className="text-xl font-black text-black">Načítání žádostí...</p>
                </div>
              )}

              {!loading && monthRequests.length === 0 && (
                <div className="rounded-3xl bg-pozadi p-8 text-center">
                  <p className="text-xl font-black text-black">
                    V tomto měsíci nejsou žádné žádosti.
                  </p>
                </div>
              )}

              {monthRequests.map((request) => {
                const status = absenceStatusStyles[request.status];
                const selected = selectedId === request.id;

                return (
                  <article
                    key={request.id}
                    className={`rounded-3xl border-2 p-5 transition ${
                      selected ? "border-primary bg-pozadi" : "border-pozadi bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(request.id)}
                      className="w-full text-left"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-black text-black">
                              {request.employee}
                            </h3>
                            <span className={`rounded-full px-3 py-1 text-sm font-black ${status.badge}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="font-bold text-gray-600">
                            {request.type} | {request.from} - {request.to} | {request.days} dny
                          </p>
                          {request.time && (
                            <p className="font-bold text-gray-600">
                              Čas: {request.time}
                            </p>
                          )}
                        </div>

                        {request.status === "pending" ? (
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedId(request.id);
                              }}
                              className="bg-pozadi text-primary px-5 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-primary hover:text-white transition"
                            >
                              <FileText size={20} />
                              Detail
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-2xl bg-pozadi px-4 py-3 font-black text-gray-600">
                            Vyřízeno
                          </div>
                        )}
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="bg-white rounded-3xl shadow-md p-7 h-max">
            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-5">
              <FileText size={30} />
            </div>
            <h2 className="text-3xl font-black text-black mb-5">Detail žádosti</h2>

            {selectedRequest ? (
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 font-bold">Zaměstnanec</p>
                  <p className="text-xl font-black text-black">{selectedRequest.employee}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-bold">Oddělení</p>
                  <p className="text-xl font-black text-black">{selectedRequest.department}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-bold">Termín</p>
                  <p className="text-xl font-black text-black">
                    {selectedRequest.from} - {selectedRequest.to}
                  </p>
                </div>
                {selectedRequest.time && (
                  <div>
                    <p className="text-gray-500 font-bold">Čas</p>
                    <p className="text-xl font-black text-black">{selectedRequest.time}</p>
                  </div>
                )}
                {selectedRequest.place && (
                  <div>
                    <p className="text-gray-500 font-bold">Místo</p>
                    <p className="text-xl font-black text-black">{selectedRequest.place}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500 font-bold">Důvod</p>
                  <p className="font-semibold text-gray-700">{selectedRequest.reason}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-bold">Podáno</p>
                  <p className="font-black text-black">{selectedRequest.submitted}</p>
                </div>
                {selectedRequest.status === "pending" ? (
                  <label className="block">
                    <span className="block text-gray-500 font-bold mb-2">
                      Poznámka ke schválení
                    </span>
                    <textarea
                      value={approvalNote}
                      onChange={(event) => setApprovalNote(event.target.value)}
                      rows={4}
                      className="w-full rounded-2xl bg-pozadi px-4 py-3 font-semibold text-black resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Například důvod zamítnutí nebo krátká poznámka pro zaměstnance."
                    />
                  </label>
                ) : selectedRequest.approvalNote ? (
                  <div>
                    <p className="text-gray-500 font-bold">Poznámka k rozhodnutí</p>
                    <p className="font-semibold text-gray-700">
                      {selectedRequest.approvalNote}
                    </p>
                  </div>
                ) : null}
                <span
                  className={`inline-block rounded-full px-4 py-2 font-black ${
                    absenceStatusStyles[selectedRequest.status].badge
                  }`}
                >
                  {absenceStatusStyles[selectedRequest.status].label}
                </span>
                {selectedRequest.status === "pending" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateStatus(selectedRequest.id, "approved", approvalNote)
                      }
                      className="bg-green-500 text-white px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-green-600 transition"
                    >
                      <Check size={20} />
                      Schválit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateStatus(selectedRequest.id, "rejected", approvalNote)
                      }
                      className="bg-red-500 text-white px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-red-600 transition"
                    >
                      <X size={20} />
                      Zamítnout
                    </button>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-pozadi p-5">
                    <p className="text-gray-500 font-bold mb-2">Historie rozhodnutí</p>
                    <p className="font-black text-black">
                      {selectedRequest.status === "approved"
                        ? "Žádost byla schválena."
                        : "Žádost byla zamítnuta."}
                    </p>
                    <p className="font-semibold text-gray-600 mt-1">
                      {selectedRequest.approvedBy
                        ? `Rozhodl/a: ${selectedRequest.approvedBy}`
                        : "Rozhodující osoba není uvedena."}
                    </p>
                    {selectedRequest.approvedAt && (
                      <p className="font-semibold text-gray-600">
                        Datum: {selectedRequest.approvedAt}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="font-semibold text-gray-600">Vyberte žádost ze seznamu.</p>
            )}
          </aside>
        </section>
    </SystemLayout>
  );
}
