"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ViewProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const sessionStr = localStorage.getItem("quizinc_session");
    if (!sessionStr) {
      router.push("/");
      return;
    }

    const session = JSON.parse(sessionStr);

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "allMembers", session.passoutYear, "members", session.docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfileData(docSnap.data());
        } else {
          setErrorMessage("Profile not found in database.");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setErrorMessage("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("quizinc_session");
      router.push("/");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">
        Loading profile...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white p-8 sm:p-10 shadow-xl rounded-2xl border border-slate-100">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 relative mb-3 overflow-hidden rounded-xl border border-slate-200 shadow-sm flex items-center justify-center bg-slate-100">
            <Image src="/logo.jpg" alt="Logo" fill className="object-cover" priority />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Review your saved QuizInc information</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
            {errorMessage}
          </div>
        )}

        {profileData && (
          <div className="space-y-6">
            {/* User Header Card */}
            <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              {profileData.profilePhoto ? (
                <img
                  src={profileData.profilePhoto}
                  alt="Profile"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-300 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                  No Photo
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-slate-900 truncate">
                  {profileData.fullName || "Name not provided"}
                </h2>
                <p className="text-sm text-slate-500 break-all">{profileData.email}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="block font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Graduation Year
                </span>
                <span className="text-slate-900 font-medium">{profileData.graduationYear || "Not set"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="block font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Position in QuizInc
                </span>
                <span className="text-slate-900 font-medium">{profileData.positionInQuizInc || "Not set"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="block font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Current Role
                </span>
                <span className="text-slate-900 font-medium">{profileData.currentRole || "Not set"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="block font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Organization
                </span>
                <span className="text-slate-900 font-medium">{profileData.organization || "Not set"}</span>
              </div>

              {/* Instagram Box */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                <span className="block font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Instagram
                </span>
                {profileData.instagram ? (
                  <a
                    href={profileData.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 font-medium hover:underline block mt-0.5 truncate"
                  >
                    {profileData.instagram} &rarr;
                  </a>
                ) : (
                  <span className="text-slate-900 font-medium block mt-0.5">Not set</span>
                )}
              </div>

              {/* LinkedIn Box */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                <span className="block font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  LinkedIn
                </span>
                {profileData.linkedin ? (
                  <a
                    href={profileData.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 font-medium hover:underline block mt-0.5 truncate"
                  >
                    {profileData.linkedin} &rarr;
                  </a>
                ) : (
                  <span className="text-slate-900 font-medium block mt-0.5">Not set</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-1/3 py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl shadow-sm transition duration-200"
              >
                Sign Out
              </button>
              <button
                type="button"
                onClick={() => router.push("/profile/edit")}
                className="w-2/3 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition duration-200"
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}