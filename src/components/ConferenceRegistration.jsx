"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";


export default function ConferenceRegistration({ onBack }) {
  const navigate = useNavigate();
  
  const { user } = useUserData();

  const [formData, setFormData] = useState({
    name: "",
    city: "", 
    country: "", 
    startsAtDate: "", 
    startsAtTime: "", 
    endAtDate: "",
    endAtTime: "",
    deadlineDate: "",
    deadlineTime: "",
    link: "",
    Partners: [],
    status: "Pending Approval", 
  });

  const [errors, setErrors] = useState({});
  const [partnerInput, setPartnerInput] = useState("");

  const countries = [
    "United States", "United Kingdom", "Canada", "Germany", "France", "Japan",
    "Australia", "Netherlands", "Sweden", "Switzerland", "Singapore", "South Korea",
    "China", "India", "Brazil", "Italy", "Spain", "Norway", "Denmark", "Finland",
  ];

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.name.trim()) newErrors.name = "Conference name is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.country) newErrors.country = "Country is required";
    if (!formData.startsAtDate) newErrors.startsAtDate = "Start date is required";
    if (!formData.startsAtTime) newErrors.startsAtTime = "Start time is required";
    if (!formData.endAtDate) newErrors.endAtDate = "End date is required";
    if (!formData.endAtTime) newErrors.endAtTime = "End time is required";
    if (!formData.deadlineDate) newErrors.deadlineDate = "Submission Deadline Date Is Required";
    if (!formData.deadlineTime) newErrors.deadlineTime = "Submission Deadline Time Is Required";
    if (!formData.link.trim()) newErrors.link = "Conference link is required";

    // CORRECTED: Date validation logic now uses the correct state variables.
    if (formData.startsAtDate && formData.startsAtTime && formData.endAtDate && formData.endAtTime) {
      const startsAt = new Date(`${formData.startsAtDate}T${formData.startsAtTime}`);
      const endAt = new Date(`${formData.endAtDate}T${formData.endAtTime}`);
      if (endAt <= startsAt) {
        newErrors.endAtDate = "End date and time must be after the start date and time";
      }
    }

    if (formData.deadlineDate && formData.deadlineTime && formData.startsAtDate && formData.startsAtTime) {
      const deadline = new Date(`${formData.deadlineDate}T${formData.deadlineTime}`);
      const startsAt = new Date(`${formData.startsAtDate}T${formData.startsAtTime}`);
      if (deadline >= startsAt) {
        newErrors.deadlineDate = "Submission deadline must be before the conference start date";
      }
    }

    // URL validation
    if (formData.link && !isValidUrl(formData.link)) {
      newErrors.link = "Please enter a valid URL (e.g., https://example.com)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const addPartner = () => {
    if (partnerInput.trim() && !formData.Partners.includes(partnerInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        Partners: [...prev.Partners, partnerInput.trim()],
      }));
      setPartnerInput("");
    }
  };

  const removePartner = (partner) => {
    setFormData((prev) => ({
      ...prev,
      Partners: prev.Partners.filter((p) => p !== partner),
    }));
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (validateForm()) {
      const conferenceData = {
        name: formData.name,
        location: `${formData.city}, ${formData.country}`,
        startsAt: new Date(`${formData.startsAtDate}T${formData.startsAtTime}`).toISOString(),
        endAt: new Date(`${formData.endAtDate}T${formData.endAtTime}`).toISOString(),
        // CORRECTED: The deadline was being created from a non-existent state variable.
        // It now correctly uses deadlineDate and deadlineTime.
        deadline: new Date(`${formData.deadlineDate}T${formData.deadlineTime}`).toISOString(),
        link: formData.link,
        status: formData.status,
        Partners: formData.Partners,
        hostID: user.id,
      };

      try {
        const response = await fetch("http://localhost:3001/conference/registeration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // CORRECTED: The body was trying to stringify an undefined 'payload' variable.
          // It now correctly uses the 'conferenceData' object.
          body: JSON.stringify(conferenceData),
        });
        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to Register Conference.');
      }
      alert('Conference Registered Successfully!');
      // Optionally, navigate away on success
      // navigate('/conference/manage'); 
    } 
    catch (error) {
      console.error("Registration failed:", error);
      alert(`Error: ${error.message}`);
    }
  };
}

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPartner();
    }
  };

  const handlePortalClick = (portal) => navigate(`/${portal}`);
  const handleLogout = () => {
    navigate("/home");
  };


  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
            </div>
            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              <a href="/conference/registration" className="text-[#6b7280] transition-colors hover:text-[#1f2937]">Create a Conference</a>
              <a href="/conference/manage" className="text-[#6b7280] transition-colors hover:text-[#1f2937]">Manage Conferences</a>
              <a href="/ManageReviews" className="text-[#6b7280] transition-colors hover:text-[#1f2937]">Manage Reviews</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => handlePortalClick("conference")} className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">Return To Conference Portal</button>
            <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#f3f4f6]">Logout</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl shadow-lg overflow-hidden">
            <div className="bg-[#059669] p-8 border-b border-[#e5e7eb]">
              <h2 className="text-3xl font-bold text-white mb-2">Register Your Conference</h2>
              <p className="text-white">
                Create a new conference registration and start accepting paper submissions from researchers worldwide.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Conference Name */}
                  <div className="group">
                    <label className="block text-sm font-medium text-[#1f2937] mb-2">Conference Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="e.g., International Conference on Machine Learning 2024"
                      className={`w-full px-4 py-3 bg-[#f9fafb] border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] ${
                        errors.name ? "border-red-500" : "border-[#e5e7eb] hover:border-[#059669]/50"
                      }`}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  {/* City */}
                  <div className="group">
                    <label className="block text-sm font-medium text-[#1f2937] mb-2">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="e.g., Delhi"
                      className={`w-full px-4 py-3 bg-[#f9fafb] border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] ${
                        errors.city ? "border-red-500" : "border-[#e5e7eb] hover:border-[#059669]/50"
                      }`}
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>

                  {/* Country */}
                  <div className="group">
                    <label className="block text-sm font-medium text-[#1f2937] mb-2">Country *</label>
                    <select
                      value={formData.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      className={`w-full px-4 py-3 bg-[#f9fafb] border rounded-lg transition-all duration-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] ${
                        errors.country ? "border-red-500" : "border-[#e5e7eb] hover:border-[#059669]/50"
                      }`}
                    >
                      <option value="">Select a country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                  </div>

                  {/* Conference Link */}
                  <div className="group">
                    <label className="block text-sm font-medium text-[#1f2937] mb-2">Conference Website *</label>
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => handleInputChange("link", e.target.value)}
                      placeholder="https://conference2024.example.com"
                      className={`w-full px-4 py-3 bg-[#f9fafb] border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] ${
                        errors.link ? "border-red-500" : "border-[#e5e7eb] hover:border-[#059669]/50"
                      }`}
                    />
                    {errors.link && <p className="text-red-500 text-sm mt-1">{errors.link}</p>}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  
                  {/* Start DateTime */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">Conference Start Date *</label>
                      <input
                        type="date"
                        value={formData.startsAtDate}
                        onChange={(e) => handleInputChange("startsAtDate", e.target.value)}
                        className={`w-full px-4 py-3 bg-[#f9fafb] border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] ${
                          errors.startsAtDate ? "border-red-500" : "border-[#e5e7eb] hover:border-[#059669]/50"
                        }`}
                      />
                      {errors.startsAtDate && <p className="text-red-500 text-sm mt-1">{errors.startsAtDate}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">Conference Start Time *</label>
                      <input
                        type="time"
                        value={formData.startsAtTime}
                        onChange={(e) => handleInputChange("startsAtTime", e.target.value)}
                        className={`w-full px-4 py-3 bg-[#f9fafb] border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] ${
                          errors.startsAtTime ? "border-red-500" : "border-[#e5e7eb] hover:border-[#059669]/50"
                        }`}
                      />
                      {errors.startsAtTime && <p className="text-red-500 text-sm mt-1">{errors.startsAtTime}</p>}
                    </div>
                  </div>

                  {/* End DateTime */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">Conference End Date *</label>
                      <input
                        type="date"
                        value={formData.endAtDate}
                        onChange={(e) => handleInputChange("endAtDate", e.target.value)}
                        className={`w-full px-4 py-3 bg-[#f9fafb] border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] ${
                          errors.endAtDate ? "border-red-500" : "border-[#e5e7eb] hover:border-[#059669]/50"
                        }`}
                      />
                      {errors.endAtDate && <p className="text-red-500 text-sm mt-1">{errors.endAtDate}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">Conference End Time *</label>
                      <input
                        type="time"
                        value={formData.endAtTime}
                        onChange={(e) => handleInputChange("endAtTime", e.target.value)}
                        className={`w-full px-4 py-3 bg-[#f9fafb] border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] ${
                          errors.endAtTime ? "border-red-500" : "border-[#e5e7eb] hover:border-[#059669]/50"
                        }`}
                      />
                      {errors.endAtTime && <p className="text-red-500 text-sm mt-1">{errors.endAtTime}</p>}
                    </div>
                  </div>

                  {/* Submission Deadline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">Submission Deadline Date *</label>
                      <input
                        type="date"
                        // CORRECTED: The value was pointing to formData.deadline, which does not exist.
                        // It now correctly points to formData.deadlineDate.
                        value={formData.deadlineDate}
                        onChange={(e) => handleInputChange("deadlineDate", e.target.value)}
                        className={`w-full px-4 py-3 bg-[#f9fafb] border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] ${
                          errors.deadlineDate ? "border-red-500" : "border-[#e5e7eb] hover:border-[#059669]/50"
                        }`}
                      />
                      {errors.deadlineDate && <p className="text-red-500 text-sm mt-1">{errors.deadlineDate}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">Submission Deadline Time *</label>
                      <input
                        type="time"
                        value={formData.deadlineTime}
                        onChange={(e) => handleInputChange("deadlineTime", e.target.value)}
                        className={`w-full px-4 py-3 bg-[#f9fafb] border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] ${
                          errors.deadlineTime ? "border-red-500" : "border-[#e5e7eb] hover:border-[#059669]/50"
                        }`}
                      />
                      {errors.deadlineTime && <p className="text-red-500 text-sm mt-1">{errors.deadlineTime}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Partners Section */}
              <div className="mt-8">
                <label className="block text-sm font-medium text-[#1f2937] mb-2">
                  Conference Partners (Optional)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={partnerInput}
                    onChange={(e) => setPartnerInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter partner organization name"
                    className="flex-1 px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] hover:border-[#059669]/50"
                  />
                  <button
                    type="button"
                    onClick={addPartner}
                    className="px-6 py-3 bg-[#059669] text-white rounded-lg hover:bg-[#059669]/90 transition-all duration-200 font-medium"
                  >
                    Add
                  </button>
                </div>
                {formData.Partners.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.Partners.map((partner, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-[#059669]/10 text-[#059669] rounded-full text-sm border border-[#059669]/20"
                      >
                        {partner}
                        <button
                          type="button"
                          onClick={() => removePartner(partner)}
                          className="hover:bg-[#059669]/20 rounded-full p-1 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="mt-10 pt-6 border-t border-[#e5e7eb]">
                <button
                  type="submit"
                  className="w-full bg-[#059669] text-white py-4 px-8 rounded-lg hover:bg-[#059669]/90 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Register Conference
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

