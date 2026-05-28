import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Coffee,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  PlayCircle,
  CalendarClock,
  TimerReset,
} from "lucide-react";
import SystemLayout from "../layouts/SystemLayout";
import PageHeader from "../components/system/PageHeader";

const statusText = {
  none: {
    label: "Čeká na první akci",
    detail: "Začněte pracovní den kliknutím na příchod.",
    chip: "Mimo práci",
  },
  prichod: {
    label: "Jste v práci",
    detail: "Docházka běží. Další akcí může být pauza, odchod mimo pracoviště nebo ukončení směny.",
    chip: "V práci",
  },
  pauza: {
    label: "Pauza probíhá",
    detail: "Pracovní čas je pozastavený, po návratu ukončete pauzu.",
    chip: "Pauza",
  },
  mimo: {
    label: "Jste mimo pracoviště",
    detail: "Směna není ukončená. Po návratu klikněte na návrat na pracoviště.",
    chip: "Mimo pracoviště",
  },
  odchod: {
    label: "Pracovní den ukončen",
    detail: "Dnešní docházka je uzavřena.",
    chip: "Uzavřeno",
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

export default function MojeDochazka() {
  const [currentState, setCurrentState] = useState("none");
  const [lastAction, setLastAction] = useState(null);
  const [todaySummary, setTodaySummary] = useState(null);
  const [shift, setShift] = useState(null);
  const [currentTime, setCurrentTime] = useState(() =>
    new Intl.DateTimeFormat("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date())
  );
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState(null);
  const [message, setMessage] = useState(null);

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("cs-CZ", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    []
  );

  const activeStatus = statusText[currentState] || statusText.none;
  const isOnBreak = currentState === "pauza";
  const isOutside = currentState === "mimo";

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(
        new Intl.DateTimeFormat("cs-CZ", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date())
      );
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost/api/dochazka_dnes.php", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Nepodařilo se načíst docházku.");
      }

      setCurrentState(data.state || "none");
      setLastAction(data.lastAction);
      setTodaySummary(data.today);
      setShift(data.shift || null);
      setMessage(null);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Nepodařilo se načíst dnešní docházku.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const saveAttendanceAction = async (action) => {
    try {
      setSavingAction(action);
      setMessage(null);

      const response = await fetch("http://localhost/api/dochazka_akce.php", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Akci se nepodařilo uložit.");
      }

      setMessage({ type: "success", text: data.message || "Docházka byla uložena." });
      await loadAttendance();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Akci se nepodařilo uložit.",
      });
    } finally {
      setSavingAction(null);
    }
  };

  const actions = [
    {
      id: "prichod",
      title: "Příchod",
      description: "Zahájení pracovní doby.",
      icon: LogIn,
      color: "from-green-500 to-green-700",
      action: "prichod",
      disabled: loading || currentState !== "none",
    },
    {
      id: "pauza",
      title: isOnBreak ? "Ukončit pauzu" : "Pauza",
      description: isOnBreak ? "Návrat z přestávky do práce." : "Spuštění přestávky nebo oběda.",
      icon: isOnBreak ? PlayCircle : Coffee,
      color: "from-yellow-300 to-yellow-500",
      action: isOnBreak ? "konec_pauzy" : "zacatek_pauzy",
      disabled: loading || currentState === "none" || currentState === "odchod" || isOutside,
    },
    {
      id: "mimo",
      title: isOutside ? "Návrat na pracoviště" : "Mimo pracoviště",
      description: isOutside
        ? "Zaměstnanec se vrátil a směna pokračuje."
        : "Krátký nutný odchod bez ukončení směny.",
      icon: isOutside ? PlayCircle : MapPin,
      color: "from-indigo-500 to-sky-600",
      action: isOutside ? "navrat_na_pracoviste" : "odchod_mimo_pracoviste",
      disabled: loading || currentState === "none" || currentState === "odchod" || isOnBreak,
    },
    {
      id: "odchod",
      title: "Ukončit směnu",
      description: "Finální ukončení dnešní pracovní doby.",
      icon: LogOut,
      color: "from-red-500 to-red-700",
      action: "odchod",
      disabled: loading || currentState === "none" || currentState === "odchod" || isOutside || isOnBreak,
    },
  ];

  return (
    <SystemLayout className="p-10">
      <PageHeader eyebrow="Docházka" title="Moje docházka" />

      <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-md p-8">
            <div className="flex flex-col items-center text-center gap-3 mb-6">
              <div>
                <p className="text-gray-500 font-black uppercase mb-2">Dnes</p>
                <h2 className="text-3xl font-black text-black capitalize">
                  {today}
                </h2>
              </div>
              <span className="inline-flex items-center justify-center rounded-full bg-pozadi px-4 py-2 text-sm font-black text-seda">
                {activeStatus.chip}
              </span>
            </div>

            <div className="rounded-3xl bg-pozadi p-8 text-center">
              <p className="text-gray-600 font-bold mb-2">Aktuální čas</p>
              <p className="text-7xl font-black text-black">{currentTime}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-md p-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
                <TimerReset size={32} />
              </div>
              <div className="max-w-md">
                <h2 className="text-3xl font-black text-black">
                  {activeStatus.label}
                </h2>
                <p className="text-gray-600 font-semibold mt-2">
                  {activeStatus.detail}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-pozadi p-5">
                <p className="text-gray-500 font-bold">Poslední akce</p>
                <p className="text-2xl font-black text-black">
                  {lastAction || "--:--"}
                </p>
              </div>
              <div className="rounded-2xl bg-pozadi p-5">
                <p className="text-gray-500 font-bold">Pauza dnes</p>
                <p className="text-2xl font-black text-black">
                  {formatMinutes(todaySummary?.pauzaMinut)}
                </p>
              </div>
              <div className="rounded-2xl bg-pozadi p-5">
                <p className="text-gray-500 font-bold">Mimo pracoviště</p>
                <p className="text-2xl font-black text-black">
                  {formatMinutes(todaySummary?.mimoPracovisteMinut)}
                </p>
              </div>
              <div className="rounded-2xl bg-pozadi p-5">
                <p className="text-gray-500 font-bold">Příchod</p>
                <p className="text-2xl font-black text-black">
                  {todaySummary?.prichod || "--:--"}
                </p>
              </div>
              <div className="rounded-2xl bg-pozadi p-5">
                <p className="text-gray-500 font-bold">Odchod</p>
                <p className="text-2xl font-black text-black">
                  {todaySummary?.odchod || "--:--"}
                </p>
              </div>
              <div className="rounded-2xl bg-pozadi p-5 col-span-2">
                <div className="flex items-center gap-3">
                  <CalendarClock className="text-primary shrink-0" size={24} />
                  <div>
                    <p className="text-gray-500 font-bold">Plán směny</p>
                    <p className="text-2xl font-black text-black">
                      {shift ? `${shift.casOd} - ${shift.casDo}` : "--:--"}
                    </p>
                    <p className="font-semibold text-gray-600">
                      {shift?.nazev || "Výchozí směna"} · {formatMinutes(shift?.uvazekMinut)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-md p-8">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-4xl font-black text-black">Akce docházky</h2>
              <p className="text-gray-600 font-semibold">
                Vyberte akci podle toho, co právě děláte.
              </p>
            </div>
            <Coffee className="text-primary shrink-0" size={42} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-6">
            {actions.map(({ id, title, description, icon: Icon, color, action, disabled }) => {
              const active = currentState === id || (id === "pauza" && isOnBreak);
              const isPause = id === "pauza";
              const isSaving = savingAction === action;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => saveAttendanceAction(action)}
                  disabled={disabled || Boolean(savingAction)}
                  className={`text-left rounded-3xl p-6 min-h-[170px] shadow-md transition bg-gradient-to-r ${color} ${
                    isPause ? "text-black" : "text-white"
                  } ${active ? "ring-4 ring-black/10 scale-[1.01]" : ""} ${
                    disabled || savingAction
                      ? "opacity-55 cursor-not-allowed"
                      : "hover:-translate-y-1"
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${
                      isPause ? "bg-white/90 text-black" : "bg-white text-black"
                    }`}
                  >
                    {isSaving ? <Loader2 size={34} className="animate-spin" /> : <Icon size={34} />}
                  </div>

                  <h3 className="text-3xl font-black mb-2">{title}</h3>
                  <p className={`text-lg font-semibold ${isPause ? "text-black/75" : "text-white/90"}`}>
                    {description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-8 rounded-3xl bg-seda text-white p-6">
            <div className="flex items-start gap-4">
              {message?.type === "error" ? (
                <AlertCircle className="text-red-300 shrink-0" size={30} />
              ) : (
                <CheckCircle2 className="text-green-300 shrink-0" size={30} />
              )}
              <div>
                <h3 className="text-2xl font-black mb-2">
                  {message?.type === "error" ? "Něco se nepovedlo" : "Docházka je propojená"}
                </h3>
                <p className="font-semibold text-white/85">
                  {message?.text ||
                    "Akce se ukládají do databáze k přihlášenému zaměstnanci a dnešnímu dni."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SystemLayout>
  );
}
