import { useEffect, useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  Settings2,
} from "lucide-react";
import SystemLayout from "../layouts/SystemLayout";
import PageHeader from "../components/system/PageHeader";

const exportTypes = [
  {
    id: "dochazka",
    title: "Docházka zaměstnanců",
    description: "Příchody, odchody, pauzy a odpracované hodiny za vybrané období.",
    icon: FileSpreadsheet,
    accent: "from-green-500 to-green-700",
  },
  {
    id: "absence",
    title: "Absence a žádosti",
    description: "Schválené i zamítnuté absence včetně důvodu a stavu žádosti.",
    icon: CalendarRange,
    accent: "from-system_cervena_tmavsi to-system_cervena_svetlejsi",
  },
  {
    id: "mzdy",
    title: "Souhrn pro mzdy",
    description: "Připravený přehled hodin, přesčasů a absencí pro další zpracování.",
    icon: Database,
    accent: "from-primary to-system_modra_svtetlejsi",
  },
];

const formatOptions = ["CSV", "XLSX"];

const typeLabels = {
  dochazka: "Docházka",
  absence: "Absence",
  mzdy: "Mzdy",
  uzivatele: "Uživatelé",
  firmy: "Firmy",
};

export default function Exporty() {
  const now = new Date();
  const [selectedType, setSelectedType] = useState("dochazka");
  const [settings, setSettings] = useState({
    from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
    departmentId: "0",
    format: "CSV",
  });
  const [departments, setDepartments] = useState([]);
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState(null);

  const loadExports = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost/api/exporty.php", {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Exporty se nepodařilo načíst.");
      }
      setExports(data.exports || []);
      setDepartments(data.departments || []);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Chyba při načítání exportů." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExports();
  }, []);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const generateExport = async () => {
    try {
      setGenerating(true);
      setMessage(null);
      const response = await fetch("http://localhost/api/exporty.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          format: settings.format.toLowerCase(),
          from: settings.from,
          to: settings.to,
          departmentId: settings.departmentId,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Export se nepodařilo vygenerovat.");
      }
      setExports(data.exports || []);
      setMessage({ type: "success", text: data.message || "Export byl vygenerován." });
      if (data.fileUrl) {
        window.open(data.fileUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Chyba při generování exportu." });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SystemLayout className="p-8 xl:p-10">
      <PageHeader eyebrow="Reporty" title="Exporty" />

      {message && (
        <div className={`mb-8 rounded-2xl px-5 py-4 font-bold ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8 mb-8">
        <div>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-gray-500 font-black uppercase">Typ exportu</p>
              <h2 className="text-3xl font-black text-black">Co chcete připravit?</h2>
            </div>
            <Download className="text-primary hidden md:block" size={40} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-1 gap-5">
            {exportTypes.map(({ id, title, description, icon: Icon, accent }) => (
              <button key={id} type="button" onClick={() => setSelectedType(id)} className={`text-left rounded-3xl p-6 shadow-md transition hover:-translate-y-1 bg-white ${selectedType === id ? "ring-2 ring-primary" : ""}`}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${accent} text-white flex items-center justify-center mb-5`}>
                  <Icon size={30} />
                </div>
                <h3 className="text-2xl font-black text-black mb-2">{title}</h3>
                <p className="font-semibold text-gray-600">{description}</p>
              </button>
            ))}
          </div>
        </div>

        <aside className="bg-white rounded-3xl shadow-md p-7 h-max">
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-5">
            <Settings2 size={30} />
          </div>
          <h2 className="text-3xl font-black text-black mb-6">Nastavení exportu</h2>

          <div className="space-y-5">
            <label className="block">
              <span className="block text-sm font-black text-gray-500 uppercase mb-2">Období od</span>
              <input type="date" value={settings.from} onChange={(e) => updateSetting("from", e.target.value)} className="w-full bg-pozadi rounded-2xl px-4 py-4 font-bold text-black outline-none" />
            </label>
            <label className="block">
              <span className="block text-sm font-black text-gray-500 uppercase mb-2">Období do</span>
              <input type="date" value={settings.to} onChange={(e) => updateSetting("to", e.target.value)} className="w-full bg-pozadi rounded-2xl px-4 py-4 font-bold text-black outline-none" />
            </label>
            <label className="block">
              <span className="block text-sm font-black text-gray-500 uppercase mb-2">Oddělení</span>
              <div className="relative">
                <select value={settings.departmentId} onChange={(e) => updateSetting("departmentId", e.target.value)} className="w-full appearance-none bg-pozadi rounded-2xl py-4 pl-4 pr-12 font-bold text-black outline-none">
                  <option value="0">Všechna oddělení</option>
                  {departments.map((department) => (
                    <option key={department.id_oddeleni} value={department.id_oddeleni}>{department.nazev}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              </div>
            </label>
          </div>

          <div className="mt-6">
            <p className="text-sm font-black text-gray-500 uppercase mb-3">Formát</p>
            <div className="grid grid-cols-1 gap-3">
              {formatOptions.map((format) => (
                <button key={format} type="button" onClick={() => updateSetting("format", format)} className={`rounded-2xl py-3 font-black transition ${settings.format === format ? "bg-primary text-white" : "bg-pozadi text-black hover:bg-primary/10"}`}>
                  {format}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={generateExport} disabled={generating} className="w-full mt-7 bg-gradient-to-r from-primary to-system_modra_svtetlejsi text-white rounded-2xl py-4 font-black flex items-center justify-center gap-3 hover:scale-105 transition disabled:opacity-60">
            {generating ? <Loader2 className="animate-spin" size={22} /> : <Download size={22} />}
            Vygenerovat export
          </button>
        </aside>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-8">
        <article className="bg-white rounded-3xl shadow-md p-7">
          <p className="text-gray-500 font-black uppercase mb-2">Průběh</p>
          <h2 className="text-3xl font-black text-black mb-6">Stav přípravy</h2>
          <div className="space-y-5">
            {[
              ["Výběr dat", "Hotovo"],
              ["Kontrola období", settings.from <= settings.to ? "Hotovo" : "Zkontrolujte datum"],
              ["Generování souboru", generating ? "Pracuji" : "Připraveno"],
            ].map(([label, status], index) => (
              <div key={label} className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${index < 2 ? "bg-green-100 text-green-700" : "bg-pozadi text-primary"}`}>
                  {index < 2 ? <CheckCircle2 size={26} /> : <RefreshCw size={26} className={generating ? "animate-spin" : ""} />}
                </div>
                <div>
                  <p className="text-xl font-black text-black">{label}</p>
                  <p className="font-bold text-gray-500">{status}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="bg-white rounded-3xl shadow-md p-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <p className="text-gray-500 font-black uppercase">Historie</p>
              <h2 className="text-3xl font-black text-black">Poslední exporty</h2>
            </div>
            <FileText className="text-primary" size={36} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="text-sm font-black uppercase text-gray-500 border-b border-pozadi">
                  <th className="py-4 pr-4">Soubor</th>
                  <th className="py-4 pr-4">Typ</th>
                  <th className="py-4 pr-4">Vytvořeno</th>
                  <th className="py-4 pr-4">Stav</th>
                  <th className="py-4">Akce</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className="py-8 text-center font-black text-black">Načítání exportů...</td></tr>
                )}
                {!loading && exports.map((item) => (
                  <tr key={item.id_export} className="border-b border-pozadi last:border-none">
                    <td className="py-4 pr-4 font-black text-black">{item.nazev_souboru}</td>
                    <td className="py-4 pr-4 font-bold text-gray-600">{typeLabels[item.typ] || item.typ}</td>
                    <td className="py-4 pr-4 font-bold text-gray-600">{item.vytvoreno}</td>
                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-black text-green-700">{item.stav}</span>
                    </td>
                    <td className="py-4">
                      {item.cesta_souboru ? (
                        <a href={`http://localhost/api/${item.cesta_souboru}`} target="_blank" rel="noreferrer" className="rounded-xl bg-pozadi px-4 py-2 font-black text-primary hover:bg-primary hover:text-white transition inline-block">
                          Stáhnout
                        </a>
                      ) : (
                        <span className="font-bold text-gray-500">Bez souboru</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </SystemLayout>
  );
}
