import React, { useState } from "react";
import Aside from "../components/aside";
import { CircleUser } from "lucide-react";

export default function ZadostOAbsenci() {
  const [formData, setFormData] = useState({
    datumOd: "",
    datumDo: "",
    duvod: "",
    idTyp: "" // typ absence
  });

  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
 console.log("Odesílám data na server:", formData);  // <-- tady vypíšeš do konzole
    // Připravíme data na server - např. POST
    try {
      const res = await fetch("http://localhost/api/zadost_absence.php", {
        method: "POST",
        credentials: "include", // posílání cookie
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
        
      });
      const data = await res.json();

if (data.success) {
  alert("Žádost o absenci byla úspěšně odeslána.");
  setFormData({ datumOd: "", datumDo: "", duvod: "", idTyp: "" });
  setSubmitStatus(null);
} else {
  alert("Chyba: " + (data.message || "Něco se pokazilo"));
  setSubmitStatus(null);
}

    } catch (error) {
      setSubmitStatus("Chyba při odesílání žádosti.");
      console.error(error);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Aside />

      <main className="flex-1  p-10 bg-gradient-to-b from-pozadi via-pozadi to-white">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-6xl font-bold">Žádost o Absenci</h1>
          <CircleUser className="w-12 h-12 text-black" />
        </div>
<div className="flex justify-center ">
        <form
          onSubmit={handleSubmit}
          className="max-w-xl  bg-white rounded-xl p-6 shadow-md"
        >
          <label className="block mb-4">
            <span className="font-semibold text-lg">Datum od:</span>
            <input
              type="date"
              name="datumOd"
              value={formData.datumOd}
              onChange={handleChange}
              required
              className="mt-1 w-full py-3 px-3 bg-pozadi rounded-md  border-gray-300 shadow-sm focus:ring-primary focus:border-primary"
            />
          </label>

          <label className="block mb-4">
            <span className="font-semibold text-lg">Datum do:</span>
            <input
              type="date"
              name="datumDo"
              value={formData.datumDo}
              onChange={handleChange}
              required
              className="mt-1 w-full py-3 px-3 bg-pozadi rounded-md border-gray-300 shadow-sm focus:ring-primary focus:border-primary"
            />
          </label>

          <label className="block mb-4">
            <span className="font-semibold text-lg">Typ absence:</span>
            <select
              name="idTyp"
              value={formData.idTyp}
              onChange={handleChange}
              required
              className="mt-1 w-full py-3 px-3 bg-pozadi rounded-md border-gray-300 shadow-sm focus:ring-primary focus:border-primary"
            >
              <option value="" disabled>Vyberte typ absence</option>
              <option value="1">Nemoc</option>
              <option value="2">Dovolená</option>
              <option value="3">Ošetřování člena rodiny</option>
              {/* Doplnit podle své tabulky typy */}
            </select>
          </label>

          <label className="block mb-6">
            <span className="font-semibold text-lg">Důvod absence:</span>
            <textarea
              name="duvod"
              value={formData.duvod}
              onChange={handleChange}
              required
              rows={4}
              className="mt-1 w-full py-3 px-3 bg-pozadi rounded-md border-gray-300 shadow-sm focus:ring-primary focus:border-primary"
              placeholder="Například nemoc, dovolená, ..."
            />
          </label>

          <button
            type="submit"
            className="bg-primary text-white px-24 py-3 rounded-xl font-bold text-lg hover:bg-primary/90 transition"
          >
            Odeslat žádost
          </button>


        </form>
        </div>
      </main>
    </div>
  );
}
