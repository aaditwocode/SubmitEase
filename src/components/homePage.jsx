"use client"

import { useState, useEffect } from "react"
import { BookOpen, Users, Lightbulb, ArrowRight, Star } from "lucide-react"
import { useUserData } from "./UserContext"

export default function WelcomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { setUser } = useUserData();
  
  // 1. Clear user data IMMEDIATELY when landing on this page
  useEffect(() => {
      if (setUser) {
          setUser(null);
          localStorage.removeItem('user'); 
      }
  }, [setUser]);

  // 2. State for public platform stats
  const [platformStats, setPlatformStats] = useState({
      users: "...",
      conferences: "...",
      papers: "..."
  });

  // 3. Fetch real data from the backend
  useEffect(() => {
      const fetchPublicStats = async () => {
          try {
              const res = await fetch('http://localhost:3001/public/platform-stats');
              if (res.ok) {
                  const data = await res.json();
                  
                  // Format the numbers beautifully (e.g., 1500 -> "1,500+")
                  setPlatformStats({
                      users: `${data.users.toLocaleString()}+`,
                      conferences: `${data.conferences.toLocaleString()}+`,
                      papers: `${data.papers.toLocaleString()}+`
                  });
              }
          } catch (err) {
              console.error("Failed to fetch platform stats:", err);
              // Graceful fallback if the server is down
              setPlatformStats({ users: "5,000+", conferences: "100+", papers: "10,000+" });
          }
      };

      fetchPublicStats();
  }, []);

  const testimonials = [
    {
      name: "Dr. Alisha Sharma",
      role: "Editor-in-Chief",
      company: "Institute of Science",
      content: "SubmitEase completely transformed how our editorial board manages submissions. The triage panel and reviewer assignment workflows are incredibly intuitive.",
      rating: 5,
    },
    {
      name: "Prof. Ben Carter",
      role: "Track Chair",
      company: "Global Tech Conference",
      content: "Managing a conference track used to be a nightmare of spreadsheets and lost emails. SubmitEase brings everything into one clean, transparent portal.",
      rating: 5,
    },
    {
      name: "Mei Lin",
      role: "PhD Candidate",
      company: "University of Technology",
      content: "As an author, knowing exactly where my manuscript is in the peer-review pipeline gives me immense peace of mind. The revision process is seamless.",
      rating: 5,
    },
  ]

  const features = [
    {
      icon: <Users className="h-8 w-8 text-[#059669]" />,
      title: "Role-Based Portals",
      description: "Dedicated interfaces for Authors, Reviewers, Track Chairs, and Editors-in-Chief to manage their specific responsibilities without clutter.",
    },
    {
      icon: <BookOpen className="h-8 w-8 text-[#059669]" />,
      title: "Streamlined Peer Review",
      description: "Assign domain experts, track review progress, manage revisions, and execute final editorial decisions all in one unified dashboard.",
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-[#059669]" />,
      title: "Real-Time Tracking",
      description: "Maintain complete transparency with live updates on manuscript status, from initial submission and EIC triage to final publication.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Header */}
      <header className="border-b border-[#e5e7eb] bg-[#ffffff]/95 backdrop-blur supports-[backdrop-filter]:bg-[#ffffff]/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-[#059669] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#stats" className="text-[#6b7280] hover:text-[#059669] font-medium transition-colors">
              Platform Stats
            </a>
            <a href="#features" className="text-[#6b7280] hover:text-[#1f2937] font-medium transition-colors">
              Features
            </a>
            <a href="#testimonials" className="text-[#6b7280] hover:text-[#1f2937] font-medium transition-colors">
              Reviews
            </a>
            <a
              href="/signin"
              className="inline-flex items-center justify-center rounded-md text-sm font-bold transition-colors h-9 px-4 border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f3f4f6] hover:text-[#059669]"
            >
              Sign In
            </a>
            <a href="/signup" className="inline-flex items-center justify-center rounded-md text-sm font-bold transition-colors bg-[#059669] text-white hover:bg-[#047857] h-9 px-4 shadow-sm">
              Get Started
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-[#1f2937] mb-6 text-balance leading-tight">
            Streamline Your Academic Submissions with <span className="text-[#059669]">SubmitEase</span>
          </h1>
          <p className="text-xl text-[#6b7280] mb-8 text-pretty max-w-3xl mx-auto">
            The academic publication process shouldn't be fragmented. SubmitEase provides a single, intelligent platform to manage journal submissions, conference papers, and peer reviews in one seamless environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/signup" className="inline-flex items-center justify-center rounded-md font-bold transition-colors bg-[#059669] text-white hover:bg-[#047857] shadow-md text-lg px-8 py-4">
              Create an Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* --- NEW: Platform Stats Section --- */}
      <section id="stats" className="py-12 px-4 bg-emerald-50/50 border-y border-emerald-100">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-emerald-200">
            <div className="p-4">
              <div className="text-4xl md:text-5xl font-bold text-[#059669] mb-2">{platformStats.users}</div>
              <div className="text-emerald-800 font-bold uppercase tracking-wider text-xs">Registered Users</div>
            </div>
            <div className="p-4">
              <div className="text-4xl md:text-5xl font-bold text-[#059669] mb-2">{platformStats.conferences}</div>
              <div className="text-emerald-800 font-bold uppercase tracking-wider text-xs">Conferences Hosted</div>
            </div>
            <div className="p-4">
              <div className="text-4xl md:text-5xl font-bold text-[#059669] mb-2">{platformStats.papers}</div>
              <div className="text-emerald-800 font-bold uppercase tracking-wider text-xs">Papers Submitted</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-[#f3f4f6]/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-4">Why Choose SubmitEase?</h2>
            <p className="text-xl text-[#6b7280] max-w-2xl mx-auto">
              Built for researchers, editorial boards, and conference organizers who demand a transparent, efficient workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="rounded-xl border border-[#e5e7eb] bg-white text-[#1f2937] shadow-sm hover:shadow-md transition-shadow">
                <div className="p-8 text-center">
                  <div className="flex justify-center mb-5 bg-emerald-50 w-16 h-16 rounded-full items-center mx-auto">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-[#1f2937] mb-3">{feature.title}</h3>
                  <p className="text-[#6b7280] leading-relaxed text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-4">Master the Pipeline in 3 Steps</h2>
            <p className="text-xl text-[#6b7280]">Transform your academic workflow from draft to final publication.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting lines for desktop */}
            <div className="hidden md:block absolute top-6 left-1/6 right-1/6 h-0.5 bg-emerald-100 z-0"></div>
            
            <div className="text-center relative z-10">
              <div className="w-12 h-12 bg-[#059669] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                1
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#1f2937]">Submit Manuscript</h3>
              <p className="text-[#6b7280] text-sm">Upload your paper, define your research area, add co-authors, and submit to your target venue.</p>
            </div>
            <div className="text-center relative z-10">
              <div className="w-12 h-12 bg-[#059669] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                2
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#1f2937]">Peer Review</h3>
              <p className="text-[#6b7280] text-sm">Editors assign domain experts. Reviewers evaluate the work and provide structured, actionable feedback.</p>
            </div>
            <div className="text-center relative z-10">
              <div className="w-12 h-12 bg-[#059669] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                3
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#1f2937]">Revise & Publish</h3>
              <p className="text-[#6b7280] text-sm">Track editorial decisions, submit requested revisions, and achieve final publication success.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-[#f3f4f6]/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-4">Trusted by Academic Leaders</h2>
            <p className="text-xl text-[#6b7280]">See what our users have to say about the SubmitEase experience.</p>
          </div>

          <div className="rounded-xl border border-[#e5e7eb] bg-white text-[#1f2937] shadow-md max-w-2xl mx-auto transition-all">
            <div className="p-10 text-center">
              <div className="flex justify-center mb-6">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-xl font-medium text-[#374151] mb-8 leading-relaxed">
                "{testimonials[currentTestimonial].content}"
              </blockquote>
              <div>
                <div className="font-bold text-[#059669] text-lg">{testimonials[currentTestimonial].name}</div>
                <div className="text-sm font-medium text-[#6b7280]">
                  {testimonials[currentTestimonial].role}, <span className="italic">{testimonials[currentTestimonial].company}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8 space-x-3">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentTestimonial ? "bg-[#059669] ring-2 ring-emerald-200 ring-offset-2" : "bg-[#d1d5db] hover:bg-gray-400"
                }`}
                aria-label={`View testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-6">Ready to Accelerate Your Research?</h2>
          <p className="text-xl text-[#6b7280] mb-8">
            Join thousands of academics and institutions who trust SubmitEase to orchestrate their publishing workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/signup" className="inline-flex items-center justify-center rounded-md font-bold transition-colors bg-[#059669] text-white hover:bg-[#047857] shadow-md text-lg px-8 py-4">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e7eb] bg-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-6 w-6 bg-[#059669] rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-[#1f2937]">SubmitEase</span>
              </div>
              <p className="text-sm text-[#6b7280]">The modern infrastructure for academic publishing and conference management.</p>
            </div>
            <div>
              <h4 className="font-bold text-[#1f2937] mb-4">Product</h4>
              <ul className="space-y-3 text-sm font-medium text-[#6b7280]">
                <li><a href="#" className="hover:text-[#059669] transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-[#059669] transition-colors">Author Guidelines</a></li>
                <li><a href="#" className="hover:text-[#059669] transition-colors">Reviewer Portal</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#1f2937] mb-4">Resources</h4>
              <ul className="space-y-3 text-sm font-medium text-[#6b7280]">
                <li><a href="#" className="hover:text-[#059669] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#059669] transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-[#059669] transition-colors">Contact Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#1f2937] mb-4">Legal</h4>
              <ul className="space-y-3 text-sm font-medium text-[#6b7280]">
                <li><a href="#" className="hover:text-[#059669] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#059669] transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#e5e7eb] mt-12 pt-8 text-center text-sm font-medium text-[#9ca3af]">
            <p>&copy; {new Date().getFullYear()} SubmitEase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}