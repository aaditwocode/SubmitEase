"use client"

import { useState } from "react"

export default function ConferenceHostRegistration({ onBack }) {
  const [formData, setFormData] = useState({
    title: "",
    city: "",
    country: "",
    startDate: "",
    endDate: "",
    submissionDueDate: "",
    startTime: "",
    webLink: "",
    partners: [],
  })

  const [errors, setErrors] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [partnerInput, setPartnerInput] = useState("")

  const countries = [
    "United States",
    "United Kingdom",
    "Canada",
    "Germany",
    "France",
    "Japan",
    "Australia",
    "Netherlands",
    "Sweden",
    "Switzerland",
    "Singapore",
    "South Korea",
    "China",
    "India",
    "Brazil",
    "Italy",
    "Spain",
    "Norway",
    "Denmark",
    "Finland",
  ]

  const validateForm = () => {
    const newErrors = {}

    // Required field validation
    if (!formData.title.trim()) newErrors.title = "Conference title is required"
    if (!formData.city.trim()) newErrors.city = "City is required"
    if (!formData.country) newErrors.country = "Country is required"
    if (!formData.startDate) newErrors.startDate = "Start date is required"
    if (!formData.endDate) newErrors.endDate = "End date is required"
    if (!formData.submissionDueDate) newErrors.submissionDueDate = "Submission due date is required"
    if (!formData.startTime) newErrors.startTime = "Starting time is required"
    if (!formData.webLink.trim()) newErrors.webLink = "Web link is required"

    // Date validation
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        newErrors.endDate = "End date must be after start date"
      }
    }

    if (formData.submissionDueDate && formData.startDate) {
      if (new Date(formData.submissionDueDate) >= new Date(formData.startDate)) {
        newErrors.submissionDueDate = "Submission due date must be before start date"
      }
    }

    // URL validation
    if (formData.webLink && !isValidUrl(formData.webLink)) {
      newErrors.webLink = "Please enter a valid URL (e.g., https://example.com)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const addPartner = () => {
    if (partnerInput.trim() && !formData.partners.includes(partnerInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        partners: [...prev.partners, partnerInput.trim()],
      }))
      setPartnerInput("")
    }
  }

  const removePartner = (partner) => {
    setFormData((prev) => ({
      ...prev,
      partners: prev.partners.filter((p) => p !== partner),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      setIsSubmitted(true)
      console.log("[v0] Conference registration submitted:", formData)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addPartner()
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-card-foreground mb-4">Registration Successful!</h2>
          <p className="text-muted-foreground mb-6">
            Your conference "{formData.title}" has been successfully registered. You will receive a confirmation email
            shortly.
          </p>
          <button
            onClick={onBack}
            className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-foreground">SubmitEase</span>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Conference Host Registration</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 border-b border-border">
              <h2 className="text-3xl font-bold text-card-foreground mb-2">Register Your Conference</h2>
              <p className="text-muted-foreground">
                Create a new conference registration and start accepting paper submissions from researchers worldwide.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Conference Title */}
                  <div className="group">
                    <label className="block text-sm font-medium text-card-foreground mb-2">Conference Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="e.g., International Conference on Machine Learning 2024"
                      className={`w-full px-4 py-3 bg-input border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
                        errors.title ? "border-destructive" : "border-border hover:border-primary/50"
                      }`}
                    />
                    {errors.title && <p className="text-destructive text-sm mt-1">{errors.title}</p>}
                  </div>

                  {/* City */}
                  <div className="group">
                    <label className="block text-sm font-medium text-card-foreground mb-2">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="e.g., San Francisco"
                      className={`w-full px-4 py-3 bg-input border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
                        errors.city ? "border-destructive" : "border-border hover:border-primary/50"
                      }`}
                    />
                    {errors.city && <p className="text-destructive text-sm mt-1">{errors.city}</p>}
                  </div>

                  {/* Country */}
                  <div className="group">
                    <label className="block text-sm font-medium text-card-foreground mb-2">Country *</label>
                    <select
                      value={formData.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      className={`w-full px-4 py-3 bg-input border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
                        errors.country ? "border-destructive" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <option value="">Select a country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    {errors.country && <p className="text-destructive text-sm mt-1">{errors.country}</p>}
                  </div>

                  {/* Web Link */}
                  <div className="group">
                    <label className="block text-sm font-medium text-card-foreground mb-2">Conference Website *</label>
                    <input
                      type="url"
                      value={formData.webLink}
                      onChange={(e) => handleInputChange("webLink", e.target.value)}
                      placeholder="https://conference2024.example.com"
                      className={`w-full px-4 py-3 bg-input border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
                        errors.webLink ? "border-destructive" : "border-border hover:border-primary/50"
                      }`}
                    />
                    {errors.webLink && <p className="text-destructive text-sm mt-1">{errors.webLink}</p>}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Start Date */}
                  <div className="group">
                    <label className="block text-sm font-medium text-card-foreground mb-2">
                      Conference Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      className={`w-full px-4 py-3 bg-input border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
                        errors.startDate ? "border-destructive" : "border-border hover:border-primary/50"
                      }`}
                    />
                    {errors.startDate && <p className="text-destructive text-sm mt-1">{errors.startDate}</p>}
                  </div>

                  {/* End Date */}
                  <div className="group">
                    <label className="block text-sm font-medium text-card-foreground mb-2">Conference End Date *</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange("endDate", e.target.value)}
                      className={`w-full px-4 py-3 bg-input border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
                        errors.endDate ? "border-destructive" : "border-border hover:border-primary/50"
                      }`}
                    />
                    {errors.endDate && <p className="text-destructive text-sm mt-1">{errors.endDate}</p>}
                  </div>

                  {/* Submission Due Date */}
                  <div className="group">
                    <label className="block text-sm font-medium text-card-foreground mb-2">
                      Paper Submission Due Date *
                    </label>
                    <input
                      type="date"
                      value={formData.submissionDueDate}
                      onChange={(e) => handleInputChange("submissionDueDate", e.target.value)}
                      className={`w-full px-4 py-3 bg-input border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
                        errors.submissionDueDate ? "border-destructive" : "border-border hover:border-primary/50"
                      }`}
                    />
                    {errors.submissionDueDate && (
                      <p className="text-destructive text-sm mt-1">{errors.submissionDueDate}</p>
                    )}
                  </div>

                  {/* Starting Time */}
                  <div className="group">
                    <label className="block text-sm font-medium text-card-foreground mb-2">
                      Conference Starting Time *
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange("startTime", e.target.value)}
                      className={`w-full px-4 py-3 bg-input border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
                        errors.startTime ? "border-destructive" : "border-border hover:border-primary/50"
                      }`}
                    />
                    {errors.startTime && <p className="text-destructive text-sm mt-1">{errors.startTime}</p>}
                  </div>
                </div>
              </div>

              {/* Partners Section */}
              <div className="mt-8">
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Conference Partners (Optional)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={partnerInput}
                    onChange={(e) => setPartnerInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter partner organization name"
                    className="flex-1 px-4 py-3 bg-input border border-border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary hover:border-primary/50"
                  />
                  <button
                    type="button"
                    onClick={addPartner}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium"
                  >
                    Add
                  </button>
                </div>
                {formData.partners.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.partners.map((partner, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm border border-primary/20"
                      >
                        {partner}
                        <button
                          type="button"
                          onClick={() => removePartner(partner)}
                          className="hover:bg-primary/20 rounded-full p-1 transition-colors"
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
              <div className="mt-10 pt-6 border-t border-border">
                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-4 px-8 rounded-lg hover:bg-primary/90 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Register Conference
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
