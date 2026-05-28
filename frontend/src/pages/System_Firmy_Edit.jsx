import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Save,
} from "lucide-react";
import SystemLayout from "../layouts/SystemLayout";
import PageHeader from "../components/system/PageHeader";

const emptyCompany = {
  nazev: "",
  ico: "",
  email: "",
  telefon: "",
  logo_cesta: "",
  dovolena_dni: "25",
  ulice: "",
  cislo_popisne: "",
  id_psc: "",
  obec: "",
};

export default function EditFirma() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [firma, setFirma] = useState(emptyCompany);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isNew) {
      setFirma(emptyCompany);
      setLoading(false);
      return;
    }

    const loadCompany = async () => {
      try {
        setLoading(true);
        setMessage(null);

        const response = await fetch(`http://localhost/api/get_firma_by_id.php?id=${id}`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Firmu se nepodařilo načíst.");
        }

        setFirma(data.firma);
      } catch (error) {
        setMessage({
          type: "error",
          text: error.message || "Chyba při načítání firmy.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [id, isNew]);

  const updateField = (field, value) => {
    setFirma((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage(null);

      const endpoint = isNew ? "create_firma.php" : "update_firma.php";
      const payload = isNew ? firma : { ...firma, id_firma: Number(id) };
      const response = await fetch(`http://localhost/api/${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Firmu se nepodařilo uložit.");
      }

      setMessage({
        type: "success",
        text: data.message || "Firma byla uložena.",
      });

      window.setTimeout(() => navigate("/System_Firmy"), 500);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Chyba při ukládání firmy.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SystemLayout className="p-10">
        <div className="bg-white rounded-3xl shadow-md p-10 flex items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-2xl font-black text-black">Načítání firmy...</p>
        </div>
      </SystemLayout>
    );
  }

  return (
    <SystemLayout className="p-8 xl:p-10">
      <PageHeader
        eyebrow="Správa"
        title={isNew ? "Přidat firmu" : "Editace firmy"}
      />

      <div className="mb-6">
        <Link
          to="/System_Firmy"
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-primary shadow-md hover:bg-primary hover:text-white transition"
        >
          <ArrowLeft size={20} />
          Zpět na firmy
        </Link>
      </div>

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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
        <section className="space-y-8">
          <div className="bg-white rounded-3xl shadow-md p-7">
            <div className="flex items-center gap-4 mb-7">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center">
                <Building2 size={30} />
              </div>
              <div>
                <p className="text-gray-500 font-black uppercase">Firemní údaje</p>
                <h2 className="text-3xl font-black text-black">Základní informace</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block md:col-span-2">
                <span className="block font-black text-gray-600 mb-2">Název firmy</span>
                <input
                  type="text"
                  required
                  value={firma.nazev || ""}
                  onChange={(event) => updateField("nazev", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block">
                <span className="block font-black text-gray-600 mb-2">IČO</span>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={firma.ico || ""}
                  onChange={(event) => updateField("ico", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block">
                <span className="block font-black text-gray-600 mb-2">Telefon</span>
                <input
                  type="text"
                  required
                  value={firma.telefon || ""}
                  onChange={(event) => updateField("telefon", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="block font-black text-gray-600 mb-2">Email</span>
                <input
                  type="email"
                  required
                  value={firma.email || ""}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="block font-black text-gray-600 mb-2">
                  Cesta k logu
                </span>
                <input
                  type="text"
                  value={firma.logo_cesta || ""}
                  onChange={(event) => updateField("logo_cesta", event.target.value)}
                  placeholder="např. images/loga/firma.png"
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="block font-black text-gray-600 mb-2">
                  Roční nárok dovolené
                </span>
                <input
                  type="number"
                  min="20"
                  max="40"
                  required
                  value={firma.dovolena_dni || "25"}
                  onChange={(event) => updateField("dovolena_dni", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-2 text-sm font-bold text-gray-500">
                  Nastavuje se individuálně pro tuto firmu. Rozsah je 20 až 40 pracovních dní.
                </p>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-md p-7">
            <div className="flex items-center gap-4 mb-7">
              <div className="w-14 h-14 rounded-2xl bg-system_modra_svtetlejsi text-white flex items-center justify-center">
                <MapPin size={30} />
              </div>
              <div>
                <p className="text-gray-500 font-black uppercase">Adresa</p>
                <h2 className="text-3xl font-black text-black">Sídlo firmy</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block">
                <span className="block font-black text-gray-600 mb-2">Ulice</span>
                <input
                  type="text"
                  required
                  value={firma.ulice || ""}
                  onChange={(event) => updateField("ulice", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block">
                <span className="block font-black text-gray-600 mb-2">Číslo popisné</span>
                <input
                  type="text"
                  required
                  value={firma.cislo_popisne || ""}
                  onChange={(event) => updateField("cislo_popisne", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block">
                <span className="block font-black text-gray-600 mb-2">PSČ</span>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={firma.id_psc || ""}
                  onChange={(event) => updateField("id_psc", event.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block">
                <span className="block font-black text-gray-600 mb-2">Obec</span>
                <input
                  type="text"
                  required
                  value={firma.obec || ""}
                  onChange={(event) => updateField("obec", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>
          </div>
        </section>

        <aside className="bg-white rounded-3xl shadow-md p-7 h-max">
          <div className="w-16 h-16 rounded-3xl bg-pozadi p-3 flex items-center justify-center mb-6">
            {firma.logo_cesta ? (
              <img
                src={`http://localhost/api/${firma.logo_cesta}`}
                alt=""
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <Building2 className="text-primary" size={34} />
            )}
          </div>

          <h2 className="text-3xl font-black text-black mb-2">
            {firma.nazev || "Nová firma"}
          </h2>
          <p className="font-bold text-gray-600 mb-6">
            {[firma.ulice, firma.cislo_popisne, firma.obec].filter(Boolean).join(" ") ||
              "Adresa zatím není vyplněná"}
          </p>
          <div className="rounded-2xl bg-pozadi px-4 py-3 mb-6">
            <p className="text-sm font-black text-gray-500 uppercase">Dovolená</p>
            <p className="text-2xl font-black text-black">
              {firma.dovolena_dni || 25} dní / rok
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-primary to-system_modra_svtetlejsi text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} />}
            {isNew ? "Vytvořit firmu" : "Uložit změny"}
          </button>

          <div className="mt-6 rounded-3xl bg-pozadi p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-primary shrink-0" size={24} />
              <p className="font-semibold text-gray-700">
                Firma se uloží společně s adresou a PSČ. Po uložení se vrátíte zpět na přehled firem.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </SystemLayout>
  );
}
