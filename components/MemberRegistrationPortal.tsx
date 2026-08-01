"use client";

import React, { useState } from "react";
import { collection, addDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export function MemberRegistrationPortal() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    graduationYear: "", // e.g., 2026, 2018
    positionInQuizInc: "",
    currentRole: "",
    organization: "",
    instagram: "",
    linkedin: "",
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      alert("Please select a profile photo.");
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      // 1. Upload photo to Cloudinary
      const imageUrl = await uploadImageToCloudinary(imageFile);

      // 2. Define Firestore Path: allMembers -> [Graduation Year Doc ID] -> members -> [Auto ID]
      const passoutYearDoc = formData.graduationYear.trim();
      const membersSubcollectionRef = collection(
        db,
        "allMembers",
        passoutYearDoc,
        "members"
      );

      // 3. Save document with all exact fields
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
    } catch (error) {
      console.error("Error registering member: ", error);
      alert("Failed to register member. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit} className="max-w-xl w-full bg-white p-8 shadow-lg rounded-xl space-y-5">
        <h2 className="text-2xl font-bold text-center text-gray-900">QuizInc Member Portal</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email Address</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Graduation Year</label>
            <input type="text" name="graduationYear" value={formData.graduationYear} onChange={handleChange} placeholder="e.g. 2026" required className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Position in QuizInc</label>
            <input type="text" name="positionInQuizInc" value={formData.positionInQuizInc} onChange={handleChange} placeholder="e.g. Core Member" required className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Role / Job Title</label>
            <input type="text" name="currentRole" value={formData.currentRole} onChange={handleChange} placeholder="e.g. Software Engineer" required className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization / University / Institute</label>
            <input type="text" name="organization" value={formData.organization} onChange={handleChange} placeholder="e.g. NIT Durgapur / Google" required className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Instagram Profile</label>
            <input type="url" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="https://instagram.com/..." className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">LinkedIn Profile</label>
            <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
          <input type="file" accept="image/*" onChange={handleFileChange} required className="w-full mt-1 p-2 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50">
          {loading ? "Uploading & Submitting..." : "Submit Details"}
        </button>

        {success && <p className="text-green-600 font-medium text-sm text-center">Successfully registered!</p>}
      </form>
    </div>
  );
}