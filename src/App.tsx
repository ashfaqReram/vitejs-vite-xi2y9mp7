// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Phone,
  MessageSquare,
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
  Zap,
  Download,
  Database,
  X,
  Search,
  Edit3
} from "lucide-react";

// PERMANENT STORAGE KEY - DO NOT CHANGE THIS NAME IN FUTURE UPDATES
const STORAGE_KEY = "bell_saved_leads_permanent";

const BUNDLE_PRICES = {
  Starter: "$90",
  Good: "$100",
  Better: "$110",
  Best: "$130"
};

const DEFAULT_LEADS = [
  {
    id: "1",
    name: "Liam MacDonald",
    phone: "7095550142",
    customerType: "Both Mobility and Residential",
    mobilityGoal: "Pitch",
    phoneModel: "iPhone 16 Pro",
    resStatus: "Winback Customer",
    bundleTier: "Better",
    stage: "Active Lead",
    notes: "Switched from Rogers."
  }
];

function loadSavedLeads() {
  try {
    const permanent = localStorage.getItem(STORAGE_KEY);
    if (permanent) {
      const parsed = JSON.parse(permanent);
      if (Array.isArray(parsed)) return parsed;
    }

    const oldKeys = [
      "bell_customers_v8",
      "bell_customers_v7",
      "bell_customers_v6",
      "bell_customers_v5",
      "bell_customers_v4",
      "bell_customers_v3",
      "bell_customers_v2",
      "bell_customers_v1"
    ];

    for (const key of oldKeys) {
      const oldData = localStorage.getItem(key);
      if (oldData) {
        const parsedOld = JSON.parse(oldData);
        if (Array.isArray(parsedOld) && parsedOld.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedOld));
          return parsedOld;
        }
      }
    }
  } catch (e) {
    console.error("Failed to load leads", e);
  }
  return DEFAULT_LEADS;
}

const EMPTY_FORM = {
  name: "",
  phone: "",
  customerType: "Mobility",
  mobilityGoal: "Follow-up",
  phoneModel: "",
  resStatus: "New Customer",
  bundleTier: "Starter",
  notes: ""
};

export default function App() {
  const [activeTab, setActiveTab] = useState("clients");
  const [privacyMode, setPrivacyMode] = useState(false);

  const [customers, setCustomers] = useState(() => loadSavedLeads());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [showBackupModal, setShowBackupModal] = useState(false);
  const [restoreText, setRestoreText] = useState("");
  const [backupStatus, setBackupStatus] = useState("");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [newCustomer, setNewCustomer] = useState(EMPTY_FORM);

  const [selectedClient, setSelectedClient] = useState(
    () => loadSavedLeads()[0] || null
  );
  const [draftedMessage, setDraftedMessage] = useState("");
  const [contextInput, setContextInput] = useState("");
  const [contextResult, setContextResult] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  }, [customers]);

  const maskName = (name) => {
    if (!privacyMode || !name) return name;
    const parts = name.split(" ");
    return parts.map((p, i) => (i === 0 ? p : p[0] + "***")).join(" ");
  };

  const hasMobility = (type) =>
    type === "Mobility" || type === "Both Mobility and Residential";

  const hasResidential = (type) =>
    type === "Residential" || type === "Both Mobility and Residential";

  // BACKUP & EXPORT FUNCTIONS
  const exportJSONBackup = () => {
    const dataStr = JSON.stringify(customers, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `bell-leads-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatus("JSON backup downloaded to your device!");
  };

  const exportCSV = () => {
    const headers = [
      "Name",
      "Phone",
      "Customer Type",
      "Mobility Type",
      "Phone Model",
      "Residential Status",
      "Bundle Tier",
      "Stage",
      "Notes"
    ];
    const escapeCSV = (val) => `"${String(val || "").replace(/"/g, '""')}"`;
    const rows = customers.map((c) =>
      [
        c.name,
        c.phone,
        c.customerType || c.service || "",
        c.mobilityGoal || "",
        c.phoneModel || "",
        c.resStatus || "",
        c.bundleTier || "",
        c.stage || "",
        c.notes || ""
      ]
        .map(escapeCSV)
        .join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `bell-leads-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatus("CSV spreadsheet downloaded!");
  };

  const copyBackupToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(customers, null, 2));
    setBackupStatus("Copied! You can paste this into iPhone Notes as a backup.");
  };

  const handleRestoreFromText = () => {
    if (!restoreText.trim()) return;
    try {
      const parsed = JSON.parse(restoreText.trim());
      if (!Array.isArray(parsed)) throw new Error("Invalid format");
      setCustomers(parsed);
      setRestoreText("");
      setBackupStatus(`Restored ${parsed.length} leads successfully!`);
    } catch (err) {
      alert("Invalid backup text. Make sure you pasted the exact JSON backup.");
    }
  };

  const handleRestoreFromFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed)) throw new Error("Invalid format");
        setCustomers(parsed);
        setBackupStatus(`Restored ${parsed.length} leads from file!`);
      } catch (err) {
        alert("Could not read backup file. Please select a valid .json backup.");
      }
    };
    reader.readAsText(file);
  };

  const generateInstantTemplate = (client) => {
    if (!client) return;
    setSelectedClient(client);
    setActiveTab("outreach");

    const firstName = (client.name || "there").trim().split(" ")[0];
    const parts = [
      `Hi ${firstName}, it's Ash here from Bell at Pippy Place!`
    ];

    const cType = client.customerType || client.service || "Mobility";

    // Mobility Section
    if (
      cType === "Mobility" ||
      cType === "Both Mobility and Residential" ||
      cType.includes("Mobility")
    ) {
      const modelText = client.phoneModel
        ? `your new ${client.phoneModel}`
        : "your new phone and plan";

      parts.push(
        `Just checking in to see how you're liking ${modelText}. Also wanted to let you know we have some great plans on adding an additional line, plus really great deals on watches and tablets if you're interested!`
      );

      if (client.mobilityGoal === "Pitch") {
        parts.push(
          `If you liked the service, it would be great if you could pass my contact information along to any family members or friends who might be looking!`
        );
      }
    }

    // Residential Section
    if (
      cType === "Residential" ||
      cType === "Both Mobility and Residential" ||
      cType.includes("BRS")
    ) {
      const tier = client.bundleTier || "Starter";
      const price = BUNDLE_PRICES[tier] || "$90";

      if (client.resStatus === "Winback Customer") {
        parts.push(
          `Remember there's always a 30-day grace period before you get locked in with a Rogers contract.`
        );
      }

      parts.push(
        `With our ${tier} bundle at ${price}/mo, you get our true 1.5Gbps Fibre to the Home internet (unlike competitors that only have Fibre to the Node, which gets really slow during the holiday seasons) plus a $200 gift card after 3 billing cycles!`
      );
    }

    parts.push(`Let me know if you have any questions!`);
    setDraftedMessage(parts.join(" "));
  };

  const startEditing = (customer) => {
    setEditingId(customer.id);
    setNewCustomer({
      name: customer.name || "",
      phone: customer.phone || "",
      customerType: customer.customerType || customer.service || "Mobility",
      mobilityGoal: customer.mobilityGoal || "Follow-up",
      phoneModel: customer.phoneModel || "",
      resStatus: customer.resStatus || "New Customer",
      bundleTier: customer.bundleTier || "Starter",
      notes: customer.notes || ""
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setNewCustomer(EMPTY_FORM);
  };

  const saveCustomer = (e) => {
    e.preventDefault();
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) return;

    if (editingId) {
      let updatedClient = null;
      const updatedList = customers.map((c) => {
        if (c.id === editingId) {
          updatedClient = { ...c, ...newCustomer };
          return updatedClient;
        }
        return c;
      });
      setCustomers(updatedList);
      setEditingId(null);
      setNewCustomer(EMPTY_FORM);
      setShowAddForm(false);
      if (updatedClient) generateInstantTemplate(updatedClient);
    } else {
      const created = {
        ...newCustomer,
        id: Date.now().toString(),
        stage: "Active Lead"
      };
      setCustomers([created, ...customers]);
      setNewCustomer(EMPTY_FORM);
      setShowAddForm(false);
      generateInstantTemplate(created);
    }
  };

  const updateStage = (id, newStage) => {
    setCustomers(
      customers.map((c) => (c.id === id ? { ...c, stage: newStage } : c))
    );
  };

  const deleteCustomer = (id) => {
    if (!window.confirm("Remove this customer from your saved list?")) return;
    setCustomers(customers.filter((c) => c.id !== id));
  };

  const renderLeadSummary = (c) => {
    const badges = [];
    const cType = c.customerType || c.service || "Mobility";
    badges.push(cType);

    if (hasMobility(cType)) {
      if (c.phoneModel) badges.push(c.phoneModel);
      if (c.mobilityGoal) badges.push(c.mobilityGoal);
    }
    if (hasResidential(cType)) {
      if (c.resStatus) badges.push(c.resStatus);
      if (c.bundleTier) {
        badges.push(`${c.bundleTier} (${BUNDLE_PRICES[c.bundleTier] || ""})`);
      }
    }
    return badges.join(" • ");
  };

  // FILTERED CUSTOMERS LIST
  const filteredCustomers = customers.filter((c) => {
    const cType = c.customerType || c.service || "Mobility";

    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Mobility" && cType === "Mobility") ||
      (activeFilter === "Residential" && cType === "Residential") ||
      (activeFilter === "Both" && cType === "Both Mobility and Residential") ||
      (activeFilter === "Winback" && c.resStatus === "Winback Customer") ||
      (activeFilter === "Pitch" && c.mobilityGoal === "Pitch") ||
      (activeFilter === "Active" && c.stage !== "Completed");

    if (!matchesFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q) ||
      (c.phoneModel || "").toLowerCase().includes(q) ||
      (c.bundleTier || "").toLowerCase().includes(q) ||
      (c.notes || "").toLowerCase().includes(q)
    );
  });

  const filterOptions = [
    "All",
    "Active",
    "Mobility",
    "Residential",
    "Both",
    "Winback",
    "Pitch"
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 font-sans">
      <header className="bg-[#00549A] px-4 py-3.5 sticky top-0 z-20 shadow-md flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg tracking-tight text-white">
            Bell Sales Hub v2.4
          </h1>
          <p className="text-xs text-blue-100">Ash — Pippy Place</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setBackupStatus("");
              setShowBackupModal(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-800/80 text-white text-xs font-medium"
            title="Backup & Export Leads"
          >
            <Download size={15} /> Backup
          </button>
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className="p-2 rounded-lg bg-blue-800/70 text-white"
            title="Privacy Mode"
          >
            {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </header>

      {/* BACKUP & EXPORT MODAL */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Database size={18} className="text-blue-400" /> Backup & Export ({customers.length} Leads)
              </h2>
              <button
                onClick={() => setShowBackupModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {backupStatus && (
              <div className="bg-emerald-950/90 border border-emerald-700 text-emerald-300 text-xs p-2.5 rounded-xl">
                {backupStatus}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300">
                1. Save or Export Your Leads
              </p>
              <button
                onClick={exportCSV}
                className="w-full bg-[#00549A] hover:bg-blue-600 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2"
              >
                <Download size={15} /> Export as CSV Spreadsheet
              </button>
              <button
                onClick={exportJSONBackup}
                className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2"
              >
                <Download size={15} /> Download Full Backup File (.json)
              </button>
              <button
                onClick={copyBackupToClipboard}
                className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-semibold text-blue-300 flex items-center justify-center gap-2"
              >
                <Copy size={15} /> Copy Backup Text (For iPhone Notes)
              </button>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-2">
              <p className="text-xs font-semibold text-slate-300">
                2. Restore Leads from Backup
              </p>
              <label className="w-full bg-slate-800 hover:bg-slate-700 py-2 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-center gap-2 cursor-pointer">
                <Upload size={14} /> Upload .json Backup File
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreFromFile}
                  className="hidden"
                />
              </label>

              <textarea
                value={restoreText}
                onChange={(e) => setRestoreText(e.target.value)}
                placeholder="Or paste copied backup text from iPhone Notes here..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
              {restoreText && (
                <button
                  onClick={handleRestoreFromText}
                  className="w-full bg-emerald-600 py-2 rounded-xl text-xs font-bold text-white"
                >
                  Restore Pasted Leads
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto p-4 space-y-4">
        {activeTab === "clients" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-sm text-slate-300">
                Saved Leads ({filteredCustomers.length} of {customers.length})
              </h2>
              <button
                onClick={() => {
                  if (showAddForm) {
                    cancelForm();
                  } else {
                    setEditingId(null);
                    setNewCustomer(EMPTY_FORM);
                    setShowAddForm(true);
                  }
                }}
                className="flex items-center gap-1.5 text-xs bg-[#00549A] px-3.5 py-2 rounded-xl text-white font-semibold shadow"
              >
                <UserPlus size={15} /> {showAddForm ? "Close Form" : "Collect Lead"}
              </button>
            </div>

            {/* SEARCH BAR & FILTER PILLS */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, device model, or notes..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {filterOptions.map((pill) => (
                  <button
                    key={pill}
                    onClick={() => setActiveFilter(pill)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition ${
                      activeFilter === pill
                        ? "bg-[#00549A] text-white"
                        : "bg-slate-900 text-slate-400 border border-slate-800"
                    }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            {showAddForm && (
              <form
                onSubmit={saveCustomer}
                className="bg-slate-900 border border-blue-600/60 rounded-2xl p-4 space-y-3 shadow-lg"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    {editingId ? "Edit Customer Lead" : "New Customer Lead Form"}
                  </h3>
                  {editingId && (
                    <button
                      type="button"
                      onClick={cancelForm}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block">
                    Customer&apos;s Name
                  </label>
                  <input
                    placeholder="e.g. Sarah Kavanagh"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                    className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block">
                    Phone Number
                  </label>
                  <input
                    placeholder="e.g. 7095550199"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, phone: e.target.value })
                    }
                    className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block">
                    Customer Type
                  </label>
                  <select
                    value={newCustomer.customerType}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        customerType: e.target.value
                      })
                    }
                    className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-white font-medium"
                  >
                    <option value="Mobility">Mobility</option>
                    <option value="Residential">Residential</option>
                    <option value="Both Mobility and Residential">
                      Both Mobility and Residential
                    </option>
                  </select>
                </div>

                {/* MOBILITY FIELDS */}
                {hasMobility(newCustomer.customerType) && (
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-3">
                    <p className="text-xs font-semibold text-blue-400">
                      Mobility Details
                    </p>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 block">
                        Mobility Type (Pitch or Follow-up)
                      </label>
                      <select
                        value={newCustomer.mobilityGoal}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            mobilityGoal: e.target.value
                          })
                        }
                        className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="Follow-up">Follow-up</option>
                        <option value="Pitch">
                          Pitch (Ask for Family & Friends Referrals)
                        </option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 block">
                        Phone Model
                      </label>
                      <input
                        placeholder="e.g. iPhone 16 Pro / Galaxy S25"
                        value={newCustomer.phoneModel}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            phoneModel: e.target.value
                          })
                        }
                        className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                )}

                {/* RESIDENTIAL FIELDS */}
                {hasResidential(newCustomer.customerType) && (
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-3">
                    <p className="text-xs font-semibold text-emerald-400">
                      Residential Details
                    </p>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 block">
                        Residential Customer Type
                      </label>
                      <select
                        value={newCustomer.resStatus}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            resStatus: e.target.value
                          })
                        }
                        className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="New Customer">New Customer</option>
                        <option value="Winback Customer">
                          Winback Customer (30-Day Rogers Grace Period)
                        </option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 block">
                        Which Bundle? ($200 Gift Card + 1.5Gbps FTTH)
                      </label>
                      <select
                        value={newCustomer.bundleTier}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            bundleTier: e.target.value
                          })
                        }
                        className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="Starter">Starter Bundle — $90/mo</option>
                        <option value="Good">Good Bundle — $100/mo</option>
                        <option value="Better">Better Bundle — $110/mo</option>
                        <option value="Best">Best Bundle — $130/mo</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block">
                    Extra Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Any extra details..."
                    value={newCustomer.notes}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, notes: e.target.value })
                    }
                    className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                    rows={2}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#00549A] hover:bg-blue-600 py-2.5 rounded-xl text-sm font-bold text-white"
                >
                  {editingId
                    ? "Update Lead & Re-Draft Message"
                    : "Save Lead & Draft Message"}
                </button>
              </form>
            )}

            {filteredCustomers.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
                No matching leads found for this search or filter.
              </div>
            ) : (
              filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-base text-white">
                        {maskName(c.name)}
                      </h3>
                      <p className="text-xs text-blue-400 font-semibold mt-0.5">
                        {renderLeadSummary(c)}
                      </p>
                    </div>
                    <span className="text-[11px] bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      {c.stage || "Active"}
                    </span>
                  </div>

                  {c.notes && <p className="text-xs text-slate-400">{c.notes}</p>}

                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <button
                      onClick={() => updateStage(c.id, "3-Day Check")}
                      className="text-[11px] bg-slate-800 px-2.5 py-1 rounded-md text-slate-300"
                    >
                      +3d Check
                    </button>
                    <button
                      onClick={() => updateStage(c.id, "30-Day Bill")}
                      className="text-[11px] bg-slate-800 px-2.5 py-1 rounded-md text-slate-300"
                    >
                      +30d Bill
                    </button>
                    <button
                      onClick={() => updateStage(c.id, "Completed")}
                      className="text-[11px] bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded-md flex items-center gap-1"
                    >
                      <CheckCircle2 size={12} /> Done
                    </button>

                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => startEditing(c)}
                        className="text-slate-400 hover:text-blue-400 p-1.5 rounded-lg bg-slate-800/60"
                        title="Edit Customer"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => deleteCustomer(c.id)}
                        className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg bg-slate-800/60"
                        title="Delete Customer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                    <a
                      href={`tel:${c.phone}`}
                      className="flex items-center justify-center gap-1.5 bg-slate-800 py-2 rounded-xl text-xs font-medium text-white"
                    >
                      <Phone size={14} /> Call
                    </a>
                    <a
                      href={`sms:${c.phone}`}
                      className="flex items-center justify-center gap-1.5 bg-slate-800 py-2 rounded-xl text-xs font-medium text-white"
                    >
                      <MessageSquare size={14} /> Text
                    </a>
                    <button
                      onClick={() => generateInstantTemplate(c)}
                      className="flex items-center justify-center gap-1.5 bg-[#00549A] py-2 rounded-xl text-xs font-semibold text-white"
                    >
                      <Zap size={14} /> Draft Text
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "scanner" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <FileText size={16} className="text-blue-400" /> Bundle & Promo Quick Reference
              </h2>
              <div className="text-xs text-slate-300 space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <p><strong className="text-white">Starter Bundle:</strong> $90/mo</p>
                <p><strong className="text-white">Good Bundle:</strong> $100/mo</p>
                <p><strong className="text-white">Better Bundle:</strong> $110/mo</p>
                <p><strong className="text-white">Best Bundle:</strong> $130/mo</p>
                <p className="text-emerald-400 pt-1">
                  • All bundles include a $200 Gift Card after 3 billing cycles.
                </p>
                <p className="text-blue-400">
                  • True 1.5Gbps Fibre to the Home (competitors use Fibre to the Node, which slows down during holidays).
                </p>
                <p className="text-amber-300">
                  • Winback: 30-day grace period before getting locked into a Rogers contract.
                </p>
              </div>

              <textarea
                value={contextInput}
                onChange={(e) => setContextInput(e.target.value)}
                placeholder="Type any quick floor notes here..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
              <button
                onClick={() => setContextResult(`Saved Note:\n${contextInput}`)}
                className="w-full bg-[#00549A] py-2.5 rounded-xl text-xs font-semibold"
              >
                Save Note
              </button>
            </div>
            {contextResult && (
              <div className="bg-slate-900 p-4 rounded-2xl text-xs text-slate-200 whitespace-pre-line">
                {contextResult}
              </div>
            )}
          </div>
        )}

        {activeTab === "outreach" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h2 className="font-bold text-sm">Post-Sale Message Generator</h2>
              <select
                value={selectedClient?.id || ""}
                onChange={(e) => {
                  const found = customers.find((c) => c.id === e.target.value);
                  if (found) generateInstantTemplate(found);
                }}
                className="w-full bg-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {renderLeadSummary(c)}
                  </option>
                ))}
              </select>

              <textarea
                value={draftedMessage}
                onChange={(e) => setDraftedMessage(e.target.value)}
                rows={7}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 leading-relaxed"
              />

              {selectedClient && draftedMessage && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(draftedMessage)}
                    className="bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-medium"
                  >
                    <Copy size={14} />
                  </button>
                  <a
                    href={`sms:${selectedClient.phone}?&body=${encodeURIComponent(
                      draftedMessage
                    )}`}
                    className="flex-1 bg-emerald-600 py-2.5 rounded-xl text-xs font-bold text-center text-white flex items-center justify-center gap-1.5"
                  >
                    <Send size={14} /> Open in Messages & Send
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 flex justify-around py-2.5 z-50 w-full max-w-md mx-auto">
        <button
          onClick={() => setActiveTab("clients")}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            activeTab === "clients"
              ? "text-blue-400 font-semibold"
              : "text-slate-400"
          }`}
        >
          <Calendar size={18} /> Queue
        </button>
        <button
          onClick={() => setActiveTab("scanner")}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            activeTab === "scanner"
              ? "text-blue-400 font-semibold"
              : "text-slate-400"
          }`}
        >
          <Upload size={18} /> Cheat Sheet
        </button>
        <button
          onClick={() => setActiveTab("outreach")}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            activeTab === "outreach"
              ? "text-blue-400 font-semibold"
              : "text-slate-400"
          }`}
        >
          <MessageSquare size={18} /> Follow-Up
        </button>
      </nav>
    </div>
  );
}