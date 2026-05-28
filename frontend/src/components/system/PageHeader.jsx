export default function PageHeader({ eyebrow, title, className = "" }) {
  return (
    <div className={`mb-10 ${className}`}>
      <div>
        {eyebrow && (
          <p className="text-primary text-xl font-black uppercase mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="text-5xl xl:text-6xl font-black text-black">{title}</h1>
      </div>
    </div>
  );
}
