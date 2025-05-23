import { useEffect, useState } from "react";
import axios from "axios";  // import axios
import { CircleUser } from "lucide-react";
import Aside from '../components/aside';
import { FaPen, FaTimes, FaPlusCircle } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Page() {
  const [firmy, setFirmy] = useState([]);

  // Funkce na načtení firem
  const fetchFirmy = () => {
    fetch("http://localhost/api/get_firmy.php")
      .then((res) => res.json())
      .then((data) => setFirmy(data))
      .catch((err) => console.error("Chyba při načítání dat:", err));
  };

  useEffect(() => {
    fetchFirmy();
  }, []);

  // Komponenta tlačítka smazání firmy
  function DeleteCompanyButton({ companyId }) {
    const handleDelete = async () => {
      if (!window.confirm("Opravdu chcete smazat tuto firmu?")) return;

      try {
        await axios.delete(`http://localhost/api/delete_company?id=${companyId}`, {
          withCredentials: true,
        });
        alert("Firma byla smazána.");
        fetchFirmy();  // znovu načíst seznam firem po smazání
      } catch (error) {
        alert("Chyba při mazání firmy.");
        console.error(error);
      }
    };

    return (
      <button
        onClick={handleDelete}
        className="absolute top-4 right-4 text-system_cervena_tmavsi"
        aria-label="Smazat firmu"
      >
        <FaTimes className="w-8 h-8" />
      </button>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Aside />

      <main className="flex-1 p-10 bg-gradient-to-b from-pozadi via-pozadi to-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-6xl font-bold">FIRMY</h1>
          <CircleUser className="w-12 h-12 text-black" />
        </div>

        <div className="px-10 sm:px-18 lg:px-26">
          <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {firmy.map((firma) => (
              <div
                key={firma.id_firma}
                className="bg-white shadow-md rounded-2xl p-6 flex flex-col items-center text-center relative"
              >
                {/* Tlačítko smazání */}
                <DeleteCompanyButton companyId={firma.id_firma} />

                <img
                  src={`http://localhost/api/${firma.logo_cesta}`}
                  alt={`Logo firmy ${firma.nazev}`}
                  className="w-36 h-36 object-contain mb-4"
                />
                <h2 className="text-3xl font-black mb-4">{firma.nazev}</h2>

                <div className="w-full text-left space-y-3 mb-6 text-lg">
                  <p>
                    <span className="font-normal">Obec: </span>
                    <span className="font-black text-lg">{firma.obec}</span>
                  </p>
                  <p>
                    <span className="font-normal">Telefon: </span>
                    <span className="font-black text-lg">{firma.telefon}</span>
                  </p>
                  <p>
                    <span className="font-normal">Email: </span>
                    <span className="font-black text-lg">{firma.email}</span>
                  </p>
                </div>

                <div className="w-full flex justify-center">
                  <Link to={`/System_Firmy_Edit/${firma.id_firma}`} className="w-full flex justify-center">
                    <button className="bg-primary text-white text-3xl font-black px-8 py-2 rounded-2xl flex items-center gap-4 hover:bg-primary/90 transition">
                      <FaPen className="w-7 h-7" />
                      Editovat
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button
          className="fixed bottom-10 right-10 bg-primary text-white w-16 h-16 rounded-xl flex items-center justify-center shadow-lg hover:bg-primary/90 transition"
          aria-label="Přidat firmu"
          onClick={() => alert("Přidat firmu - funkce ještě není implementovaná")}
        >
          <FaPlusCircle className="w-8 h-8" />
        </button>
      </main>
    </div>
  );
}
