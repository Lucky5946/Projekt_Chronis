import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CalendarCheck2,
  ChevronDown,
  CircleHelp,
  FileBarChart,
  Home,
  LogOut,
  Mail,
  MessageSquareQuote,
  PlayCircle,
  Settings,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";
import logo from "../assets/manufactory-lab.png";
import chronisLogo from "../assets/chronis.png";

const linkBase =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-base xl:text-lg font-bold transition";

function SidebarLink({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${linkBase} ${
          isActive
            ? "bg-white/25 text-white shadow-sm"
            : "text-white/90 hover:bg-white/15 hover:text-white"
        }`
      }
    >
      <Icon size={22} className="shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function DisabledLink({ icon: Icon, label }) {
  return (
    <div className={`${linkBase} text-white/55 cursor-not-allowed`}>
      <Icon size={22} className="shrink-0" />
      <span className="truncate">{label}</span>
      <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-black uppercase">
        brzy
      </span>
    </div>
  );
}

function SidebarSection({ title, icon: Icon, open, onToggle, children }) {
  return (
    <div className="rounded-2xl bg-white/10">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-3 text-left text-white font-black"
      >
        <Icon size={22} className="shrink-0" />
        <span className="flex-1 truncate">{title}</span>
        <ChevronDown
          size={20}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && <div className="space-y-1 px-2 pb-2">{children}</div>}
    </div>
  );
}

function getInitials(user) {
  const first = user?.jmeno?.trim()?.[0] || "";
  const last = user?.prijmeni?.trim()?.[0] || "";

  return `${first}${last}`.toUpperCase() || "?";
}

function Aside() {
  const [user, setUser] = useState(null);
  const [openSections, setOpenSections] = useState({
    attendance: true,
    management: true,
    analytics: false,
    system: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost/api/get_user.php", { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          console.warn("Uživatel není přihlášen nebo nebyl nalezen.");
        }
      })
      .catch((err) => {
        console.error("Chyba při získávání uživatele:", err);
      });
  }, []);

  const isAdmin = Boolean(user?.isAdmin);
  const isManager = Boolean(user?.isManager);
  const canManageTeam = isAdmin || isManager;
  const profilePhoto = user?.fotka_cesta ? `http://localhost/api/${user.fotka_cesta}` : "";

  const userRole = useMemo(() => {
    if (!user) return "Načítání profilu";
    if (isAdmin) return "Administrátor";
    if (isManager) return "Vedoucí";
    return "Zaměstnanec";
  }, [isAdmin, isManager, user]);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost/api/logout.php", {}, { withCredentials: true });
      navigate("/login");
    } catch (error) {
      console.error("Chyba při odhlašování:", error);
    }
  };

  return (
    <aside className="w-64 xl:w-72 h-screen sticky top-0 bg-gradient-to-b from-pozadi to-primary shadow-lg flex flex-col p-5 xl:p-6 text-white shrink-0 overflow-y-auto">
      <div className="flex flex-col items-center mb-6">
        <img src={logo} alt="Logo" className="h-10 mb-5" />

        <div className="relative w-full max-w-[190px] overflow-hidden">
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt="Profil"
              className="aspect-[4/3] w-full object-cover rounded-tl-full rounded-br-full"
            />
          ) : (
            <div className="aspect-[4/3] w-full rounded-tl-full rounded-br-full bg-white/20 flex items-center justify-center text-5xl font-black text-white">
              {getInitials(user)}
            </div>
          )}
        </div>

        <div className="mt-4 text-center min-h-[58px]">
          <h2 className="text-xl xl:text-2xl font-black leading-tight">
            {user ? `${user.jmeno} ${user.prijmeni}` : "Načítání..."}
          </h2>
          <p className="text-sm font-bold text-white/80">{userRole}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full mt-5">
          <button
            onClick={() => navigate("/zpravy")}
            className="flex items-center justify-center h-10 rounded-xl bg-gradient-to-r from-system_modra_tmavsi to-system_modra_svtetlejsi"
            aria-label="Zprávy"
            type="button"
          >
            <Mail size={20} />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center h-10 rounded-xl bg-gradient-to-r from-system_cervena_tmavsi to-system_cervena_svetlejsi"
            aria-label="Odhlásit se"
            type="button"
          >
            <LogOut size={20} />
          </button>
          <button
            onClick={() => navigate("/napoveda")}
            className="flex items-center justify-center h-10 rounded-xl bg-gradient-to-r from-system_modra_tmavsi to-system_modra_svtetlejsi"
            aria-label="Nápověda"
            type="button"
          >
            <CircleHelp size={20} />
          </button>
        </div>
      </div>

      <nav className="flex flex-col gap-3">
        <SidebarLink to="/system_main" icon={Home} label="Dashboard" />

        <SidebarSection
          title="Docházka"
          icon={CalendarCheck2}
          open={openSections.attendance}
          onToggle={() => toggleSection("attendance")}
        >
          <SidebarLink to="/moje_dochazka" icon={PlayCircle} label="Moje docházka" />
          <SidebarLink to="/historie_dochazky" icon={CalendarDays} label="Historie docházky" />
          <SidebarLink to="/zadost_o_absenci" icon={CalendarCheck2} label="Žádost o absenci" />
          {canManageTeam ? (
            <SidebarLink to="/schvalovani_absenci" icon={ShieldCheck} label="Schvalování žádostí" />
          ) : (
            <SidebarLink to="/moje_zadosti" icon={Bell} label="Moje žádosti" />
          )}
        </SidebarSection>

        {canManageTeam && (
          <SidebarSection
            title="Správa"
            icon={UserCog}
            open={openSections.management}
            onToggle={() => toggleSection("management")}
          >
            {isAdmin && <SidebarLink to="/System_Firmy" icon={Building2} label="Firmy" />}
            <SidebarLink to="/uzivatele" icon={UsersRound} label="Uživatelé" />
          </SidebarSection>
        )}

        {canManageTeam && (
          <SidebarSection
            title="Reporty"
            icon={BarChart3}
            open={openSections.analytics}
            onToggle={() => toggleSection("analytics")}
          >
            <SidebarLink to="/dochazkove_reporty" icon={FileBarChart} label="Docházkové reporty" />
            <SidebarLink to="/exporty" icon={BarChart3} label="Exporty" />
          </SidebarSection>
        )}

        <SidebarSection
          title="Systém"
          icon={Settings}
          open={openSections.system}
          onToggle={() => toggleSection("system")}
        >
          {isAdmin && <SidebarLink to="/nastaveni" icon={Settings} label="Nastavení" />}
          <SidebarLink to="/recenze" icon={MessageSquareQuote} label="Recenze" />
          <SidebarLink to="/napoveda" icon={CircleHelp} label="Nápověda" />
        </SidebarSection>
      </nav>

      <div className="mt-auto flex items-center gap-3 pt-6 border-t border-white/20">
        <img src={chronisLogo} alt="Chronis Logo" className="h-10 w-auto" />
        <span className="text-white font-bold text-3xl">CHRONIS</span>
      </div>
    </aside>
  );
}

export default Aside;
