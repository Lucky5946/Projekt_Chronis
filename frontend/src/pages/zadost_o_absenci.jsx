import { useMemo, useState } from "react";
import SystemLayout from "../layouts/SystemLayout";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  HeartPulse,
  MapPin,
  Plane,
  Send,
  ShieldQuestion,
  TimerReset,
} from "lucide-react";
import PageHeader from "../components/system/PageHeader";

const absenceTypes = [
  {
    id: "1",
    title: "Dovolená",
    description: "Plánovaná dovolená nebo osobní volno.",
    icon: Plane,
  },
  {
    id: "2",
    title: "Nemoc",
    description: "Nepřítomnost ze zdravotních důvodů.",
    icon: HeartPulse,
  },
  {
    id: "3",
    title: "Lékař",
    description: "Návštěva lékaře nebo zdravotnického zařízení.",
    icon: ShieldQuestion,
  },
  {
    id: "4",
    title: "Home office",
    description: "Práce mimo pracoviště po domluvě s vedoucím.",
    icon: ClipboardCheck,
  },
  {
    id: "5",
    title: "Propustka",
    description: "Krátkodobé opuštění pracoviště během směny.",
    icon: TimerReset,
  },
];

const formatCzechDate = (value) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
};

export default function ZadostOAbsenci() {
  const [formData, setFormData] = useState({
    datumOd: "",
    datumDo: "",
    casOd: "",
    casDo: "",
    misto: "",
    duvod: "",
    idTyp: "",
  });

  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedType = absenceTypes.find((type) => type.id === formData.idTyp);
  const isPropustka = selectedType?.title === "Propustka";

  const daysCount = useMemo(() => {
    if (!formData.datumOd || !formData.datumDo) return null;

    const start = new Date(formData.datumOd);
    const end = new Date(formData.datumDo);
    const difference = end.getTime() - start.getTime();

    if (Number.isNaN(difference) || difference < 0) return null;

    return Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;
  }, [formData.datumDo, formData.datumOd]);

  const formattedTerm =
    formData.datumOd && formData.datumDo
      ? `${formatCzechDate(formData.datumOd)} - ${formatCzechDate(formData.datumDo)}`
      : "Není vyplněn";

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleTypeSelect = (id) => {
    const nextType = absenceTypes.find((type) => type.id === id);
    const nextIsPropustka = nextType?.title === "Propustka";

    setFormData((prev) => ({
      ...prev,
      idTyp: id,
      casOd: nextIsPropustka ? prev.casOd : "",
      casDo: nextIsPropustka ? prev.casDo : "",
      misto: nextIsPropustka ? prev.misto : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.idTyp) {
      setSubmitStatus({
        type: "error",
        message: "Vyberte typ žádosti.",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const res = await fetch("http://localhost/api/zadost_absence.php", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitStatus({
          type: "success",
          message: "Žádost o absenci byla úspěšně odeslána.",
        });
        setFormData({
          datumOd: "",
          datumDo: "",
          casOd: "",
          casDo: "",
          misto: "",
          duvod: "",
          idTyp: "",
        });
      } else {
        setSubmitStatus({
          type: "error",
          message: data.message || "Žádost se nepodařilo odeslat.",
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "Chyba při připojení k serveru.",
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SystemLayout className="p-10">
        <PageHeader eyebrow="Docházka" title="Žádost o absenci" />

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_0.85fr] gap-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-8 shadow-md"
          >
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
                <ClipboardCheck size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-black">
                  Vyplnění žádosti
                </h2>
                <p className="text-gray-600 font-semibold">
                  Zadejte termín, typ absence a krátké odůvodnění.
                </p>
              </div>
            </div>

            <div className="mb-7">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
                <div>
                  <p className="text-gray-500 font-black uppercase">Typ žádosti</p>
                  <h3 className="text-2xl font-black text-black">
                    Nejdřív vyberte, o co žádáte
                  </h3>
                </div>
                <span className="text-sm font-black text-gray-500">
                  {selectedType ? selectedType.title : "Nevybráno"}
                </span>
              </div>

              <div className="rounded-3xl bg-pozadi p-2 grid grid-cols-2 xl:grid-cols-4 gap-2">
                {absenceTypes.map(({ id, title, description, icon: Icon }) => {
                  const isSelected = formData.idTyp === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleTypeSelect(id)}
                      title={description}
                      className={`min-h-[92px] rounded-2xl px-3 py-4 flex flex-col items-center justify-center text-center transition ${
                        isSelected
                          ? "bg-primary text-white shadow-md"
                          : "bg-white text-black hover:bg-primary/10"
                      }`}
                    >
                      <Icon
                        size={28}
                        className={isSelected ? "text-white mb-2" : "text-primary mb-2"}
                      />
                      <span className="text-base font-black leading-tight">{title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl bg-pozadi p-5 mb-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-gray-500 font-black uppercase">Termín</p>
                  <h3 className="text-2xl font-black text-black">
                    {isPropustka ? "Kdy budete mimo pracoviště" : "Vyberte období absence"}
                  </h3>
                </div>
                <div className="hidden md:flex w-12 h-12 rounded-2xl bg-white text-primary items-center justify-center">
                  <CalendarDays size={26} />
                </div>
              </div>

              <div className={`grid grid-cols-1 ${isPropustka ? "xl:grid-cols-2" : "md:grid-cols-2"} gap-4`}>
                <label className="rounded-2xl bg-white p-4 block">
                  <span className="flex items-center gap-2 text-sm font-black uppercase text-gray-500 mb-3">
                    <CalendarDays size={18} className="text-primary" />
                    Datum od
                  </span>
                  <input
                    type="date"
                    name="datumOd"
                    value={formData.datumOd}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent text-2xl font-black text-black focus:outline-none"
                  />
                </label>

                <label className="rounded-2xl bg-white p-4 block">
                  <span className="flex items-center gap-2 text-sm font-black uppercase text-gray-500 mb-3">
                    <CalendarDays size={18} className="text-primary" />
                    Datum do
                  </span>
                  <input
                    type="date"
                    name="datumDo"
                    value={formData.datumDo}
                    onChange={handleChange}
                    required
                    min={formData.datumOd || undefined}
                    className="w-full bg-transparent text-2xl font-black text-black focus:outline-none"
                  />
                </label>
              </div>

              {isPropustka && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <label className="rounded-2xl bg-white p-4 block">
                    <span className="flex items-center gap-2 text-sm font-black uppercase text-gray-500 mb-3">
                      <Clock3 size={18} className="text-primary" />
                      Čas od
                    </span>
                    <input
                      type="time"
                      name="casOd"
                      value={formData.casOd}
                      onChange={handleChange}
                      required
                      className="w-full bg-transparent text-2xl font-black text-black focus:outline-none"
                    />
                  </label>

                  <label className="rounded-2xl bg-white p-4 block">
                    <span className="flex items-center gap-2 text-sm font-black uppercase text-gray-500 mb-3">
                      <Clock3 size={18} className="text-primary" />
                      Čas do
                    </span>
                    <input
                      type="time"
                      name="casDo"
                      value={formData.casDo}
                      onChange={handleChange}
                      required
                      className="w-full bg-transparent text-2xl font-black text-black focus:outline-none"
                    />
                  </label>

                  <label className="rounded-2xl bg-white p-4 block">
                    <span className="flex items-center gap-2 text-sm font-black uppercase text-gray-500 mb-3">
                      <MapPin size={18} className="text-primary" />
                      Místo
                    </span>
                    <input
                      name="misto"
                      value={formData.misto}
                      onChange={handleChange}
                      className="w-full bg-transparent text-xl font-black text-black focus:outline-none"
                      placeholder="Například lékař"
                    />
                  </label>
                </div>
              )}
            </div>

            <label className="block mb-6">
              <span className="font-black text-lg text-black">Důvod žádosti</span>
              <textarea
                name="duvod"
                value={formData.duvod}
                onChange={handleChange}
                required
                rows={5}
                className="mt-2 w-full py-4 px-4 bg-pozadi rounded-2xl font-semibold text-black resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Například: plánovaná dovolená, nemoc, ošetřování..."
              />
            </label>

            {submitStatus && (
              <div
                className={`mb-6 rounded-2xl px-5 py-4 font-bold ${
                  submitStatus.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {submitStatus.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white px-6 py-4 rounded-2xl font-black text-xl hover:bg-primary/90 transition flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send size={24} />
              {isSubmitting ? "Odesílám..." : "Odeslat žádost"}
            </button>
          </form>

          <aside className="space-y-6 xl:sticky xl:top-8 self-start">
            <div className="bg-white rounded-3xl p-8 shadow-md">
              <h2 className="text-3xl font-black mb-6 text-black">Souhrn</h2>
              <div className="space-y-4">
                <div className="flex justify-between gap-4 border-b border-pozadi pb-4">
                  <span className="font-bold text-gray-500">Typ</span>
                  <span className="font-black text-black text-right">
                    {selectedType?.title || "Nevybráno"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-b border-pozadi pb-4">
                  <span className="font-bold text-gray-500">Termín</span>
                  <span className="font-black text-black text-right">
                    {formattedTerm}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-bold text-gray-500">Počet dní</span>
                  <span className="font-black text-black">
                    {daysCount ? `${daysCount} dní` : "-"}
                  </span>
                </div>
                {isPropustka && (
                  <div className="flex justify-between gap-4 border-t border-pozadi pt-4">
                    <span className="font-bold text-gray-500">Čas</span>
                    <span className="font-black text-black text-right">
                      {formData.casOd && formData.casDo
                        ? `${formData.casOd} - ${formData.casDo}`
                        : "Není vyplněn"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-system_modra_tmavsi to-system_modra_svtetlejsi rounded-3xl p-8 text-white shadow-md">
              <CheckCircle2 size={40} className="mb-4" />
              <h2 className="text-3xl font-black mb-3">Po odeslání</h2>
              <p className="font-semibold text-white/90">
                Žádost se uloží do systému a bude připravena pro další zpracování
                vedoucím nebo administrátorem.
              </p>
            </div>
          </aside>
        </section>
    </SystemLayout>
  );
}
