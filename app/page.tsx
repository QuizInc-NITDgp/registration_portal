"use client";

import React, { useState, useEffect } from "react";
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);

  // 1. Check local session storage on mount
  useEffect(() => {
    const sessionStr = localStorage.getItem("quizinc_session");
    if (sessionStr) {
      router.push("/profile");
    }
  }, [router]);

  const processUserSession = async (user: any) => {
    const userEmail = user.email;
    if (!userEmail) {
      toast.error("Could not retrieve email from Google account.");
      setLoading(false);
      return;
    }

    const passoutYearsGroup = ["2024", "2025", "2026", "2027", "2028", "2029", "2030"];
    let foundPath: { passoutYear: string; docId: string } | null = null;

    for (const year of passoutYearsGroup) {
      const membersRef = collection(db, "allMembers", year, "members");
      const q = query(membersRef, where("email", "==", userEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        foundPath = { passoutYear: year, docId: docSnap.id };
        break;
      }
    }

    if (foundPath) {
      localStorage.setItem("quizinc_session", JSON.stringify(foundPath));
      toast.success("Welcome back! Redirecting...");
      setTimeout(() => router.push("/profile"), 1000);
    } else {
      const tempSession = {
        email: userEmail,
        fullName: user.displayName || "",
        profilePhoto: user.photoURL || "",
      };
      localStorage.setItem("quizinc_temp_session", JSON.stringify(tempSession));
      toast("Complete your profile first!");
      setTimeout(() => router.push("/profile/edit"), 1000);
    }
  };

  // 2. Use onAuthStateChanged to reliably catch redirect / login completions
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true);
        await processUserSession(user);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setPopupBlocked(false);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        await processUserSession(result.user);
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      setLoading(false);
      
      if (error.code === "auth/cancelled-popup-request") return;
      if (error.code === "auth/popup-closed-by-user") {
        toast.error("Sign-in popup was closed before completion.");
        return;
      }
      if (error.code === "auth/popup-blocked") {
        setPopupBlocked(true);
        toast.error("Popup was blocked by your browser.");
        return;
      }
      toast.error("Failed to sign in with Google. Please try again.");
    }
  };

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "rgba(6,9,26,0.95)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(12px)",
            fontSize: "13px",
            fontWeight: "600",
          },
          duration: 3000,
        }}
      />
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes itemIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .panel-in   { animation: panelIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .login-item { animation: itemIn 0.4s ease-out both; }
        .login-item:nth-child(1) { animation-delay: 0.1s; }
        .login-item:nth-child(2) { animation-delay: 0.17s; }
        .login-item:nth-child(3) { animation-delay: 0.24s; }
      `}</style>

      <main className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
        <Image src="/bg.jpg" alt="background" fill className="object-cover brightness-[0.22] -z-10" priority />
        <div className="absolute inset-0 -z-10 opacity-[0.035]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 60px,rgba(255,255,255,0.8) 60px,rgba(255,255,255,0.8) 61px)" }} />

        <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-red-700/15 blur-[100px] -z-10" />
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-blue-700/15 blur-[100px] -z-10" />

        <div className="panel-in relative flex flex-col md:flex-row max-w-3xl w-full rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl"
          style={{ background: "rgba(6, 9, 26, 0.88)", backdropFilter: "blur(24px)", boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.8)" }}>

          <div className="absolute top-0 left-0 right-0 h-[2px] z-10"
            style={{ background: "linear-gradient(90deg,#3b82f6,#ef4444,#3b82f6)", backgroundSize: "200% 100%", animation: "shimmer 4s linear infinite" }} />

          <div className="relative w-full md:flex-1 md:min-h-[460px]">
            <Image
              src="/finalposter.jpeg"
              alt="football legends"
              width={800}
              height={1200}
              className="w-full h-auto md:absolute md:inset-0 md:h-full md:object-cover opacity-90"
              priority
            />
            <div className="absolute inset-0 border-r border-white/[0.05]" />
          </div>

          <div className="flex-1 flex flex-col justify-center gap-6 p-7 md:p-9">
            <div className="flex items-center justify-between">
              <Image src="/quizinc.jpg" alt="QuizInc logo" width={85} height={32} className="object-contain opacity-85 bg-transparent" />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-none">
                WELCOME
                <span className="ml-2" style={{
                  background: "linear-gradient(135deg, #3b82f6, #ef4444)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>BACK</span>
              </h1>
              <p className="text-gray-400 text-[14px] mt-2 font-medium tracking-wide">
                Register your profile to be displayed in the club website.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {[
                "Compete with fans worldwide",
                "Answer rapid-fire quizzes",
                "Climb the global leaderboard",
              ].map((text, i) => (
                <div key={i} className="login-item flex items-center gap-3 rounded-xl px-3.5 py-2.5 border border-white/[0.04] group hover:border-blue-500/15 hover:bg-blue-500/[0.02] transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.01)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  <p className="text-white/60 text-xs font-medium tracking-wide group-hover:text-white/80 transition-colors">{text}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3.5 mt-1">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 text-white font-black text-xs tracking-widest uppercase rounded-xl py-3.5 transition-all duration-200 active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #dc2626 100%)",
                  border: "1px solid rgba(59,130,246,0.35)",
                  boxShadow: "0 4px 20px rgba(37,99,235,0.25), inset 1px 0 rgba(255,255,255,0.12)"
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Signing in...
                  </>
                ) : (
                  "Sign in with Google"
                )}
              </button>

              {popupBlocked && (
                <p className="text-red-400 text-[11px] text-center leading-relaxed">
                  Popup was blocked. Please allow popups for this site, then try again.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}