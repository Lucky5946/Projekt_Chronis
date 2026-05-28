import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Building2,
  Edit3,
  Mail,
  MapPin,
  Phone,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import SystemLayout from "../layouts/SystemLayout";
import PageHeader from "../components/system/PageHeader";

export default function SystemFirmy() {
  const [firmy, setFirmy] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const fetchFirmy = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch("http://localhost/api/get_firmy.php", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Firmy se nepodařilo načíst.");
      }

      setFirmy(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setFirmy([]);
      setMessage({
        type: "error",
        text: error.message || "Chyba při načítání firem.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirmy();
  }, []);

  const filteredCompanies = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return firmy;

    return firmy.filter((firma) =>
      [firma.nazev, firma.obec, firma.email, firma.telefon, firma.ico]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [firmy, search]);

  const handleDelete = async (companyId) => {
    if (!window.confirm("Opravdu chcete smazat tuto firmu?")) return;

    try {
      const response = await axios.delete(
        `http://localhost/api/delete_company.php?id=${companyId}`,
        { withCredentials: true }
      );

      setMessage({
        type: "success",
        text: response.data?.message || "Firma byla smazána.",
      });
      fetchFirmy();
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Chyba při mazání firmy.",
      });
    }
  };

  return (
    <SystemLayout className="p-8 xl:p-10">
      <PageHeader eyebrow="Správa" title="Firmy" />

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8 mb-8">
        <div className="bg-white rounded-3xl shadow-md p-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-gray-500 font-black uppercase">Firemní databáze</p>
              <h2 className="text-3xl font-black text-black">
                Přehled společností
              </h2>
              <p className="font-semibold text-gray-600 mt-2">
                Kontakty, sídla a rychlá správa firem napojených na Chronis.
              </p>
            </div>

            <Link
              to="/System_Firmy_Edit/new"
              className="h-14 px-6 rounded-2xl bg-primary text-white font-black flex items-center justify-center gap-3 hover:scale-105 transition"
            >
              <PlusCircle size={22} />
              Přidat firmu
            </Link>
          </div>

          <div className="mt-7 flex items-center gap-3 bg-pozadi rounded-2xl px-4 py-4">
            <Search size={22} className="text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent font-bold text-black outline-none"
              placeholder="Vyhledat podle názvu, IČO, obce, emailu nebo telefonu"
            />
          </div>
        </div>

        <aside className="bg-white rounded-3xl shadow-md p-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-primary to-system_modra_svtetlejsi text-white flex items-center justify-center mb-5">
            <Building2 size={30} />
          </div>
          <p className="text-gray-500 font-bold">Počet firem</p>
          <p className="text-5xl font-black text-black mt-1">
            {loading ? "..." : firmy.length}
          </p>
          <p className="font-semibold text-gray-600 mt-4">
            Zobrazeno: {filteredCompanies.length}
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

      {loading ? (
        <section className="bg-white rounded-3xl shadow-md p-10 text-center">
          <Building2 className="mx-auto text-primary mb-4" size={48} />
          <p className="text-2xl font-black text-black">Načítání firem...</p>
        </section>
      ) : filteredCompanies.length > 0 ? (
        <section className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredCompanies.map((firma) => (
            <article
              key={firma.id_firma}
              className="bg-white rounded-3xl shadow-md p-6 flex flex-col min-h-[380px]"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="w-20 h-20 rounded-3xl bg-pozadi p-3 flex items-center justify-center shrink-0">
                  {firma.logo_cesta ? (
                    <img
                      src={`http://localhost/api/${firma.logo_cesta}`}
                      alt={`Logo firmy ${firma.nazev}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Building2 className="text-primary" size={34} />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(firma.id_firma)}
                  className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-500 hover:text-white transition"
                  aria-label={`Smazat firmu ${firma.nazev}`}
                >
                  <Trash2 size={21} />
                </button>
              </div>

              <div className="mb-6">
                <h2 className="text-3xl font-black text-black leading-tight">
                  {firma.nazev}
                </h2>
                <p className="font-bold text-gray-500 mt-2">
                  IČO: {firma.ico || "neuvedeno"}
                </p>
                <p className="font-bold text-primary mt-1">
                  Dovolená: {firma.dovolena_dni || 25} dní / rok
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 rounded-2xl bg-pozadi px-4 py-3">
                  <MapPin size={20} className="text-primary shrink-0" />
                  <span className="font-bold text-gray-700">
                    {[firma.ulice, firma.cislo_popisne, firma.obec]
                      .filter(Boolean)
                      .join(" ") || "Adresa není vyplněná"}
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-pozadi px-4 py-3">
                  <Phone size={20} className="text-primary shrink-0" />
                  <span className="font-bold text-gray-700">
                    {firma.telefon || "Telefon není vyplněný"}
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-pozadi px-4 py-3">
                  <Mail size={20} className="text-primary shrink-0" />
                  <span className="font-bold text-gray-700 break-all">
                    {firma.email || "Email není vyplněný"}
                  </span>
                </div>
              </div>

              <Link
                to={`/System_Firmy_Edit/${firma.id_firma}`}
                className="mt-auto w-full bg-gradient-to-r from-primary to-system_modra_svtetlejsi text-white rounded-2xl py-4 font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition"
              >
                <Edit3 size={22} />
                Upravit firmu
              </Link>
            </article>
          ))}
        </section>
      ) : (
        <section className="bg-white rounded-3xl shadow-md p-10 text-center">
          <Building2 className="mx-auto text-primary mb-4" size={48} />
          <p className="text-2xl font-black text-black">Žádná firma nenalezena.</p>
          <p className="font-semibold text-gray-600 mt-2">
            Zkuste změnit hledaný výraz nebo přidat novou firmu.
          </p>
        </section>
      )}
    </SystemLayout>
  );
}
