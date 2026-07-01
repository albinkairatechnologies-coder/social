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
  Copy,
  Bell,
  X,
  Activity,
  TrendingUp,
  User,
  Smile,
  ThumbsUp,
  MessageSquare,
  Play,
  CheckCircle,
  FileText,
  Upload,
  CreditCard,
  DollarSign,
  Edit2,
  Save,
  ImageIcon
} from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AnalyticsMetric {
  id: string;
  postId: string;
  platform: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  saves: number;
  recordedAt: string;
}

interface CommentItem {
  id: string;
  postId: string;
  authorName: string;
  authorAvatar: string | null;
  text: string;
  sentiment: string;
  createdAt: string;
  parentId: string | null;
  isAdmin: boolean;
}

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
  analytics?: AnalyticsMetric[];
  comments?: CommentItem[];
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
    "instagram" | "linkedin" | "facebook" | null
  >(null);
  const [connectMode, setConnectMode] = useState<"mock" | "oauth" | "manual">("oauth");
  const [connectUsername, setConnectUsername] = useState("");
  const [connectDisplayName, setConnectDisplayName] = useState("");
  const [connectAccessToken, setConnectAccessToken] = useState("");
  const [connectRefreshToken, setConnectRefreshToken] = useState("");
  const [connectAccountId, setConnectAccountId] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);

  // State for Advanced Features
  const [notifications, setNotifications] = useState<any[]>([]);
  const [clientTasks, setClientTasks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("RECENT");
  const [insightsPost, setInsightsPost] = useState<any | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<any[]>([]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState<Record<string, string>>({});
  const [showNotifications, setShowNotifications] = useState(false);
  
  // State for Editing Tasks
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // State for Bulk Task Creation
  const [planVideosCount, setPlanVideosCount] = useState<number | "">("");
  const [planPostersCount, setPlanPostersCount] = useState<number | "">("");
  const [isGenerating, setIsGenerating] = useState(false);

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
        setNotifications(data.notifications || []);
        setClientTasks(data.clientTasks || []);
        setDocuments(data.documents || []);
        setInvoices(data.invoices || []);
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
      
      // Auto-refresh every 15 seconds for real-time updates
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 15000);
      
      return () => clearInterval(interval);
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

  const getAnalyticsChartData = () => {
    const logs = posts
      .filter(p => p.status === "PUBLISHED")
      .flatMap(p => p.analytics || [])
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    const dataPoints = logs.length > 3 
      ? logs.map(l => l.impressions) 
      : [1250, 1600, 2100, 2450, 2900, 3350];

    const maxVal = Math.max(...dataPoints, 100);
    const width = 600;
    const height = 150;
    const points = dataPoints.map((val, index) => {
      const x = (index / (dataPoints.length - 1)) * width;
      const y = height - (val / maxVal) * (height - 20);
      return { x, y, val };
    });

    const pathD = points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
    }, "");

    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z` 
      : "";

    return { pathD, areaD, points, maxVal };
  };

  const getReachByPlatform = () => {
    const distribution = { INSTAGRAM: 0, LINKEDIN: 0, TWITTER: 0, FACEBOOK: 0 };
    const latestMap = new Map<string, any>();
    
    posts.forEach(post => {
      if (post.analytics) {
        post.analytics.forEach(item => {
          const key = `${post.id}-${item.platform}`;
          if (!latestMap.has(key)) latestMap.set(key, item);
        });
      }
    });

    Array.from(latestMap.values()).forEach(item => {
      const plat = item.platform as keyof typeof distribution;
      if (distribution[plat] !== undefined) {
        distribution[plat] += item.impressions || 0;
      }
    });

    if (distribution.INSTAGRAM === 0 && distribution.LINKEDIN === 0) {
      return { INSTAGRAM: 1450, LINKEDIN: 2100, TWITTER: 840, FACEBOOK: 450 };
    }
    return distribution;
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!insightsPost) return;
    const text = adminReplyText[commentId];
    if (!text || !text.trim()) return;

    try {
      const res = await fetch("/api/posts/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: insightsPost.id,
          parentId: commentId,
          text: text.trim(),
        }),
      });

      if (res.ok) {
        setAdminReplyText(prev => ({ ...prev, [commentId]: "" }));
        await fetchDashboardData();
        const updatedRes = await fetch("/api/dashboard");
        const updatedData = await updatedRes.json();
        if (updatedRes.ok) {
          const newPost = updatedData.posts.find((p: any) => p.id === insightsPost.id);
          if (newPost) {
            setInsightsPost(newPost);
          }
        }
      } else {
        alert("Failed to submit reply.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendCopilotMessage = async (textToSend?: string) => {
    const text = textToSend || copilotInput;
    if (!text || !text.trim()) return;

    const userMessage = { role: "user" as const, content: text.trim() };
    const updatedMessages = [...copilotMessages, userMessage];
    
    setCopilotMessages(updatedMessages);
    if (!textToSend) setCopilotInput("");
    setCopilotLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await res.json();
      if (data.success) {
        setCopilotMessages([...updatedMessages, { role: "assistant" as const, content: data.response }]);
      } else {
        setCopilotMessages([...updatedMessages, { role: "assistant" as const, content: data.response || "Failed to get response." }]);
      }
    } catch (err) {
      console.error(err);
      setCopilotMessages([...updatedMessages, { role: "assistant" as const, content: "Error connecting to AI Copilot." }]);
    } finally {
      setCopilotLoading(false);
    }
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

  const handleGeneratePlan = async () => {
    if (!planVideosCount && !planPostersCount) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/client-tasks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoCount: Number(planVideosCount) || 0,
          posterCount: Number(planPostersCount) || 0
        })
      });
      if (res.ok) {
        setPlanVideosCount("");
        setPlanPostersCount("");
        fetchDashboardData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to generate tasks.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate tasks.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    try {
      const res = await fetch("/api/client-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTask.id,
          title: editingTask.title,
          type: editingTask.type,
          status: editingTask.status
        })
      });
      if (res.ok) {
        setEditingTask(null);
        fetchDashboardData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update task.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update task.");
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 transition-colors">
        <RefreshCw className="h-10 w-10 animate-spin text-teal-500" />
        <p className="text-sm font-semibold tracking-wider">Lifting SocialForge Dashboard...</p>
      </div>
    );
  }

  // 1. Filter by Date (if selected in calendar)
  let filtered = selectedDate ? getPostsForDate(selectedDate) : posts;

  // 2. Filter by Platform
  if (platformFilter !== "ALL") {
    filtered = filtered.filter(p => p.platforms.includes(platformFilter));
  }

  // 3. Filter by Status
  if (statusFilter !== "ALL") {
    filtered = filtered.filter(p => p.status === statusFilter);
  }

  // 4. Sort posts
  const displayedPosts = [...filtered].sort((a, b) => {
    if (sortBy === "RECENT") {
      return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
    }
    
    const getPostMetric = (post: any, metric: "impressions" | "likes" | "comments") => {
      if (metric === "comments") {
        return post.comments?.length || 0;
      }
      if (!post.analytics || post.analytics.length === 0) return 0;
      
      const latestMap = new Map<string, any>();
      post.analytics.forEach((item: any) => {
        const key = item.platform;
        if (!latestMap.has(key)) latestMap.set(key, item);
      });
      return Array.from(latestMap.values()).reduce((sum, item) => sum + (item[metric] || 0), 0);
    };

    if (sortBy === "IMPRESSIONS") {
      return getPostMetric(b, "impressions") - getPostMetric(a, "impressions");
    }
    if (sortBy === "LIKES") {
      return getPostMetric(b, "likes") - getPostMetric(a, "likes");
    }
    if (sortBy === "COMMENTS") {
      return getPostMetric(b, "comments") - getPostMetric(a, "comments");
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50/65 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-16 font-sans transition-colors duration-300 relative overflow-x-hidden">
      {/* Top Banner Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-955/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center justify-between">
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

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-end mt-2 md:mt-0 w-full md:w-auto">
            <ThemeToggle />

            {/* Notification Center */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer bg-white dark:bg-slate-900/40 relative"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-4 shadow-2xl space-y-3 z-50 text-xs animate-fade-in">
                  <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                    <span className="font-extrabold text-slate-850 dark:text-slate-100">Activity center</span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-[10px] text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-4">No new alerts.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-2 border-b border-slate-100 dark:border-slate-850/60 text-[10px] last:border-b-0 space-y-0.5">
                          <p className="font-bold text-slate-700 dark:text-slate-300">{n.title}</p>
                          <p className="text-slate-555 dark:text-slate-450 leading-snug">{n.message}</p>
                          <p className="text-[8px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={fetchDashboardData}
              disabled={isRefreshing}
              className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-255 transition-colors cursor-pointer bg-white dark:bg-slate-900/40"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-teal-500" : ""}`} />
            </button>

            {/* AI Copilot Trigger */}
            <button 
              onClick={() => setIsCopilotOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 text-purple-650 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-500 animate-pulse" />
              <span>AI Copilot</span>
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
              <Sparkles className="h-4 w-4 text-purple-500 animate-bounce" />
              <span>AI Image Forge</span>
            </Link>
          </div>
        </div>

        {/* CLIENT WORK DASHBOARD */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-6 bg-teal-500 rounded-full inline-block"></span>
              Client Work Overview
            </h2>
            <span className="text-[10px] bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span> Live Updates Active
            </span>
          </div>

          {/* CONTENT PLANNER */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between shadow-sm">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Plan New Content</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Instantly generate pending tasks for the client's upcoming month.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto shadow-sm focus-within:border-indigo-500 transition-colors">
                <Play className="h-4 w-4 text-indigo-400" />
                <input 
                  type="number" 
                  min="0"
                  placeholder="Videos"
                  value={planVideosCount}
                  onChange={(e) => setPlanVideosCount(e.target.value === "" ? "" : parseInt(e.target.value))}
                  className="bg-transparent border-none text-sm w-16 focus:outline-none text-slate-800 dark:text-slate-100 font-bold placeholder-slate-400"
                />
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto shadow-sm focus-within:border-pink-500 transition-colors">
                <ImageIcon className="h-4 w-4 text-pink-400" />
                <input 
                  type="number" 
                  min="0"
                  placeholder="Posters"
                  value={planPostersCount}
                  onChange={(e) => setPlanPostersCount(e.target.value === "" ? "" : parseInt(e.target.value))}
                  className="bg-transparent border-none text-sm w-16 focus:outline-none text-slate-800 dark:text-slate-100 font-bold placeholder-slate-400"
                />
              </div>
              <button
                onClick={handleGeneratePlan}
                disabled={isGenerating || (!planVideosCount && !planPostersCount)}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {isGenerating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {isGenerating ? "Generating..." : "Generate Tasks"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Videos Work */}
            <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Videos Work</span>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl">
                  <Play className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{clientTasks.filter(t => t.type === 'VIDEO').length}</span>
                <span className="text-xs font-semibold text-slate-450 dark:text-slate-500">in progress</span>
              </div>
            </div>

            {/* Posters Work */}
            <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Posters Work</span>
                <div className="p-2 bg-pink-50 dark:bg-pink-900/20 text-pink-500 rounded-xl">
                  <ImageIcon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{clientTasks.filter(t => t.type === 'POSTER').length}</span>
                <span className="text-xs font-semibold text-slate-450 dark:text-slate-500">in progress</span>
              </div>
            </div>

            {/* Pending Work */}
            <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Work</span>
                <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{clientTasks.filter(t => t.status === 'PENDING').length}</span>
                <span className="text-xs font-semibold text-slate-450 dark:text-slate-500">awaiting action</span>
              </div>
            </div>

            {/* Testing/QA Work */}
            <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Testing / QA Status</span>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-xl">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{clientTasks.filter(t => t.status === 'TESTING').length}</span>
                <span className="text-xs font-semibold text-slate-450 dark:text-slate-500">in review</span>
              </div>
            </div>
          </div>

          {/* TASK LIST (Pending Works & Poster/Videos) */}
          <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm overflow-hidden">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-500" />
              All Client Works
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Task Name</th>
                    <th className="pb-3 px-4">Type</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientTasks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-slate-400">No client works available.</td>
                    </tr>
                  ) : clientTasks.map((task: any) => (
                    <tr key={task.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="py-3 pr-4">
                        <span className="text-sm font-bold text-slate-750 dark:text-slate-200">{task.title}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                          task.type === 'VIDEO' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' : 
                          task.type === 'POSTER' ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/20' : 
                          'bg-slate-100 text-slate-600 dark:bg-slate-800'
                        }`}>
                          {task.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                          task.status === 'PENDING' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 
                          task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 
                          task.status === 'TESTING' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' : 
                          'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-right">
                        <button 
                          onClick={() => setEditingTask({...task})}
                          className="p-1.5 text-slate-400 hover:text-teal-600 bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-900/30 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold">Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Documents */}
            <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Documents
                </h3>
                <button 
                  onClick={() => alert("Document uploads will be available in the next update!")}
                  className="text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload
                </button>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[200px] pr-2">
                {documents.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No documents available.</p>
                ) : documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-750 dark:text-slate-200">{doc.title}</p>
                        <p className="text-[10px] text-slate-450 font-medium">Uploaded {new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a href={doc.url} className="text-xs font-bold text-teal-600 hover:text-teal-700 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 dark:hover:bg-teal-900/40 rounded-lg transition-colors">View</a>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoices */}
            <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-500" />
                  Invoices
                </h3>
                <button 
                  onClick={() => alert("Invoice creation will be available in the next update!")}
                  className="text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[200px] pr-2">
                {invoices.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No invoices available.</p>
                ) : invoices.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-500 dark:bg-rose-900/20'}`}>
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-750 dark:text-slate-200">{inv.title}</p>
                        <p className="text-[10px] text-slate-450 font-medium">Due {new Date(inv.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100">${inv.amount}</span>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-md ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ANALYTICS STUDIO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-205 dark:border-slate-800/80 p-6 shadow-sm">
          {/* Main SVG impressions/likes chart */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-teal-500" />
                Audience Impressions & Reach Trend
              </h3>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                Real-Time Logs
              </span>
            </div>
            
            {/* SVG Chart wrapper */}
            <div className="h-[180px] w-full relative flex items-end">
              {(() => {
                const { pathD, areaD, points } = getAnalyticsChartData();
                return (
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 600 150" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="3 3" />
                    <line x1="0" y1="75" x2="600" y2="75" stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="3 3" />
                    <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="3 3" />
                    
                    {/* Area fill */}
                    {areaD && <path d={areaD} fill="url(#chartGradient)" />}
                    {/* Line path */}
                    {pathD && <path d={pathD} fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" />}
                    
                    {/* Interactive dots */}
                    {points.map((p, i) => (
                      <g key={i} className="group/dot cursor-pointer">
                        <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#14b8a6" strokeWidth="2.5" className="transition-all group-hover/dot:r-6" />
                        <rect x={p.x - 25} y={p.y - 25} width="50" height="18" rx="4" fill="#0f172a" className="opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none" />
                        <text x={p.x} y={p.y - 13} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" className="opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none">{p.val}</text>
                      </g>
                    ))}
                  </svg>
                );
              })()}
            </div>
            
            {/* Chart X-axis timing labels */}
            <div className="flex justify-between text-[9px] text-slate-450 dark:text-slate-500 font-bold px-2">
              <span>5 days ago</span>
              <span>4 days ago</span>
              <span>3 days ago</span>
              <span>2 days ago</span>
              <span>Yesterday</span>
              <span>Today</span>
            </div>
          </div>
          
          {/* Platform Reach Distribution */}
          <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-900 pt-4 lg:pt-0 lg:pl-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              Channel Reach Share
            </h3>
            
            {(() => {
              const reach = getReachByPlatform();
              const total = Object.values(reach).reduce((a, b) => a + b, 0) || 1;
              return (
                <div className="space-y-3.5">
                  {[
                    { label: "Instagram", value: reach.INSTAGRAM, color: "bg-pink-500", percent: ((reach.INSTAGRAM / total) * 100).toFixed(0) },
                    { label: "LinkedIn", value: reach.LINKEDIN, color: "bg-blue-500", percent: ((reach.LINKEDIN / total) * 100).toFixed(0) },
                    { label: "Twitter/X", value: reach.TWITTER, color: "bg-sky-500", percent: ((reach.TWITTER / total) * 100).toFixed(0) },
                    { label: "Facebook", value: reach.FACEBOOK, color: "bg-indigo-600", percent: ((reach.FACEBOOK / total) * 100).toFixed(0) }
                  ].map(plat => (
                    <div key={plat.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-655 dark:text-slate-400">{plat.label}</span>
                        <span className="text-slate-700 dark:text-slate-200 font-bold">{plat.value.toLocaleString()} ({plat.percent}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                        <div className={`h-full ${plat.color}`} style={{ width: `${plat.percent}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 shadow-sm space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Scheduled</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-blue-500 dark:text-blue-400">{metrics.totalScheduled}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">pending</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-955 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${(metrics.totalScheduled / Math.max(posts.length, 1)) * 100}%` }}></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 shadow-sm space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Published</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-500 dark:text-emerald-400">{metrics.totalPublished}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">live</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-955 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${(metrics.totalPublished / Math.max(posts.length, 1)) * 100}%` }}></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 shadow-sm space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Failed</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-rose-500 dark:text-rose-400">{metrics.totalFailed}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">errors</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-955 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500" style={{ width: `${(metrics.totalFailed / Math.max(posts.length, 1)) * 100}%` }}></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 shadow-sm space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Total Reach</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-teal-500 dark:text-teal-400">{metrics.totalReach.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">views</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-955 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500" style={{ width: "65%" }}></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 shadow-sm space-y-2 col-span-2 md:col-span-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Engagement Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-purple-500 dark:text-purple-400">{metrics.engagementRate}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">avg</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-955 rounded-full overflow-hidden">
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
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase mb-2">
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
                          setSelectedDate(null);
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
                    <p className="text-[10px] text-teal-650 dark:text-teal-450 leading-relaxed font-medium">
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
                      className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-655 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Queue Post History */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350 flex items-center justify-between">
                <span>Post Queue & Archive ({displayedPosts.length})</span>
                {selectedDate && <span className="text-xs text-slate-450 dark:text-slate-500">Filtered view</span>}
              </h3>

              {/* FILTER / SORT FEED MANAGEMENT CONTROLS */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-white dark:bg-slate-900/40 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="flex flex-wrap gap-2">
                  <select 
                    value={platformFilter} 
                    onChange={(e) => setPlatformFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-350 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Platforms</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="TWITTER">Twitter/X</option>
                    <option value="FACEBOOK">Facebook</option>
                  </select>
                  
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-350 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="DRAFT">Drafts</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort by</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-750 dark:text-slate-300 focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="RECENT">Most Recent</option>
                    <option value="IMPRESSIONS">Impressions</option>
                    <option value="LIKES">Likes</option>
                    <option value="COMMENTS">Comments</option>
                  </select>
                </div>
              </div>

              {displayedPosts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-955/40 p-12 text-center text-slate-400 dark:text-slate-500 animate-fade-in">
                  <Clock className="h-10 w-10 text-slate-300 dark:text-slate-800 mx-auto mb-3" />
                  <p className="text-xs font-bold">No posts found matching the filters.</p>
                  <p className="text-[11px] text-slate-450 dark:text-slate-650 mt-1">Adjust filters or create a new post to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedPosts.map((post) => {
                    const postCommentsCount = post.comments?.length || 0;
                    const hasMedia = post.media && post.media.length > 0;
                    return (
                      <div 
                        key={post.id}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
                            return;
                          }
                          setInsightsPost(post);
                        }}
                        className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/30 p-5 space-y-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-350 dark:hover:border-slate-800 shadow-sm dark:shadow-none cursor-pointer group"
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
                                    : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20"
                                }`}
                              >
                                {plat}
                              </span>
                            ))}
                            {hasMedia && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-650 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20 flex items-center gap-1">
                                🖼️ Media
                              </span>
                            )}
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
                                className="text-slate-400 hover:text-teal-650 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded transition-colors cursor-pointer"
                                title="Publish Now"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Duplicate Post Button */}
                            <button
                              onClick={() => handleDuplicatePost(post)}
                              className="text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded transition-colors cursor-pointer"
                              title="Duplicate/Reuse Post"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete Post Button */}
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-slate-400 hover:text-rose-505 hover:bg-slate-100 dark:hover:bg-slate-805 p-1 rounded transition-colors cursor-pointer"
                              title="Delete Post"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Content details layout */}
                        <div className="flex gap-4 items-start">
                          {hasMedia ? (
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

                        {/* Footer timing and comments indicator */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-900/60 text-[10px] text-slate-450 dark:text-slate-550 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {post.status === "PUBLISHED" ? "Published" : "Scheduled"}:{" "}
                              {new Date(post.scheduledAt).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {postCommentsCount > 0 && (
                              <span className="flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/20 px-1.5 py-0.5 rounded">
                                <MessageSquare className="h-3 w-3" />
                                {postCommentsCount} comments
                              </span>
                            )}
                            <span className="text-teal-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">View Insights →</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                <p className="text-xs text-slate-455 dark:text-slate-500 mt-1 font-medium">Connect your creator pages to publish assets automatically.</p>
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
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-855 px-2 py-0.5 rounded-full font-bold">
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
                          className="text-[10px] text-rose-600 dark:text-rose-400 hover:text-rose-505 dark:hover:text-rose-300 font-extrabold cursor-pointer hover:underline"
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
                <div className="rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-955/40 p-4 space-y-4">
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
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-855 px-2 py-0.5 rounded-full font-bold">
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
                          className="text-[10px] text-rose-600 dark:text-rose-455 hover:text-rose-500 dark:hover:text-rose-300 font-extrabold cursor-pointer hover:underline"
                        >
                          Disconnect
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConnectModal("linkedin")}
                        className="w-full bg-slate-100 dark:bg-slate-805 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg py-1.5 text-[10px] font-bold transition-all cursor-pointer"
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

                {/* Facebook Channel */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-955/40 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👥</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Facebook Pages API</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Facebook Page Integration</p>
                      </div>
                    </div>
                    {accounts.some((a) => a.provider === "facebook") ? (
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                        Connected
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-855 px-2 py-0.5 rounded-full font-bold">
                        Offline
                      </span>
                    )}
                  </div>

                  {accounts.some((a) => a.provider === "facebook") ? (
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-indigo-500 dark:text-indigo-400">FB</div>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">{accounts.find((a) => a.provider === "facebook")?.platformUsername}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDisconnect("facebook")}
                          className="text-[10px] text-rose-600 dark:text-rose-455 hover:text-rose-500 dark:hover:text-rose-300 font-extrabold cursor-pointer hover:underline"
                        >
                          Disconnect
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConnectModal("facebook")}
                        className="w-full bg-slate-100 dark:bg-slate-805 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg py-1.5 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Swap / Update Account
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowConnectModal("facebook")}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 text-xs font-bold transition-all duration-300 cursor-pointer shadow-md shadow-indigo-100 dark:shadow-none"
                    >
                      Connect Sandbox FB Page
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live activity feed */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                  Live Activity Feed
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 font-medium">Ongoing engagement events simulated in real-time.</p>
              </div>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-4">No recent activity. Publish posts to trigger simulation events.</p>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="flex gap-2.5 items-start p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 text-xs">
                      <span className="text-base shrink-0">
                        {notif.type === "SUCCESS" ? "✅" : notif.type === "ALERT" ? "🚨" : "💬"}
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold text-slate-850 dark:text-slate-200 truncate">{notif.title}</p>
                        <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-tight">{notif.message}</p>
                        <p className="text-[8px] text-slate-400">{new Date(notif.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* POST INSIGHTS MODAL */}
      {insightsPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-2xl relative my-8 animate-fade-in">
            <button 
              onClick={() => setInsightsPost(null)}
              className="absolute top-4 right-4 p-2 text-slate-450 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-105 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header info */}
            <div className="flex flex-wrap gap-3 items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4 pr-8">
              <div>
                <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
                  Post Performance Insights
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">Scheduled/Published: {new Date(insightsPost.scheduledAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {insightsPost.platforms.map((plat: string) => (
                  <span key={plat} className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-300">
                    {plat}
                  </span>
                ))}
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-650 dark:text-teal-400 border border-teal-100 dark:border-teal-500/20">
                  {insightsPost.status}
                </span>
              </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Side: Demographic Analysis & Forecasting (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Demographics cards (Age/Gender/Devices) */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55/50 dark:bg-slate-950/20 p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-teal-500" />
                    Audience Demographics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Gender SVG visual bar */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender Share</span>
                      <div className="h-5 w-full bg-slate-105 dark:bg-slate-900 rounded-lg overflow-hidden flex text-[10px] font-bold text-white text-center">
                        <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center" style={{ width: "65%" }}>F: 65%</div>
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center" style={{ width: "35%" }}>M: 35%</div>
                      </div>
                    </div>

                    {/* Devices list */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Devices</span>
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-550 dark:text-slate-450">📱 Mobile App</span>
                        <span className="text-slate-700 dark:text-slate-200 font-extrabold">88%</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-550 dark:text-slate-450">💻 Desktop Web</span>
                        <span className="text-slate-700 dark:text-slate-200 font-extrabold">12%</span>
                      </div>
                    </div>

                    {/* Top Locations */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Locations</span>
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-550 dark:text-slate-450">🇺🇸 United States</span>
                        <span className="text-slate-700 dark:text-slate-200 font-extrabold">42%</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-550 dark:text-slate-450">🇮🇳 India</span>
                        <span className="text-slate-700 dark:text-slate-200 font-extrabold">28%</span>
                      </div>
                    </div>
                  </div>

                  {/* Age distribution bar chart */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-900/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age Bracket Breakdown</span>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
                      {[
                        { range: "18-24", pct: "15%", height: "h-6 bg-slate-300 dark:bg-slate-800" },
                        { range: "25-34", pct: "45%", height: "h-14 bg-teal-500/80" },
                        { range: "35-44", pct: "25%", height: "h-10 bg-indigo-500/80" },
                        { range: "45+", pct: "15%", height: "h-6 bg-slate-350 dark:bg-slate-700" }
                      ].map(age => (
                        <div key={age.range} className="flex flex-col items-center justify-end h-20 gap-1">
                          <div className={`w-full rounded-md ${age.height} flex items-center justify-center text-[9px] font-extrabold text-white`}>{age.pct}</div>
                          <span className="text-[9px] text-slate-555 dark:text-slate-400">{age.range}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Reach forecasting (SVG Line Chart) */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55/50 dark:bg-slate-950/20 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-indigo-500" />
                    Reach & Engagement Forecasting
                  </h4>
                  <div className="h-[100px] w-full relative flex items-end">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 80" preserveAspectRatio="none">
                      <path d="M 0 60 Q 125 45 250 40 T 500 15" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" />
                      <circle cx="250" cy="40" r="3.5" fill="#6366f1" />
                      <circle cx="500" cy="15" r="3.5" fill="#6366f1" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-450 dark:text-slate-550 font-bold px-1">
                    <span>Current Reach</span>
                    <span>3-day Forecast</span>
                    <span>7-day Forecast (+55%)</span>
                  </div>
                </div>

              </div>

              {/* Right Side: Sentiment Analysis & Comments Feed (5 cols) */}
              <div className="lg:col-span-5 space-y-4 flex flex-col max-h-[460px]">
                
                {/* 1. Comment Sentiment Meter */}
                {(() => {
                  const postComments = insightsPost.comments || [];
                  const pos = postComments.filter((c: any) => c.sentiment === "POSITIVE").length;
                  const neu = postComments.filter((c: any) => c.sentiment === "NEUTRAL").length;
                  const neg = postComments.filter((c: any) => c.sentiment === "NEGATIVE").length;
                  const total = postComments.length || 1;

                  const posPct = ((pos / total) * 100).toFixed(0);
                  const neuPct = ((neu / total) * 100).toFixed(0);
                  const negPct = ((neg / total) * 100).toFixed(0);

                  return (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55/50 dark:bg-slate-950/20 p-4 space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Smile className="h-4 w-4 text-amber-500" />
                        Engagement Sentiment Analysis
                      </h4>
                      <div className="h-4 w-full bg-slate-105 dark:bg-slate-900 rounded-md overflow-hidden flex text-[8px] font-extrabold text-white text-center">
                        {pos > 0 && <div className="h-full bg-emerald-500 flex items-center justify-center" style={{ width: `${posPct}%` }}>Pos: {posPct}%</div>}
                        {neu > 0 && <div className="h-full bg-slate-400 flex items-center justify-center" style={{ width: `${neuPct}%` }}>Neu: {neuPct}%</div>}
                        {neg > 0 && <div className="h-full bg-rose-500 flex items-center justify-center" style={{ width: `${negPct}%` }}>Neg: {negPct}%</div>}
                        {postComments.length === 0 && <div className="h-full bg-slate-200 dark:bg-slate-800 text-slate-500 w-full flex items-center justify-center font-bold">No sentiment logs</div>}
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Interactive Nested Comment Thread */}
                <div className="flex-1 rounded-xl border border-slate-205 dark:border-slate-800 p-4 bg-slate-55/50 dark:bg-slate-950/20 flex flex-col space-y-3 min-h-[220px] overflow-y-auto">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Comment Thread</h4>
                  
                  {(() => {
                    const postComments = insightsPost.comments || [];
                    if (postComments.length === 0) {
                      return <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-8">No comments yet. Simulation will trigger some shortly!</p>;
                    }

                    const parentComments = postComments.filter((c: any) => !c.parentId);
                    const replies = postComments.filter((c: any) => c.parentId);

                    return (
                      <div className="space-y-4">
                        {parentComments.map((parent: any) => {
                          const parentReplies = replies.filter((r: any) => r.parentId === parent.id);
                          return (
                            <div key={parent.id} className="space-y-2">
                              {/* Parent Comment */}
                              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 text-[11px] space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{parent.authorName}</span>
                                  <span className={`text-[8px] font-black px-1.5 py-0.2 rounded ${
                                    parent.sentiment === "POSITIVE" 
                                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" 
                                      : parent.sentiment === "NEGATIVE" 
                                        ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-455" 
                                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                  }`}>{parent.sentiment}</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{parent.text}</p>
                              </div>

                              {/* Replies */}
                              {parentReplies.map((reply: any) => (
                                <div key={reply.id} className="ml-5 p-2 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-[10px] space-y-0.5">
                                  <div className="flex justify-between items-center">
                                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">🛡️ {reply.authorName}</span>
                                    <span className="text-[8px] text-slate-450">{new Date(reply.createdAt).toLocaleTimeString()}</span>
                                  </div>
                                  <p className="text-slate-600 dark:text-slate-400">{reply.text}</p>
                                </div>
                              ))}

                              {/* Admin reply input area */}
                              <div className="ml-5 flex gap-1.5 items-center">
                                <input 
                                  type="text"
                                  placeholder="Type reply as admin..."
                                  value={adminReplyText[parent.id] || ""}
                                  onChange={(e) => setAdminReplyText(prev => ({ ...prev, [parent.id]: e.target.value }))}
                                  className="flex-1 text-[10px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none"
                                />
                                <button 
                                  onClick={() => handleSubmitReply(parent.id)}
                                  className="bg-slate-900 hover:bg-slate-800 dark:bg-gradient-to-r dark:from-teal-500 dark:to-indigo-500 text-white dark:text-slate-950 px-2.5 py-1.5 rounded-lg text-[9px] font-black cursor-pointer shadow-sm"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* AI COPILOT SIDEBAR PANEL */}
      <div className={`fixed top-0 right-0 z-40 h-full w-[350px] border-l border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-2xl p-5 flex flex-col space-y-4 transition-transform duration-300 transform ${
        isCopilotOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI Copilot Assistant
          </h3>
          <button 
            onClick={() => setIsCopilotOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {copilotMessages.length === 0 && (
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-bold">Quick Action Templates</p>
            <div className="grid grid-cols-1 gap-2 text-left">
              <button 
                onClick={() => handleSendCopilotMessage("Run a diagnostics check on my queue and tell me if there are any performance bottlenecks or publishing errors.")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-2 transition-all cursor-pointer"
              >
                <span>🔍</span>
                <div>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200">Content Diagnostics</p>
                  <p className="text-[9px] text-slate-450 dark:text-slate-500 font-medium">Scan queue for errors/bottlenecks.</p>
                </div>
              </button>
              <button 
                onClick={() => handleSendCopilotMessage("Give me a performance review of my published posts and calculate my average engagement trends.")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-2 transition-all cursor-pointer"
              >
                <span>📈</span>
                <div>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200">Performance Diagnostics</p>
                  <p className="text-[9px] text-slate-450 dark:text-slate-500 font-medium">Review reach & engagement trends.</p>
                </div>
              </button>
              <button 
                onClick={() => handleSendCopilotMessage("Recommend 3 high-engaging caption variations for a new marketing post.")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-2 transition-all cursor-pointer"
              >
                <span>✍️</span>
                <div>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200">Caption Variations</p>
                  <p className="text-[9px] text-slate-450 dark:text-slate-500 font-medium">Generate 3 engaging captions.</p>
                </div>
              </button>
              <button 
                onClick={() => handleSendCopilotMessage("Generate an Instagram caption template about launching a tech product, including emojis, hashtags, and a call-to-action.")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-2 transition-all cursor-pointer"
              >
                <span>📸</span>
                <div>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200">Instagram Template</p>
                  <p className="text-[9px] text-slate-450 dark:text-slate-500 font-medium">Punchy caption with emojis and hashtags.</p>
                </div>
              </button>
              <button 
                onClick={() => handleSendCopilotMessage("Generate a professional LinkedIn caption template about career growth and leadership lessons.")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-2 transition-all cursor-pointer"
              >
                <span>💼</span>
                <div>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200">LinkedIn Template</p>
                  <p className="text-[9px] text-slate-450 dark:text-slate-500 font-medium">Professional thought leadership framework.</p>
                </div>
              </button>
              <button 
                onClick={() => handleSendCopilotMessage("Generate a Twitter/X caption hook template to maximize click-through rate on articles.")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-2 transition-all cursor-pointer"
              >
                <span>🐦</span>
                <div>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200">Twitter/X Hook Template</p>
                  <p className="text-[9px] text-slate-450 dark:text-slate-500 font-medium">High-CTR hooks and thread outlines.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Chat Feed */}
        <div className="flex-1 rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 p-3 overflow-y-auto space-y-3 text-[11px] pr-1">
          {copilotMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-2">
              <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" />
              <p className="font-bold">Ask anything about your workspace</p>
              <p className="text-[10px] max-w-xs text-slate-450 leading-relaxed font-medium">I have real-time access to your publishing history, queue status, and reach analytics.</p>
            </div>
          ) : (
            copilotMessages.map((msg, i) => (
              <div key={i} className={`flex flex-col space-y-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{msg.role === "user" ? "You" : "Copilot AI"}</span>
                <div className={`p-2.5 rounded-2xl max-w-[90%] leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-slate-900 text-white dark:bg-gradient-to-r dark:from-teal-500 dark:to-indigo-500 dark:text-slate-950 font-bold" 
                    : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 text-slate-750 dark:text-slate-300"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {copilotLoading && (
            <div className="flex gap-1.5 items-center text-slate-400 text-[10px] animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin text-purple-400" />
              <span>Copilot is analyzing...</span>
            </div>
          )}
        </div>

        {/* Input message */}
        <div className="flex gap-1.5 items-center">
          <input 
            type="text"
            placeholder="Type message to Copilot..."
            value={copilotInput}
            onChange={(e) => setCopilotInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendCopilotMessage()}
            className="flex-1 text-xs rounded-xl border border-slate-205 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
          />
          <button 
            onClick={() => handleSendCopilotMessage()}
            disabled={copilotLoading}
            className="bg-slate-900 hover:bg-slate-850 dark:bg-gradient-to-r dark:from-teal-500 dark:to-indigo-500 text-white dark:text-slate-950 p-2.5 rounded-xl cursor-pointer shadow-md disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* MODAL POPUP FOR CONNECTION */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl relative">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>🔗</span>
              Link {showConnectModal === "instagram" ? "Instagram" : showConnectModal === "facebook" ? "Facebook" : "LinkedIn"} Page
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
                ? `Connect your real ${showConnectModal === "instagram" ? "Instagram" : showConnectModal === "facebook" ? "Facebook" : "LinkedIn"} profile securely via official OAuth integration.`
                : connectMode === "mock"
                ? "This simulates OAuth for local testing. No real API calls will be made."
                : "Enter your API credentials manually. Tokens are encrypted before storage."}
            </p>

            <div className="space-y-3">
              {connectMode === "oauth" && (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-100 dark:border-slate-850 animate-fade-in">
                  <div className="text-3xl">🔑</div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Redirecting to {showConnectModal === "instagram" ? "Instagram" : showConnectModal === "facebook" ? "Facebook" : "LinkedIn"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs leading-normal">
                      You will authorize SocialForge to publish posts on your behalf.
                    </p>
                  </div>
                </div>
              )}

              {connectMode === "manual" && (
                <div className="animate-fade-in space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {showConnectModal === "instagram" ? "Instagram User ID" : showConnectModal === "facebook" ? "Facebook Page ID" : "LinkedIn Author URN"}
                    </label>
                    <input
                      type="text"
                      value={connectAccountId}
                      onChange={(e) => setConnectAccountId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-teal-500 focus:outline-none"
                      placeholder={showConnectModal === "instagram" ? "1234567890" : showConnectModal === "facebook" ? "987654321" : "urn:li:person:abc123"}
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
                </div>
              )}

              {connectMode !== "oauth" && (
                <div className="animate-fade-in space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Platform Username
                    </label>
                    <input
                      type="text"
                      placeholder={showConnectModal === "instagram" ? "e.g., creator_forge" : showConnectModal === "facebook" ? "e.g., my_facebook_page" : "e.g., in/creator-forge"}
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
                </div>
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
                className="flex-1 bg-slate-900 hover:bg-slate-855 dark:bg-gradient-to-r dark:from-teal-500 dark:to-indigo-500 dark:hover:from-teal-400 dark:hover:to-indigo-400 text-white dark:text-slate-950 font-bold rounded-lg py-2 text-xs disabled:bg-slate-200 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
              >
                {connectLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin text-white dark:text-slate-950" />
                ) : connectMode === "oauth" ? (
                  `Authorize on ${showConnectModal === "instagram" ? "Instagram" : showConnectModal === "facebook" ? "Facebook" : "LinkedIn"}`
                ) : (
                  "Connect"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-teal-500" />
                Edit Client Work
              </h3>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Task Name</label>
                <input 
                  type="text" 
                  value={editingTask.title} 
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</label>
                  <select 
                    value={editingTask.type} 
                    onChange={(e) => setEditingTask({...editingTask, type: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:border-teal-500 focus:outline-none cursor-pointer"
                  >
                    <option value="VIDEO">Video</option>
                    <option value="POSTER">Poster</option>
                    <option value="DOCUMENT">Document</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</label>
                  <select 
                    value={editingTask.status} 
                    onChange={(e) => setEditingTask({...editingTask, status: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:border-teal-500 focus:outline-none cursor-pointer"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="TESTING">Testing / QA</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/20">
              <button 
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateTask}
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
