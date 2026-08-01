"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionPath, setSessionPath] = useState<{ passoutYear: string; docId: string } | null>(null);

  const [formData, setFormData] = useState({
    graduationYear: "",
    fullName: "",
    email: "",
    positionInQuizInc: "",
    currentRole: "",
    organization: "",
    instagram: "",
    linkedin: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const sessionStr = localStorage.getItem("quizinc_session");
    if (!sessionStr) {
      router.push("/");
      return;
    }

    const session = JSON.parse(sessionStr);
    setSessionPath(session);

    const fetchUserData = async () => {
      try {
        const docRef = doc(db, "allMembers", session.passoutYear, "members", session.docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            graduationYear: data.graduationYear || session.passoutYear,
            fullName: data.fullName || "",
            email: data.email || "",
            positionInQuizInc: data.positionInQuizInc || "",
            currentRole: data.currentRole || "",
            organization: data.organization || "",
            instagram: data.instagram || "",
            linkedin: data.linkedin || "",
          });
          setExistingPhoto(data.profilePhoto || "");
          setImagePreview(data.profilePhoto || null);
        }
      } catch (err) {
        console.error("Error fetching data for editing:", err);
        setErrorMessage("Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("Image size must be less than 10MB.");
        return;
      }
      setErrorMessage("");
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionPath) return;

    const newYear = formData.graduationYear.trim();
    if (!newYear) {
      setErrorMessage("Graduation year cannot be empty.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      let imageUrl = existingPhoto;
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      const updatedData = {
        graduationYear: newYear,
        fullName: formData.fullName,
        email: formData.email,
        positionInQuizInc: formData.positionInQuizInc,
        currentRole: formData.currentRole,
        organization: formData.organization,
        instagram: formData.instagram || "",
        linkedin: formData.linkedin || "",
        profilePhoto: imageUrl,
        updatedAt: new Date(),
      };

      // Check if the graduation year changed
      if (newYear !== sessionPath.passoutYear) {
        // 1. Create a reference in the NEW passout year subcollection (using the same docId or auto-id)
        const newDocRef = doc(db, "allMembers", newYear, "members", sessionPath.docId);
        await setDoc(newDocRef, updatedData);

        // 2. Delete the document from the OLD passout year subcollection
        const oldDocRef = doc(db, "allMembers", sessionPath.passoutYear, "members", sessionPath.docId);
        await deleteDoc(oldDocRef);

        // 3. Update localStorage session with the new passout year
        localStorage.setItem(
          "quizinc_session",
          JSON.stringify({ passoutYear: newYear, docId: sessionPath.docId })
        );
      } else {
        // Year didn't change, just update the existing document normally
        const targetDocRef = doc(db, "allMembers", sessionPath.passoutYear, "members", sessionPath.docId);
        await setDoc(targetDocRef, updatedData, { merge: true });
      }

      // Redirect back to profile view
      router.push("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to save changes. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">
        Loading editor...
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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Update your information and details</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Graduation Year</label>
              <input
                type="text"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                placeholder="e.g. 2026"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Position in QuizInc</label>
              <input
                type="text"
                name="positionInQuizInc"
                value={formData.positionInQuizInc}
                onChange={handleChange}
                placeholder="e.g. Core Coordinator"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Current Role / Job Title</label>
              <input
                type="text"
                name="currentRole"
                value={formData.currentRole}
                onChange={handleChange}
                placeholder="e.g. SDE / Student"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Organization / University</label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              placeholder="e.g. NIT Durgapur"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Instagram URL <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="url"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="https://instagram.com/username"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                LinkedIn URL <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Profile Photo (Max 10MB)</label>
            <div className="flex items-center gap-4 mt-1">
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="w-1/3 py-3.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl shadow-sm transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-2/3 py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}