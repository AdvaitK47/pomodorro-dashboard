"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isForgotPassword) {
        // Handle Password Reset
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/`,
          },
        );
        if (resetError) throw resetError;
        setMessage("Check your email for the password reset link.");
        setIsForgotPassword(false);
      } else if (isSignUp) {
        // Handle Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email,
            password,
            options: {
              data: {
                username: username,
              },
            },
          },
        );

        if (authError) throw authError;

        // If Confirm Email is ON, session is null. If OFF, it auto-logs in.
        if (authData.session) {
          router.push("/");
        } else {
          setMessage(
            "Account created! Please verify your email before logging in.",
          );
          setIsSignUp(false);
          setPassword("");
        }
      } else {
        // Handle Login
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans text-white p-4">
      {/* Background */}
      <Image
        src="/bg.jpg"
        alt="Background"
        fill
        className="object-cover z-[-2]"
        priority
      />
      <div className="absolute inset-0 bg-black/60 z-[-1]"></div>

      {/* ULTRA-COMPACT UI */}
      <div className="bg-[#181817]/95 border border-white/5 p-4 rounded-3xl shadow-2xl w-full max-w-[400px] h-fit flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo */}
        <div className="mb-6 w-full flex justify-center mt-2">
          <Image
            src="/logo.png"
            alt="App Logo"
            width={200}
            height={80}
            className="object-contain"
            priority
          />
        </div>

        {/* 3 Main Features */}
        <div className="flex w-full justify-between mb-6 px-1 text-center">
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
              Deep Focus
            </span>
            <span className="text-[9px] text-white/40 font-medium tracking-wide">
              Distraction-free
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
              Smart Stats
            </span>
            <span className="text-[9px] text-white/40 font-medium tracking-wide">
              Track progress
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
              Task Sync
            </span>
            <span className="text-[9px] text-white/40 font-medium tracking-wide">
              Stay on schedule
            </span>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="w-full flex flex-col gap-3">
          {error && (
            <div className="w-full p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium">
              {error}
            </div>
          )}
          {message && (
            <div className="w-full p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs text-center font-medium">
              {message}
            </div>
          )}

          {!isForgotPassword && isSignUp && (
            <input
              type="text"
              placeholder="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/20 transition-colors placeholder:text-white/30 text-white"
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/20 transition-colors placeholder:text-white/30 text-white"
          />

          {!isForgotPassword && (
            <div className="flex flex-col gap-1.5">
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/20 transition-colors placeholder:text-white/30 text-white"
              />
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError(null);
                    setMessage(null);
                  }}
                  className="self-end text-[9px] text-white/30 hover:text-white/70 transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-[#ebebeb] text-black hover:bg-white rounded-xl font-extrabold text-[11px] uppercase tracking-[0.15em] transition-all active:scale-95 disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : isForgotPassword
                ? "Send Reset Link"
                : isSignUp
                  ? "Create Account"
                  : "Enter Dashboard"}
          </button>
        </form>

        {/* Toggle Mode */}
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setIsForgotPassword(false);
            setError(null);
            setMessage(null);
          }}
          className="mt-5 text-[10px] text-white/40 hover:text-white/80 transition-colors tracking-wide"
        >
          {isForgotPassword
            ? "Back to Login"
            : isSignUp
              ? "Already have an account? Log in."
              : "Don't have an account? Sign up."}
        </button>
      </div>
    </main>
  );
}
