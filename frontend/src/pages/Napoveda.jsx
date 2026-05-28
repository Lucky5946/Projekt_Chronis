import {
  BookOpen,
  CalendarCheck2,
  CircleHelp,
  FileBarChart,
  LifeBuoy,
  Mail,
  PlayCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import SystemLayout from "../layouts/SystemLayout";
import PageHeader from "../components/system/PageHeader";

const helpTopics = [
  {
    title: "Jak zaznamenat příchod a odchod",
    description: "Rychlý postup pro stránku Moje docházka.",
    icon: PlayCircle,
  },
  {
    title: "Jak podat žádost o absenci",
    description: "Výběr typu absence, termínu a odeslání žádosti.",
    icon: CalendarCheck2,
  },
  {
    title: "Schvalování žádostí",
    description: "Přehled stavů, kalendář a detail žádosti pro vedoucí.",
    icon: ShieldCheck,
  },
  {
    title: "Reporty a exporty",
    description: "Kde najít docházkové reporty a připravit soubor ke stažení.",
    icon: FileBarChart,
  },
];

const faq = [
  ["Nejde mi odeslat žádost.", "Zkontrolujte vyplněný typ absence, datum od, datum do a důvod."],
  ["Kde najdu exporty?", "V levém menu otevřete sekci Reporty a klikněte na Exporty."],
  ["Kdo může schvalovat absence?", "V návrhu je tato část dostupná administrátorovi nebo vedoucímu."],
];

export default function Napoveda() {
  return (
    <SystemLayout className="p-8 xl:p-10">
      <PageHeader eyebrow="Systém" title="Nápověda" />

      <section className="bg-white rounded-3xl shadow-md p-7 mb-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-center">
          <div>
            <p className="text-gray-500 font-black uppercase">Centrum pomoci</p>
            <h2 className="text-4xl font-black text-black mt-2">
              Rychlé odpovědi pro práci v Chronisu
            </h2>
            <p className="font-semibold text-gray-600 mt-3 max-w-3xl">
              Stránka slouží jako jednoduchá interní nápověda. Později se sem
              můžou doplnit návody podle skutečných funkcí aplikace.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-pozadi rounded-2xl px-4 py-4">
            <Search size={22} className="text-gray-500" />
            <input
              className="w-full bg-transparent font-bold text-black outline-none"
              placeholder="Hledat v nápovědě"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {helpTopics.map(({ title, description, icon: Icon }) => (
          <article key={title} className="bg-white rounded-3xl shadow-md p-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-primary to-system_modra_svtetlejsi text-white flex items-center justify-center mb-5">
              <Icon size={30} />
            </div>
            <h3 className="text-2xl font-black text-black mb-2">{title}</h3>
            <p className="font-semibold text-gray-600">{description}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
        <div className="bg-white rounded-3xl shadow-md p-7">
          <div className="flex items-center gap-4 mb-6">
            <BookOpen className="text-primary" size={36} />
            <h2 className="text-3xl font-black text-black">Časté otázky</h2>
          </div>

          <div className="space-y-4">
            {faq.map(([question, answer]) => (
              <article key={question} className="rounded-2xl bg-pozadi p-5">
                <h3 className="text-xl font-black text-black mb-2">{question}</h3>
                <p className="font-semibold text-gray-600">{answer}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <article className="bg-white rounded-3xl shadow-md p-7">
            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-5">
              <LifeBuoy size={30} />
            </div>
            <h2 className="text-3xl font-black text-black mb-3">Podpora</h2>
            <p className="font-semibold text-gray-600">
              Pokud uživatel nenajde odpověď, měl by mít možnost napsat správci
              systému nebo technické podpoře.
            </p>
          </article>

          <article className="bg-white rounded-3xl shadow-md p-7">
            <div className="flex items-center gap-4 mb-4">
              <Mail className="text-primary" size={28} />
              <h3 className="text-2xl font-black text-black">Kontakt</h3>
            </div>
            <p className="font-black text-black">podpora@chronis.cz</p>
            <p className="font-semibold text-gray-600 mt-1">
              Návrhový kontakt pro budoucí helpdesk.
            </p>
          </article>

          <article className="bg-white rounded-3xl shadow-md p-7">
            <div className="flex items-center gap-4 mb-4">
              <CircleHelp className="text-primary" size={28} />
              <h3 className="text-2xl font-black text-black">Tip</h3>
            </div>
            <p className="font-semibold text-gray-600">
              Nápovědu bych nechal stručnou. Uživatelé ji ocení víc, když najdou
              konkrétní odpověď rychle.
            </p>
          </article>
        </aside>
      </section>
    </SystemLayout>
  );
}
