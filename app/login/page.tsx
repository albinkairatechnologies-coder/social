"use client";

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Eye, EyeOff, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      if (mode === "signup") {
        setIsLogin(false);
      } else if (mode === "login") {
        setIsLogin(true);
      }
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (session) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!isLogin) {
        // Register user
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Registration failed");
        }
      }

      // Sign in
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) throw new Error(result.error);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError("");
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
    } catch (err: any) {
      setError(err.message || "Failed to log in with Demo account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/65 dark:bg-background text-foreground flex flex-col items-center justify-center p-4 relative transition-colors duration-300">
      
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-100 dark:to-indigo-400 bg-clip-text text-transparent">
            SocialForge
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {isLogin ? "Welcome back! Sign in to continue" : "Create your account and start automating"}
          </p>
        </div>

        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-8 shadow-xl shadow-slate-150/10 dark:shadow-none transition-all">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground/60 focus:bg-white dark:focus:bg-background focus:border-indigo-500 focus:outline-none transition-all font-medium"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground/60 focus:bg-white dark:focus:bg-background focus:border-indigo-500 focus:outline-none transition-all font-medium"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-background px-4 py-3 pr-12 text-sm text-foreground placeholder-muted-foreground/60 focus:bg-white dark:focus:bg-background focus:border-indigo-500 focus:outline-none transition-all font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-900/40 rounded-lg p-3.5 text-xs text-rose-600 dark:text-rose-455 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-205 text-white dark:text-slate-950 font-extrabold py-3 rounded-lg transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer mb-2"
            >
              {isLoading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-teal-500 to-indigo-650 hover:from-teal-400 hover:to-indigo-550 text-white font-extrabold py-3 rounded-lg transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-teal-200" />
              <span>⚡ Try Demo Account</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-450 font-medium">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-indigo-600 dark:text-teal-400 font-extrabold hover:underline transition-colors cursor-pointer"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
