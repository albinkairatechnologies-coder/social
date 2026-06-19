"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Bot,
  Zap,
  BarChart3,
  ThumbsUp,
  MessageCircle,
  Share2,
  Heart,
  Bookmark,
  MoreHorizontal,
  Smile,
  Monitor,
  Smartphone,
  Check,
  Send,
  Link2,
  HelpCircle,
  TrendingUp,
  ArrowUpRight
} from "lucide-react";

// Local SVG Icons for Social Logos (Pixel-perfect matching official brands)
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      // 1. Attempt to register the demo account (ignores error if user already exists)
      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Demo Creator",
          email: "demo@socialforge.com",
          password: "demopassword"
        }),
      }).catch((e) => console.log("Demo register bypass/exists:", e));

      // 2. Perform credentials sign in
      const result = await signIn("credentials", {
        email: "demo@socialforge.com",
        password: "demopassword",
        redirect: false,
      });

      if (result?.error) throw new Error(result.error);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to sign in with Demo account.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<"instagram" | "linkedin">("instagram");
  const [promptInput, setPromptInput] = useState("SaaS platform product launch announcement");
  const [simulatedCaption, setSimulatedCaption] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [selectedMockDate, setSelectedMockDate] = useState("2026-06-20T10:00");
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // FAQ Data
  const faqs = [
    {
      question: "How does the AI Copywriting Assistant work?",
      answer: "Our copywriting module utilizes custom-tuned Google Gemini models. By analyzing your prompt, target platform, and optional tags, it generates highly relevant, platform-tailored copy. It drafts the main caption, extracts hashtags, and even proposes an Instagram 'first comment' to keep your main layout clean."
    },
    {
      question: "What is the AI Visual Forge?",
      answer: "The Visual Forge lets you generate and test social creatives in real-time. Simply describe the creative asset you need (e.g. 'minimalist modern office background') and our AI generator produces a tailored image, auto-attaching it to your current composer post without requiring any download and re-upload cycles."
    },
    {
      question: "Can I connect real business accounts?",
      answer: "Absolutely. SocialForge is built for flexibility. You can activate our Sandbox (Mock) mode to safely experiment with queue layouts, or securely configure your actual Instagram Graph API credentials and LinkedIn UGC OAuth tokens for automated production publishing."
    },
    {
      question: "How does the Content Calendar manage automation?",
      answer: "Every post submitted to the queue is mapped directly onto an interactive scheduler calendar. You can see platform breakdowns per day, select dates to filter or edit posts, and check immediate status updates (such as SCHEDULED, PUBLISHED, or detailed error logs for FAILED events)."
    }
  ];

  const handleSimulateType = () => {
    setIsTyping(true);
    setHasGenerated(true);
    setScheduleSuccess(false);
    setSimulatedCaption("");
    
    const fullText = `🚀 The wait is over. Meet the future of creative automation: Visual Forge. \n\nWe've unified Google Gemini AI text generation, direct image forge prompting, and multi-channel publication pipelines into a single canvas. \n\nStop juggling tabs. Draft, generate, preview, and schedule for Instagram & LinkedIn in under a minute. \n\nTry it now! #CreativeAutomation #MarketingTools #SaaSProductivity #AIGraphics`;
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setSimulatedCaption((prev) => prev + fullText.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 12);
  };

  const handleSimulateSchedule = () => {
    if (!hasGenerated) {
      alert("Please simulate the AI copywriter first to generate content!");
      return;
    }
    setScheduleSuccess(true);
    setTimeout(() => {
      setScheduleSuccess(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Dynamic blink style for typewriter effect */}
      <style>{`
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-cursor {
          animation: cursor-blink 1s step-end infinite;
        }
      `}</style>

      {/* 1. Header & Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-400 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-100 font-black text-white text-lg">
              SF
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
              SocialForge
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-wider font-extrabold text-slate-500">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#simulator" className="hover:text-indigo-600 transition-colors">Sandbox Demo</a>
            <a href="#workflow" className="hover:text-indigo-600 transition-colors">Workflow</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
          </nav>

          {/* Dynamic Auth Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {status === "authenticated" ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 px-4.5 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-200 transition-all transform active:scale-95 cursor-pointer"
              >
                <span>Console</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <button
                  onClick={handleDemoLogin}
                  disabled={isDemoLoading}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-2 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Demo Access</span>
                </button>
                <Link
                  href="/login?mode=login"
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-100 transition-all transform active:scale-95 cursor-pointer"
                >
                  <span>Launch Free</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-12 px-6 overflow-hidden">
        {/* CSS Dot Grid Background */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-70" />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-50" />
        
        <div className="max-w-5xl mx-auto text-center space-y-5">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-600">
            <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse"></span>
            <span>Gemini AI Engine Connected</span>
            <span className="text-slate-300">|</span>
            <span className="text-indigo-600 font-extrabold flex items-center gap-0.5">
              Dual Platform Scheduling <TrendingUp className="h-3 w-3" />
            </span>
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.08] max-w-4xl mx-auto">
            The intelligent publishing hub for{" "}
            <span className="bg-gradient-to-r from-teal-500 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              modern creators.
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Automate writing, graphic generation, and calendar queues. SocialForge combines AI-backed copywriting with native direct publishing to streamline your media channels.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link
              href={status === "authenticated" ? "/dashboard" : "/login?mode=signup"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-slate-350 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              Get Started for Free
              <ArrowRight className="h-4.5 w-4.5 text-teal-400" />
            </Link>
            {status !== "authenticated" && (
              <button
                onClick={handleDemoLogin}
                disabled={isDemoLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-450 hover:to-indigo-550 px-7 py-4 text-sm font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-4.5 w-4.5 text-teal-200" />
                <span>{isDemoLoading ? "Signing in..." : "⚡ Quick Demo Account"}</span>
              </button>
            )}
            <a
              href="#simulator"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 px-7 py-4 text-sm font-bold text-slate-700 shadow-sm transition-all transform hover:-translate-y-0.5"
            >
              Try Playground Demo
            </a>
          </div>
        </div>
      </section>

      {/* 3. Interactive Sandbox Simulator */}
      <section id="simulator" className="py-10 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-950">
            Interactive Social Workspace
          </h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm font-medium">
            Test drive our real-time typewriter generator, multi-channel layouts, and date planners below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Left Panel: Composer Tool Widget (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xl shadow-slate-100/50 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Header Info */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-150">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sandbox Console</span>
                </div>
                <div className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 font-extrabold px-2 py-0.5 rounded-full">
                  OFFLINE PREVIEW
                </div>
              </div>

              {/* Step 1 Input Box */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">1. Define Concept Prompt</label>
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. Launching a new visual dashboard"
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all font-medium"
                />
              </div>

              {/* AI Trigger Button */}
              <button
                type="button"
                onClick={handleSimulateType}
                disabled={isTyping || !promptInput.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 text-sm font-bold shadow-md shadow-indigo-100 transition-all transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-teal-300" />
                {isTyping ? "AI Copywriter is drafting..." : "Simulate Gemini Copywriter"}
              </button>

              {/* Caption Textarea Display */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">2. Real-Time Workspace Canvas</label>
                  {isTyping && <span className="text-[9px] font-bold text-indigo-600 animate-pulse">Typing...</span>}
                </div>
                <div className="relative">
                  <textarea
                    rows={6}
                    value={simulatedCaption}
                    onChange={(e) => setSimulatedCaption(e.target.value)}
                    placeholder="Describe your post concept above and click simulate to stream copy here..."
                    className="w-full text-sm rounded-xl border border-slate-250 bg-slate-50/50 p-4 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all resize-none font-medium leading-relaxed"
                  />
                  {isTyping && (
                    <span className="absolute left-[17px] top-[17px] pointer-events-none text-slate-800 font-medium">
                      {simulatedCaption}
                      <span className="inline-block w-1.5 h-4 bg-indigo-600 animate-cursor ml-0.5">|</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Queue Date Input */}
              <div className="space-y-2 pt-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  3. Queue Time Target
                </label>
                <input
                  type="datetime-local"
                  value={selectedMockDate}
                  onChange={(e) => setSelectedMockDate(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-slate-700 focus:bg-white focus:outline-none cursor-pointer font-bold"
                />
              </div>
            </div>

            {/* Sandbox Automation Submissions */}
            <div className="pt-6 border-t border-slate-150 mt-6 space-y-4">
              <button
                type="button"
                onClick={handleSimulateSchedule}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-3 text-sm font-extrabold shadow-md shadow-slate-200 transition-all cursor-pointer"
              >
                <span>Commit to Content Queue</span>
              </button>

              {scheduleSuccess && (
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-250 bg-emerald-50/80 p-3.5 text-xs text-emerald-800 animate-fade-in shadow-sm">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-extrabold block text-emerald-950">Draft Event Queued Successfully!</span>
                    <p className="text-[10px] text-emerald-700 leading-relaxed">
                      Post injected into dashboard schedule calendar for {new Date(selectedMockDate).toLocaleString()}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Device Previews (7 cols) */}
          <div className="lg:col-span-7 bg-slate-100/60 border border-slate-250/50 rounded-3xl p-6 shadow-inner flex flex-col items-center justify-start min-h-[520px]">
            
            {/* Toggle Tabs */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-2xl shadow-sm mb-6 w-full max-w-xs">
              <button
                onClick={() => setActiveTab("instagram")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === "instagram"
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <InstagramIcon className="h-4 w-4" />
                Instagram
              </button>
              <button
                onClick={() => setActiveTab("linkedin")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === "linkedin"
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <LinkedInIcon className="h-4 w-4" />
                LinkedIn
              </button>
            </div>

            {/* High-Fidelity Instagram Mobile Mock (Phone Body) */}
            {activeTab === "instagram" ? (
              <div className="w-full max-w-[320px] bg-slate-950 rounded-[2.5rem] p-3 shadow-2xl border-4 border-slate-800 relative animate-fade-in">
                
                {/* Phone Notch/Speaker */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 h-4 w-28 bg-slate-950 rounded-full z-20 flex items-center justify-center">
                  <div className="w-8 h-1 bg-slate-800 rounded-full" />
                </div>

                <div className="bg-white rounded-[2rem] overflow-hidden text-slate-800 aspect-[9/16] flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="px-3.5 pt-6 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[1.5px]">
                          <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-[8px] font-black text-slate-800">SF</div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-800 leading-tight">socialforge_studio</h4>
                          <span className="text-[8px] text-slate-400 block -mt-0.5">London, United Kingdom</span>
                        </div>
                      </div>
                      <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
                    </div>

                    {/* Styled Graphic Post Canvas */}
                    <div className="w-full aspect-square relative bg-gradient-to-br from-indigo-50 via-slate-50 to-teal-50 flex items-center justify-center p-4 border-b border-slate-100">
                      <div className="relative h-32 w-52 rounded-xl bg-white border border-slate-200/80 p-3 shadow-md flex flex-col justify-between z-10">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Post Template</span>
                          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                        </div>
                        <div className="py-2.5 text-center text-[10px] font-black text-slate-700 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                          🖼️ Attached Graphic Asset
                        </div>
                        <div className="flex items-center justify-between text-[7px] text-slate-400">
                          <span>SocialForge Art Engine</span>
                          <span>1080 x 1080</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Heart className="h-4.5 w-4.5 text-slate-700 hover:text-red-500 cursor-pointer" />
                        <MessageCircle className="h-4.5 w-4.5 text-slate-700" />
                        <Send className="h-4.5 w-4.5 text-slate-700" />
                      </div>
                      <Bookmark className="h-4.5 w-4.5 text-slate-700" />
                    </div>

                    {/* Caption area */}
                    <div className="px-3 pb-3 space-y-1">
                      <p className="text-[9px] font-extrabold text-slate-800">4,204 likes</p>
                      <div className="text-[10px] text-slate-700 leading-relaxed max-h-24 overflow-y-auto pr-1">
                        <span className="font-extrabold text-slate-900 mr-1.5">socialforge_studio</span>
                        {hasGenerated ? simulatedCaption : "Generated copywriting caption will stream here. Describe your theme on the left and run AI assistant to preview."}
                      </div>
                    </div>
                  </div>

                  {/* Home Bar indicator */}
                  <div className="h-8 flex items-center justify-center pb-2">
                    <div className="w-20 h-1 bg-slate-200 rounded-full" />
                  </div>
                </div>
              </div>
            ) : (
              /* High-Fidelity LinkedIn Desktop Browser Mock */
              <div className="w-full max-w-[500px] bg-white rounded-2xl border border-slate-250 shadow-2xl overflow-hidden animate-fade-in flex flex-col">
                
                {/* Browser Window Header Control Bar */}
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 block" />
                  </div>
                  {/* Mock URL Bar */}
                  <div className="w-2/3 bg-white border border-slate-250/70 rounded-md py-0.5 px-3 text-[9px] text-slate-400 font-mono text-center truncate">
                    https://socialforge.io/dashboard/composer
                  </div>
                  <div className="w-6" /> {/* Spacer */}
                </div>

                <div className="bg-white p-5 text-slate-800 space-y-4">
                  {/* LinkedIn Author Metadata */}
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-extrabold text-indigo-700 text-xs">SF</div>
                      <div>
                        <div className="flex items-center gap-1">
                          <h4 className="text-[11px] font-black text-slate-900">SocialForge Admin</h4>
                          <span className="text-[9px] text-slate-400 font-medium">• 1st</span>
                        </div>
                        <p className="text-[9px] text-slate-500 leading-tight">AI Multi-Channel scheduler • Automation Hub</p>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Just now • Edited • 🌐</span>
                      </div>
                    </div>
                    <button className="text-slate-400"><MoreHorizontal className="h-4 w-4" /></button>
                  </div>

                  {/* LinkedIn Body Content Text */}
                  <div className="text-[11px] text-slate-800 leading-relaxed whitespace-pre-line max-h-32 overflow-y-auto bg-slate-50/50 p-3 rounded-xl border border-slate-200/50">
                    {hasGenerated ? simulatedCaption : "Generated copywriting caption will stream here. Describe your theme on the left and run AI assistant to preview."}
                  </div>

                  {/* LinkedIn Attached Media Preview */}
                  <div className="w-full aspect-video relative rounded-xl bg-slate-50 border border-slate-200/60 overflow-hidden flex items-center justify-center">
                    <div className="relative h-28 w-44 rounded-xl bg-white border border-slate-250/80 p-3 shadow-md flex flex-col justify-between z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-[7px] font-extrabold text-slate-400 uppercase tracking-widest">LinkedIn UGC</span>
                        <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                      </div>
                      <div className="text-center text-[9px] font-black text-slate-700 bg-slate-50 border border-dashed border-slate-200 rounded-lg py-1.5">
                        💼 Linked Graphic Asset
                      </div>
                      <div className="flex items-center justify-between text-[7px] text-slate-400">
                        <span>Creative Forge v2</span>
                        <span>Aspect: 16:9</span>
                      </div>
                    </div>
                  </div>

                  {/* LinkedIn Likes Count */}
                  <div className="flex items-center justify-between text-[9px] text-slate-400 pt-2 border-b border-slate-100 pb-2">
                    <span>👍💡 240 reactions</span>
                    <span>12 comments • 1 share</span>
                  </div>

                  {/* LinkedIn Actions */}
                  <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold">
                    <button className="flex items-center gap-1 py-1 px-2 hover:bg-slate-50 rounded"><ThumbsUp className="h-3.5 w-3.5" /> Like</button>
                    <button className="flex items-center gap-1 py-1 px-2 hover:bg-slate-50 rounded"><MessageCircle className="h-3.5 w-3.5" /> Comment</button>
                    <button className="flex items-center gap-1 py-1 px-2 hover:bg-slate-50 rounded"><Share2 className="h-3.5 w-3.5" /> Repost</button>
                    <button className="flex items-center gap-1 py-1 px-2 hover:bg-slate-50 rounded"><Send className="h-3.5 w-3.5" /> Send</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Core Features Showcase */}
      <section id="features" className="py-12 bg-white border-y border-slate-200/50 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Fully Charged Social Operations
            </h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm font-medium">
              Eliminate manual copy-pasting, custom media storage hacks, and schedule trackers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6.5 space-y-5 hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1 transition-all duration-305 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Bot className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-950">Gemini Copywriter</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Draft context-rich captions tailored to platform restrictions. Get inline tag pools and clean first-comment options out-of-the-box.
                </p>
              </div>
              <span className="text-[10px] text-indigo-600 font-extrabold flex items-center gap-1 pt-2">Powered by Google Gemini <ArrowRight className="h-3 w-3" /></span>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6.5 space-y-5 hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1 transition-all duration-305 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-950">AI Visual Forge</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Describe visuals and watch custom post assets render instantly. Direct attachment options remove manual asset downloads.
                </p>
              </div>
              <span className="text-[10px] text-teal-600 font-extrabold flex items-center gap-1 pt-2">Integrated Canvas <ArrowRight className="h-3 w-3" /></span>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6.5 space-y-5 hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1 transition-all duration-305 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-11 w-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-950">Content Calendars</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Plan campaigns weeks in advance. Filter days, double-check thumbnails, and monitor real-time queue states on a single screen.
                </p>
              </div>
              <span className="text-[10px] text-purple-600 font-extrabold flex items-center gap-1 pt-2">Interactive Schedule <ArrowRight className="h-3 w-3" /></span>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6.5 space-y-5 hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1 transition-all duration-305 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-11 w-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-950">Secure Channels</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Link social accounts utilizing sandbox mock modes or actual API credentials. Supports LinkedIn UGC Shares and Instagram Graph uploads.
                </p>
              </div>
              <span className="text-[10px] text-rose-600 font-extrabold flex items-center gap-1 pt-2">OAuth Integrations <ArrowRight className="h-3 w-3" /></span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Timeline Workflow */}
      <section id="workflow" className="py-12 px-6 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            How SocialForge Simplifies Operations
          </h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm font-medium">
            A linear workflow designed to save hours of manual scheduler uploads.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
          {/* Timeline Connector Line */}
          <div className="hidden lg:block absolute top-7 left-[15%] right-[15%] h-0.5 bg-slate-200 -z-10" />

          {/* Timeline Step 1 */}
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 flex items-center justify-center text-lg font-black font-mono">
              1
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-950">Link Channels Safely</h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-medium">
                Log into our dashboard and hook up target profiles. Choose sandbox connections for quick staging trials, or plug real keys to start active posting.
              </p>
            </div>
          </div>

          {/* Timeline Step 2 */}
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 flex items-center justify-center text-lg font-black font-mono">
              2
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-950">Forge AI Texts & Images</h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-medium">
                Write prompt templates to generate customized text and image assets inside the composer. Preview how posts look on different devices before queuing.
              </p>
            </div>
          </div>

          {/* Timeline Step 3 */}
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 flex items-center justify-center text-lg font-black font-mono">
              3
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-950">Automate Calendar Schedules</h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-medium">
                Confirm publishing dates. The scheduler automatically picks up assets, runs connections, updates calendar cards, and outputs status analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Accordion Section */}
      <section id="faq" className="py-12 bg-slate-50 border-t border-slate-200/50 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 items-center justify-center text-indigo-600 mx-auto mb-2">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm font-medium">
              Find technical details regarding sandbox configurations and our publishing pipelines.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm transition-all duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5.5 text-left font-extrabold text-sm text-slate-800 hover:text-indigo-600 transition-colors focus:outline-none cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5.5 pb-5.5 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-4 animate-fade-in font-medium">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Footer CTA Block */}
      <section className="py-12 px-6 max-w-6xl mx-auto text-center relative overflow-hidden bg-gradient-to-tr from-indigo-900 via-indigo-950 to-slate-950 rounded-[2.5rem] shadow-2xl my-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,theme(colors.teal.500/10),transparent)]" />
        <div className="relative space-y-6 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Ready to Supercharge Your Social Pipeline?
          </h2>
          <p className="text-indigo-200/80 text-xs sm:text-sm font-medium leading-relaxed">
            Link sandbox accounts, draft content with Google Gemini integration, and publish automated queues starting today.
          </p>
          <div className="pt-4">
            <Link
              href={status === "authenticated" ? "/dashboard" : "/login?mode=signup"}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-teal-400 hover:bg-teal-350 px-8 py-4 text-xs uppercase tracking-wider font-extrabold text-slate-950 shadow-xl shadow-teal-950/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Initialize Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-sm">
              SF
            </div>
            <span className="text-base font-bold text-slate-800">
              SocialForge
            </span>
          </div>

          {/* Copywrite details */}
          <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} SocialForge Inc. All rights reserved. Built with Next.js, Google Gemini, and TailwindCSS.
          </p>

          {/* Secondary Footer Nav links */}
          <div className="flex items-center gap-6 text-xs font-bold text-slate-500">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#simulator" className="hover:text-indigo-600 transition-colors">Sandbox</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
