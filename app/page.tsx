"use client";

import React, { useState, useEffect } from "react";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    // 1. Immediate local session check
    const sessionStr = localStorage.getItem("quizinc_session");
    if (sessionStr) {
      router.push("/profile");
      return;
    }

    // 2. Global Auth Listener (handles sign-in updates automatically)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const userEmail = user.email;
      if (!userEmail) {
        setErrorMessage("Could not retrieve email from Google account.");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const passoutYearsGroup = ["2024", "2025", "2026", "2027", "2028", "2029", "2030"];
        
        // Execute queries concurrently with Promise.all for faster response times
        const queryPromises = passoutYearsGroup.map(async (year) => {
          const membersRef = collection(db, "allMembers", year, "members");
          const q = query(membersRef, where("email", "==", userEmail));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            return { passoutYear: year, docId: querySnapshot.docs[0].id };
          }
          return null;
        });

        const results = await Promise.all(queryPromises);
        const foundPath = results.find((res) => res !== null);

        if (foundPath) {
          localStorage.setItem("quizinc_session", JSON.stringify(foundPath));
          router.push("/profile");
        } else {
          const tempSession = {
            email: userEmail,
            fullName: user.displayName || "",
            profilePhoto: user.photoURL || "",
          };
          localStorage.setItem("quizinc_temp_session", JSON.stringify(tempSession));
          router.push("/profile/edit");
        }
      } catch (error) {
        console.error("Error verifying user session:", error);
        setErrorMessage("Failed to load user profile. Please try again.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      // Initiates auth; onAuthStateChanged will handle the user session processing
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === "auth/cancelled-popup-request") return;
      if (error.code === "auth/popup-closed-by-user") {
        setLoading(false);
        return;
      }
      console.error("Google login error:", error);
      setErrorMessage("Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 shadow-xl rounded-2xl border-2 border-blue-200">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 relative mb-3 overflow-hidden rounded-xl border border-slate-200 shadow-sm flex items-center justify-center bg-slate-100">
            <Image src="/logo.jpg" alt="Logo" fill className="object-cover" priority />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">QuizInc Member Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Register your profile to be displayed in the club website</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 shadow-sm hover:shadow transition duration-200 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
      </div>
    </main>
  );
}