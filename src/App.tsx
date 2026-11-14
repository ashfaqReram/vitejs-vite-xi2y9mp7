// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Phone,
  MessageSquare,
  Sparkles,
  UserPlus,
  Eye,
  EyeOff,
  Calendar,
  Upload,
  FileText,
  Send,
  CheckCircle2,
  Trash2,
  Copy,
  ClipboardPaste,
  Zap
} from "lucide-react";

const INITIAL_CUSTOMERS = [
  {
    id: "1",
    name: "Liam MacDonald",
    phone: "7095550142",
    service: "Mobility & BRS",
    stage: "3-Day Install Check",
    dueDate: "Today",
    notes: "New bundle activation."
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("clients");
  const [privacyMode, setPrivacyMode] = useState(false);

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem("bell_customers_v7");
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    service: "Mobility & BRS",
    stage: "3-Day Install Check",
    notes: ""
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const [quickSmsInput, setQuickSmsInput] = useState("");
  const [selectedClient, setSelectedClient] = useState(INITIAL_CUSTOMERS[0]);
  const [draftedMessage, setDraftedMessage] = useState("");
  const [contextInput, setContextInput] = useState("");
  const [contextResult, setContextResult] = useState("");

  useEffect(() => {
    localStorage.setItem("bell_customers_v7", JSON.stringify(customers));
  }, [customers]);

  const maskName = (name) => {
    if (!privacyMode) return name;
    const parts = name.split(" ");
    return parts.map((p, i) => (i === 0 ? p : p[0] + "***")).join(" ");
  };

  const generateInstantTemplate = (client) => {
    setSelectedClient(client);
    setActiveTab("outreach");

    const name = client.name.split(" ")[0];
    let body = "";

    if (client.service === "Mobility & BRS") {
      body = `Hi ${name}, Ash here from Bell at Pippy Place! Just checking in to see how everything is working with your new mobility plan/device and your home internet/TV setup. Let me know if you have any questions!\n\n- Ash from Bell at 34 Pippy Place, St. John's, NL A1B 3X4`;
    } else if (client.service === "BRS Only") {
      body = `Hi ${name}, Ash here from Bell at Pippy Place! Just wanted to follow up on your home internet and TV install. How is the Wi-Fi speed and setup working out for you?\n\n- Ash from Bell at 34 Pippy Place, St. John's, NL A1B 3X4`;
    } else {
      body = `Hi ${name}, Ash here from Bell at Pippy Place! Just checking in to see how you're liking your new mobile device and plan. Everything working great with your coverage?\n\n- Ash from Bell at 34 Pippy Place, St. John's, NL A1B 3X4`;
    }

    setDraftedMessage(body);
  };

  const addCustomer = (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;
    setCustomers([
      { ...newCustomer, id: Date.now().toString(), dueDate: "Today" },
      ...customers
    ]);
    setNewCustomer({
      name: "",
      phone: "",
      service: "Mobility & BRS",
      stage: "3-Day Install Check",
      notes: ""
    });
    setShowAddForm(false);
  };

  const updateCadence = (id, newDue, newStage) => {
    setCustomers(
      customers.map((c) =>
        c.id === id ? { ...c, dueDate: newDue, stage: newStage || c.stage } : c
      )
    );
  };

  const deleteCustomer = (id) => {
    setCustomers(customers.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 font-sans">
      <header className="bg-[#00549A] px-4 py-3.5 sticky top-0 z-20 shadow-md flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg tracking-tight text-white">Bell Sales Hub v2.0.1</h1>
          <p className="text-xs text-blue-100">Ash — 34 Pippy Place</p>
        </div>
        <button onClick={() => setPrivacyMode(!privacyMode)} className="p-2 rounded-lg bg-blue-800/70 text-white">
          {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {activeTab === "clients" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-blue-900/50 rounded-2xl p-3.5 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <ClipboardPaste size={13} /> Quick Log Customer
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickSmsInput}
                  onChange={(e) => setQuickSmsInput(e.target.value)}
                  placeholder="Customer Name & Details..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  onClick={() => {
                    if (!quickSmsInput.trim()) return;
                    setCustomers([
                      {
                        id: Date.now().toString(),
                        name: quickSmsInput,
                        phone: "7095550000",
                        service: "Mobility & BRS",
                        stage: "3-Day Install Check",
                        dueDate: "Today",
                        notes: "Quick logged from floor."
                      },
                      ...customers
                    ]);
                    setQuickSmsInput("");
                  }}
                  className="bg-[#00549A] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
                >
                  Add Lead
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-sm text-slate-300">Active Queue ({customers.length})</h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 text-xs bg-slate-800 px-3 py-1.5 rounded-lg text-blue-400 font-medium"
              >
                <UserPlus size={15} /> New Customer
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={addCustomer} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
                <input placeholder="Customer Name" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm" required />
                <input placeholder="Phone Number" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm" required />
                
                <label className="text-xs text-slate-400 block">Select Sale Type:</label>
                <select value={newCustomer.service} onChange={(e) => setNewCustomer({ ...newCustomer, service: e.target.value })} className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-white font-medium">
                  <option value="Mobility & BRS">Mobility & BRS (Both)</option>
                  <option value="BRS Only">BRS Only (Internet/TV)</option>
                  <option value="Mobility Only">Mobility Only (Phone/Plan)</option>
                </select>

                <select value={newCustomer.stage} onChange={(e) => setNewCustomer({ ...newCustomer, stage: e.target.value })} className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="3-Day Install Check">3-Day Install Check</option>
                  <option value="30-Day 1st Bill Review">30-Day Bill Review</option>
                  <option value="Completed">Follow-Up Completed</option>
                </select>
                <textarea placeholder="Notes..." value={newCustomer.notes} onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })} className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm" rows={2} />
                <button type="submit" className="w-full bg-[#00549A] py-2 rounded-lg text-sm font-semibold">Save Customer</button>
              </form>
            )}

            {customers.map((c) => (
              <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-white">{maskName(c.name)}</h3>
                    <p className="text-xs text-blue-400 font-semibold">{c.service}</p>
                  </div>
                  <span className="text-[11px] bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-0.5 rounded-full">
                    {c.stage}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{c.notes}</p>
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <button onClick={() => updateCadence(c.id, "In 3 Days", "3-Day Install Check")} className="text-[11px] bg-slate-800 px-2.5 py-1 rounded-md text-slate-300">+3d Check</button>
                  <button onClick={() => updateCadence(c.id, "In 30 Days", "30-Day 1st Bill Review")} className="text-[11px] bg-slate-800 px-2.5 py-1 rounded-md text-slate-300">+30d Bill</button>
                  <button onClick={() => updateCadence(c.id, "Done", "Completed")} className="text-[11px] bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded-md flex items-center gap-1"><CheckCircle2 size={12} /> Done</button>
                  <button onClick={() => deleteCustomer(c.id)} className="ml-auto text-slate-500 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                  <a href={`tel:${c.phone}`} className="flex items-center justify-center gap-1.5 bg-slate-800 py-2 rounded-xl text-xs font-medium text-white"><Phone size={14} /> Call</a>
                  <a href={`sms:${c.phone}`} className="flex items-center justify-center gap-1.5 bg-slate-800 py-2 rounded-xl text-xs font-medium text-white"><MessageSquare size={14} /> Text</a>
                  <button onClick={() => generateInstantTemplate(c)} className="flex items-center justify-center gap-1.5 bg-[#00549A] py-2 rounded-xl text-xs font-semibold text-white"><Zap size={14} /> Instant Draft</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "scanner" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h2 className="font-bold text-sm flex items-center gap-2"><FileText size={16} className="text-blue-400" /> Quick Notes</h2>
              <textarea value={contextInput} onChange={(e) => setContextInput(e.target.value)} placeholder="Type customer notes here..." rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white" />
              <button onClick={() => {
                setContextResult(`Follow-up saved for notes: "${contextInput}"\n\n- Ash from Bell at 34 Pippy Place, St. John's, NL A1B 3X4`);
              }} className="w-full bg-[#00549A] py-2.5 rounded-xl text-xs font-semibold">Format Note</button>
            </div>
            {contextResult && <div className="bg-slate-900 p-4 rounded-2xl text-xs text-slate-200 whitespace-pre-line">{contextResult}</div>}
          </div>
        )}

        {activeTab === "outreach" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h2 className="font-bold text-sm">Post-Sale Message Generator</h2>
              <select value={selectedClient?.id} onChange={(e) => {
                const found = customers.find(c => c.id === e.target.value);
                if (found) generateInstantTemplate(found);
              }} className="w-full bg-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium">
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.service}</option>)}
              </select>
              
              <textarea value={draftedMessage} onChange={(e) => setDraftedMessage(e.target.value)} rows={6} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 leading-relaxed" />
              
              {selectedClient && draftedMessage && (
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(draftedMessage)} className="bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-medium"><Copy size={14} /></button>
                  <a href={`sms:${selectedClient.phone}?&body=${encodeURIComponent(draftedMessage)}`} className="flex-1 bg-emerald-600 py-2.5 rounded-xl text-xs font-bold text-center text-white"><Send size={14} /> Open in Messages & Send</a>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 flex justify-around py-2.5 z-50 w-full max-w-md mx-auto">
        <button onClick={() => setActiveTab("clients")} className={`flex flex-col items-center gap-1 text-[11px] ${activeTab === "clients" ? "text-blue-400 font-semibold" : "text-slate-400"}`}><Calendar size={18} /> Queue</button>
        <button onClick={() => setActiveTab("scanner")} className={`flex flex-col items-center gap-1 text-[11px] ${activeTab === "scanner" ? "text-blue-400 font-semibold" : "text-slate-400"}`}><Upload size={18} /> Notes</button>
        <button onClick={() => setActiveTab("outreach")} className={`flex flex-col items-center gap-1 text-[11px] ${activeTab === "outreach" ? "text-blue-400 font-semibold" : "text-slate-400"}`}><MessageSquare size={18} /> Follow-Up</button>
      </nav>
    </div>
  );
}