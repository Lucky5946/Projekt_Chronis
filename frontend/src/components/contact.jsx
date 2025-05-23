import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import contactImage from "../assets/contact.png";
import { useState } from "react";

const zoomFadeIn = {
  hidden: { opacity: 0, scale: 0.95, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Odesílání...");
    try {
      const response = await fetch("http://localhost/api/send.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.text();

      if (response.ok) {
        setStatus("Zpráva odeslána!");
        setFormData({ name: "", company: "", email: "", message: "" });
      } else {
        setStatus("Chyba: " + result);
      }
    } catch (error) {
      setStatus("Chyba při připojení k serveru.");
    }
  };

  return (
    <section id="kontakt" className="w-full py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-pozadi rounded-[120px] shadow-lg flex flex-col md:flex-row overflow-hidden">
          {/* Levá část - text + obrázek */}
          <motion.div
            className="md:w-3/5 px-10 pt-10 pb-0 bg-gradient-to-br text-black flex flex-col justify-start rounded-l-3xl h-full"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={zoomFadeIn}
          >
            <div className="pl-8">
              <h2 className="text-4xl font-bold mb-4">Ukážeme vám CHRONIS</h2>
              <p className="text-4xl leading-relaxed mb-6">
                moderní řešení pro vaši firmu
              </p>

              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="text-tlacitko_tmave w-5 h-5 mr-3"
                  />
                  <span className="text-xl font-bold text-tlacitko_tmave">
                    info@chronis.cz
                  </span>
                </div>

                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="text-tlacitko_tmave w-5 h-5 mr-3"
                  />
                  <span className="text-xl font-bold text-tlacitko_tmave">
                    +420 123 456 789
                  </span>
                </div>
              </div>
            </div>

            <img
              src={contactImage}
              alt="Chronis"
              className="w-full h-auto mt-auto"
            />
          </motion.div>

          {/* Pravá část - formulář */}
          <motion.div
            className="md:w-2/5 p-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={zoomFadeIn}
          >
            <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
              <input
                type="text"
                name="name"
                placeholder="Vaše jméno"
                value={formData.name}
                onChange={handleChange}
                className="bg-white rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                name="company"
                placeholder="Název firmy"
                value={formData.company}
                onChange={handleChange}
                className="bg-white rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                name="email"
                placeholder="Váš email"
                value={formData.email}
                onChange={handleChange}
                className="bg-white rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                name="message"
                placeholder="Vaše zpráva"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                className="bg-white rounded-3xl px-4 py-3 resize focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-primary cursor-pointer text-white font-semibold py-3 px-6 rounded-2xl hover:scale-105 transition self-end"
              >
                Odeslat
              </button>
              {status && <p>{status}</p>}
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
