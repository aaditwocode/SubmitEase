"use client"

import { useState } from "react"
import { BookOpen, Users, Lightbulb, ArrowRight, Star } from "lucide-react"
import {useUserData} from "./UserContext"
export default function WelcomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const {setUser} = useUserData();
  setUser(null);
  const testimonials = [
    {
      name: "Dr. Alisha Sharma",
      role: "Postdoctoral Researcher",
      company: "Institute of Science",
      content: "SubmitEase's AI recommendations saved me days of searching for the right journal. The automated formatting checks are a lifesaver!",
      rating: 5,
    },
    {
      name: "Prof. Ben Carter",
      role: "Journal Editor",
      company: "Global Engineering Review",
      content: "Managing peer reviews has never been smoother. The platform's intuitive dashboard simplifies the entire workflow for our editorial team.",
      rating: 5,
    },
    {
      name: "Mei Lin",
      role: "PhD Candidate",
      company: "University of Technology",
      content: "Collaborating with my co-authors on our conference paper was seamless. A must-have tool for any research team.",
      rating: 5,
    },
  ]

  const features = [
    {
      icon: <Lightbulb className="h-8 w-8 text-[#059669]" />,
      title: "AI-Powered Suggestions",
      description: "Analyze your paper to recommend the most suitable journals or conferences for submission.",
    },
    {
      icon: <BookOpen className="h-8 w-8 text-[#059669]" />,
      title: "Unified Dashboard",
      description: "A central hub to monitor the status of all your journal submissions and conference activities in one place.",
    },
    {
      icon: <Users className="h-8 w-8 text-[#059669]" />,
      title: "Multi-Author Collaboration",
      description: "Our system is designed for modern research teams, allowing multiple authors to be easily associated with a single manuscript.",
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
            <a href="#features" className="text-[#6b7280] hover:text-[#1f2937] transition-colors">
              Features
            </a>
            <a href="#testimonials" className="text-[#6b7280] hover:text-[#1f2937] transition-colors">
              Reviews
            </a>
            <a
              href="/signin"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f3f4f6] hover:text-[#1f2937]"
            >
              Sign In
            </a>
            <a href="/signup" className="inline-flex items-center justify-center rounded-md font-medium transition-colors bg-[#059669] text-white hover:bg-emerald-600 h-9 px-4">
              Get Started
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-[#1f2937] mb-6 text-balance">
            Streamline Your Academic Submissions with <span className="text-[#059669]">SubmitEase</span>
          </h1>
          <p className="text-xl text-[#6b7280] mb-8 text-pretty max-w-3xl mx-auto">
            The academic submission process is inefficient and fragmented. SubmitEase provides a single, intelligent platform to manage journal submissions, conference papers, and peer reviews in one seamless environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/signup" className="inline-flex items-center justify-center rounded-md font-medium transition-colors bg-[#059669] text-white hover:bg-emerald-600 text-lg px-8 py-6">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-[#f3f4f6]/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-4">Why Choose SubmitEase?</h2>
            <p className="text-xl text-[#6b7280] max-w-2xl mx-auto">
              Built for developers and businesses who need reliable form processing without the hassle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-[#1f2937] shadow-sm hover:shadow-lg transition-shadow">
                <div className="p-8 text-center">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-[#1f2937] mb-3">{feature.title}</h3>
                  <p className="text-[#6b7280] leading-relaxed">{feature.description}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-4">Get Started in 3 Simple Steps</h2>
            <p className="text-xl text-[#6b7280]">Transform your submission workflow from start to finish.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#059669] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Select a Venue</h3>
              <p className="text-[#6b7280]">Choose from a comprehensive list of journals and conferences.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#059669] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Submit Your Paper</h3>
              <p className="text-[#6b7280]">Our AI-assisted form helps you fill out submission details and check formatting.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#059669] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Your Progress</h3>
              <p className="text-[#6b7280]">Monitor your submission status from initial review to final decision on your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-[#f3f4f6]/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-4">Trusted by Researchers and Academics</h2>
            <p className="text-xl text-[#6b7280]">See what our users have to say about SubmitEase</p>
          </div>

          <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-[#1f2937] shadow-sm max-w-2xl mx-auto">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-lg text-[#1f2937] mb-6 italic">
                "{testimonials[currentTestimonial].content}"
              </blockquote>
              <div>
                <div className="font-semibold text-[#1f2937]">{testimonials[currentTestimonial].name}</div>
                <div className="text-sm text-[#6b7280]">
                  {testimonials[currentTestimonial].role} at {testimonials[currentTestimonial].company}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentTestimonial ? "bg-[#059669]" : "bg-[#e5e7eb]"
                }`}
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
            Join thousands of academics who trust SubmitEase to streamline their publishing workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/signup" className="inline-flex items-center justify-center rounded-md font-medium transition-colors bg-[#059669] text-white hover:bg-emerald-600 text-lg px-8 py-6">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e7eb] bg-[#f3f4f6]/30 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-6 w-6 bg-[#059669] rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-[#1f2937]">SubmitEase</span>
              </div>
              <p className="text-sm text-[#6b7280]">The future of academic publishing.</p>
            </div>
            <div>
              <h4 className="font-semibold text-[#1f2937] mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-[#6b7280]">
                <li>
                  <a href="#" className="hover:text-[#1f2937] transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#1f2937] transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#1f2937] transition-colors">
                    API Reference
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#1f2937] mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-[#6b7280]">
                <li>
                  <a href="#" className="hover:text-[#1f2937] transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#1f2937] transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#1f2937] transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#1f2937] mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-[#6b7280]">
                <li>
                  <a href="#" className="hover:text-[#1f2937] transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#1f2937] transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#e5e7eb] mt-8 pt-8 text-center text-sm text-[#6b7280]">
            <p>&copy; 2024 SubmitEase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

