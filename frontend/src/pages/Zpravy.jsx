import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  ExternalLink,
  Inbox,
  Loader2,
  Mail,
  MessageSquareText,
  Reply,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SystemLayout from "../layouts/SystemLayout";
import PageHeader from "../components/system/PageHeader";

const formatDate = (value) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value.replace(" ", "T")));
};

const messageSections = [
  {
    id: "notifikace",
    label: "Notifikace",
    title: "Systémové notifikace",
    description: "Nové žádosti, upozornění a události, které vyžadují pozornost.",
    types: ["upozorneni", "notifikace"],
    icon: Bell,
  },
  {
    id: "zpravy",
    label: "Zprávy",
    title: "Zprávy a oznámení",
    description: "Interní komunikace mezi uživateli a obecné zprávy systému.",
    types: ["zprava", "system"],
    icon: Inbox,
  },
];

const typeLabels = {
  notifikace: "Notifikace",
  upozorneni: "Notifikace",
  zprava: "Zpráva",
  system: "Systém",
};

const shortenEmail = (email) => {
  if (!email || email.length <= 28) return email || "";

  return `${email.slice(0, 17)}...${email.slice(-8)}`;
};

const recipientLabel = (recipient) =>
  `${recipient.jmeno} (${shortenEmail(recipient.email)})`;

export default function Zpravy() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    notifications: 0,
    system: 0,
    messages: 0,
  });
  const [activeSection, setActiveSection] = useState("notifikace");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ recipientId: "", subject: "", body: "" });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);
  const [composeMessage, setComposeMessage] = useState(null);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch("http://localhost/api/zpravy.php", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Zprávy se nepodařilo načíst.");
      }

      setMessages(data.messages || []);
      setRecipients(data.recipients || []);
      setStats(data.stats || {
        total: 0,
        unread: 0,
        read: 0,
        notifications: 0,
        system: 0,
        messages: 0,
      });
      setForm((prev) => ({
        ...prev,
        recipientId: prev.recipientId || data.recipients?.[0]?.id_zamestnanec || "",
      }));
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Chyba při načítání zpráv." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const filteredMessages = useMemo(() => {
    const section = messageSections.find((item) => item.id === activeSection);
    const sectionMessages = messages.filter((item) =>
      section?.types.includes(item.type)
    );
    const term = search.trim().toLowerCase();
    if (!term) return sectionMessages;

    return sectionMessages.filter((item) =>
      [item.subject, item.sender, item.text, item.type, typeLabels[item.type]]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [activeSection, messages, search]);

  const activeSectionInfo =
    messageSections.find((item) => item.id === activeSection) || messageSections[0];

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const sendMessage = async () => {
    try {
      setSending(true);
      setComposeMessage(null);

      const response = await fetch("http://localhost/api/zpravy.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Zprávu se nepodařilo odeslat.");
      }

      setMessages(data.messages || []);
      setStats(data.stats || stats);
      setForm({ recipientId: recipients[0]?.id_zamestnanec || "", subject: "", body: "" });
      setComposeMessage({ type: "success", text: data.message || "Zpráva byla odeslána." });
    } catch (error) {
      setComposeMessage({ type: "error", text: error.message || "Chyba při odesílání zprávy." });
    } finally {
      setSending(false);
    }
  };

  const replyToMessage = (item) => {
    if (!item.senderId) return;

    setForm({
      recipientId: String(item.senderId),
      subject: item.subject?.startsWith("Re:") ? item.subject : `Re: ${item.subject}`,
      body: "",
    });
    setComposeMessage({
      type: "success",
      text: `Odpověď pro ${item.sender} je připravená.`,
    });
  };

  const markRead = async (messageId) => {
    try {
      const response = await fetch("http://localhost/api/zpravy.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", messageId }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Zprávu se nepodařilo upravit.");
      }

      setMessages(data.messages || []);
      setStats(data.stats || stats);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Chyba při úpravě zprávy." });
    }
  };

  return (
    <SystemLayout className="p-8 xl:p-10">
      <PageHeader eyebrow="Systém" title="Zprávy" />

      {message && (
        <div
          className={`mb-8 rounded-2xl px-5 py-4 font-bold ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <article className="bg-white rounded-3xl shadow-md p-6">
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-5">
            <Bell size={30} />
          </div>
          <p className="text-gray-500 font-bold">Notifikace</p>
          <p className="text-4xl font-black text-black mt-1">
            {loading ? "..." : stats.notifications}
          </p>
        </article>
        <article className="bg-white rounded-3xl shadow-md p-6">
          <div className="w-14 h-14 rounded-2xl bg-system_modra_svtetlejsi text-white flex items-center justify-center mb-5">
            <Mail size={30} />
          </div>
          <p className="text-gray-500 font-bold">Zprávy</p>
          <p className="text-4xl font-black text-black mt-1">
            {loading ? "..." : stats.messages + stats.system}
          </p>
        </article>
        <article className="bg-white rounded-3xl shadow-md p-6">
          <div className="w-14 h-14 rounded-2xl bg-yellow-400 text-black flex items-center justify-center mb-5">
            <CheckCheck size={30} />
          </div>
          <p className="text-gray-500 font-bold">Nepřečtené celkem</p>
          <p className="text-4xl font-black text-black mt-1">{loading ? "..." : stats.unread}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        <div className="bg-white rounded-3xl shadow-md p-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-7">
            <div>
              <p className="text-gray-500 font-black uppercase">Schránka</p>
              <h2 className="text-3xl font-black text-black">{activeSectionInfo.title}</h2>
              <p className="font-semibold text-gray-600 mt-1">
                {activeSectionInfo.description}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-pozadi rounded-2xl px-4 py-4 lg:w-80">
              <Search size={22} className="text-gray-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent font-bold text-black outline-none"
                placeholder="Hledat zprávu"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-7">
            {messageSections.map(({ id, label, icon: Icon }) => {
              const isActive = activeSection === id;
              const count =
                id === "notifikace" ? stats.notifications : stats.messages + stats.system;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={`rounded-2xl px-5 py-4 flex items-center justify-between gap-4 font-black transition ${
                    isActive
                      ? "bg-primary text-white shadow-md"
                      : "bg-pozadi text-black hover:bg-primary/10"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={22} />
                    {label}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm ${
                      isActive ? "bg-white/20 text-white" : "bg-white text-primary"
                    }`}
                  >
                    {loading ? "..." : count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            {loading && (
              <div className="rounded-3xl bg-pozadi p-8 text-center">
                <p className="text-2xl font-black text-black">Načítání zpráv...</p>
              </div>
            )}

            {!loading && filteredMessages.length === 0 && (
              <div className="rounded-3xl bg-pozadi p-8 text-center">
                <p className="text-2xl font-black text-black">Žádná zpráva nenalezena.</p>
              </div>
            )}

            {!loading &&
              filteredMessages.map((item) => {
                const ItemIcon = ["notifikace", "upozorneni"].includes(item.type)
                  ? Bell
                  : MessageSquareText;

                return (
                <article
                  key={item.id}
                  className={`rounded-3xl border-2 p-5 ${
                    !item.read ? "border-primary bg-pozadi" : "border-pozadi bg-white"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white text-primary flex items-center justify-center shrink-0">
                        <ItemIcon size={25} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <h3 className="text-2xl font-black text-black">{item.subject}</h3>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-primary">
                            {typeLabels[item.type] || "Zpráva"}
                          </span>
                          {!item.read && (
                            <span className="rounded-full bg-primary px-3 py-1 text-xs font-black text-white">
                              nové
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold text-gray-500">
                          <span className="text-black">{item.sender}</span>
                          {item.senderEmail && <span>{item.senderEmail}</span>}
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                        <p className="font-semibold text-gray-700 mt-3">{item.text}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap lg:flex-col gap-2 lg:items-stretch shrink-0">
                      {!item.read && (
                        <button
                          type="button"
                          onClick={() => markRead(item.id)}
                          className="rounded-2xl bg-white px-4 py-3 font-black text-primary hover:bg-primary hover:text-white transition"
                        >
                          Označit přečtené
                        </button>
                      )}
                      {item.senderId && (
                        <button
                          type="button"
                          onClick={() => replyToMessage(item)}
                          className="rounded-2xl bg-primary px-4 py-3 font-black text-white hover:bg-primary/90 transition flex items-center justify-center gap-2"
                        >
                          <Reply size={18} />
                          Odpovědět
                        </button>
                      )}
                      {["notifikace", "upozorneni"].includes(item.type) && (
                        <button
                          type="button"
                          onClick={() => navigate("/schvalovani_absenci")}
                          className="rounded-2xl bg-seda px-4 py-3 font-black text-white hover:bg-seda/90 transition flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={18} />
                          Otevřít
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="bg-white rounded-3xl shadow-md p-7 h-max">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-primary to-system_modra_svtetlejsi text-white flex items-center justify-center mb-5">
            <Send size={30} />
          </div>
          <h2 className="text-3xl font-black text-black mb-5">Rychlá zpráva</h2>
          <div className="space-y-4">
            <div className="relative">
              <select
                value={form.recipientId}
                onChange={(event) => updateForm("recipientId", event.target.value)}
                className="w-full appearance-none bg-pozadi rounded-2xl pl-4 pr-14 py-4 font-bold text-black outline-none truncate"
              >
                {recipients.map((recipient) => (
                  <option key={recipient.id_zamestnanec} value={recipient.id_zamestnanec}>
                    {recipientLabel(recipient)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={22}
                className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </div>
            <input
              value={form.subject}
              onChange={(event) => updateForm("subject", event.target.value)}
              className="w-full bg-pozadi rounded-2xl px-4 py-4 font-bold text-black outline-none"
              placeholder="Předmět"
            />
            <textarea
              value={form.body}
              onChange={(event) => updateForm("body", event.target.value)}
              className="w-full min-h-36 bg-pozadi rounded-2xl px-4 py-4 font-bold text-black outline-none resize-none"
              placeholder="Text zprávy"
            />
          </div>
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !form.recipientId}
            className="w-full mt-5 bg-primary text-white rounded-2xl py-4 font-black flex items-center justify-center gap-3 hover:scale-105 transition disabled:opacity-60"
          >
            {sending ? <Loader2 className="animate-spin" size={22} /> : <Send size={22} />}
            Odeslat
          </button>

          {composeMessage && (
            <div
              className={`mt-4 rounded-2xl px-4 py-3 font-bold ${
                composeMessage.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {composeMessage.text}
            </div>
          )}

          <div className="mt-7 rounded-3xl bg-pozadi p-5">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="text-primary" size={24} />
              <h3 className="text-xl font-black text-black">Interní schránka</h3>
            </div>
            <p className="font-semibold text-gray-600">
              Zprávy se ukládají do databáze, podporují přečtení a zobrazují systémové notifikace.
            </p>
          </div>
        </aside>
      </section>
    </SystemLayout>
  );
}
