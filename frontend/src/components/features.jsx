import { motion } from "framer-motion";
import dochazkaImage from "../assets/dochazka.png";
import dokumentyImage from "../assets/dokumentace.png";
import skladnikImage from "../assets/skladnik.png";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const headingVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export default function Features() {
  return (
    <section className="w-full py-5">
      <div className="max-w-7xl mx-auto px-6">
        <motion.h2
          className="text-6xl font-bold text-center mb-12 text-black"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={headingVariants}
        >
          CO UMÍME?
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <motion.article
            className="p-6 rounded-2xl transition flex flex-col items-center text-center min-h-[480px]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={itemVariants}
          >
            <div className="w-full h-96 mb-6 flex items-center justify-center">
              <img
                src={dochazkaImage}
                alt="Plánování směn"
                className="max-h-full object-contain"
              />
            </div>
            <h3 className="text-2xl font-black mb-6 text-black">Docházkový systém</h3>
            <p className="text-black font-medium text-justify flex-grow">
              Moderní <span className="font-black"> docházkový systém</span> umožňuje zaměstnancům pohodlně zaznamenávat{" "}
              <span className="font-black"> příchody</span> a <span className="font-black">odchody</span> pomocí{" "}
              <span className="font-black"> mobilní aplikace</span> nebo<span className="font-black"> webového rozhraní</span>.
              Přehledně zobrazuje denní i měsíční docházku, umožňuje sledování pracovní doby, přestávek i nepřítomnosti.
              Ideální řešení pro firmy, které chtějí mít docházku pod kontrolou a{" "}
              <span className="font-black"> zjednodušit administrativu</span>.
            </p>
          </motion.article>

          {/* Feature 2 */}
          <motion.article
            className="p-6 rounded-2xl transition flex flex-col items-center text-center min-h-[480px]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={itemVariants}
          >
            <div className="w-full h-96 mb-6 flex items-center justify-center">
              <img
                src={dokumentyImage}
                alt="Dokumentační terminál"
                className="max-h-full object-contain"
              />
            </div>
            <h3 className="text-2xl font-black mb-6 text-black">Dokumentační terminál</h3>
            <p className="text-black font-medium text-justify flex-grow">
              <span className="font-black">Mobilní</span> a <span className="font-black">tabletová aplikace</span>, která umožňuje rychlé zobrazení výkresů pomocí{" "}
              <span className="font-black">QR kódu</span>. Stačí naskenovat kód fotoaparátem, systém zobrazí příslušný výkres ve formátu{" "}
              <span className="font-black">PDF</span>, <span className="font-black">Excel</span> nebo <span className="font-black">obrázek</span>. Podporuje nahrávání souborů i jejich správu přímo v terénu. Ideální pro techniky a pracovníky ve výrobě.
            </p>
          </motion.article>

          {/* Feature 3 */}
          <motion.article
            className="p-6 rounded-2xl transition flex flex-col items-center text-center min-h-[480px]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={itemVariants}
          >
            <div className="w-full h-96 mb-6 flex items-center justify-center">
              <img
                src={skladnikImage}
                alt="Mobilní skladník"
                className="max-h-full object-contain"
              />
            </div>
            <h3 className="text-2xl font-black mb-6 text-black">Mobilní skladník</h3>
            <p className="text-black font-medium text-justify flex-grow">
              Mobilní skladník umožňuje rychlé a přesné naskladňování materiálu pomocí skeneru{" "}
              <span className="font-black">čárových kódů</span> přímo na skladě. Usnadňuje také{" "}
              <span className="font-black">provádění inventur</span>, kdy skladník může jednoduše kontrolovat a aktualizovat stavy zásob v reálném čase. Díky tomu se výrazně zjednodušuje{" "}
              <span className="font-black">správa zásob</span>, zvyšuje přesnost dat a šetří čas při každodenních skladových operacích.
            </p>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
