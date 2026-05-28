import { motion } from "framer-motion";
import { Clock3, DatabaseZap, ShieldCheck, UsersRound } from "lucide-react";
import Header from "../components/header";
import Footer from "../components/footer";
import aboutTeamImage from "../assets/about-team.png";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
};

const values = [
  {
    icon: Clock3,
    title: "Rychlá evidence",
    text: "Docházka, pauzy a absence mají být dostupné na pár kliknutí bez zbytečného papírování.",
  },
  {
    icon: UsersRound,
    title: "Přehled pro týmy",
    text: "Zaměstnanci vidí vlastní údaje, vedoucí získají kontrolu nad žádostmi a firemními přehledy.",
  },
  {
    icon: ShieldCheck,
    title: "Role a bezpečnost",
    text: "Systém počítá s přihlášením, administrací práv a oddělením běžných uživatelů od správců.",
  },
  {
    icon: DatabaseZap,
    title: "Data pro provoz",
    text: "Cílem je mít docházková data připravená pro reporty, exporty a další firemní procesy.",
  },
];

const milestones = [
  "Kiosková aplikace pro načítání čipů a základní docházkové akce.",
  "Webové rozhraní pro zaměstnance, vedoucí a administrátory.",
  "Správa firem, žádosti o absenci a postupné rozšiřování reportů.",
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="bg-gradient-to-b from-pozadi to-white py-20">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <div className="inline-flex items-center rounded-full bg-primary/10 px-5 py-3 mb-6">
                <span className="text-primary text-2xl font-black uppercase tracking-wide">
                  O nás
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-black mb-6">
                Chronis pomáhá firmám získat pořádek v docházce
              </h1>
              <p className="text-xl leading-relaxed text-black font-medium">
                Projekt navazuje na docházkovou aplikaci pro provoz Manufactory
                LAB. Webová část rozšiřuje systém o přihlášení, přehledy,
                žádosti o absenci a administraci firemních dat.
              </p>
            </motion.div>

            <motion.div
              className="relative rounded-[3rem] overflow-hidden shadow-xl min-h-[420px]"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <img
                src={aboutTeamImage}
                alt="Tým Chronis na společné poradě"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/35" />
              <div className="relative z-10 p-8 h-full min-h-[420px] flex flex-col justify-end text-white">
                <p className="text-4xl font-black mb-3">Manufactory LAB</p>
                <p className="text-lg font-semibold max-w-md">
                  Řešení stavěné pro reálný provoz, kde je potřeba rychlost,
                  přehled a jednoduché ovládání.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-5xl font-black text-center mb-12">
              Co je pro nás důležité
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map(({ icon: Icon, title, text }) => (
                <article key={title} className="bg-pozadi rounded-3xl p-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mb-5">
                    <Icon size={26} />
                  </div>
                  <h3 className="text-2xl font-black mb-3">{title}</h3>
                  <p className="font-medium text-gray-700">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-pozadi">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-5xl font-black mb-8">Vývoj projektu</h2>
            <div className="space-y-5">
              {milestones.map((item, index) => (
                <div key={item} className="flex gap-5 items-start bg-white rounded-3xl p-6">
                  <span className="w-12 h-12 shrink-0 rounded-full bg-primary text-white flex items-center justify-center text-xl font-black">
                    {index + 1}
                  </span>
                  <p className="text-xl font-semibold text-black">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
