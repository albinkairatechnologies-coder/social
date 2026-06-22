"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Calendar,
  Clock,
  Plus,
  BarChart3,
  Link2,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Smartphone,
  Monitor,
  ArrowLeft,
  Trash2,
  Send,
  Copy
} from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface PostItem {
  id: string;
  caption: string;
  firstComment: string | null;
  hashtags: string | null;
  scheduledAt: string;
  publishedAt: string | null;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";
  platforms: string[];
  errorLog: string | null;
  media: Array<{ url: string; type: string }>;
}

interface ConnectedAccount {
  id: string;
  provider: string;
  platformUsername: string;
  platformDisplayName: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [metrics, setMetrics] = useState({
    totalScheduled: 0,
    totalPublished: 0,
    totalFailed: 0,
    totalReach: 0,
    engagementRate: "0%",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calendar navigation state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Connection overlay states
  const [showConnectModal, setShowConnectModal] = useState<
    "instagram" | "linkedin" | null
  >(null);
  const [connectMode, setConnectMode] = useState<"mock" | "oauth" | "manual">("oauth");
  const [connectUsername, setConnectUsername] = useState("");
  const [connectDisplayName, setConnectDisplayName] = useState("");
  const [connectAccessToken, setConnectAccessToken] = useState("");
  const [connectRefreshToken, setConnectRefreshToken] = useState("");
  const [connectAccountId, setConnectAccountId] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Handle OAuth callback status from URL search params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const oauthStatus = params.get("status");
      const platform = params.get("platform");
      const message = params.get("message");

      if (oauthStatus === "success") {
        alert(`Successfully connected your ${platform === "instagram" ? "Instagram" : "LinkedIn"} account!`);
        router.replace("/dashboard");
      } else if (oauthStatus === "error") {
        alert(`Failed to connect account: ${message || "Unknown error"}`);
        router.replace("/dashboard");
      }
    }
  }, [router]);

  const fetchDashboardData = async () => {
    if (!session?.user) return;
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts || []);
        setAccounts(data.accounts || []);
        setMetrics(
          data.metrics || {
            totalScheduled: 0,
            totalPublished: 0,
            totalFailed: 0,
            totalReach: 0,
            engagementRate: "0%",
          }
        );
      }
    } catch (error) {
      console.error("Failed to load dashboard statistics:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status]);

  const handleConnect = async () => {
    if (!showConnectModal) return;
    setConnectLoading(true);
    try {
      let url = "";
      let body = {};

      if (connectMode === "oauth") {
        window.location.href = `/api/auth/${showConnectModal}/connect`;
        return;
      } else if (connectMode === "mock") {
        url = "/api/auth/mock-connect";
        body = {
          provider: showConnectModal,
          username: connectUsername,
          displayName: connectDisplayName || connectUsername,
        };
      } else {
        url = "/api/auth/manual-connect";
        body = {
          provider: showConnectModal,
          accessToken: connectAccessToken,
          refreshToken: connectRefreshToken || undefined,
          providerAccountId: connectAccountId,
          username: connectUsername,
          displayName: connectDisplayName,
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setShowConnectModal(null);
        setConnectUsername("");
        setConnectDisplayName("");
        setConnectAccessToken("");
        setConnectRefreshToken("");
        setConnectAccountId("");
        fetchDashboardData();
      } else {
        alert(data.error || "Failed to connect account");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConnectLoading(false);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`Disconnect your ${provider} account?`)) return;
    try {
      const res = await fetch("/api/auth/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this scheduled post?")) return;
    try {
      const res = await fetch(`/api/posts?postId=${postId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        fetchDashboardData();
      } else {
        alert(data.error || "Failed to delete post.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishNow = async (postId: string) => {
    if (!confirm("Are you sure you want to publish this post immediately?")) return;
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Post published successfully!");
        fetchDashboardData();
      } else {
        alert(data.error || "Failed to publish post immediately.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to publish post.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDuplicatePost = (post: PostItem) => {
    sessionStorage.setItem("socialforge_draft", JSON.stringify({
      caption: post.caption,
      firstComment: post.firstComment || "",
      hashtags: post.hashtags || "",
      mediaUrl: post.media?.[0]?.url || "",
      mediaType: post.media?.[0]?.type || "IMAGE",
      platforms: post.platforms
    }));
    router.push("/dashboard/composer");
  };


  // Generate calendar days for the current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday...
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days: Array<{ dayNum: number; dateObj: Date; isCurrentMonth: boolean }> = [];
    
    // Previous month padding
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        dayNum: prevMonthTotalDays - i,
        dateObj: new Date(year, month - 1, prevMonthTotalDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        dayNum: i,
        dateObj: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    return days;
  };

  const calendarDays = getDaysInMonth(currentMonth);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Check if a specific date has scheduled/published posts
  const getPostsForDate = (dateObj: Date) => {
    return posts.filter((post) => {
      const postDate = new Date(post.scheduledAt);
      return (
        postDate.getDate() === dateObj.getDate() &&
        postDate.getMonth() === dateObj.getMonth() &&
        postDate.getFullYear() === dateObj.getFullYear()
      );
    });
  };

  // Filtered post list (by calendar selection)
  const displayedPosts = selectedDate
    ? getPostsForDate(selectedDate)
    : posts;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 transition-colors">
        <RefreshCw className="h-10 w-10 animate-spin text-teal-500" />
        <p className="text-sm font-semibold tracking-wider">Lifting SocialForge Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/65 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-16 font-sans transition-colors duration-300">
      {/* Top Banner Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl shadow-sm cursor-pointer animate-fade-in"
              title="Back to Homepage"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center shadow-md font-black text-white text-sm animate-fade-in">
                SF
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-teal-500 to-indigo-600 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">
                SocialForge
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button 
              onClick={fetchDashboardData}
              disabled={isRefreshing}
              className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-255 transition-colors cursor-pointer bg-white dark:bg-slate-900/40"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-teal-500" : ""}`} />
            </button>
            <Link
              href="/dashboard/composer"
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 dark:bg-gradient-to-r dark:from-teal-400 dark:to-indigo-500 dark:hover:from-teal-300 dark:hover:to-indigo-400 px-4 py-2.5 text-xs font-black text-white dark:text-slate-950 shadow-md transition-all cursor-pointer transform active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[3px]" />
              <span>Create Post</span>
            </Link>
            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center justify-center p-2.5 rounded-xl border border-rose-200 dark:border-rose-955 text-rose-500 dark:text-rose-455 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer bg-white dark:bg-rose-950/10"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-250 dark:border-slate-800/80 p-8 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Welcome back, Creator!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage connected pages, prompt AI contents, and automate publishing.</p>
          </div>
          <div className="flex gap-2">
            <Link 
              href="/dashboard/composer" 
              className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-350 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>AI Image Forge</span>
            </Link>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Metric Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 shadow-sm space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Scheduled</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-blue-500 dark:text-blue-400">{metrics.totalScheduled}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">pending</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${(metrics.totalScheduled / Math.max(posts.length, 1)) * 100}%` }}></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 shadow-sm space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Published</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-500 dark:text-emerald-400">{metrics.totalPublished}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">live</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${(metrics.totalPublished / Math.max(posts.length, 1)) * 100}%` }}></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 shadow-sm space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Failed</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-rose-500 dark:text-rose-400">{metrics.totalFailed}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">errors</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500" style={{ width: `${(metrics.totalFailed / Math.max(posts.length, 1)) * 100}%` }}></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 shadow-sm space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Total Reach</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-teal-500 dark:text-teal-400">{metrics.totalReach.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">views</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500" style={{ width: "65%" }}></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 shadow-sm space-y-2 col-span-2 md:col-span-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Engagement Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-purple-500 dark:text-purple-400">{metrics.engagementRate}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">avg</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500" style={{ width: "45%" }}></div>
            </div>
          </div>
        </div>

        {/* WORKSPACE LAYOUT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Calendar & Queue History (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Interactive Calendar Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-500" />
                  Content Schedule
                </h3>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                  <button onClick={handlePrevMonth} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded cursor-pointer">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold px-1 text-slate-700 dark:text-slate-200">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  <button onClick={handleNextMonth} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded cursor-pointer">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase mb-2">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((cell, idx) => {
                  const dayPosts = getPostsForDate(cell.dateObj);
                  const isSelected = selectedDate && 
                    cell.dateObj.getDate() === selectedDate.getDate() &&
                    cell.dateObj.getMonth() === selectedDate.getMonth() &&
                    cell.dateObj.getFullYear() === selectedDate.getFullYear();
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedDate(null); // Clear filter
                        } else {
                          setSelectedDate(cell.dateObj);
                        }
                      }}
                      className={`aspect-square rounded-lg border flex flex-col items-center justify-between p-1.5 relative transition-all cursor-pointer ${
                        !cell.isCurrentMonth 
                          ? "border-transparent text-slate-350 dark:text-slate-700 hover:text-slate-500" 
                          : isSelected
                            ? "border-teal-500 bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-200 shadow-sm"
                            : "border-slate-100 dark:border-slate-900 bg-slate-50/45 dark:bg-slate-950/40 text-slate-650 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <span className="text-[10px] font-bold self-start">{cell.dayNum}</span>
                      
                      {/* Platform icons in cells */}
                      {dayPosts.length > 0 && (
                        <div className="flex gap-0.5 justify-center w-full mt-1">
                          {Array.from(new Set(dayPosts.flatMap((p) => p.platforms))).map((plat, pIdx) => (
                            <span 
                              key={pIdx} 
                              className={`text-[8px] px-1 rounded-sm ${
                                plat === "INSTAGRAM" ? "bg-pink-500/20 text-pink-500" : "bg-blue-500/20 text-blue-500"
                              }`}
                            >
                              {plat === "INSTAGRAM" ? "IG" : "LI"}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between bg-teal-50 dark:bg-teal-950/10 border border-teal-200 dark:border-teal-900/40 rounded-xl p-3.5 gap-3.5 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-teal-800 dark:text-teal-300 font-bold block">
                      Filtered date: {selectedDate.toLocaleDateString()}
                    </span>
                    <p className="text-[10px] text-teal-655 dark:text-teal-450 leading-relaxed font-medium">
                      Select an option below to manage content for this day.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const yyyy = selectedDate.getFullYear();
                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                        const formatted = `${yyyy}-${mm}-${dd}T10:00`;
                        router.push(`/dashboard/composer?scheduledAt=${formatted}`);
                      }}
                      className="bg-teal-600 hover:bg-teal-500 text-white dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-slate-950 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[3px]" />
                      <span>Create Post for this Day</span>
                    </button>
                    <button 
                      onClick={() => setSelectedDate(null)}
                      className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Queue Post History */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Post Queue & Archive ({displayedPosts.length})</span>
                {selectedDate && <span className="text-xs text-slate-450 dark:text-slate-500">Filtered view</span>}
              </h3>

              {displayedPosts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/40 p-12 text-center text-slate-400 dark:text-slate-500">
                  <Clock className="h-10 w-10 text-slate-300 dark:text-slate-800 mx-auto mb-3" />
                  <p className="text-xs font-bold">No posts found for the selected period.</p>
                  <p className="text-[11px] text-slate-450 dark:text-slate-650 mt-1">Click Create Post to schedule your first automation.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedPosts.map((post) => (
                    <div 
                      key={post.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/30 p-5 space-y-4 transition-transform duration-300 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-800 shadow-sm dark:shadow-none"
                    >
                      {/* Post top metadata */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {post.platforms.map((plat) => (
                            <span 
                              key={plat}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                plat === "INSTAGRAM" 
                                  ? "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-500/20" 
                                  : "bg-blue-55 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20"
                              }`}
                            >
                              {plat}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Status Badge */}
                          <span 
                            className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              post.status === "PUBLISHED"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
                                : post.status === "SCHEDULED"
                                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20"
                                  : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              post.status === "PUBLISHED" 
                                ? "bg-emerald-500" 
                                : post.status === "SCHEDULED" 
                                  ? "bg-blue-500 animate-pulse" 
                                  : "bg-rose-500"
                            }`}></span>
                            {post.status}
                          </span>

                          {/* Publish Now Button */}
                          {(post.status === "SCHEDULED" || post.status === "FAILED") && (
                            <button
                              onClick={() => handlePublishNow(post.id)}
                              className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded transition-colors cursor-pointer"
                              title="Publish Now"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Duplicate Post Button */}
                          <button
                            onClick={() => handleDuplicatePost(post)}
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded transition-colors cursor-pointer"
                            title="Duplicate/Reuse Post"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Post Button */}
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded transition-colors cursor-pointer"
                            title="Delete Post"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content details layout */}
                      <div className="flex gap-4 items-start">
                        {post.media?.[0]?.url ? (
                          <div className="relative w-16 h-24 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner">
                            <Image 
                              src={post.media[0].url} 
                              alt="Thumbnail preview" 
                              fill 
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 flex items-center justify-center shrink-0 text-slate-400 text-lg">
                            📝
                          </div>
                        )}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <p className="text-xs text-slate-700 dark:text-slate-350 whitespace-pre-line line-clamp-3 leading-relaxed font-medium">
                            {post.caption}
                          </p>
                          {post.hashtags && (
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 truncate font-semibold">{post.hashtags}</p>
                          )}
                        </div>
                      </div>

                      {/* Error Logger Output */}
                      {post.status === "FAILED" && post.errorLog && (
                        <div className="flex gap-2 items-start rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span className="font-mono leading-tight">{post.errorLog}</span>
                        </div>
                      )}

                      {/* Footer timing info */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-900/60 text-[10px] text-slate-450 dark:text-slate-550 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {post.status === "PUBLISHED" ? "Published" : "Scheduled"}:{" "}
                            {new Date(post.scheduledAt).toLocaleString()}
                          </span>
                        </div>
                        {post.publishedAt && (
                          <span>Live ID: {post.id}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Connected Platforms Status (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-indigo-500" />
                  Social Integrations
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 font-medium">Connect your creator pages to publish assets automatically.</p>
              </div>

              <div className="space-y-4">
                {/* Instagram Channel */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📸</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Instagram Graph API</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Creator/Business Profile Link</p>
                      </div>
                    </div>
                    {accounts.some((a) => a.provider === "instagram") ? (
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                        Connected
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-850 px-2 py-0.5 rounded-full font-bold">
                        Offline
                      </span>
                    )}
                  </div>

                  {accounts.some((a) => a.provider === "instagram") ? (
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-pink-500 dark:text-pink-400">IG</div>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">{accounts.find((a) => a.provider === "instagram")?.platformUsername}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDisconnect("instagram")}
                          className="text-[10px] text-rose-600 dark:text-rose-400 hover:text-rose-500 dark:hover:text-rose-300 font-extrabold cursor-pointer hover:underline"
                        >
                          Disconnect
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConnectModal("instagram")}
                        className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg py-1.5 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Swap / Update Account
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowConnectModal("instagram")}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-xl py-2 text-xs font-bold transition-all duration-300 cursor-pointer shadow-md shadow-pink-100 dark:shadow-none"
                    >
                      Connect Sandbox IG Page
                    </button>
                  )}
                </div>

                {/* LinkedIn Channel */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💼</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">LinkedIn UGC Posts</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Member Profile or Companies</p>
                      </div>
                    </div>
                    {accounts.some((a) => a.provider === "linkedin") ? (
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                        Connected
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-850 px-2 py-0.5 rounded-full font-bold">
                        Offline
                      </span>
                    )}
                  </div>

                  {accounts.some((a) => a.provider === "linkedin") ? (
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-blue-500 dark:text-blue-400">LI</div>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">{accounts.find((a) => a.provider === "linkedin")?.platformUsername}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDisconnect("linkedin")}
                          className="text-[10px] text-rose-600 dark:text-rose-400 hover:text-rose-500 dark:hover:text-rose-300 font-extrabold cursor-pointer hover:underline"
                        >
                          Disconnect
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConnectModal("linkedin")}
                        className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg py-1.5 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Swap / Update Account
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowConnectModal("linkedin")}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 text-xs font-bold transition-all duration-300 cursor-pointer shadow-md shadow-blue-100 dark:shadow-none"
                    >
                      Connect Sandbox LI Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL POPUP FOR CONNECTION */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl relative">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>🔗</span>
              Link {showConnectModal === "instagram" ? "Instagram" : "LinkedIn"} Page
            </h3>

            {/* Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-950 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConnectMode("oauth")}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                  connectMode === "oauth" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                1-Click OAuth
              </button>
              <button
                type="button"
                onClick={() => setConnectMode("mock")}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                  connectMode === "mock" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                Sandbox (Mock)
              </button>
              <button
                type="button"
                onClick={() => setConnectMode("manual")}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                  connectMode === "manual" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                Manual Keys
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {connectMode === "oauth"
                ? `Connect your real ${showConnectModal === "instagram" ? "Instagram/Facebook" : "LinkedIn"} profile securely via official OAuth integration.`
                : connectMode === "mock"
                ? "This simulates OAuth for local testing. No real API calls will be made."
                : "Enter your API credentials manually. Tokens are encrypted before storage."}
            </p>

            <div className="space-y-3">
              {connectMode === "oauth" && (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-100 dark:border-slate-850">
                  <div className="text-3xl">🔑</div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Redirecting to {showConnectModal === "instagram" ? "Facebook" : "LinkedIn"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs">
                      You will authorize SocialForge to publish posts on your behalf.
                    </p>
                  </div>
                </div>
              )}

              {connectMode === "manual" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {showConnectModal === "instagram" ? "Instagram User ID" : "LinkedIn Author URN"}
                    </label>
                    <input
                      type="text"
                      value={connectAccountId}
                      onChange={(e) => setConnectAccountId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-teal-500 focus:outline-none"
                      placeholder={showConnectModal === "instagram" ? "1234567890" : "urn:li:person:abc123"}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Access Token
                    </label>
                    <input
                      type="password"
                      value={connectAccessToken}
                      onChange={(e) => setConnectAccessToken(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-teal-500 focus:outline-none font-mono"
                      placeholder="EAAC..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Refresh Token (Optional)
                    </label>
                    <input
                      type="password"
                      value={connectRefreshToken}
                      onChange={(e) => setConnectRefreshToken(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-teal-500 focus:outline-none font-mono"
                      placeholder="Optional"
                    />
                  </div>
                </>
              )}

              {connectMode !== "oauth" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Platform Username
                    </label>
                    <input
                      type="text"
                      placeholder={showConnectModal === "instagram" ? "e.g., creator_forge" : "e.g., in/creator-forge"}
                      value={connectUsername}
                      onChange={(e) => setConnectUsername(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., SocialForge Creator Page"
                      value={connectDisplayName}
                      onChange={(e) => setConnectDisplayName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConnectModal(null)}
                className="flex-1 border border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConnect}
                disabled={
                  connectLoading ||
                  (connectMode === "mock" && !connectUsername) ||
                  (connectMode === "manual" && (!connectAccessToken || !connectAccountId || !connectDisplayName || !connectUsername))
                }
                className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-gradient-to-r dark:from-teal-500 dark:to-indigo-500 dark:hover:from-teal-400 dark:hover:to-indigo-400 text-white dark:text-slate-950 font-bold rounded-lg py-2 text-xs disabled:bg-slate-200 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
              >
                {connectLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin text-white dark:text-slate-950" />
                ) : connectMode === "oauth" ? (
                  `Authorize on ${showConnectModal === "instagram" ? "Facebook" : "LinkedIn"}`
                ) : (
                  "Connect"
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
