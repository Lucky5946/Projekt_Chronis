import kolecko from "../assets/kolecko.png";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";

function Footer() {
  return (
    <footer className="bg-seda text-white py-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10">
        {/* 1. sloupec - logo + název */}
        <div className="flex flex-center items-center space-y-4 w-[90%] mx-auto text-center">
          <img src={kolecko} alt="Manufactory Logo" className="w-[90%] h-auto" />

        </div>

        {/* 2. sloupec */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">O nás</h3>
          <p className="text-gray-300 text-base leading-relaxed italic">
            Jsme ryze česká společnost vzniklá transformací z OSVČ. Zkušenosti s vývojem získáváme již od roku 1987.
          </p>

          <h3 className="text-2xl mt-10 font-semibold mb-3">Sledujte nás</h3>
          <div className="flex space-x-4 text-xl text-white">
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="bg-white text-black p-3 rounded-full hover:bg-primary transition"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="bg-white text-black p-3 rounded-full hover:bg-primary transition"
            >
              <FaInstagram />
            </a>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="bg-white text-black p-3 rounded-full hover:bg-primary transition"
            >
              <FaLinkedinIn />
            </a>
          </div>
        </div>

        {/* 3. sloupec */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">Sídlo</h3>
          <p className="text-gray-300 text-sm leading-relaxed italic">
            manufactory s.r.o. <br />
            Skřivánčí 681/25<br />
            779 00 Olomouc<br /><br />
            IČO 07700911<br />
            DIČ CZ07700911
          </p>
        </div>

        {/* 4. sloupec */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">Provozovna <br /> Výdejna e-shopu</h3>
          <p className="text-gray-300 italic text-sm leading-relaxed">
            Žichlínek 258<br />
            563 01 Lanškroun
          </p>
        </div>

        {/* 5. sloupec - Kontakty */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">Kontakty</h3>
          <p className="text-gray-300 italic text-sm leading-relaxed">
            E-mail: <a href="mailto:info@manufactory.cz" className="hover:underline">info@manufactory.cz</a><br />
            Telefon: <a href="tel:+420123456789" className="hover:underline">+420 123 456 789</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
