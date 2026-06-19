"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Calendar,
  Clock,
  ArrowLeft,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import SocialPreview from "@/components/composer/social-preview";
import ImageGenerator from "@/components/composer/image-generator";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function ComposerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Post Details
  const [caption, setCaption] = useState("");
  const [firstComment, setFirstComment] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["INSTAGRAM", "LINKEDIN"]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");

  // Prefill details if query params or sessionStorage draft exist
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const scheduledParam = params.get("scheduledAt");
      if (scheduledParam) {
        setScheduledAt(scheduledParam);
      }

      // Check for duplicated/preloaded draft in sessionStorage
      const savedDraft = sessionStorage.getItem("socialforge_draft");
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.caption) setCaption(draft.caption);
          if (draft.firstComment !== undefined) setFirstComment(draft.firstComment);
          if (draft.hashtags !== undefined) setHashtags(draft.hashtags);
          if (draft.mediaUrl !== undefined) setMediaUrl(draft.mediaUrl);
          if (draft.mediaType !== undefined) setMediaType(draft.mediaType);
          if (draft.platforms !== undefined) setPlatforms(draft.platforms);
          
          // Clear draft from storage after loading
          sessionStorage.removeItem("socialforge_draft");
        } catch (e) {
          console.error("Error parsing saved draft:", e);
        }
      }
    }
  }, []);

  // AI Text Generator State
  const [textPrompt, setTextPrompt] = useState("");
  const [isGeneratingText, setIsGeneratingText] = useState(false);

  // Form Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // File Upload State & Ref
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setNotification(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setMediaUrl(data.url);
      setMediaType(data.type);
      setNotification({ type: "success", message: "File uploaded successfully!" });
    } catch (err: any) {
      console.error(err);
      setNotification({ type: "error", message: err.message || "Failed to upload file." });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const togglePlatform = (platform: string) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter((p) => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  const handleGenerateCaption = async () => {
    if (!textPrompt.trim()) return;
    setIsGeneratingText(true);
    setNotification(null);

    try {
      const response = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textPrompt,
          platform: platforms.length === 1 ? platforms[0].toLowerCase() : "both",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate caption");
      }

      setCaption(data.caption || "");
      if (data.firstComment) setFirstComment(data.firstComment);
      if (data.hashtags) setHashtags(data.hashtags);
    } catch (err: any) {
      console.error(err);
      setNotification({ type: "error", message: err.message || "Failed to generate caption." });
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) {
      setNotification({ type: "error", message: "Please provide a post caption." });
      return;
    }
    if (platforms.length === 0) {
      setNotification({ type: "error", message: "Please select at least one platform." });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          firstComment,
          hashtags,
          platforms,
          scheduledAt: scheduledAt || null,
          mediaUrl: mediaUrl || null,
          mediaType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process post submission.");
      }

      setNotification({ type: "success", message: data.message });
      
      // Reset form on success (except media if they want to reuse)
      if (!scheduledAt) {
        setCaption("");
        setFirstComment("");
        setHashtags("");
        setMediaUrl("");
      }
    } catch (err: any) {
      console.error(err);
      setNotification({ type: "error", message: err.message || "Failed to submit post." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAIAsset = (url: string, type: "IMAGE" | "VIDEO") => {
    setMediaUrl(url);
    setMediaType(type);
    setNotification({ type: "success", message: "AI asset attached to composer successfully!" });
  };

  return (
    <div className="min-h-screen bg-slate-50/65 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-12 font-sans selection:bg-purple-100 selection:text-purple-900 transition-colors duration-300">
      {/* Premium Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-900 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 dark:from-teal-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Create Social Media Masterpiece
              </h1>
              <p className="text-xs text-slate-500">Draft, generate media, preview live layout, and publish</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 text-xs bg-slate-150/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full text-slate-655 dark:text-slate-450 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Connected to DB & AI Engine</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Hand: Compose Workspace (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {notification && (
            <div
              className={`flex items-start gap-3 rounded-xl border p-4 text-sm animate-fade-in ${
                notification.type === "success"
                  ? "border-emerald-250 bg-emerald-50 text-emerald-800"
                  : "border-rose-250 bg-rose-50 text-rose-800"
              }`}
            >
              {notification.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {/* AI CAPTION ASSISTANT COMPONENT */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Copywriting Assistant (Gemini)
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="Briefly describe what this post is about... (e.g. Launching a new SaaS dashboard)"
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-455 dark:placeholder-slate-600 focus:bg-white dark:focus:bg-slate-950 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={handleGenerateCaption}
                disabled={isGeneratingText || !textPrompt.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-bold text-white cursor-pointer disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              >
                {isGeneratingText ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Draft Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* MAIN FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 shadow-sm space-y-6">
              {/* Select Platforms */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Target Platforms</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => togglePlatform("INSTAGRAM")}
                    className={`flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold transition-all duration-300 cursor-pointer ${
                      platforms.includes("INSTAGRAM")
                        ? "border-pink-500 bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className="text-base">📸</span>
                    Instagram (Posts & Reels)
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePlatform("LINKEDIN")}
                    className={`flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold transition-all duration-300 cursor-pointer ${
                      platforms.includes("LINKEDIN")
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-650 dark:text-blue-400 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className="text-base">💼</span>
                    LinkedIn (UGC Share)
                  </button>
                </div>
              </div>

              {/* Caption Text Box */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Post Caption</label>
                <textarea
                  rows={6}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write something engaging..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-455 focus:bg-white dark:focus:bg-slate-950 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-medium leading-relaxed"
                  required
                />
              </div>

              {/* Advanced Configurations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Instagram First Comment <span className="text-slate-400 dark:text-slate-500 font-medium">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={firstComment}
                    onChange={(e) => setFirstComment(e.target.value)}
                    placeholder="Put hashtags here to keep caption clean..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-455 focus:bg-white dark:focus:bg-slate-950 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all resize-none font-medium"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Post Hashtags <span className="text-slate-400 dark:text-slate-500 font-medium">(Inline list)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="#marketing #ai #business..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-455 focus:bg-white dark:focus:bg-slate-950 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all resize-none font-medium"
                  />
                </div>
              </div>

              {/* Media Upload URL / Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Attached Media Asset</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="Paste image/video URL, or upload, or generate on the right..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 pl-10 pr-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-455 focus:bg-white dark:focus:bg-slate-950 focus:border-purple-500 focus:outline-none transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleUploadClick}
                      disabled={isUploading}
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-lg text-slate-450 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                      title="Upload file"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,video/*"
                      className="hidden"
                    />
                  </div>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as "IMAGE" | "VIDEO")}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-655 dark:text-slate-300 focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video (Reel)</option>
                  </select>
                </div>
                {mediaUrl && (
                  <div className="text-[10px] text-slate-450 dark:text-slate-500 flex items-center gap-1 font-medium">
                    <span>Active URL:</span>
                    <span className="text-slate-600 dark:text-slate-400 font-mono truncate max-w-sm">{mediaUrl}</span>
                  </div>
                )}
              </div>

              {/* Schedule Timing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-900 pt-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-teal-500" />
                    Publish Timing
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2.5 text-xs text-slate-655 dark:text-slate-300 focus:border-purple-500 focus:outline-none cursor-pointer font-bold"
                  />
                  <p className="text-[10px] text-slate-455 dark:text-slate-555">Leave blank to publish instantly.</p>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-850 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-500 dark:hover:from-teal-400 dark:hover:to-emerald-400 px-4 py-3 text-sm font-extrabold text-white dark:text-slate-950 cursor-pointer shadow-md transition-all duration-300 transform active:scale-95 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white dark:text-slate-950" />
                        <span>Scheduling...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>{scheduledAt ? "Schedule SocialForge Post" : "Publish to Socials Now"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Render Preview Component */}
            <SocialPreview
              caption={caption}
              firstComment={firstComment}
              hashtags={hashtags}
              mediaUrl={mediaUrl || undefined}
              mediaType={mediaType}
              selectedPlatforms={platforms}
            />
          </form>
        </div>

        {/* Right Hand: AI Visual Forge (5 cols) */}
        <div className="lg:col-span-5">
          <ImageGenerator onSelectImage={handleSelectAIAsset} />
        </div>
      </div>
    </div>
  );
}
