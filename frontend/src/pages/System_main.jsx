import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  BarChart3,
  CalendarCheck2,
  CircleUser,
  Clock3,
  FileText,
  PlusCircle,
  PlayCircle,
  UsersRound,
} from "lucide-react";
import SystemLayout from "../layouts/SystemLayout";
import PageHeader from "../components/system/PageHeader";

const quickActions = [
  {
    title: "Správa firem",
    text: "Zobrazit a upravit firemní údaje.",
    to: "/System_Firmy",
    icon: Building2,
  },
  {
    title: "Žádost o absenci",
    text: "Vytvořit novou žádost o dovolenou nebo nemoc.",
    to: "/zadost_o_absenci",
    icon: CalendarCheck2,
  },
  {
    title: "Uživatelé",
    text: "Připravená část pro správu zaměstnanců.",
    to: "/uzivatele",
    icon: UsersRound,
  },
];

const employeeActions = [
  {
    title: "Zaznamenat docházku",
    text: "Příchod, odchod nebo pauza.",
    to: "/moje_dochazka",
    icon: PlayCircle,
  },
  {
    title: "Nová žádost",
    text: "Dovolená, nemoc nebo ošetřování.",
    to: "/zadost_o_absenci",
    icon: CalendarCheck2,
  },
  {
    title: "Historie docházky",
    text: "Kalendář, grafy a odpracované hodiny.",
    to: "/historie_dochazky",
    icon: BarChart3,
  },
];

export default function SystemAdmin() {
  const [user, setUser] = useState(null);
  const [firmy, setFirmy] = useState([]);
  const [managedUsers, setManagedUsers] = useState([]);
  const [managedRequests, setManagedRequests] = useState([]);
  const [employeeDashboard, setEmployeeDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [userResponse, firmyResponse, employeeResponse, usersResponse, requestsResponse] = await Promise.all([
          fetch("http://localhost/api/get_user.php", { credentials: "include" }),
          fetch("http://localhost/api/get_firmy.php", { credentials: "include" }),
          fetch("http://localhost/api/employee_dashboard.php", { credentials: "include" }),
          fetch("http://localhost/api/get_uzivatele.php", { credentials: "include" }),
          fetch("http://localhost/api/absence_admin.php", { credentials: "include" }),
        ]);

        const userData = await userResponse.json();
        const firmyData = await firmyResponse.json();
        const employeeData = await employeeResponse.json();
        const usersData = await usersResponse.json();
        const requestsData = await requestsResponse.json();

        if (userData.success) {
          setUser(userData.user);
        }

        if (Array.isArray(firmyData)) {
          setFirmy(firmyData);
        }

        if (employeeData.success) {
          setEmployeeDashboard(employeeData);
        }

        if (usersData.success) {
          setManagedUsers(usersData.users || []);
        }

        if (requestsData.success) {
          setManagedRequests(requestsData.requests || []);
        }
      } catch (error) {
        console.error("Chyba při načítání dashboardu:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Firmy v systému",
        value: loading ? "..." : firmy.length,
        icon: Building2,
        color: "from-system_modra_tmavsi to-system_modra_svtetlejsi",
      },
      {
        label: "Aktivní uživatel",
        value: user ? `${user.jmeno} ${user.prijmeni}` : loading ? "..." : "Nepřihlášen",
        icon: CircleUser,
        color: "from-primary to-system_modra_svtetlejsi",
      },
      {
        label: "Role",
        value: user?.isAdmin ? "Administrátor" : "Zaměstnanec",
        icon: UsersRound,
        color: "from-system_cervena_tmavsi to-system_cervena_svetlejsi",
      },
      {
        label: "Dnešní stav",
        value: "Přehled",
        icon: Clock3,
        color: "from-seda to-system_modra_tmavsi",
      },
    ],
    [firmy.length, loading, user]
  );

  const recentCompanies = firmy.slice(0, 4);
  const formatMinutes = (minutes) => {
    const value = Number(minutes) || 0;
    const hours = Math.floor(value / 60);
    const rest = value % 60;

    if (hours <= 0) return `${rest} min`;
    return `${hours} h ${String(rest).padStart(2, "0")} min`;
  };
  const attendance = employeeDashboard?.attendance;
  const requestSummary = employeeDashboard?.requests;
  const shift = employeeDashboard?.shift;
  const shiftRange = shift ? `${shift.casOd} - ${shift.casDo}` : "07:00 - 15:30";
  const isManager = Boolean(user?.isManager);
  const pendingManagedRequests = managedRequests.filter((request) => request.status === "pending").length;

  if (!loading && user && isManager && !user.isAdmin) {
    return (
      <SystemLayout className="p-10">
        <PageHeader eyebrow="Vedoucí" title="Dashboard týmu" />

        <section className="bg-white rounded-3xl shadow-md p-8 mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-black mb-3">
                Vítejte, {user.jmeno}
              </h2>
              <p className="text-lg font-semibold text-gray-600 max-w-3xl">
                Máte přehled nad zaměstnanci ve své firmě, jejich žádostmi a rychlými akcemi
                pro každodenní provoz.
              </p>
            </div>

            <Link
              to="/schvalovani_absenci"
              className="w-max bg-primary text-white px-6 py-3 rounded-2xl font-black text-lg flex items-center gap-3 hover:scale-105 transition"
            >
              <CalendarCheck2 size={24} />
              Schvalovat žádosti
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {[
            {
              label: "Moji uživatelé",
              value: managedUsers.length,
              icon: UsersRound,
              color: "from-primary to-system_modra_svtetlejsi",
            },
            {
              label: "Čekající žádosti",
              value: pendingManagedRequests,
              icon: CalendarCheck2,
              color: "from-yellow-400 to-yellow-600",
            },
            {
              label: "Vyřešené žádosti",
              value: Math.max(managedRequests.length - pendingManagedRequests, 0),
              icon: FileText,
              color: "from-green-500 to-green-700",
            },
            {
              label: "Role",
              value: "Vedoucí",
              icon: CircleUser,
              color: "from-seda to-system_modra_tmavsi",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <article key={label} className="bg-white rounded-3xl shadow-md p-6">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${color} text-white flex items-center justify-center mb-5`}
              >
                <Icon size={30} />
              </div>
              <p className="text-gray-500 font-bold mb-2">{label}</p>
              <p className="text-2xl font-black text-black">{value}</p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_0.9fr] gap-8">
          <div className="bg-white rounded-3xl shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-black">Rychlé akce</h2>
              <FileText className="text-primary" size={32} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-5">
              {[
                {
                  title: "Správa uživatelů",
                  text: "Upravte zaměstnance ve své firmě.",
                  to: "/uzivatele",
                  icon: UsersRound,
                },
                {
                  title: "Schvalování žádostí",
                  text: "Vyřešte čekající absence a propustky.",
                  to: "/schvalovani_absenci",
                  icon: CalendarCheck2,
                },
                {
                  title: "Moje docházka",
                  text: "Zaznamenejte vlastní příchod, pauzu nebo odchod.",
                  to: "/moje_dochazka",
                  icon: PlayCircle,
                },
              ].map(({ title, text, to, icon: Icon }) => (
                <Link
                  key={title}
                  to={to}
                  className="group border-2 border-pozadi rounded-3xl p-5 flex gap-4 items-start hover:border-primary hover:bg-pozadi transition"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
                    <Icon size={26} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-black group-hover:text-primary">
                      {title}
                    </h3>
                    <p className="font-semibold text-gray-600">{text}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-black">Čekající žádosti</h2>
              <Link to="/schvalovani_absenci" className="text-primary font-black">
                Zobrazit vše
              </Link>
            </div>

            <div className="space-y-4">
              {managedRequests.filter((request) => request.status === "pending").slice(0, 4).map((request) => (
                <div key={request.id} className="rounded-2xl bg-pozadi p-5">
                  <div className="flex justify-between gap-4">
                    <h3 className="text-xl font-black text-black">{request.employee}</h3>
                    <span className="font-black text-primary">{request.days} dnů</span>
                  </div>
                  <p className="font-semibold text-gray-600">
                    {request.type} | {request.from} - {request.to}
                  </p>
                </div>
              ))}

              {pendingManagedRequests === 0 && (
                <div className="rounded-3xl bg-pozadi p-8 text-center">
                  <CalendarCheck2 className="mx-auto text-primary mb-4" size={48} />
                  <p className="text-xl font-black text-black">Žádné čekající žádosti.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </SystemLayout>
    );
  }

  if (!loading && user && !user.isAdmin) {
    return (
      <SystemLayout className="p-10">
        <PageHeader eyebrow="Zaměstnanec" title="Můj dashboard" />

        <section className="bg-white rounded-3xl shadow-md p-8 mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-black mb-3">
                Vítejte, {user.jmeno}
              </h2>
              <p className="text-lg font-semibold text-gray-600 max-w-3xl">
                Tady máte rychlý přehled dnešní směny, žádostí a vlastní
                docházky.
              </p>
            </div>

            <Link
              to="/moje_dochazka"
              className="w-max bg-primary text-white px-6 py-3 rounded-2xl font-black text-lg flex items-center gap-3 hover:scale-105 transition"
            >
              <PlayCircle size={24} />
              Otevřít docházku
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {[
            {
              label: "Dnešní stav",
              value: attendance?.label || "Bez záznamu",
              icon: Clock3,
              color: "from-green-500 to-green-700",
            },
            {
              label: "Odpracováno dnes",
              value: formatMinutes(attendance?.todayMinutes),
              icon: PlayCircle,
              color: "from-primary to-system_modra_svtetlejsi",
            },
            {
              label: "Moje žádosti",
              value: requestSummary ? `${requestSummary.pending}/${requestSummary.total}` : "...",
              icon: CalendarCheck2,
              color: "from-system_modra_tmavsi to-system_modra_svtetlejsi",
            },
            {
              label: "Tento měsíc",
              value: formatMinutes(attendance?.monthMinutes),
              icon: BarChart3,
              color: "from-seda to-system_modra_tmavsi",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <article key={label} className="bg-white rounded-3xl shadow-md p-6">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${color} text-white flex items-center justify-center mb-5`}
              >
                <Icon size={30} />
              </div>
              <p className="text-gray-500 font-bold mb-2">{label}</p>
              <p className="text-2xl font-black text-black">{value}</p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_0.9fr] gap-8">
          <div className="bg-white rounded-3xl shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-black">Rychlé akce</h2>
              <FileText className="text-primary" size={32} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-5">
              {employeeActions.map(({ title, text, to, icon: Icon }) => (
                <Link
                  key={title}
                  to={to}
                  className="group border-2 border-pozadi rounded-3xl p-5 flex gap-4 items-start hover:border-primary hover:bg-pozadi transition"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
                    <Icon size={26} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-black group-hover:text-primary">
                      {title}
                    </h3>
                    <p className="font-semibold text-gray-600">{text}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-md p-8">
            <p className="text-gray-500 font-black uppercase mb-2">Dnešní směna</p>
            <h2 className="text-3xl font-black text-black mb-2">{shiftRange}</h2>
            <p className="font-bold text-gray-500 mb-6">
              {shift?.nazev || "Výchozí směna"} · plán {formatMinutes(shift?.uvazekMinut || 480)}
            </p>

            <div className="space-y-4">
              {[
                ["Příchod", attendance?.arrival || "--:--"],
                ["Pauza", formatMinutes(attendance?.pauseMinutes)],
                ["Odchod", attendance?.leave || (attendance?.state === "none" ? "--:--" : "probíhá")],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-pozadi p-5 flex justify-between gap-4">
                  <span className="font-bold text-gray-500">{label}</span>
                  <span className="font-black text-black">{value}</span>
                </div>
              ))}
            </div>

            <Link
              to="/historie_dochazky"
              className="mt-6 w-full bg-gradient-to-r from-primary to-system_modra_svtetlejsi text-white rounded-2xl py-4 font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition"
            >
              <BarChart3 size={22} />
              Zobrazit historii
            </Link>
          </div>
        </section>
      </SystemLayout>
    );
  }

  return (
    <SystemLayout className="p-10">
        <PageHeader eyebrow="Administrace" title="Dashboard" />

        <section className="bg-white rounded-3xl shadow-md p-8 mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-black mb-3">
                {user ? `Vítejte, ${user.jmeno}` : "Vítejte v systému Chronis"}
              </h2>
              <p className="text-lg font-semibold text-gray-600 max-w-3xl">
                Tady budete mít rychlý přehled o firmách, uživatelích, žádostech
                a dalších částech docházkového systému.
              </p>
            </div>

            <Link
              to="/System_Firmy"
              className="w-max bg-primary text-white px-6 py-3 rounded-2xl font-black text-lg flex items-center gap-3 hover:scale-105 transition"
            >
              <PlusCircle size={24} />
              Spravovat firmy
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <article key={label} className="bg-white rounded-3xl shadow-md p-6">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${color} text-white flex items-center justify-center mb-5`}
              >
                <Icon size={30} />
              </div>
              <p className="text-gray-500 font-bold mb-2">{label}</p>
              <p className="text-2xl font-black text-black break-words">{value}</p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_0.9fr] gap-8">
          <div className="bg-white rounded-3xl shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-black">Rychlé akce</h2>
              <FileText className="text-primary" size={32} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-5">
              {quickActions.map(({ title, text, to, icon: Icon }) => (
                <Link
                  key={title}
                  to={to}
                  className="group border-2 border-pozadi rounded-3xl p-5 flex gap-4 items-start hover:border-primary hover:bg-pozadi transition"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
                    <Icon size={26} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-black group-hover:text-primary">
                      {title}
                    </h3>
                    <p className="font-semibold text-gray-600">{text}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-black">Poslední firmy</h2>
              <Link to="/System_Firmy" className="text-primary font-black">
                Zobrazit vše
              </Link>
            </div>

            {recentCompanies.length > 0 ? (
              <div className="space-y-4">
                {recentCompanies.map((firma) => (
                  <Link
                    key={firma.id_firma}
                    to={`/System_Firmy_Edit/${firma.id_firma}`}
                    className="flex items-center gap-4 rounded-2xl bg-pozadi p-4 hover:scale-[1.01] transition"
                  >
                    <img
                      src={`http://localhost/api/${firma.logo_cesta}`}
                      alt={`Logo firmy ${firma.nazev}`}
                      className="w-14 h-14 object-contain bg-white rounded-xl p-2"
                    />
                    <div>
                      <h3 className="text-xl font-black text-black">{firma.nazev}</h3>
                      <p className="font-semibold text-gray-600">
                        {firma.obec || "Obec neuvedena"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-pozadi p-8 text-center">
                <Building2 className="mx-auto text-primary mb-4" size={48} />
                <p className="text-xl font-black text-black">
                  Zatím nejsou načtené žádné firmy.
                </p>
                <p className="font-semibold text-gray-600 mt-2">
                  Po připojení databáze se zde zobrazí rychlý přehled.
                </p>
              </div>
            )}
          </div>
        </section>
    </SystemLayout>
  );
}
