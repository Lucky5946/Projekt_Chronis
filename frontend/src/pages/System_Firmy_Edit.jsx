import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Aside from "../components/aside";
import { CircleUser } from "lucide-react";

export default function EditFirma() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [firma, setFirma] = useState(null);

  useEffect(() => {
    fetch(`http://localhost/api/get_firma_by_id.php?id=${id}`)
      .then((res) => res.json())
      .then((data) => setFirma(data))
      .catch((err) => console.error("Chyba při načítání firmy:", err));
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(firma);
    fetch("http://localhost/api/update_firma.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(firma),
    })
      .then((res) => res.json())
      .then(() => {
        alert("Firma upravena");
        navigate("/System_Firmy");
      })
      .catch((err) => console.error("Chyba při odeslání formuláře:", err));
  };

  if (!firma) return <p>Načítání...</p>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Aside />
      <main className="flex-1 flex flex-col p-10 bg-gradient-to-b from-pozadi via-pozadi to-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-6xl font-bold">EDITACE FIRMY</h1>
          <CircleUser className="w-12 h-12 text-black" />
        </div>

        {/* Formulář */}
        <form onSubmit={handleSubmit} id="form" className="flex flex-1 gap-10">
          {/* Levý sloupec - firemní údaje */}
          <div className="flex-1 space-y-4">
            <h2 className="text-2xl font-bold mb-2">Firemní údaje</h2>
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
              <div>
                <label className="block font-bold mb-1">Název</label>
                <input
                  type="text"
                  value={firma.nazev || ""}
                  onChange={(e) =>
                    setFirma({ ...firma, nazev: e.target.value })
                  }
                  className="w-full p-2 py-4 rounded-xl bg-pozadi focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Email</label>
                <input
                  type="email"
                  value={firma.email || ""}
                  onChange={(e) =>
                    setFirma({ ...firma, email: e.target.value })
                  }
                  className="w-full p-2 py-4 rounded-xl bg-pozadi focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Telefon</label>
                <input
                  type="text"
                  value={firma.telefon || ""}
                  onChange={(e) =>
                    setFirma({ ...firma, telefon: e.target.value })
                  }
                  className="w-full p-2 py-4 rounded-xl bg-pozadi focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">IČO</label>
                <input
                  type="text"
                  value={firma.ico || ""}
                  onChange={(e) => setFirma({ ...firma, ico: e.target.value })}
                  className="w-full p-2 py-4 rounded-xl bg-pozadi focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pravý sloupec - adresa firmy */}
          <div className="flex-1 space-y-4">
            <h2 className="text-2xl font-bold mb-2">Adresa firmy</h2>

            {/* První kontejner: Ulice + Číslo popisné */}
            <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
              <div>
                <label className="block font-bold mb-1">Ulice</label>
                <input
                  type="text"
                  value={firma.ulice || ""}
                  onChange={(e) =>
                    setFirma({ ...firma, ulice: e.target.value })
                  }
                  className="w-full p-2 py-4 rounded-xl bg-pozadi focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Číslo popisné</label>
                <input
                  type="text"
                  value={firma.cislo_popisne || ""}
                  onChange={(e) =>
                    setFirma({ ...firma, cislo_popisne: e.target.value })
                  }
                  className="w-full p-2 py-4 rounded-xl bg-pozadi focus:outline-none"
                />
              </div>
            </div>

            {/* Tlačítko pod formulářem, vycentrované a s mezerou */}
            <div className="mt-8 flex justify-center">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-4 rounded-full font-bold shadow-md hover:from-primary/90 hover:to-blue-500 transition-all"
              >
                Uložit změny
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
