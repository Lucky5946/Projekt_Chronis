export const initialAbsenceRequests = [
  {
    id: 1,
    employee: "Jan Novak",
    department: "Výroba",
    type: "Dovolená",
    from: "2026-05-06",
    to: "2026-05-08",
    days: 3,
    submitted: "2026-04-28",
    reason: "Plánovaná dovolená po domluvě s vedoucím směny.",
    status: "pending",
  },
  {
    id: 2,
    employee: "Petra Svobodová",
    department: "Administrativa",
    type: "Nemoc",
    from: "2026-05-13",
    to: "2026-05-15",
    days: 3,
    submitted: "2026-05-13",
    reason: "Dočasná pracovní neschopnost.",
    status: "pending",
  },
  {
    id: 3,
    employee: "Martin Dvořák",
    department: "Sklad",
    type: "Ošetřování",
    from: "2026-05-21",
    to: "2026-05-22",
    days: 2,
    submitted: "2026-05-10",
    reason: "Ošetřování člena rodiny.",
    status: "approved",
  },
  {
    id: 4,
    employee: "Tereza Králová",
    department: "Kvalita",
    type: "Dovolená",
    from: "2026-06-03",
    to: "2026-06-05",
    days: 3,
    submitted: "2026-05-14",
    reason: "Krátká dovolená.",
    status: "rejected",
  },
];

export const monthNames = [
  "Leden",
  "Únor",
  "Březen",
  "Duben",
  "Květen",
  "Červen",
  "Červenec",
  "Srpen",
  "Září",
  "Říjen",
  "Listopad",
  "Prosinec",
];

export const weekdayLabels = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

export const absenceStatusStyles = {
  pending: {
    label: "Čeká",
    badge: "bg-yellow-100 text-yellow-700",
    dot: "bg-yellow-400",
    day: "bg-yellow-200 text-yellow-900 border-yellow-400",
  },
  approved: {
    label: "Schváleno",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    day: "bg-green-200 text-green-900 border-green-500",
  },
  rejected: {
    label: "Zamítnuto",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    day: "bg-red-200 text-red-900 border-red-500",
  },
};
