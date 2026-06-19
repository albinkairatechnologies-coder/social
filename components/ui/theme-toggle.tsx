"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Initial theme check
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    
    // Default to light theme as requested, or load saved preference
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Sun className="h-4.5 w-4.5 text-amber-500" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-indigo-400" />
      )}
    </button>
  );
}
