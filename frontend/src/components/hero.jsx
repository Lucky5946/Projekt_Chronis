import heroImage from "../assets/dochazka.png";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section
      className="w-full bg-gradient-to-b from-pozadi to-transparent text-white"
      style={{ height: "calc(100vh - 72px)", paddingBottom: "40px" }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-full">
        {/* Text - animace zleva */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col w-[46%] space-y-6"
        >
          <h1 className="text-6xl font-black text-black">
            Docházkový systém CHRONIS
          </h1>
          <p className="text-xl italic text-black font-medium">
            Modul docházka vyřídí vše okolo docházky zaměstnanců, včetně plánu
            směn, práce na projektech, žádostí, exportů do mezd a další.
          </p>
          <button
            onClick={() => {
              const section = document.getElementById("kontakt");
              if (section) {
                section.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="cursor-pointer w-max px-8 py-4 bg-primary rounded-full text-xl font-semibold hover:scale-105 transition"
          >
            Naplánovat schůzku
          </button>
        </motion.div>

        {/* Obrázek - animace zprava */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden md:block w-[52%]"
        >
          <img
            src={heroImage}
            alt="Hero ilustrace"
            className="w-full h-auto object-cover rounded-lg"
          />
        </motion.div>
      </div>
    </section>
  );
}
