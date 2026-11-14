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
  Key,
  Trash2,
  Copy
} from "lucide-react";

// ============================================================================
// PASTE YOUR GEMINI API KEY INSIDE THE QUOTES BELOW (OR USE THE KEY ICON IN APP):
const DEFAULT_API_KEY = "";
// ============================================================================

const INITIAL_CUSTOMERS = [
  {
    id: "1",
    name: "Liam MacDonald",
    phone: "7095550142",
    service: "Fibe 1.5 Gbps + Fibe TV App",
    stage: "3-Day Install Check",
    dueDate: "Today",
    notes: "Tech install scheduled yesterday afternoon. Has 2 Wi-Fi pods."
  },
  {
    id: "2",
    name: "Sarah Kavanagh",
    phone: "7095550198",
    service: "iPhone 16 Pro (2-Yr SmartPay)",
    stage: "30-Day 1st Bill Review",
    dueDate: "Tomorrow",
    notes: "Explain connection fee credit and partial month proration."
  },
  {
    id: "3",
    name: "David Mercer",
    phone: "7095550115",
    service: "BYOD 100GB Mobility",
    stage: "Home Internet Cross-Sell",
    dueDate: "In 3 Days",
    notes: "Mentioned his current home internet contract ends this month."
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("clients");
  const [privacyMode, setPrivacyMode] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("bell_gemini_key") || DEFAULT_API_KEY);
  const [showKeyModal, setShowKeyModal] = useState(false);

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem("bell_customers_v1");
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    service: "",
    stage: "3-Day Install Check",
    notes: ""
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const [loadingAI, setLoadingAI] = useState(false);
  const [shiftBriefing, setShiftBriefing] = useState("");
  const [selectedClient, setSelectedClient] = useState(INITIAL_CUSTOMERS[0]);
  const [draftedMessage, setDraftedMessage] = useState("");
  const [contextInput, setContextInput] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [contextResult, setContextResult] = useState("");

  useEffect(() => {
    localStorage.setItem("bell_customers_v1", JSON.stringify(customers));
  }, [customers]);

  const saveApiKey = (newKey) => {
    setApiKey(newKey.trim());
    localStorage.setItem("bell_gemini_key", newKey.trim());
    setShowKeyModal(false);
  };

  const maskName = (name) => {
    if (!privacyMode) return name;
    const parts = name.split(" ");
    return parts.map((p, i) => (i === 0 ? p : p[0] + "***")).join(" ");
  };

  const callGemini = async (promptText, inlineImage = null) => {
    const activeKey = apiKey || DEFAULT_API_KEY;
    if (!activeKey) {
      setShowKeyModal(true);
      throw new Error("Please add your Gemini API Key first.");
    }

    const parts = [{ text: promptText }];
    if (inlineImage) {
      parts.push({
        inlineData: {
          mimeType: inlineImage.mimeType,
          data: inlineImage.data
        }
      });
    }

    const models = [
      "gemini-3.0-flash",
      "gemini-3.8-flash",
      "gemini-3-flash-preview",
      "gemini-2.5-flash-lite"
    ];
    let lastError = "No response generated.";

    for (const model of models) {
      const endpoint =
        "https:" +
        "//generativelanguage.googleapis.com/v1beta/models/" +
        model +
        ":generateContent?key=" +
        activeKey;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] })
      });

      const data = await res.json();
      if (!data.error) {
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
      }
      lastError = data.error.message;
    }

    throw new Error(lastError);
  };

  const generateShiftBriefing = async () => {
    setLoadingAI(true);
    try {
      const summaryPrompt = `You are an assistant for a Bell Technical Sales Consultant. Here is my current customer follow-up list: ${JSON.stringify(
        customers
      )}. Give me a short, punchy 3-bullet shift priority briefing on who to contact first today, what cross-sell or retention angle to use, and any proration/install tips.`;
      const reply = await callGemini(summaryPrompt);
      setShiftBriefing(reply);
    } catch (err) {
      setShiftBriefing("Error: " + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const generateFollowUpMessage = async (client, type = "SMS") => {
    setSelectedClient(client);
    setActiveTab("outreach");
    setLoadingAI(true);
    try {
      const prompt = `Write a friendly, concise, non-pushy ${type} from a Bell retail Technical Sales Consultant to customer ${client.name}. 
Service: ${client.service}. 
Follow-up stage: ${client.stage}. 
Notes: ${client.notes}. 
Keep it natural for texting from a work phone—no robotic corporate language, under 320 characters if SMS.`;
      const reply = await callGemini(prompt);
      setDraftedMessage(reply.trim());
    } catch (err) {
      setDraftedMessage("Error: " + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(",")[1];
      setImageBase64({ mimeType: file.type, data: base64String, preview: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoneContext = async () => {
    setLoadingAI(true);
    try {
      const prompt = `You are a Bell Technical Sales Consultant AI assistant. 
My existing customer list is: ${JSON.stringify(customers)}.
Analyze the following notes/screenshot from my phone: "${contextInput}".
1. Match any names/numbers to my existing customers or identify new leads.
2. If there is a promo sheet or rate plan mentioned, suggest which of my customers would benefit most and write a 1-sentence text I can send them.`;
      const reply = await callGemini(prompt, imageBase64);
      setContextResult(reply);
    } catch (err) {
      setContextResult("Error: " + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const addCustomer = (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;
    const created = {
      ...newCustomer,
      id: Date.now().toString(),
      dueDate: "Today"
    };
    setCustomers([created, ...customers]);
    setNewCustomer({ name: "", phone: "", service: "", stage: "3-Day Install Check", notes: "" });
    setShowAddForm(false);
  };

  const updateCadence = (id, newDue, newStage) => {
    setCustomers(
      customers.map((c) => (c.id === id ? { ...c, dueDate: newDue, stage: newStage || c.stage } : c))
    );
  };

  const deleteCustomer = (id) => {
    setCustomers(customers.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 font-sans">
      <header className="bg-[#00549A] px-4 py-3.5 sticky top-0 z-20 shadow-md flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg tracking-tight text-white">Bell Sales Hub</h1>
          <p className="text-xs text-blue-100">Technical Consultant Assistant</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className="p-2 rounded-lg bg-blue-800/70 text-white hover:bg-blue-700"
            title="Toggle Floor Privacy"
          >
            {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            onClick={() => setShowKeyModal(true)}
            className="p-2 rounded-lg bg-blue-800/70 text-white hover:bg-blue-700"
            title="Set Gemini API Key"
          >
            <Key size={18} />
          </button>
        </div>
      </header>

      {showKeyModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h2 className="font-bold text-base">Gemini API Key</h2>
            <p className="text-xs text-slate-400">
              Saved privately in your browser storage.
            </p>
            <input
              type="password"
              defaultValue={apiKey}
              placeholder="Paste AIza... key here"
              id="apiKeyInput"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => saveApiKey(document.getElementById("apiKeyInput").value)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#00549A] text-white"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto p-4 space-y-4">
        {activeTab === "clients" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Sparkles size={14} /> Shift Priority Queue
                </span>
                <button
                  onClick={generateShiftBriefing}
                  disabled={loadingAI}
                  className="text-xs bg-[#00549A] hover:bg-blue-600 px-3 py-1.5 rounded-lg font-medium"
                >
                  {loadingAI ? "Analyzing..." : "Run Briefing"}
                </button>
              </div>
              {shiftBriefing ? (
                <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {shiftBriefing}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Tap Run Briefing to let Gemini rank today&apos;s highest-value follow-ups and cross-sells.
                </p>
              )}
            </div>

            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-sm text-slate-300">
                Active Follow-Ups ({customers.length})
              </h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-blue-400 font-medium"
              >
                <UserPlus size={15} /> New Lead
              </button>
            </div>

            {showAddForm && (
              <form
                onSubmit={addCustomer}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3"
              >
                <input
                  placeholder="Customer Name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm"
                  required
                />
                <input
                  placeholder="Phone Number (e.g. 7095550199)"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm"
                  required
                />
                <input
                  placeholder="Sold Service (e.g. Fibe 3 Gbps + Mobility)"
                  value={newCustomer.service}
                  onChange={(e) => setNewCustomer({ ...newCustomer, service: e.target.value })}
                  className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm"
                />
                <textarea
                  placeholder="Notes (install date, promised credits, family phones...)"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                />
                <button
                  type="submit"
                  className="w-full bg-[#00549A] py-2 rounded-lg text-sm font-semibold"
                >
                  Save to Follow-Up Queue
                </button>
              </form>
            )}

            {customers.map((c) => (
              <div
                key={c.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-white">{maskName(c.name)}</h3>
                    <p className="text-xs text-blue-400 font-medium">{c.service}</p>
                  </div>
                  <span className="text-[11px] bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-0.5 rounded-full">
                    {c.dueDate} • {c.stage}
                  </span>
                </div>

                <p className="text-xs text-slate-400">{c.notes}</p>

                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <button
                    onClick={() => updateCadence(c.id, "In 3 Days", "3-Day Install Check")}
                    className="text-[11px] bg-slate-800 px-2.5 py-1 rounded-md text-slate-300"
                  >
                    +3d Check
                  </button>
                  <button
                    onClick={() => updateCadence(c.id, "In 30 Days", "30-Day 1st Bill Review")}
                    className="text-[11px] bg-slate-800 px-2.5 py-1 rounded-md text-slate-300"
                  >
                    +30d 1st Bill
                  </button>
                  <button
                    onClick={() => updateCadence(c.id, "Completed", "Followed Up")}
                    className="text-[11px] bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded-md flex items-center gap-1"
                  >
                    <CheckCircle2 size={12} /> Done
                  </button>
                  <button
                    onClick={() => deleteCustomer(c.id)}
                    className="ml-auto text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 py-2 rounded-xl text-xs font-medium text-white"
                  >
                    <Phone size={14} /> Call
                  </a>
                  <a
                    href={`sms:${c.phone}`}
                    className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 py-2 rounded-xl text-xs font-medium text-white"
                  >
                    <MessageSquare size={14} /> Text
                  </a>
                  <button
                    onClick={() => generateFollowUpMessage(c, "SMS")}
                    className="flex items-center justify-center gap-1.5 bg-[#00549A] hover:bg-blue-600 py-2 rounded-xl text-xs font-semibold text-white"
                  >
                    <Sparkles size={14} /> AI Draft
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "scanner" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <FileText size={16} className="text-blue-400" /> Phone Context & Promo Matcher
              </h2>
              <p className="text-xs text-slate-400">
                Paste text from your iPhone Shortcut, voice notes, or upload a photo of a dealer promo sheet to match offers with your customers.
              </p>

              <textarea
                value={contextInput}
                onChange={(e) => setContextInput(e.target.value)}
                placeholder="Paste copied screen text, customer notes, or new Bell promo details here..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />

              <label className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-medium cursor-pointer">
                <Upload size={15} /> Upload Promo Photo or Note Screenshot
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {imageBase64 && (
                <div className="text-xs text-emerald-400 flex items-center justify-between bg-slate-950 p-2 rounded-lg">
                  <span>Image attached ready for Gemini scan</span>
                  <button onClick={() => setImageBase64(null)} className="text-red-400 underline">
                    Remove
                  </button>
                </div>
              )}

              <button
                onClick={analyzePhoneContext}
                disabled={loadingAI}
                className="w-full bg-[#00549A] hover:bg-blue-600 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Sparkles size={15} />
                {loadingAI ? "Scanning with Gemini..." : "Match Customers & Suggest Pitch"}
              </button>
            </div>

            {contextResult && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase text-blue-400">AI Recommendations</h3>
                <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                  {contextResult}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "outreach" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h2 className="font-bold text-sm">AI Message Composer</h2>

              <select
                value={selectedClient?.id}
                onChange={(e) =>
                  setSelectedClient(customers.find((c) => c.id === e.target.value))
                }
                className="w-full bg-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.service}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => generateFollowUpMessage(selectedClient, "SMS")}
                  disabled={loadingAI}
                  className="flex-1 bg-[#00549A] py-2 rounded-xl text-xs font-semibold"
                >
                  Draft SMS Text
                </button>
                <button
                  onClick={() => generateFollowUpMessage(selectedClient, "Voicemail Call Script")}
                  disabled={loadingAI}
                  className="flex-1 bg-slate-800 py-2 rounded-xl text-xs font-semibold"
                >
                  Draft Call Script
                </button>
              </div>

              <textarea
                value={draftedMessage}
                onChange={(e) => setDraftedMessage(e.target.value)}
                rows={5}
                placeholder="Tap 'Draft SMS Text' above to generate a custom follow-up..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"
              />

              {selectedClient && draftedMessage && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(draftedMessage)}
                    className="flex items-center justify-center gap-1.5 bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-medium"
                  >
                    <Copy size={14} /> Copy
                  </button>
                  <a
                    href={`sms:${selectedClient.phone}?&body=${encodeURIComponent(draftedMessage)}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl text-xs font-bold text-white"
                  >
                    <Send size={14} /> Open in iPhone Messages
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 flex justify-around py-2.5 z-20 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab("clients")}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            activeTab === "clients" ? "text-blue-400 font-semibold" : "text-slate-400"
          }`}
        >
          <Calendar size={18} />
          Queue
        </button>
        <button
          onClick={() => setActiveTab("scanner")}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            activeTab === "scanner" ? "text-blue-400 font-semibold" : "text-slate-400"
          }`}
        >
          <Upload size={18} />
          Phone Context
        </button>
        <button
          onClick={() => setActiveTab("outreach")}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            activeTab === "outreach" ? "text-blue-400 font-semibold" : "text-slate-400"
          }`}
        >
          <MessageSquare size={18} />
          AI Outreach
        </button>
      </nav>
    </div>
  );
}