"use client";

import React, { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ThumbsUp, MessageSquare, Repeat, Share2 } from "lucide-react";
import Image from "next/image";

interface SocialPreviewProps {
  caption: string;
  firstComment?: string;
  hashtags: string;
  mediaUrl?: string;
  mediaType?: "IMAGE" | "VIDEO";
  selectedPlatforms: string[];
}

export default function SocialPreview({
  caption,
  firstComment,
  hashtags,
  mediaUrl,
  mediaType = "IMAGE",
  selectedPlatforms,
}: SocialPreviewProps) {
  const [activeTab, setActiveTab] = useState<"instagram" | "linkedin" | "twitter" | "facebook">(
    selectedPlatforms.includes("INSTAGRAM") ? "instagram" :
    selectedPlatforms.includes("LINKEDIN") ? "linkedin" :
    selectedPlatforms.includes("TWITTER") ? "twitter" : "facebook"
  );

  // Keep activeTab in sync with selected platforms
  React.useEffect(() => {
    const activeUpper = activeTab.toUpperCase();
    if (!selectedPlatforms.includes(activeUpper) && selectedPlatforms.length > 0) {
      const firstAvailable = selectedPlatforms[0].toLowerCase() as "instagram" | "linkedin" | "twitter" | "facebook";
      setActiveTab(firstAvailable);
    }
  }, [selectedPlatforms, activeTab]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-850 pb-4 mb-6">
        <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100">
          Live Mock Previews
        </h3>
        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("instagram")}
            disabled={!selectedPlatforms.includes("INSTAGRAM")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-300 cursor-pointer ${
              activeTab === "instagram"
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-250 disabled:opacity-30 disabled:cursor-not-allowed"
            }`}
          >
            Instagram
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("linkedin")}
            disabled={!selectedPlatforms.includes("LINKEDIN")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-300 cursor-pointer ${
              activeTab === "linkedin"
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-250 disabled:opacity-30 disabled:cursor-not-allowed"
            }`}
          >
            LinkedIn
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("twitter")}
            disabled={!selectedPlatforms.includes("TWITTER")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-300 cursor-pointer ${
              activeTab === "twitter"
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-250 disabled:opacity-30 disabled:cursor-not-allowed"
            }`}
          >
            Twitter/X
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("facebook")}
            disabled={!selectedPlatforms.includes("FACEBOOK")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-300 cursor-pointer ${
              activeTab === "facebook"
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-250 disabled:opacity-30 disabled:cursor-not-allowed"
            }`}
          >
            Facebook
          </button>
        </div>
      </div>

      <div className="flex justify-center items-start min-h-[450px]">
        {activeTab === "instagram" && (
          <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black text-slate-800 dark:text-white overflow-hidden shadow-lg animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-900">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                  <div className="h-full w-full rounded-full border border-white dark:border-black bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-800 dark:text-white">
                    SF
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">socialforge_creator</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400">Sponsored • San Francisco, CA</p>
                </div>
              </div>
              <MoreHorizontal className="h-5 w-5 text-slate-400 cursor-pointer" />
            </div>

            {/* Media Area */}
            <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-900">
              {mediaUrl ? (
                mediaType === "VIDEO" ? (
                  <div className="relative w-full h-full">
                    <video src={mediaUrl} className="w-full h-full object-cover" controls muted loop />
                    <span className="absolute top-3 right-3 text-[10px] bg-black/60 px-2 py-1 rounded-md text-white font-medium backdrop-blur-sm">
                      Reels Preview
                    </span>
                  </div>
                ) : (
                  <Image src={mediaUrl} alt="Instagram Preview" fill className="object-cover" />
                )
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-655 p-8 text-center text-xs">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-lg">
                    📸
                  </div>
                  <span className="font-bold">Attach or generate an asset to see preview</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4 text-slate-700 dark:text-white">
                  <Heart className="h-6 w-6 hover:text-red-500 cursor-pointer transition-colors" />
                  <MessageCircle className="h-6 w-6 hover:text-slate-400 dark:hover:text-slate-300 cursor-pointer transition-colors" />
                  <Send className="h-6 w-6 hover:text-slate-400 dark:hover:text-slate-300 cursor-pointer transition-colors" />
                </div>
                <Bookmark className="h-6 w-6 text-slate-700 dark:text-white hover:text-slate-400 dark:hover:text-slate-300 cursor-pointer transition-colors" />
              </div>

              {/* Likes */}
              <p className="text-xs font-extrabold text-slate-850 dark:text-white mb-1">1,245 likes</p>

              {/* Caption */}
              <div className="text-xs space-y-1">
                <p className="leading-relaxed">
                  <span className="font-bold text-slate-900 dark:text-white mr-2">socialforge_creator</span>
                  {caption ? (
                    <span className="whitespace-pre-line text-slate-700 dark:text-slate-200 font-medium">
                      {caption}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 italic font-medium">No caption generated yet.</span>
                  )}
                </p>
                {hashtags && (
                  <p className="text-indigo-600 dark:text-blue-400 hover:underline cursor-pointer whitespace-pre-line font-bold">
                    {hashtags}
                  </p>
                )}
              </div>

              {/* First comment (hashtags pool simulation) */}
              {firstComment && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-900/60 text-xs">
                  <span className="font-bold mr-2 text-slate-900 dark:text-white">socialforge_creator</span>
                  <span className="text-indigo-600 dark:text-blue-450 whitespace-pre-line font-medium">{firstComment}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "linkedin" && (
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden shadow-lg p-4 animate-fade-in">
            {/* Profile Info */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex gap-2">
                <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-black text-indigo-600 dark:text-teal-400">
                  SF
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer hover:underline flex items-center gap-1">
                    SocialForge Dashboard <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">• 1st</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-medium">AI Social Scheduler & Creative Director</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                    1d • 🌐
                  </p>
                </div>
              </div>
              <MoreHorizontal className="h-5 w-5 text-slate-400 cursor-pointer" />
            </div>

            {/* Commentary Text */}
            <div className="text-xs mb-3 text-slate-750 dark:text-slate-350 whitespace-pre-line leading-relaxed font-medium">
              {caption ? (
                caption
              ) : (
                <span className="text-slate-400 dark:text-slate-600 italic">Enter composer text or trigger AI caption generation...</span>
              )}
              {hashtags && (
                <span className="text-indigo-600 dark:text-blue-500 hover:underline block mt-2 cursor-pointer font-bold">
                  {hashtags}
                </span>
              )}
            </div>

            {/* LinkedIn Media Area */}
            {mediaUrl ? (
              <div className="relative aspect-video w-full rounded-lg bg-slate-50 dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800/60 flex items-center justify-center">
                {mediaType === "VIDEO" ? (
                  <video src={mediaUrl} className="w-full h-full object-cover" controls muted loop />
                ) : (
                  <Image src={mediaUrl} alt="LinkedIn Preview" fill className="object-cover" />
                )}
              </div>
            ) : null}

            {/* Social Counts */}
            <div className="flex items-center justify-between text-[10px] text-slate-450 dark:text-slate-400 py-2 border-b border-slate-100 dark:border-slate-900 mt-3 font-semibold">
              <div className="flex items-center gap-1">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-55 dark:bg-blue-600/20 text-[8px] text-blue-600 dark:text-blue-400">👍</span>
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-teal-55 dark:bg-teal-600/20 text-[8px] text-teal-600 dark:text-teal-400">💡</span>
                <span>88 likes</span>
              </div>
              <div>
                <span>12 comments • 4 shares</span>
              </div>
            </div>

            {/* LinkedIn Actions */}
            <div className="flex justify-between items-center pt-2 text-slate-500 dark:text-slate-400 text-xs font-bold">
              <button className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                <ThumbsUp className="h-4 w-4" />
                <span>Like</span>
              </button>
              <button className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                <MessageSquare className="h-4 w-4" />
                <span>Comment</span>
              </button>
              <button className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                <Repeat className="h-4 w-4" />
                <span>Repost</span>
              </button>
              <button className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                <Share2 className="h-4 w-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "twitter" && (
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black text-slate-900 dark:text-white p-4 shadow-lg animate-fade-in">
            {/* Twitter Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex gap-2">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-800 dark:text-white">
                  SF
                </div>
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-1">
                    SocialForge <span className="text-slate-500 font-normal">@socialforge_app • 2h</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">AI Copilot Creative Workspace</p>
                </div>
              </div>
              <MoreHorizontal className="h-5 w-5 text-slate-400 cursor-pointer" />
            </div>

            {/* Tweet Content */}
            <div className="text-xs mb-3 leading-relaxed whitespace-pre-line font-medium text-slate-805 dark:text-slate-100">
              {caption ? caption : <span className="text-slate-400 italic">Tweet caption draft goes here...</span>}
              {hashtags && (
                <span className="text-sky-500 hover:underline block mt-1 cursor-pointer font-bold">
                  {hashtags}
                </span>
              )}
            </div>

            {/* Twitter Media Area */}
            {mediaUrl ? (
              <div className="relative aspect-video w-full rounded-2xl bg-slate-50 dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-805 flex items-center justify-center">
                {mediaType === "VIDEO" ? (
                  <video src={mediaUrl} className="w-full h-full object-cover" controls muted loop />
                ) : (
                  <Image src={mediaUrl} alt="Twitter Preview" fill className="object-cover" />
                )}
              </div>
            ) : null}

            {/* Tweet Footer Stats */}
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-100 dark:border-slate-900/60 text-slate-550 dark:text-slate-400 text-[10px] font-bold">
              <span className={`font-mono px-2 py-0.5 rounded-full ${caption.length > 280 ? "text-red-500 bg-red-50 dark:bg-red-950/20 animate-pulse" : "text-sky-600 bg-sky-50 dark:bg-sky-955/20"}`}>
                Character Count: {caption.length}/280
              </span>
            </div>

            {/* Tweet Actions */}
            <div className="flex justify-between items-center pt-3 text-slate-500 dark:text-slate-400 text-xs mt-1">
              <button className="flex items-center gap-1.5 hover:text-sky-500 transition-colors cursor-pointer">
                <MessageSquare className="h-4 w-4" />
                <span>45</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors cursor-pointer">
                <Repeat className="h-4 w-4" />
                <span>12</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-pink-500 transition-colors cursor-pointer">
                <Heart className="h-4 w-4" />
                <span>210</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-sky-500 transition-colors cursor-pointer">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "facebook" && (
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-150 overflow-hidden shadow-lg p-4 animate-fade-in">
            {/* Facebook Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-black text-blue-600">
                  SF
                </div>
                <div>
                  <h4 className="text-xs font-bold hover:underline cursor-pointer flex items-center gap-1">
                    SocialForge Page <span className="text-blue-500">✔</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight flex items-center gap-1 font-medium">
                    2 hours ago • 🌐
                  </p>
                </div>
              </div>
              <MoreHorizontal className="h-5 w-5 text-slate-400 cursor-pointer" />
            </div>

            {/* FB Text */}
            <div className="text-xs mb-3 text-slate-750 dark:text-slate-350 whitespace-pre-line leading-relaxed font-medium">
              {caption ? caption : <span className="text-slate-400 italic">Facebook post draft goes here...</span>}
              {hashtags && (
                <span className="text-blue-600 dark:text-blue-450 hover:underline block mt-2 cursor-pointer font-bold">
                  {hashtags}
                </span>
              )}
            </div>

            {/* FB Media Area */}
            {mediaUrl ? (
              <div className="relative aspect-video w-full bg-slate-50 dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                {mediaType === "VIDEO" ? (
                  <video src={mediaUrl} className="w-full h-full object-cover" controls muted loop />
                ) : (
                  <Image src={mediaUrl} alt="Facebook Preview" fill className="object-cover" />
                )}
              </div>
            ) : null}

            {/* FB Likes & Comments Counts */}
            <div className="flex items-center justify-between text-[10px] text-slate-450 dark:text-slate-400 py-2 border-b border-slate-100 dark:border-slate-900 mt-3 font-semibold">
              <div className="flex items-center gap-1">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-[8px] text-white">👍</span>
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-[8px] text-white">❤️</span>
                <span>124 likes</span>
              </div>
              <div>
                <span>32 comments • 6 shares</span>
              </div>
            </div>

            {/* FB Action Buttons */}
            <div className="flex justify-between items-center pt-2 text-slate-500 dark:text-slate-400 text-xs font-bold">
              <button type="button" className="flex items-center justify-center gap-1.5 flex-1 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                <ThumbsUp className="h-4 w-4" />
                <span>Like</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-1.5 flex-1 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                <MessageSquare className="h-4 w-4" />
                <span>Comment</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-1.5 flex-1 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
