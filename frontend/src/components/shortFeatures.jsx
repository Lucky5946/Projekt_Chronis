export default function ShortFeatures() {
  const items = [
    "Neplatíte za neaktivní uživatele",
    "Podpora na emailu, chatu a telefonu v ceně",
    "Zálohování a pravidelné aktualizace",
    "Sleva pro neziskové organizace",
  ];

  return (
    <section className="max-w-6xl mx-auto py-16 px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {items.map((text, idx) => (
          <article key={idx} className="p-4">
            <p className="text-lg font-bold italic text-black">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
