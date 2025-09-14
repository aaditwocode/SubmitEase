"use client"

import { useState } from "react"
import { BookOpen, Users, Lightbulb, ArrowRight, Star } from "lucide-react"
export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Author",
  })

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
      icon: <Lightbulb className="h-8 w-8 text-emerald-500" />,
      title: "AI-Powered Suggestions",
      description: "Analyze your paper to recommend the most suitable journals or conferences for submission.",
    },
    {
      icon: <BookOpen className="h-8 w-8 text-emerald-500" />,
      title: "Unified Dashboard",
      description: "A central hub to monitor the status of all your journal submissions and conference activities in one place.",
    },
    {
      icon: <Users className="h-8 w-8 text-emerald-500" />,
      title: "Multi-Author Collaboration",
      description: "Our system is designed for modern research teams, allowing multiple authors to be easily associated with a single manuscript.",
    },
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSignIn = (e) => {
    e.preventDefault()
    console.log("Sign in attempt:", { email: formData.email, password: formData.password })
    // Add your sign in logic here
  }

  const handleSignUp = (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match")
      return
    }
    console.log("Sign up attempt:", formData)
    // Add your sign up logic here
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-foreground">SubmitEase</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Reviews
            </a>
            <a
              href="/auth"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            >
              Sign In
            </a>
            <a href="/auth" className="inline-flex items-center justify-center rounded-md font-medium transition-colors bg-emerald-500 text-primary-foreground hover:bg-emerald-600 h-9 px-4">
              Get Started
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Streamline Your Form Submissions with <span className="text-emerald-500">SubmitEase</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Effortless form handling for your website. No backend required, no complex setup. Just simple, reliable form
            processing that works.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setIsSignUp(true)
                setShowAuthModal(true)
              }}
              className="inline-flex items-center justify-center rounded-md font-medium transition-colors bg-emerald-500 text-primary-foreground hover:bg-emerald-600 text-lg px-8 py-6"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose SubmitEase?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for developers and businesses who need reliable form processing without the hassle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="rounded-lg border border-border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow">
                <div className="p-8 text-center">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Get Started in 3 Simple Steps</h2>
            <p className="text-xl text-muted-foreground">Transform your submission workflow from start to finish.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500 text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Select a Venue</h3>
              <p className="text-muted-foreground">Choose from a comprehensive list of journals and conferences.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500 text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Submit Your Paper</h3>
              <p className="text-muted-foreground">Our AI-assisted form helps you fill out submission details and check formatting.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500 text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Your Progress</h3>
              <p className="text-muted-foreground">Monitor your submission status from initial review to final decision on your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Trusted by Researchers and Academics</h2>
            <p className="text-xl text-muted-foreground">See what our users have to say about SubmitEase</p>
          </div>

          <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm max-w-2xl mx-auto">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-emerald-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-lg text-card-foreground mb-6 italic">
                "{testimonials[currentTestimonial].content}"
              </blockquote>
              <div>
                <div className="font-semibold text-card-foreground">{testimonials[currentTestimonial].name}</div>
                <div className="text-sm text-muted-foreground">
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
                  index === currentTestimonial ? "bg-emerald-500" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Ready to Accelerate Your Research?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of academics who trust SubmitEase to streamline their publishing workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/auth" className="inline-flex items-center justify-center rounded-md font-medium transition-colors bg-emerald-500 text-primary-foreground hover:bg-emerald-600 text-lg px-8 py-6">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-6 w-6 bg-emerald-500 rounded flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-foreground">SubmitEase</span>
              </div>
              <p className="text-sm text-muted-foreground">The future of academic publishing.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    API Reference
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 SubmitEase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}