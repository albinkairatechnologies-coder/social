"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, Image as ImageIcon, Check, RefreshCw } from "lucide-react";
import Image from "next/image";

interface ImageGeneratorProps {
  onSelectImage: (mediaUrl: string, mediaType: "IMAGE" | "VIDEO") => void;
}

export default function ImageGenerator({ onSelectImage }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMedia, setGeneratedMedia] = useState<{ url: string; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setGeneratedMedia(null);

    try {
      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image.");
      }

      setGeneratedMedia({
        url: data.media.url,
        id: data.media.id,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during image generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseAsset = () => {
    if (generatedMedia) {
      onSelectImage(generatedMedia.url, "IMAGE");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-md">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">AI Vertical Image Generator</h3>
          <p className="text-xs text-slate-450 dark:text-slate-400">Powered by Gemini Imagen 3 (Perfect 9:16 aspect ratio for Reels & Stories)</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="image-prompt" className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Creative Prompt
          </label>
          <div className="relative">
            <textarea
              id="image-prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., A futuristic workspace with neon blue accents, glassmorphic UI displays, floating holograms, highly detailed 3D render..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-3 pr-10 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-455 dark:placeholder-slate-600 focus:bg-white dark:focus:bg-slate-950 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none transition-all duration-300 font-medium"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/10 dark:shadow-indigo-950/40 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-200 dark:disabled:from-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer transition-all duration-300 transform active:scale-95"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Forging AI Image (Imagen 3)...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>Generate 9:16 Masterpiece</span>
            </>
          )}
        </button>

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-600 dark:text-red-400 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Output Preview */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/80 p-4 flex flex-col items-center justify-center min-h-[320px] relative">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-4 text-slate-400 dark:text-slate-555 animate-pulse text-center">
              <RefreshCw className="h-10 w-10 animate-spin text-purple-555 dark:text-purple-400" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-350">Generating asset...</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-555">Usually takes 5-15 seconds depending on complexity</p>
              </div>
            </div>
          ) : generatedMedia ? (
            <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
              <div className="relative w-44 aspect-[9/16] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl group bg-slate-100 dark:bg-slate-950">
                <Image
                  src={generatedMedia.url}
                  alt="Generated Vertical Asset"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <button
                onClick={handleUseAsset}
                className="flex items-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-500 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Attach to Post Composer</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-655 text-center py-8">
              <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-800" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-455">No AI asset generated yet</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 max-w-[200px] leading-relaxed">Type a description above and click generate to create custom social media images.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
