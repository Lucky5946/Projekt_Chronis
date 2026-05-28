import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  TimerReset,
} from "lucide-react";
import SystemLayout from "../layouts/SystemLayout";
import PageHeader from "../components/system/PageHeader";
import { buildCalendarDays, toDateKey } from "../utils/calendar";

const monthNames = [
  "Leden",
  "Únor",
  "Březen",
  "Duben",
  "Květen",
  "Červen",
  "Červenec",
  "Srpen",
  "Září",
  "Říjen",
  "Listopad",
  "Prosinec",
];

const weekdayLabels = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

const statusStyles = {
  pritomen: {
    day: "bg-green-100 border-green-200 text-green-700",
    badge: "bg-green-100 text-green-700",
    label: "V pořádku",
  },
  pozdni_prichod: {
    day: "bg-yellow-100 border-yellow-200 text-yellow-700",
    badge: "bg-yellow-100 text-yellow-700",
    label: "Pozdní příchod",
  },
  absence: {
    day: "bg-red-100 border-red-200 text-red-700",
    badge: "bg-red-100 text-red-700",
    label: "Absence",
  },
  volno: {
    day: "bg-gray-100 border-gray-200 text-gray-500",
    badge: "bg-gray-100 text-gray-600",
    label: "Volno",
  },
  neuzavreno: {
    day: "bg-blue-100 border-blue-200 text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    label: "Probíhá",
  },
};

const formatMinutes = (minutes) => {
  if (minutes === null || minutes === undefined) {
    return "--";
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours <= 0) {
    return `${rest} min`;
  }

  return `${hours} h ${rest.toString().padStart(2, "0")} min`;
};

const formatHours = (minutes) => {
  if (!minutes) {
    return "0.0";
  }

  return (minutes / 60).toFixed(1);
};

const getWeekNumberInMonth = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstMondayOffset = (firstDay.getDay() + 6) % 7;

  return Math.floor((date.getDate() + firstMondayOffset - 1) / 7);
};

export default function HistorieDochazky() {
  const now = new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    totalMinutes: 0,
    lateCount: 0,
    absenceCount: 0,
    openCount: 0,
    recordCount: 0,
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth]
  );

  const attendanceByDay = useMemo(() => {
    const map = new Map();
    records.forEach((record) => map.set(record.date, record));
    return map;
  }, [records]);

  const selectedRecord = selectedDay ? attendanceByDay.get(selectedDay) : null;

  const weeklyHours = useMemo(() => {
    const weeks = Array.from({ length: 6 }, (_, index) => ({
      label: `${index + 1}. týden`,
      minutes: 0,
    }));

    records.forEach((record) => {
      const weekIndex = getWeekNumberInMonth(record.date);
      weeks[weekIndex].minutes += record.workedMinutes || 0;
    });

    const maxMinutes = Math.max(...weeks.map((week) => week.minutes), 1);

    return weeks
      .filter((week) => week.minutes > 0)
      .map((week) => ({
        ...week,
        hours: formatHours(week.minutes),
        percent: Math.max(Math.round((week.minutes / maxMinutes) * 100), 8),
      }));
  }, [records]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setMessage(null);

        const year = visibleMonth.getFullYear();
        const month = visibleMonth.getMonth() + 1;
        const response = await fetch(
          `http://localhost/api/dochazka_historie.php?year=${year}&month=${month}`,
          { credentials: "include" }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Historii docházky se nepodařilo načíst.");
        }

        const loadedRecords = data.records || [];
        setRecords(loadedRecords);
        setSummary(data.summary || {});
        setSelectedDay(loadedRecords.at(-1)?.date ?? null);
      } catch (error) {
        setRecords([]);
        setSelectedDay(null);
        setMessage({
          type: "error",
          text: error.message || "Chyba při připojení k serveru.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [visibleMonth]);

  const changeMonth = (offset) => {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1)
    );
  };

  return (
    <SystemLayout className="p-8 xl:p-10">
      <PageHeader eyebrow="Docházka" title="Historie docházky" />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <article className="bg-white rounded-3xl shadow-md p-6">
          <Clock3 className="text-primary mb-4" size={38} />
          <p className="text-gray-500 font-bold">Odpracováno</p>
          <p className="text-4xl font-black text-black">
            {formatHours(summary.totalMinutes)} h
          </p>
        </article>
        <article className="bg-white rounded-3xl shadow-md p-6">
          <TimerReset className="text-yellow-500 mb-4" size={38} />
          <p className="text-gray-500 font-bold">Pozdní příchody</p>
          <p className="text-4xl font-black text-black">{summary.lateCount || 0}</p>
        </article>
        <article className="bg-white rounded-3xl shadow-md p-6">
          <CalendarDays className="text-red-500 mb-4" size={38} />
          <p className="text-gray-500 font-bold">Absence</p>
          <p className="text-4xl font-black text-black">{summary.absenceCount || 0}</p>
        </article>
      </section>

      {message && (
        <div className="mb-8 rounded-2xl bg-red-100 text-red-700 px-5 py-4 font-bold flex items-center gap-3">
          <AlertCircle size={22} />
          {message.text}
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8 mb-8">
        <div className="bg-white rounded-3xl shadow-md p-7">
          <div className="flex items-center justify-between gap-4 mb-7">
            <div>
              <p className="text-gray-500 font-black uppercase">Kalendář</p>
              <h2 className="text-3xl font-black text-black">
                {monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="w-11 h-11 rounded-2xl bg-pozadi flex items-center justify-center hover:bg-primary hover:text-white transition"
                aria-label="Předchozí měsíc"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="w-11 h-11 rounded-2xl bg-pozadi flex items-center justify-center hover:bg-primary hover:text-white transition"
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
                return <div key={`empty-${index}`} className="min-h-20" />;
              }

              const dateKey = toDateKey(day);
              const record = attendanceByDay.get(dateKey);
              const style = record
                ? statusStyles[record.status]?.day || statusStyles.neuzavreno.day
                : "bg-pozadi border-transparent text-black";

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => record && setSelectedDay(dateKey)}
                  disabled={!record}
                  className={`min-h-20 rounded-2xl border-2 p-2 text-left transition ${style} ${
                    selectedDay === dateKey ? "ring-4 ring-primary/20" : ""
                  } ${record ? "hover:scale-[1.02]" : "cursor-default opacity-70"}`}
                >
                  <span className="text-lg font-black">{day.getDate()}</span>
                  {record && (
                    <p className="text-sm font-black mt-2">
                      {formatHours(record.workedMinutes)} h
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {loading && (
            <div className="mt-6 rounded-2xl bg-pozadi p-5 font-black text-black flex items-center gap-3">
              <Loader2 className="animate-spin text-primary" size={22} />
              Načítám historii docházky...
            </div>
          )}
        </div>

        <aside className="bg-white rounded-3xl shadow-md p-7 h-max">
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-5">
            <CalendarDays size={30} />
          </div>
          <h2 className="text-3xl font-black text-black mb-5">Detail dne</h2>
          {selectedRecord ? (
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 font-bold">Datum</p>
                <p className="text-xl font-black text-black">{selectedRecord.date}</p>
              </div>
              <div>
                <p className="text-gray-500 font-bold">Stav</p>
                <span
                  className={`inline-block rounded-full px-4 py-2 font-black ${
                    statusStyles[selectedRecord.status]?.badge || statusStyles.neuzavreno.badge
                  }`}
                >
                  {statusStyles[selectedRecord.status]?.label || "Neznámý stav"}
                </span>
              </div>
              <div>
                <p className="text-gray-500 font-bold">Příchod</p>
                <p className="text-xl font-black text-black">
                  {selectedRecord.arrival || "--:--"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-bold">Odchod</p>
                <p className="text-xl font-black text-black">
                  {selectedRecord.leave || "probíhá"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-bold">Pauza</p>
                <p className="text-xl font-black text-black">
                  {formatMinutes(selectedRecord.pauseMinutes)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-bold">Odpracováno</p>
                <p className="text-xl font-black text-black">
                  {formatMinutes(selectedRecord.workedMinutes)}
                </p>
              </div>
              {selectedRecord.note && (
                <div>
                  <p className="text-gray-500 font-bold">Poznámka</p>
                  <p className="font-semibold text-gray-700">{selectedRecord.note}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="font-semibold text-gray-600">
              {loading ? "Načítám záznamy..." : "Vyberte den v kalendáři."}
            </p>
          )}
        </aside>
      </section>

      <section className="bg-white rounded-3xl shadow-md p-7">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-gray-500 font-black uppercase">Graf</p>
            <h2 className="text-3xl font-black text-black">
              Odpracované hodiny po týdnech
            </h2>
          </div>
          <BarChart3 className="text-primary" size={38} />
        </div>

        {weeklyHours.length > 0 ? (
          <div className="h-72 flex items-end gap-5">
            {weeklyHours.map((item) => (
              <div key={item.label} className="flex-1 flex flex-col items-center gap-3">
                <div className="w-full h-56 flex items-end rounded-2xl bg-pozadi overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-t from-primary to-system_modra_svtetlejsi rounded-t-2xl"
                    style={{ height: `${item.percent}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className="font-black text-black">{item.label}</p>
                  <p className="text-sm font-bold text-gray-500">{item.hours} h</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-pozadi p-8 text-center">
            <p className="text-xl font-black text-black">
              Pro tento měsíc zatím nejsou žádné odpracované hodiny.
            </p>
          </div>
        )}
      </section>
    </SystemLayout>
  );
}
