"use client";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";

export default function JournalRegistration() {
  const navigate = useNavigate();
  
  const { user, setUser, setloginStatus } = useUserData();

  const [formData, setFormData] = useState({
    name: "",
    Publication: "", 
    link: "",
    status: "Pending Approval", 
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.name.trim()) newErrors.name = "Journal name is required";
    if (!formData.Publication.trim()) newErrors.Publication = "Publisher name is required";
    if (!formData.link.trim()) newErrors.link = "Journal website link is required";

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

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (validateForm()) {
      // Construct payload according to Journal Schema
      const journalData = {
        name: formData.name,
        Publication: formData.Publication,
        link: formData.link,
        hostID: user.id,
      };

      try {
        // Assuming the endpoint follows your convention
        const response = await fetch("http://localhost:3001/journal/registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(journalData),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to Register Journal.');
        }
        
        alert('Journal Registered Successfully!');
        // navigate('/journal/manage'); // Optional redirect
      } 
      catch (error) {
        console.error("Registration failed:", error);
        alert(`Error: ${error.message}`);
      }
    }
  };

  const Header = ({ user }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
  
    // 1. Configuration: Maps DB Role Strings -> Frontend Routes
    const ROLE_CONFIG = {
      "Author": { label: "Author", path: "/journal" },
    };
  
    // 2. Filter options based on the current user's roles
    const availablePortals = useMemo(() => {
      if (!user || !user.role || !Array.isArray(user.role)) return [];
      return user.role
        .map(roleString => ROLE_CONFIG[roleString])
        .filter(Boolean);
    }, [user]);
  
    const handleLogout = () => {
      setUser(null);
      setloginStatus(false);
      navigate("/home");
    };
  
    return (
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left Side: Logo & Register Tab */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
            </div>
  
            {/* Clean Navbar - Only Register remains */}
            <nav className="hidden items-center md:flex">
              <button 
                onClick={() => navigate('/journal/registration')}
                className="text-sm font-medium text-[#6b7280] transition-colors hover:text-[#059669] hover:bg-green-50 px-3 py-2 rounded-md"
              >
                Register a Journal
              </button>
            </nav>
          </div>
  
          {/* Right Side: Actions */}
          <div className="flex items-center gap-3">
            
            {/* 1. Dynamic "Switch Portal" Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                className="group flex items-center gap-2 rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f3f4f6] transition-colors bg-white"
              >
                Switch Portal
                <svg 
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
  
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-[#e5e7eb] py-2 z-50">
  
                  {/* Divider if we have dynamic roles */}
                  {availablePortals.length > 0 && (
                    <div className="border-gray-100 my-1"></div>
                  )}
  
                  {/* Dynamic Links based on User Roles */}
                  {availablePortals.length > 0 && (
                    <>
                      <h6 className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Your Roles
                      </h6>
                      {availablePortals.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            navigate(option.path);
                            setIsDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-[#1f2937] hover:bg-[#f3f4f6] hover:text-[#059669]"
                        >
                          {option.label}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
  
            {/* 2. Return to Dashboard */}
            <button 
              onClick={() => navigate('/dashboard')}
              className="hidden sm:block rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90"
            >
              Return To Dashboard
            </button>
  
            {/* 3. Logout */}
            <button 
              onClick={handleLogout} 
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
    );
  };

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Header */}
      <Header user={user} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl shadow-lg overflow-hidden">
            <div className="bg-[#059669] p-8 border-b border-[#e5e7eb]">
              <h2 className="text-3xl font-bold text-white mb-2">Register Your Journal</h2>
              <p className="text-white">
                Create a new journal to manage continuous manuscript submissions and peer reviews.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 gap-8">
                
                {/* Journal Name */}
                <div className="group">
                  <label className="block text-sm font-medium text-[#1f2937] mb-2">Journal Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Journal of Advanced Computing"
                    className={`w-full px-4 py-3 bg-[#f9fafb] border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] ${
                      errors.name ? "border-red-500" : "border-[#e5e7eb] hover:border-[#059669]/50"
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Publisher */}
                <div className="group">
                  <label className="block text-sm font-medium text-[#1f2937] mb-2">Publisher / Organization *</label>
                  <input
                    type="text"
                    value={formData.Publication}
                    onChange={(e) => handleInputChange("Publication", e.target.value)}
                    placeholder="e.g., IEEE, Springer, or University Name"
                    className={`w-full px-4 py-3 bg-[#f9fafb] border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] ${
                      errors.Publication ? "border-red-500" : "border-[#e5e7eb] hover:border-[#059669]/50"
                    }`}
                  />
                  {errors.Publication && <p className="text-red-500 text-sm mt-1">{errors.Publication}</p>}
                </div>

                {/* Journal Link */}
                <div className="group">
                  <label className="block text-sm font-medium text-[#1f2937] mb-2">Journal Website *</label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => handleInputChange("link", e.target.value)}
                    placeholder="https://journal.example.com"
                    className={`w-full px-4 py-3 bg-[#f9fafb] border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] ${
                      errors.link ? "border-red-500" : "border-[#e5e7eb] hover:border-[#059669]/50"
                    }`}
                  />
                  {errors.link && <p className="text-red-500 text-sm mt-1">{errors.link}</p>}
                </div>

              </div>

              {/* Submit Button */}
              <div className="mt-10 pt-6 border-t border-[#e5e7eb]">
                <button
                  type="submit"
                  className="w-full bg-[#059669] text-white py-4 px-8 rounded-lg hover:bg-[#059669]/90 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Register Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}