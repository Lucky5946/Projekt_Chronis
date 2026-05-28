import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  Edit3,
  Mail,
  Phone,
  PlusCircle,
  Search,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";
import SystemLayout from "../layouts/SystemLayout";
import PageHeader from "../components/system/PageHeader";

const roleDescriptions = {
  Administrátor: "Plný přístup ke správě firem, uživatelů, reportů a nastavení.",
  "Vedoucí směny": "Schvaluje absence a sleduje docházku svého týmu.",
  Zaměstnanec: "Eviduje příchod, odchod, pauzy a vlastní žádosti.",
};

const formatLastLogin = (value) => {
  if (!value) {
    return "zatím nikdy";
  }

  return new Intl.DateTimeFormat("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value.replace(" ", "T")));
};

const userInitials = (user) =>
  `${user?.jmeno?.[0] || ""}${user?.prijmeni?.[0] || ""}`.toUpperCase() || "?";

function UserAvatar({ user, size = "md", className = "" }) {
  const sizeClasses = {
    sm: "w-10 h-10 rounded-xl text-sm",
    md: "w-12 h-12 rounded-2xl text-base",
    lg: "w-16 h-16 rounded-3xl text-xl",
  };
  const photo = user?.fotka_cesta ? `http://localhost/api/${user.fotka_cesta}` : "";

  if (photo) {
    return (
      <img
        src={photo}
        alt={`${user.jmeno} ${user.prijmeni}`}
        className={`${sizeClasses[size]} object-cover bg-pozadi shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-r from-primary to-system_modra_svtetlejsi text-white flex items-center justify-center font-black shrink-0 ${className}`}
      title={`${user?.jmeno || ""} ${user?.prijmeni || ""}`.trim()}
    >
      {userInitials(user)}
    </div>
  );
}

export default function Uzivatele() {
  const [users, setUsers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch("http://localhost/api/get_uzivatele.php", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Uživatele se nepodařilo načíst.");
      }

      setUsers(data.users || []);
      setPositions(data.positions || []);
    } catch (error) {
      console.error(error);
      setUsers([]);
      setMessage({
        type: "error",
        text: error.message || "Chyba při načítání uživatelů.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) =>
      [
        user.jmeno,
        user.prijmeni,
        user.email,
        user.telefon,
        user.prihlasovaci_jmeno,
        user.pozice,
        user.oddeleni,
        user.firma,
        user.smena,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [users, search]);

  const stats = useMemo(() => {
    const activeCount = users.filter((user) => Number(user.aktivni) === 1).length;
    const adminCount = users.filter((user) => Number(user.id_pozice) === 1).length;
    const inactiveCount = users.length - activeCount;

    return [
      {
        label: "Uživatelé",
        value: users.length,
        icon: UsersRound,
        color: "from-primary to-system_modra_svtetlejsi",
      },
      {
        label: "Aktivní účty",
        value: activeCount,
        icon: CheckCircle2,
        color: "from-green-500 to-green-700",
      },
      {
        label: "Administrátoři",
        value: adminCount,
        icon: ShieldCheck,
        color: "from-system_modra_tmavsi to-system_modra_svtetlejsi",
      },
      {
        label: "Pozastavené",
        value: inactiveCount,
        icon: Clock3,
        color: "from-yellow-300 to-yellow-500",
      },
    ];
  }, [users]);

  const roleCards = useMemo(() => {
    return positions.map((position) => {
      const roleUsers = users.filter(
        (user) => Number(user.id_pozice) === Number(position.id_pozice)
      );

      return {
        title: position.nazev,
        description: roleDescriptions[position.nazev] || "Role podle nastavení v databázi.",
        count: roleUsers.length,
        users: roleUsers.slice(0, 4),
      };
    });
  }, [positions, users]);

  const handleDelete = async (userId) => {
    if (!window.confirm("Opravdu chcete smazat tohoto uživatele?")) return;

    try {
      const response = await axios.delete(
        `http://localhost/api/delete_uzivatel.php?id=${userId}`,
        { withCredentials: true }
      );

      setMessage({
        type: "success",
        text: response.data?.message || "Uživatel byl smazán.",
      });
      fetchUsers();
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Chyba při mazání uživatele.",
      });
    }
  };

  return (
    <SystemLayout className="p-8 xl:p-10">
      <PageHeader eyebrow="Správa" title="Uživatelé" />

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <article key={label} className="bg-white rounded-3xl shadow-md p-6">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${color} text-white flex items-center justify-center mb-5`}
            >
              <Icon size={30} />
            </div>
            <p className="text-gray-500 font-bold">{label}</p>
            <p className="text-4xl font-black text-black mt-1">
              {loading ? "..." : value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 mb-8">
        <div className="bg-white rounded-3xl shadow-md p-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-7">
            <div>
              <p className="text-gray-500 font-black uppercase">Přístupové účty</p>
              <h2 className="text-3xl font-black text-black">Správa zaměstnanců</h2>
              <p className="font-semibold text-gray-600 mt-2">
                Přehled rolí, kontaktů a stavu účtů napojený na databázi.
              </p>
            </div>

            <Link
              to="/uzivatele/new"
              className="h-14 px-6 rounded-2xl bg-primary text-white font-black flex items-center justify-center gap-3 hover:scale-105 transition"
            >
              <PlusCircle size={22} />
              Přidat uživatele
            </Link>
          </div>

          <div className="flex items-center gap-3 bg-pozadi rounded-2xl px-4 py-4">
            <Search size={22} className="text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent font-bold text-black outline-none"
              placeholder="Vyhledat podle jména, emailu, role nebo oddělení"
            />
          </div>
        </div>

        <aside className="bg-white rounded-3xl shadow-md p-7">
          <div className="flex -space-x-3 mb-5">
            {users.slice(0, 5).map((user) => (
              <UserAvatar
                key={user.id_zamestnanec}
                user={user}
                size="lg"
                className="ring-4 ring-white"
              />
            ))}
            {users.length === 0 && (
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-r from-primary to-system_modra_svtetlejsi text-white flex items-center justify-center">
                <ShieldCheck size={30} />
              </div>
            )}
          </div>
          <h2 className="text-3xl font-black text-black mb-4">Role v systému</h2>
          <p className="font-semibold text-gray-600">
            Administrátor má přístup ke správě systému. Ostatní role zůstávají připravené pro
            docházku, žádosti a týmové přehledy.
          </p>
        </aside>
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

      <section className="space-y-8">
        <div className="bg-white rounded-3xl shadow-md p-7">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left">
              <thead>
                <tr className="text-sm font-black uppercase text-gray-500 border-b border-pozadi">
                  <th className="py-4 pr-4">Uživatel</th>
                  <th className="py-4 pr-4">Role</th>
                  <th className="py-4 pr-4">Směna</th>
                  <th className="py-4 pr-4">Kontakt</th>
                  <th className="py-4 pr-4">Poslední přihlášení</th>
                  <th className="py-4 pr-4">Stav</th>
                  <th className="py-4">Akce</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center">
                      <p className="text-2xl font-black text-black">
                        Načítání uživatelů...
                      </p>
                    </td>
                  </tr>
                )}

                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center">
                      <p className="text-2xl font-black text-black">
                        Žádný uživatel nenalezen.
                      </p>
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredUsers.map((user) => {
                    const active = Number(user.aktivni) === 1;

                    return (
                      <tr
                        key={user.id_zamestnanec}
                        className="border-b border-pozadi last:border-none"
                      >
                        <td className="py-5 pr-4">
                          <div className="flex items-center gap-4">
                            <UserAvatar user={user} />
                            <div>
                              <p className="font-black text-black">
                                {user.jmeno} {user.prijmeni}
                              </p>
                              <p className="font-bold text-gray-500">
                                {user.oddeleni || "Oddělení neuvedeno"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 pr-4 font-bold text-gray-700">
                          {user.pozice || "Role neuvedena"}
                        </td>
                        <td className="py-5 pr-4">
                          <p className="font-black text-gray-700">
                            {user.smena || "Směna neuvedena"}
                          </p>
                          {(user.smena_od || user.smena_do) && (
                            <p className="font-bold text-gray-500">
                              {user.smena_od} - {user.smena_do}
                            </p>
                          )}
                        </td>
                        <td className="py-5 pr-4">
                          <div className="space-y-1 font-bold text-gray-600">
                            <p className="flex items-center gap-2">
                              <Mail size={16} className="text-primary" />
                              {user.email}
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone size={16} className="text-primary" />
                              {user.telefon}
                            </p>
                          </div>
                        </td>
                        <td className="py-5 pr-4 font-bold text-gray-600">
                          {formatLastLogin(user.posledni_prihlaseni)}
                        </td>
                        <td className="py-5 pr-4">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-black ${
                              active
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {active ? "Aktivní" : "Pozastavený"}
                          </span>
                        </td>
                        <td className="py-5">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/uzivatele/${user.id_zamestnanec}`}
                              className="rounded-xl bg-pozadi px-4 py-2 font-black text-primary flex items-center gap-2 hover:bg-primary hover:text-white transition"
                            >
                              <Edit3 size={18} />
                              Upravit
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(user.id_zamestnanec)}
                              className="rounded-xl bg-red-100 px-4 py-2 font-black text-red-600 flex items-center gap-2 hover:bg-red-500 hover:text-white transition"
                            >
                              <Trash2 size={18} />
                              Smazat
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {roleCards.map((role) => (
            <article key={role.title} className="bg-white rounded-3xl shadow-md p-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <h3 className="text-2xl font-black text-black">{role.title}</h3>
                <span className="rounded-full bg-pozadi px-3 py-1 font-black text-primary">
                  {role.count}
                </span>
              </div>
              <div className="flex -space-x-2 mb-4 min-h-10">
                {role.users.map((user) => (
                  <UserAvatar
                    key={user.id_zamestnanec}
                    user={user}
                    size="sm"
                    className="ring-4 ring-white"
                  />
                ))}
              </div>
              <p className="font-semibold text-gray-600">{role.description}</p>
            </article>
          ))}
        </aside>
      </section>
    </SystemLayout>
  );
}
