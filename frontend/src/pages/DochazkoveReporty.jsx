import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Clock3,
  Filter,
  Search,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import SystemLayout from "../layouts/SystemLayout";
import PageHeader from "../components/system/PageHeader";

const dayLabels = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

const formatHours = (minutes) => `${((Number(minutes) || 0) / 60).toFixed(1)} h`;

const formatArrival = (seconds) => {
  if (!seconds) return "--:--";
  const rounded = Math.round(seconds / 60) * 60;
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export default function DochazkoveReporty() {
  const now = new Date();
  const [filters, setFilters] = useState({
    from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
    companyId: "0",
    departmentId: "0",
    search: "",
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const params = new URLSearchParams(filters);
      const response = await fetch(`http://localhost/api/dochazkove_reporty.php?${params}`, {
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Report se nepodařilo načíst.");
      }
      setData(result);
    } catch (error) {
      setMessage(error.message || "Chyba při načítání reportu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const stats = useMemo(() => {
    const summary = data?.summary || {};
    return [
      {
        label: "Odpracováno",
        value: formatHours(summary.totalMinutes),
        note: `${summary.employeeCount || 0} zaměstnanců v přehledu`,
        icon: Clock3,
        color: "from-system_modra_tmavsi to-system_modra_svtetlejsi",
      },
      {
        label: "Průměrný příchod",
        value: formatArrival(summary.averageArrivalSeconds),
        note: "počítáno z vyplněných příchodů",
        icon: UserCheck,
        color: "from-primary to-system_modra_svtetlejsi",
      },
      {
        label: "Absence",
        value: `${summary.absenceDays || 0} dnů`,
        note: "z docházkových stavů",
        icon: CalendarDays,
        color: "from-system_cervena_tmavsi to-system_cervena_svetlejsi",
      },
      {
        label: "Přesčas",
        value: formatHours(summary.overtimeMinutes),
        note: "nad 8 hodin denně",
        icon: TrendingUp,
        color: "from-seda to-system_modra_tmavsi",
      },
    ];
  }, [data]);

  const weeklyOverview = useMemo(() => {
    const rows = data?.weekly || [];
    const max = Math.max(...rows.map((item) => Number(item.minutes) || 0), 1);
    return rows.map((item) => ({
      label: dayLabels[item.day],
      hours: formatHours(item.minutes),
      percent: Math.max(Math.round(((Number(item.minutes) || 0) / max) * 100), 6),
    }));
  }, [data]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "companyId" ? { departmentId: "0" } : {}),
    }));
  };

  const isAdminScope = data?.scope === "all";

  return (
    <SystemLayout className="p-8 xl:p-10">
      <PageHeader eyebrow="Reporty" title="Docházkové reporty" />

      {message && (
        <div className="mb-8 rounded-2xl bg-red-100 text-red-700 px-5 py-4 font-bold">
          {message}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {stats.map(({ label, value, note, icon: Icon, color }) => (
          <article key={label} className="bg-white rounded-3xl shadow-md p-6">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${color} text-white flex items-center justify-center mb-5`}>
              <Icon size={30} />
            </div>
            <p className="text-gray-500 font-bold">{label}</p>
            <p className="text-3xl font-black text-black mt-1">{loading ? "..." : value}</p>
            <p className="text-sm font-bold text-gray-500 mt-3">{note}</p>
          </article>
        ))}
      </section>

      <section className="bg-white rounded-3xl shadow-md p-6 mb-8">
        <div className="flex flex-col xl:flex-row xl:items-end gap-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
            <label className="block">
              <span className="block text-sm font-black text-gray-500 uppercase mb-2">Od</span>
              <input type="date" value={filters.from} onChange={(e) => updateFilter("from", e.target.value)} className="w-full bg-pozadi rounded-2xl px-4 py-4 font-bold text-black outline-none" />
            </label>
            <label className="block">
              <span className="block text-sm font-black text-gray-500 uppercase mb-2">Do</span>
              <input type="date" value={filters.to} onChange={(e) => updateFilter("to", e.target.value)} className="w-full bg-pozadi rounded-2xl px-4 py-4 font-bold text-black outline-none" />
            </label>
            {isAdminScope ? (
              <label className="block">
                <span className="block text-sm font-black text-gray-500 uppercase mb-2">Firma</span>
                <select value={filters.companyId} onChange={(e) => updateFilter("companyId", e.target.value)} className="w-full bg-pozadi rounded-2xl px-4 py-4 font-bold text-black outline-none">
                  <option value="0">Všechny firmy</option>
                  {(data?.companies || []).map((company) => (
                    <option key={company.id_firma} value={company.id_firma}>{company.nazev}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block">
                <span className="block text-sm font-black text-gray-500 uppercase mb-2">Oddělení</span>
                <select value={filters.departmentId} onChange={(e) => updateFilter("departmentId", e.target.value)} className="w-full bg-pozadi rounded-2xl px-4 py-4 font-bold text-black outline-none">
                  <option value="0">Všechna oddělení</option>
                  {(data?.departments || []).map((department) => (
                    <option key={department.id_oddeleni} value={department.id_oddeleni}>{department.nazev}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="block">
              <span className="block text-sm font-black text-gray-500 uppercase mb-2">Zaměstnanec</span>
              <div className="flex items-center gap-3 bg-pozadi rounded-2xl px-4 py-4">
                <Search size={20} className="text-gray-500" />
                <input value={filters.search} onChange={(e) => updateFilter("search", e.target.value)} className="w-full bg-transparent font-bold text-black outline-none" placeholder="Vyhledat osobu" />
              </div>
            </label>
          </div>
          <button type="button" onClick={loadReport} className="h-14 px-6 rounded-2xl bg-primary text-white font-black flex items-center justify-center gap-3 hover:scale-105 transition">
            <Filter size={22} />
            Použít filtr
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8 mb-8">
        <article className="bg-white rounded-3xl shadow-md p-7">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-gray-500 font-black uppercase">Týdenní průběh</p>
              <h2 className="text-3xl font-black text-black">Odpracované hodiny</h2>
            </div>
            <BarChart3 className="text-primary" size={38} />
          </div>

          <div className="h-72 flex items-end gap-4">
            {weeklyOverview.map((item) => (
              <div key={item.label} className="flex-1 flex flex-col items-center gap-3">
                <div className="w-full h-56 flex items-end rounded-2xl bg-pozadi overflow-hidden">
                  <div className="w-full bg-gradient-to-t from-primary to-system_modra_svtetlejsi rounded-t-2xl" style={{ height: `${item.percent}%` }} />
                </div>
                <div className="text-center">
                  <p className="font-black text-black">{item.label}</p>
                  <p className="text-sm font-bold text-gray-500">{item.hours}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="bg-white rounded-3xl shadow-md p-7">
          <p className="text-gray-500 font-black uppercase mb-2">Oddělení</p>
          <h2 className="text-3xl font-black text-black mb-6">Souhrn týmů</h2>
          <div className="space-y-4">
            {(data?.departmentRows || []).map((row) => (
              <div key={row.id_oddeleni} className="rounded-2xl bg-pozadi p-5">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <h3 className="text-xl font-black text-black">{row.oddeleni}</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-primary">{row.lide} lidí</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm font-bold text-gray-600">
                  <span>{formatHours(row.minuty)}</span>
                  <span>{row.absence} abs.</span>
                  <span>{formatHours(row.prescas)} přesčas</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="bg-white rounded-3xl shadow-md p-7">
        <div className="mb-6">
          <p className="text-gray-500 font-black uppercase">Přehled zaměstnanců</p>
          <h2 className="text-3xl font-black text-black">Docházka za období</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="text-sm font-black uppercase text-gray-500 border-b border-pozadi">
                <th className="py-4 pr-4">Zaměstnanec</th>
                <th className="py-4 pr-4">Oddělení</th>
                <th className="py-4 pr-4">Průměrný příchod</th>
                <th className="py-4 pr-4">Hodiny</th>
                <th className="py-4">Stav</th>
              </tr>
            </thead>
            <tbody>
              {(data?.employeeRows || []).map((row) => {
                const needsCheck = Number(row.neuzavreno) > 0 || Number(row.pozdni) > 0;
                return (
                  <tr key={row.id_zamestnanec} className="border-b border-pozadi last:border-none">
                    <td className="py-4 pr-4 font-black text-black">{row.jmeno}</td>
                    <td className="py-4 pr-4 font-bold text-gray-600">{row.oddeleni || "Neuvedeno"}</td>
                    <td className="py-4 pr-4 font-bold text-gray-600">{formatArrival(row.prumer_prichod)}</td>
                    <td className="py-4 pr-4 font-bold text-gray-600">{formatHours(row.minuty)}</td>
                    <td className="py-4">
                      <span className={`rounded-full px-3 py-1 text-sm font-black ${needsCheck ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                        {needsCheck ? "Ke kontrole" : "V normě"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </SystemLayout>
  );
}
