import { useState } from "react";
import pozadiImage from "../assets/curve.svg";
import mobileImage from "../assets/mobile.png";

export default function PriceCalculator() {
const [users, setUsers] = useState(100);
const min = 0;
const max = 400;

const increment = () => {
  if (users < max) setUsers(users + 1);
};

const decrement = () => {
  if (users > min) setUsers(users - 1);
};

// Dynamická cena za měsíc
const pricePerUser = 429; // nebo jakákoli jiná logika
const monthlyPrice = users * pricePerUser;

  return (
    <div
      className="relative py-20 px-4 bg-[#e8f6fc] overflow-hidden"
      style={{
        backgroundImage: `url(${pozadiImage})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100%",
      }}
    >
      <h2 className="text-6xl font-bold text-center mb-12 text-black">CENA</h2>

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden">
        {/* Levá část */}
        <div className="w-full md:w-1/2 p-8 flex flex-col items-center justify-center border-r-2 border-pozadi">
          <p className="font-semibold mb-6 text-lg mt-[-10px]">
            Počet aktivních uživatelů
          </p>

          <div className="flex items-center gap-4 mb-6 border-primary border-2 rounded-full px-3 py-2 bg-white shadow-sm">
            <button
              onClick={decrement}
              className="text-white font-black bg-primary w-12 h-12 cursor-pointer rounded-full text-2xl flex items-center  pointer justify-center"
            >
              −
            </button>
            <span className="text-xl font-bold w-16 text-center">{users}</span>
            <button
              onClick={increment}
              className="text-white font-black bg-primary w-12 h-12 rounded-full cursor-pointer  text-2xl flex items-center justify-center"
            >
              +
            </button>
          </div>

          <div className="relative w-full">
            <input
              type="range"
              min={min}
              max={max}
              step={1}
              value={users}
              onChange={(e) => setUsers(Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none bg-blue-200 accent-blue-500 z-10 relative [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />

            {/* Ticks overlay */}
            <div className="absolute top-1/2 left-0 w-full z-0 h-0 pointer-events-none">
              {[0, 100, 200, 300, 400].map((tick, index) => (
                <div
                  key={tick}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${(tick / max) * 100}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="w-px h-4 bg-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">{tick}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pravá část */}
        <div className="w-full md:w-1/2 p-8 flex flex-col items-center justify-center text-center">
          <img src={mobileImage} alt="App preview" className="w-32 mb-4" />
          <p className="text-xl font-bold">{monthlyPrice} Kč / Měsíc</p>
          <p className="text-sm text-gray-500 mb-4">Prvních 14 dní zdarma</p>
          <button
            onClick={() => {
              const section = document.getElementById("kontakt");
              if (section) {
                section.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="cursor-pointer bg-blue-500 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-blue-600"
          >
            Naplánovat schůzku
          </button>
        </div>
      </div>
    </div>
  );
}
