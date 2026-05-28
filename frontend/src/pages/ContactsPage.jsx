import { Mail, MapPin, Phone } from "lucide-react";
import Header from "../components/header";
import Footer from "../components/footer";
import ContactSection from "../components/contact";
import kolecko from "../assets/kolecko.png";
import contactLukas from "../assets/contact-lukas.png";
import contactSupport from "../assets/contact-support.png";
import contactBusiness from "../assets/contact-business.png";

const contacts = [
  {
    icon: Mail,
    title: "E-mail",
    value: "info@manufactory-lab.com",
    href: "mailto:info@manufactory-lab.com",
  },
  {
    icon: Phone,
    title: "Telefon",
    value: "+420 123 456 789",
    href: "tel:+420123456789",
  },
  {
    icon: MapPin,
    title: "Provozovna",
    value: "Žichlínek 258, 563 01 Lanškroun",
  },
];

const members = [
  {
    name: "Lukáš Mareš",
    role: "Vývoj aplikace Chronis",
    email: "lukas.mares@manufactory-lab.com",
    image: contactLukas,
    online: true,
  },
  {
    name: "Technická podpora",
    role: "Pomoc s nasazením a provozem",
    email: "tereza.podpora@manufactory-lab.com",
    image: contactSupport,
    online: true,
  },
  {
    name: "Obchodní kontakt",
    role: "Domluva ukázky a spolupráce",
    email: "obchod@manufactory-lab.com",
    image: contactBusiness,
    online: false,
  },
];

export default function ContactsPage() {
  const scrollToContactForm = () => {
    const section = document.getElementById("kontakt");

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="bg-gradient-to-b from-pozadi to-white py-20">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-14 items-center">
            <div>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-5 py-3 text-primary text-2xl font-black uppercase tracking-wide">
                Kontakty
              </span>
              <h1 className="text-5xl md:text-6xl font-black text-black mt-4 mb-6">
                Ozvěte se nám nebo se zastavte v provozovně
              </h1>
              <p className="text-xl leading-relaxed text-black font-medium">
                Na této stránce najdete kontaktní údaje firmy, adresu sídla,
                provozovnu a lidi, kteří se kolem projektu Chronis pohybují.
              </p>
            </div>

            <div className="bg-pozadi rounded-[3rem] p-8 flex flex-col md:flex-row items-center gap-8">
              <img src={kolecko} alt="Manufactory logo" className="w-44 h-44 object-contain" />
              <div>
                <h2 className="text-3xl font-black mb-4">Manufactory s.r.o.</h2>
                <p className="text-lg font-semibold text-gray-700">
                  Skřivánčí 681/25<br />
                  779 00 Olomouc<br />
                  IČO 07700911<br />
                  DIČ CZ07700911
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {contacts.map(({ icon: Icon, title, value, href }) => (
              <article key={title} className="bg-pozadi rounded-3xl p-7">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mb-5">
                  <Icon size={26} />
                </div>
                <h2 className="text-2xl font-black mb-2">{title}</h2>
                {href ? (
                  <a href={href} className="text-lg font-semibold text-gray-700 hover:text-primary">
                    {value}
                  </a>
                ) : (
                  <p className="text-lg font-semibold text-gray-700">{value}</p>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="py-16 bg-pozadi">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-5xl font-black text-center mb-12">
              Členové a kontaktní osoby
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {members.map((member) => (
                <article
                  key={member.email}
                  className="bg-white rounded-3xl p-5 shadow-md overflow-hidden"
                >
                  <div className="relative rounded-[1.75rem] overflow-hidden aspect-[4/3] mb-5 bg-pozadi">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 flex items-center gap-2 shadow-sm">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          member.online ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      <span className="text-xs font-black text-black">
                        {member.online ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                  <div className="px-2 pb-2">
                    <h3 className="text-2xl font-black">{member.name}</h3>
                    <p className="font-semibold text-gray-600 my-2">{member.role}</p>
                    <a href={`mailto:${member.email}`} className="font-bold text-primary break-all">
                      {member.email}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-[3rem] bg-seda text-white p-8 min-h-[360px] flex flex-col justify-between">
              <div>
                <MapPin className="mb-6 text-primary" size={44} />
                <h2 className="text-4xl font-black mb-4">Kde nás najdete</h2>
                <p className="text-xl font-semibold text-gray-200">
                  Sídlo firmy je v Olomouci, provozovna a výdejna je v Žichlínku
                  u Lanškrouna.
                </p>
              </div>
              <div className="mt-7 rounded-[2rem] overflow-hidden border-4 border-white/10 bg-white min-h-[260px]">
                <iframe
                  title="Mapa provozovny Manufactory LAB"
                  src="https://www.google.com/maps?q=%C5%BDichl%C3%ADnek%20258%2C%20563%2001%20Lan%C5%A1kroun&output=embed"
                  className="w-full h-[260px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-full rounded-[2.5rem] bg-pozadi p-8 shadow-md">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mb-5">
                  <Mail size={26} />
                </div>
                <h2 className="text-4xl font-black mb-4">Domluva schůzky</h2>
                <p className="text-xl font-semibold text-gray-700 mb-6 max-w-xl">
                  Pro ukázku systému nebo dotazy k projektu můžete použít formulář níže.
                </p>
                <button
                  type="button"
                  onClick={scrollToContactForm}
                  className="bg-primary text-white px-8 py-3 rounded-full text-xl font-black hover:scale-105 transition"
                >
                  Přejít na formulář
                </button>
              </div>
            </div>
          </div>
        </section>

        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
