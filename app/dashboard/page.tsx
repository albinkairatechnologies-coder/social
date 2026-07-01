"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  LogOut, 
  RefreshCw, 
  Users, 
  Briefcase, 
  ArrowRight,
  PieChart,
  BarChart2
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AgencyDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newClientName, setNewClientName] = useState("");
  const [newClientCompany, setNewClientCompany] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (res.ok) {
        setClients(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchClients();
    }
  }, [status]);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClientName, company: newClientCompany }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewClientName("");
        setNewClientCompany("");
        fetchClients();
      } else {
        alert("Failed to add client");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const renderPieChart = () => {
    const clientsWithTasks = clients.filter(c => c._count?.clientTasks > 0);
    if (clientsWithTasks.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <PieChart className="h-10 w-10 mb-2 opacity-50" />
          <p className="text-sm font-medium">No pending tasks across clients to display.</p>
        </div>
      );
    }

    const totalTasks = clientsWithTasks.reduce((sum, c) => sum + c._count.clientTasks, 0);
    let cumulativePercent = 0;
    
    // A palette of vibrant colors for the pie chart slices
    const colors = ["#0ea5e9", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];

    return (
      <div className="flex flex-col md:flex-row items-center justify-center gap-12 h-64">
        <svg width="200" height="200" viewBox="0 0 100 100" className="transform -rotate-90">
          {clientsWithTasks.map((client, index) => {
            const percent = client._count.clientTasks / totalTasks;
            const dashArray = `${percent * 314.159} 314.159`;
            const dashOffset = -cumulativePercent * 314.159;
            cumulativePercent += percent;
            return (
              <circle
                key={client.id}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={colors[index % colors.length]}
                strokeWidth="20"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                className="transition-all duration-1000 ease-out"
              />
            );
          })}
        </svg>
        <div className="flex flex-col gap-3">
          {clientsWithTasks.map((client, index) => (
            <div key={client.id} className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {client.name} <span className="text-slate-400">({client._count.clientTasks} pending tasks)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <RefreshCw className="h-10 w-10 animate-spin text-teal-500" />
        <p className="text-sm font-semibold">Loading Agency Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-20">
      <nav className="border-b border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center shadow-md font-black text-white text-lg">
              SF
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-teal-500 to-indigo-600 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Agency Console
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* Performance Overview Chart */}
        <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <BarChart2 className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-bold">Client Performance (Pending Tasks)</h2>
          </div>
          {renderPieChart()}
        </div>

        {/* Client Roster */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Users className="h-6 w-6 text-teal-500" />
              Client Roster
            </h2>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:scale-105 transition-transform"
            >
              <Plus className="h-4 w-4 stroke-[3px]" />
              Add Client
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(client => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <div className="group bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-black text-slate-500">
                      {client.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {client.name}
                      </h3>
                      {client.company && (
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Briefcase className="h-3 w-3" /> {client.company}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-auto">
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-500 mb-1 font-bold">PENDING TASKS</p>
                      <p className="text-2xl font-black text-rose-500">{client._count?.clientTasks || 0}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-500 mb-1 font-bold">TOTAL POSTS</p>
                      <p className="text-2xl font-black text-indigo-500">{client._count?.posts || 0}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                    Enter Workspace
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}

            {clients.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p className="font-medium text-lg">No clients found</p>
                <p className="text-sm">Click "Add Client" to start managing workspaces.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-4">Add New Client</h3>
              <form onSubmit={handleAddClient} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Client Name *</label>
                  <input 
                    type="text"
                    required
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Company Name (Optional)</label>
                  <input 
                    type="text"
                    value={newClientCompany}
                    onChange={e => setNewClientCompany(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding || !newClientName}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center gap-2"
                  >
                    {isAdding && <RefreshCw className="h-4 w-4 animate-spin" />}
                    Create Workspace
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
