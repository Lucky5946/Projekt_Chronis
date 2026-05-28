import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  KeyRound,
  Loader2,
  Save,
  UserRound,
} from "lucide-react";
import SystemLayout from "../layouts/SystemLayout";
import PageHeader from "../components/system/PageHeader";

const emptyUser = {
  jmeno: "",
  prijmeni: "",
  email: "",
  telefon: "",
  fotka_cesta: "",
  fotka_data: "",
  cip: "",
  mzda: "",
  datum_nastupu: "",
  id_pozice: "",
  id_oddeleni: "",
  id_vychozi_smena: "",
  prihlasovaci_jmeno: "",
  heslo: "",
  aktivni: true,
};

export default function UzivatelEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [user, setUser] = useState(emptyUser);
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setMessage(null);

        const endpoint = isNew
          ? "http://localhost/api/get_uzivatele.php"
          : `http://localhost/api/get_uzivatel_by_id.php?id=${id}`;
        const response = await fetch(endpoint, { credentials: "include" });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Uživatele se nepodařilo načíst.");
        }

        setPositions(data.positions || []);
        setDepartments(data.departments || []);
        setShifts(data.shifts || []);

        if (isNew) {
          setUser({
            ...emptyUser,
            id_pozice: data.positions?.[0]?.id_pozice || "",
            id_oddeleni: data.departments?.[0]?.id_oddeleni || "",
            id_vychozi_smena: data.shifts?.[0]?.id_smena || "",
          });
        } else {
          setUser({
            ...data.user,
            heslo: "",
            aktivni: Number(data.user.aktivni) === 1,
          });
        }
      } catch (error) {
        setMessage({
          type: "error",
          text: error.message || "Chyba při načítání uživatele.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isNew]);

  const updateField = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  const photoPreview = user.fotka_data
    || (user.fotka_cesta ? `http://localhost/api/${user.fotka_cesta}` : "");

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateField("fotka_data", String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage(null);

      const endpoint = isNew ? "create_uzivatel.php" : "update_uzivatel.php";
      const payload = isNew ? user : { ...user, id_zamestnanec: Number(id) };
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
        throw new Error(data.message || "Uživatele se nepodařilo uložit.");
      }

      setMessage({
        type: "success",
        text: data.message || "Uživatel byl uložen.",
        passwordSetup: data.passwordSetup || null,
      });
      if (!isNew) {
        window.setTimeout(() => navigate("/uzivatele"), 500);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Chyba při ukládání uživatele.",
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
          <p className="text-2xl font-black text-black">Načítání uživatele...</p>
        </div>
      </SystemLayout>
    );
  }

  return (
    <SystemLayout className="p-8 xl:p-10">
      <PageHeader
        eyebrow="Správa"
        title={isNew ? "Přidat uživatele" : "Editace uživatele"}
      />

      <div className="mb-6">
        <Link
          to="/uzivatele"
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-primary shadow-md hover:bg-primary hover:text-white transition"
        >
          <ArrowLeft size={20} />
          Zpět na uživatele
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
          {message.passwordSetup?.url && (
            <div className="mt-3 rounded-xl bg-white/70 p-3 text-sm">
              <p className="mb-2">{message.passwordSetup.message}</p>
              <a
                href={message.passwordSetup.url}
                target="_blank"
                rel="noreferrer"
                className="break-all underline"
              >
                {message.passwordSetup.url}
              </a>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
        <section className="space-y-8">
          <div className="bg-white rounded-3xl shadow-md p-7">
            <div className="flex items-center gap-4 mb-7">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center">
                <UserRound size={30} />
              </div>
              <div>
                <p className="text-gray-500 font-black uppercase">Osobní údaje</p>
                <h2 className="text-3xl font-black text-black">Zaměstnanec</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block">
                <span className="block font-black text-gray-600 mb-2">Jméno</span>
                <input
                  type="text"
                  required
                  value={user.jmeno || ""}
                  onChange={(event) => updateField("jmeno", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block">
                <span className="block font-black text-gray-600 mb-2">Příjmení</span>
                <input
                  type="text"
                  required
                  value={user.prijmeni || ""}
                  onChange={(event) => updateField("prijmeni", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block">
                <span className="block font-black text-gray-600 mb-2">Email</span>
                <input
                  type="email"
                  required
                  value={user.email || ""}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block">
                <span className="block font-black text-gray-600 mb-2">Telefon</span>
                <input
                  type="text"
                  required
                  value={user.telefon || ""}
                  onChange={(event) => updateField("telefon", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="block font-black text-gray-600 mb-2">Fotka zaměstnance</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoChange}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:font-black file:text-white"
                />
              </label>

              <label className="block">
                <span className="block font-black text-gray-600 mb-2">Čip</span>
                <input
                  type="text"
                  required
                  value={user.cip || ""}
                  onChange={(event) => updateField("cip", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block">
                <span className="block font-black text-gray-600 mb-2">Mzda</span>
                <input
                  type="number"
                  required
                  min="1"
                  value={user.mzda || ""}
                  onChange={(event) => updateField("mzda", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block">
                <span className="block font-black text-gray-600 mb-2">Datum nástupu</span>
                <input
                  type="date"
                  value={user.datum_nastupu || ""}
                  onChange={(event) => updateField("datum_nastupu", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl bg-pozadi px-4 py-4 mt-8">
                <input
                  type="checkbox"
                  checked={Boolean(user.aktivni)}
                  onChange={(event) => updateField("aktivni", event.target.checked)}
                  className="w-5 h-5 accent-primary"
                />
                <span className="font-black text-gray-700">Aktivní účet</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-md p-7">
            <div className="flex items-center gap-4 mb-7">
              <div className="w-14 h-14 rounded-2xl bg-system_modra_svtetlejsi text-white flex items-center justify-center">
                <BadgeCheck size={30} />
              </div>
              <div>
                <p className="text-gray-500 font-black uppercase">Zařazení</p>
                <h2 className="text-3xl font-black text-black">Role a oddělení</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block">
                <span className="block font-black text-gray-600 mb-2">Role</span>
                <select
                  required
                  value={user.id_pozice || ""}
                  onChange={(event) => updateField("id_pozice", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                >
                  {positions.map((position) => (
                    <option key={position.id_pozice} value={position.id_pozice}>
                      {position.nazev}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block font-black text-gray-600 mb-2">Oddělení</span>
                <select
                  required
                  value={user.id_oddeleni || ""}
                  onChange={(event) => updateField("id_oddeleni", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                >
                  {departments.map((department) => (
                    <option key={department.id_oddeleni} value={department.id_oddeleni}>
                      {department.firma ? `${department.firma} - ` : ""}
                      {department.nazev}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="block font-black text-gray-600 mb-2">Výchozí směna</span>
                <select
                  required
                  value={user.id_vychozi_smena || ""}
                  onChange={(event) => updateField("id_vychozi_smena", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                >
                  {shifts.map((shift) => (
                    <option key={shift.id_smena} value={shift.id_smena}>
                      {shift.nazev} ({shift.cas_od} - {shift.cas_do}, {shift.uvazek_minut} min)
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-md p-7">
            <div className="flex items-center gap-4 mb-7">
              <div className="w-14 h-14 rounded-2xl bg-seda text-white flex items-center justify-center">
                <KeyRound size={30} />
              </div>
              <div>
                <p className="text-gray-500 font-black uppercase">Přihlášení</p>
                <h2 className="text-3xl font-black text-black">Účet</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block">
                <span className="block font-black text-gray-600 mb-2">
                  Přihlašovací jméno
                </span>
                <input
                  type="text"
                  required
                  value={user.prihlasovaci_jmeno || ""}
                  onChange={(event) => updateField("prihlasovaci_jmeno", event.target.value)}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block">
                <span className="block font-black text-gray-600 mb-2">
                  {isNew ? "Heslo ručně (volitelné)" : "Nové heslo"}
                </span>
                <input
                  type="password"
                  value={user.heslo || ""}
                  onChange={(event) => updateField("heslo", event.target.value)}
                  placeholder={isNew ? "Prázdné = uživatel si heslo nastaví z emailu" : "Nechte prázdné pro zachování hesla"}
                  className="w-full rounded-2xl bg-pozadi px-4 py-4 font-bold text-black outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>
          </div>
        </section>

        <aside className="bg-white rounded-3xl shadow-md p-7 h-max xl:sticky xl:top-8 self-start">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Fotka zaměstnance"
              className="w-20 h-20 rounded-3xl object-cover bg-pozadi mb-6"
            />
          ) : (
            <div className="w-16 h-16 rounded-3xl bg-pozadi text-primary flex items-center justify-center mb-6">
              <UserRound size={34} />
            </div>
          )}

          <h2 className="text-3xl font-black text-black mb-2">
            {[user.jmeno, user.prijmeni].filter(Boolean).join(" ") || "Nový uživatel"}
          </h2>
          <p className="font-bold text-gray-600 mb-6">
            {positions.find((position) => String(position.id_pozice) === String(user.id_pozice))
              ?.nazev || "Role není vybraná"}
          </p>

          <div className="mb-6 rounded-3xl bg-pozadi p-5">
            <div className="flex items-start gap-3">
              <CalendarClock className="text-primary shrink-0" size={24} />
              <div>
                <p className="font-black text-black">Výchozí směna</p>
                <p className="font-semibold text-gray-600">
                  {(() => {
                    const shift = shifts.find(
                      (item) => String(item.id_smena) === String(user.id_vychozi_smena)
                    );
                    return shift
                      ? `${shift.nazev}, ${shift.cas_od} - ${shift.cas_do}`
                      : "Směna není vybraná";
                  })()}
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-primary to-system_modra_svtetlejsi text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} />}
            {isNew ? "Vytvořit uživatele" : "Uložit změny"}
          </button>

          <div className="mt-6 rounded-3xl bg-pozadi p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-primary shrink-0" size={24} />
              <p className="font-semibold text-gray-700">
                Heslo se ukládá zahashované. Při editaci stačí nechat pole hesla prázdné, pokud ho nechcete měnit.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </SystemLayout>
  );
}
