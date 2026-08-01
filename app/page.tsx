"use client";

import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { uploadImageToCloudinary } from "@/lib/cloudinary"; 
import Image from "next/image";

export default function MemberRegistrationPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    graduationYear: "",
    positionInQuizInc: "",
    currentRole: "",
    organization: "",
    instagram: "",
    linkedin: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("Image size must be less than 10MB.");
        e.target.value = ""; 
        setImageFile(null);
        setImagePreview(null);
        return;
      }

      setErrorMessage(""); 
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setErrorMessage("Please select a profile photo.");
      return;
    }

    setLoading(true);
    setSuccess(false);
    setErrorMessage("");

    try {
     
      const imageUrl = await uploadImageToCloudinary(imageFile);

      
      const passoutYearDoc = formData.graduationYear.trim();
      const membersSubcollectionRef = collection(
        db,
        "allMembers",
        passoutYearDoc,
        "members"
      );

      
      await addDoc(membersSubcollectionRef, {
        fullName: formData.fullName,
        email: formData.email,
        graduationYear: passoutYearDoc,
        positionInQuizInc: formData.positionInQuizInc,
        currentRole: formData.currentRole,
        organization: formData.organization,
        instagram: formData.instagram || "",
        linkedin: formData.linkedin || "",
        profilePhoto: imageUrl,
        createdAt: new Date(),
      });

      setSuccess(true);
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        graduationYear: "",
        positionInQuizInc: "",
        currentRole: "",
        organization: "",
        instagram: "",
        linkedin: "",
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error registering member: ", error);
      setErrorMessage("Failed to register member. Please check your network or configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white p-8 sm:p-10 shadow-xl rounded-2xl border border-slate-100">
        
        {/* Header with Square Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 relative mb-3 overflow-hidden rounded-xl border border-slate-200 shadow-sm flex items-center justify-center bg-slate-100">
            {/* Make sure you place logo.png inside your project's /public folder */}
            <Image 
              src="/logo.jpg" 
              alt="Logo" 
              fill 
              className="object-cover"
              priority 
            />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            QuizInc Member Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Submit your details to register or update your profile in the directory.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Full Name & Email */}
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
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. john@example.com"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
              />
            </div>
          </div>

          {/* Graduation Year & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Graduation Year</label>
              <input
                type="text"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                placeholder="e.g. 2026"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Position in QuizInc</label>
              <input
                type="text"
                name="positionInQuizInc"
                value={formData.positionInQuizInc}
                onChange={handleChange}
                placeholder="e.g. Core Coordinator"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
              />
            </div>
          </div>

          {/* Current Role & Organization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Current Role / Job Title</label>
              <input
                type="text"
                name="currentRole"
                value={formData.currentRole}
                onChange={handleChange}
                placeholder="e.g. SDE / Student"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Organization / University</label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="e.g. NIT Durgapur / Google"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
              />
            </div>
          </div>

          {/* Social Profiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Instagram Profile URL</label>
              <input
                type="url"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="https://instagram.com/username"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">LinkedIn Profile URL</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
              />
            </div>
          </div>

          {/* Profile Photo Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Profile Photo (Max 10MB)</label>
            <div className="flex items-center gap-4 mt-1">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
              />
            </div>
          </div>

          {/* Error / Success Messages */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
              {errorMessage}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium text-center">
              🎉 Member successfully registered!
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Uploading Photo & Submitting..." : "Submit Registration"}
          </button>
        </form>

      </div>
    </main>
  );
}