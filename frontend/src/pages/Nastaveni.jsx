import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  Clock3,
  KeyRound,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import SystemLayout from "../layouts/SystemLayout";
import PageHeader from "../components/system/PageHeader";

const defaults = {
  nazev_systemu: "Chronis",
  hlavni_email: "info@chronis.cz",
  vychozi_zacatek_smeny: "07:00",
  vychozi_konec_smeny: "15:30",
  upozorneni_nova_absence: true,
  upozorneni_rozhodnuti_absence: true,
  upozorneni_export: true,
  upozorneni_chybejici_odchod: true,
};

const notificationOptions = [
  ["upozorneni_nova_absence", "Nová žádost o absenci"],
  ["upozorneni_rozhodnuti_absence", "Schválení nebo zamítnutí žádosti"],
  ["upozorneni_export", "Dokončený export"],
  ["upozorneni_chybejici_odchod", "Upozornění na chybějící odchod"],
];

const boolValue = (value) => value === true || value === "1" || value === 1;

export default function Nastaveni() {
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const response = await fetch("http://localhost/api/nastaveni.php", {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Nastavení se nepodařilo načíst.");
      }

      const next = { ...defaults };
      Object.entries(data.settings || {}).forEach(([key, item]) => {
        next[key] = item.typ === "boolean" ? boolValue(item.hodnota) : item.hodnota;
      });
      setSettings(next);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Chyba při načítání nastavení." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const settingCards = useMemo(
    () => [
      {
        title: "Docházka",
        description: "Konkrétní směna se nastavuje u každého uživatele individuálně.",
        icon: Clock3,
        value: "Podle zaměstnance",
      },
      {
        title: "Oprávnění",
        description: "Role administrátora, vedoucího směny a zaměstnance.",
        icon: ShieldCheck,
        value: "3 role",
      },
      {
        title: "Firma",
        description: "Dovolená se nastavuje individuálně ve správě konkrétní firmy.",
        icon: Building2,
        value: "Individuálně",
      },
    ],
    [settings]
  );

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const response = await fetch("http://localhost/api/nastaveni.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Nastavení se nepodařilo uložit.");
      }
      setMessage({ type: "success", text: data.message || "Nastavení bylo uloženo." });
      await loadSettings();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Chyba při ukládání nastavení." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SystemLayout className="p-8 xl:p-10">
      <PageHeader eyebrow="Systém" title="Nastavení" />

      {message && (
        <div className={`mb-8 rounded-2xl px-5 py-4 font-bold ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {settingCards.map(({ title, description, icon: Icon, value }) => (
          <article key={title} className="bg-white rounded-3xl shadow-md p-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-primary to-system_modra_svtetlejsi text-white flex items-center justify-center mb-5">
              <Icon size={30} />
            </div>
            <p className="text-gray-500 font-bold">{title}</p>
            <p className="text-2xl font-black text-black mt-1">{loading ? "..." : value}</p>
            <p className="font-semibold text-gray-600 mt-3">{description}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        <div className="bg-white rounded-3xl shadow-md p-7">
          <div className="flex items-center justify-between gap-4 mb-7">
            <div>
              <p className="text-gray-500 font-black uppercase">Obecné nastavení</p>
              <h2 className="text-3xl font-black text-black">Chování systému</h2>
            </div>
            <SlidersHorizontal className="text-primary" size={38} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <label className="block">
              <span className="block text-sm font-black text-gray-500 uppercase mb-2">Název systému</span>
              <input value={settings.nazev_systemu} onChange={(e) => updateSetting("nazev_systemu", e.target.value)} className="w-full bg-pozadi rounded-2xl px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary" />
            </label>
            <label className="block">
              <span className="block text-sm font-black text-gray-500 uppercase mb-2">Hlavní email</span>
              <input type="email" value={settings.hlavni_email} onChange={(e) => updateSetting("hlavni_email", e.target.value)} className="w-full bg-pozadi rounded-2xl px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary" />
            </label>
            <label className="block">
              <span className="block text-sm font-black text-gray-500 uppercase mb-2">Záložní začátek směny</span>
              <input type="time" value={settings.vychozi_zacatek_smeny} onChange={(e) => updateSetting("vychozi_zacatek_smeny", e.target.value)} className="w-full bg-pozadi rounded-2xl px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary" />
            </label>
            <label className="block">
              <span className="block text-sm font-black text-gray-500 uppercase mb-2">Záložní konec směny</span>
              <input type="time" value={settings.vychozi_konec_smeny} onChange={(e) => updateSetting("vychozi_konec_smeny", e.target.value)} className="w-full bg-pozadi rounded-2xl px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary" />
            </label>
          </div>

          <p className="mt-4 font-semibold text-gray-600">
            Běžné denní, noční nebo zkrácené směny vybírejte přímo ve správě uživatele.
            Tyto časy slouží jen jako záloha pro starší záznamy bez přiřazené směny.
          </p>

          <div className="mt-7 rounded-3xl bg-pozadi p-6">
            <h3 className="text-2xl font-black text-black mb-4">Notifikace</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notificationOptions.map(([key, option]) => (
                <label key={key} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 font-bold text-gray-700">
                  <input type="checkbox" checked={Boolean(settings[key])} onChange={(e) => updateSetting(key, e.target.checked)} className="w-5 h-5 accent-primary" />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <button type="button" onClick={saveSettings} disabled={saving} className="mt-7 bg-gradient-to-r from-primary to-system_modra_svtetlejsi text-white rounded-2xl px-7 py-4 font-black flex items-center gap-3 hover:scale-105 transition disabled:opacity-60">
            {saving ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} />}
            Uložit nastavení
          </button>
        </div>

        <aside className="space-y-5">
          <article className="bg-white rounded-3xl shadow-md p-7">
            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-5">
              <KeyRound size={30} />
            </div>
            <h2 className="text-3xl font-black text-black mb-3">Bezpečnost</h2>
            <p className="font-semibold text-gray-600">
              Hesla uživatelů se mění ve správě uživatelů a ukládají se zahashovaná.
            </p>
          </article>

          <article className="bg-white rounded-3xl shadow-md p-7">
            <div className="flex items-center gap-4 mb-4">
              <Mail className="text-primary" size={28} />
              <h3 className="text-2xl font-black text-black">Emailové zprávy</h3>
            </div>
            <p className="font-semibold text-gray-600">
              Hlavní email z nastavení se používá jako systémový kontakt pro exporty a oznámení.
            </p>
          </article>

          <article className="bg-white rounded-3xl shadow-md p-7">
            <div className="flex items-center gap-4 mb-4">
              <Bell className="text-primary" size={28} />
              <h3 className="text-2xl font-black text-black">Upozornění</h3>
            </div>
            <p className="font-semibold text-gray-600">
              Notifikační volby se ukládají do databáze a dají se později použít v backendové logice.
            </p>
          </article>
        </aside>
      </section>
    </SystemLayout>
  );
}
