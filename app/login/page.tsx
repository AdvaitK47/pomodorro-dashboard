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
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email,

            password,

            options: { data: { username: username } },
          },
        );

        if (authError) throw authError;

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
      <Image
        src="/bg.jpg"
        alt="Background"
        fill
        className="object-cover z-[-2]"
        priority
      />

      <div className="absolute inset-0 bg-black/60 z-[-1]"></div>

      {/* Scaled down container: max-w-[320px] and slightly tighter padding */}

      <div className="bg-[#181817]/95 border border-white/5 p-4 rounded-3xl shadow-2xl w-full max-w-[320px] h-fit flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo scaled up by ~1.25x */}

        <div className="mb-5 w-full flex flex-col items-center mt-1">
          <Image
            src="/logo.png"
            alt="App Logo"
            width={150}
            height={50}
            className="object-contain"
            priority
          />

          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50 mt-2">
            Focus Time Tracker
          </p>
        </div>

        <div className="flex w-full justify-between mb-6 px-1 text-center">
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/90">
              Deep Focus
            </span>

            <span className="text-[8px] text-white/40 font-medium tracking-wide">
              Distraction-free
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/90">
              Smart Stats
            </span>

            <span className="text-[8px] text-white/40 font-medium tracking-wide">
              Track progress
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/90">
              Task Sync
            </span>

            <span className="text-[8px] text-white/40 font-medium tracking-wide">
              Stay on schedule
            </span>
          </div>
        </div>

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
              className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-white/20 transition-colors placeholder:text-white/30 text-white"
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-white/20 transition-colors placeholder:text-white/30 text-white"
          />

          {!isForgotPassword && (
            <div className="flex flex-col gap-1">
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-white/20 transition-colors placeholder:text-white/30 text-white"
              />

              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);

                    setError(null);

                    setMessage(null);
                  }}
                  className="self-end text-[8px] text-white/30 hover:text-white/70 transition-colors mt-1"
                >
                  Forgot Password?
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#ebebeb] text-black hover:bg-white rounded-xl font-extrabold text-[10px] uppercase tracking-[0.15em] transition-all active:scale-95 disabled:opacity-50"
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

        <div className="w-full flex flex-col items-center mt-5 gap-3">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);

              setIsForgotPassword(false);

              setError(null);

              setMessage(null);
            }}
            className="text-[9px] text-white/40 hover:text-white/80 transition-colors tracking-wide"
          >
            {isForgotPassword
              ? "Back to Login"
              : isSignUp
                ? "Already have an account? Log in."
                : "Don't have an account? Sign up."}
          </button>

          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem("guestMode", "true");

              router.push("/");
            }}
            className="text-[9px] font-bold text-white/30 hover:text-white/70 uppercase tracking-widest transition-colors border-b border-transparent hover:border-white/30 pb-0.5"
          >
            Skip & Continue as Guest →
          </button>
        </div>
      </div>
    </main>
  );
}
