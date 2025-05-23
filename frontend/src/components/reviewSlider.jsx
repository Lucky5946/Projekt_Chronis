import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function ReviewsSlider() {
  const [reviews, setReviews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch("http://localhost/api/reviews.php")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setReviews(data);
      })
      .catch((err) => {
        console.error("Chyba při načítání recenzí:", err);
      });
  }, []);

  // Reset currentIndex pokud by byl mimo rozsah po změně reviews
  useEffect(() => {
    if (currentIndex >= reviews.length) {
      setCurrentIndex(0);
    }
  }, [reviews, currentIndex]);

  if (reviews.length === 0) {
    return <div className="text-center p-6">Načítám recenze...</div>;
  }

  const total = reviews.length;

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const getVisibleReviews = () => {
    if (total <= 3) return reviews;

    return [
      reviews[currentIndex],
      reviews[(currentIndex + 1) % total],
      reviews[(currentIndex + 2) % total],
    ];
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-6xl font-bold text-center mb-12 text-black">RECENZE</h2>

      <div className="relative">
        <div className="flex items-center pb-4">
          <button
            onClick={prevSlide}
            className="z-10 p-3 rounded-full shadow bg-white hover:bg-gray-100 transition"
            aria-label="Předchozí recenze"
          >
            <FaChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

<div className="flex w-full overflow-hidden px-4 pb-16">
  {getVisibleReviews().map((review) => (
    <div
      key={review.id}
      className="w-1/3 px-4 transition-transform duration-500 ease-in-out"
    >
      <div className="bg-white rounded-2xl p-8 pb-12 shadow-lg h-full flex flex-col justify-between">
        <p className="mb-4 text-gray-700 italic">"{review.text}"</p>

        {/* Firma + logo + jméno */}
        <div>
          {/* Název firmy nad jménem */}
<div className="flex items-center space-x-3">
  {/* Logo firmy vlevo */}
  {review.logo_cesta && (
    <img
      src={`http://localhost/api/${review.logo_cesta}`}
      alt={`${review.nazev} logo`}
      className="w-12 h-12 object-contain rounded"
    />
  )}

  {/* Název firmy a jméno nad sebou */}
  <div className="flex flex-col">
    <p className="text-xl font-bold text-gray-900">{review.name}</p>
    <p className="text-tlacitko_tmave font-bold">{review.nazev}</p>
  </div>
</div>

        </div>
      </div>
    </div>
  ))}
</div>


          <button
            onClick={nextSlide}
            className="z-10 p-3 rounded-full shadow bg-white hover:bg-gray-100 transition"
            aria-label="Další recenze"
          >
            <FaChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

<div className="flex justify-center  space-x-3 bg-transparent">
  {(total <= 3 ? reviews : reviews.slice(0, 2)).map((_, idx, arr) => (
    <button
      key={idx}
      onClick={() => goToSlide(idx)}
      className={`w-3 h-3 rounded-full transition ${
        idx === currentIndex % arr.length ? "bg-primary" : "bg-gray-300"
      }`}
      aria-label={`Recenze ${idx + 1}`}
    />
  ))}
</div>


    </div>
  );
}
