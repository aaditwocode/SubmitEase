"use client"

import { useState, useEffect } from "react"
import { BookOpen, Users, Lightbulb, ArrowRight, Star, Layers, X } from "lucide-react"
import { useUserData } from "./UserContext"

export default function WelcomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [activePipeline, setActivePipeline] = useState('conference');
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
      journals: "...",
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
                  setPlatformStats({
                      users: `${data.users?.toLocaleString() || 0}+`,
                      journals: `${data.journals?.toLocaleString() || 0}+`, 
                      conferences: `${data.conferences?.toLocaleString() || 0}+`,
                      papers: `${data.papers?.toLocaleString() || 0}+`
                  });
              }
          } catch (err) {
              console.error("Failed to fetch platform stats:", err);
              setPlatformStats({ users: "5,000+", journals: "50+", conferences: "100+", papers: "10,000+" });
          }
      };

      fetchPublicStats();
  }, []);

  // --- UNIFIED MODAL STATE MANAGEMENT ---
  const [modal, setModal] = useState({
      isOpen: false,
      type: null, 
      step: 'email', 
      loading: false,
      error: '',
      userExists: false,
      hostID: null
  });

  const [authData, setAuthData] = useState({ email: '', password: '' });
  const [journalData, setJournalData] = useState({ name: '', link: '', publication: '' });
  const [confData, setConfData] = useState({
      name: "", city: "", country: "", startsAtDate: "", endAtDate: "",
      deadlineDate: "", deadlineTime: "", link: "", Partners: [], tracks: [], status: "Pending Approval"
  });

  const [partnerInput, setPartnerInput] = useState("");
  const [trackInput, setTrackInput] = useState("");

  const countries = [
    "United States", "United Kingdom", "Canada", "Germany", "France", "Japan",
    "Australia", "Netherlands", "Sweden", "Switzerland", "Singapore", "South Korea",
    "China", "India", "Brazil", "Italy", "Spain", "Norway", "Denmark", "Finland",
  ];

  const openModal = (type) => {
      setModal({ isOpen: true, type, step: 'email', loading: false, error: '', userExists: false, hostID: null });
  };

  const closeModal = () => {
      setModal({ isOpen: false, type: null, step: 'email', loading: false, error: '', userExists: false, hostID: null });
      setAuthData({ email: '', password: '' });
      setJournalData({ name: '', link: '', publication: '' });
      setConfData({ name: "", city: "", country: "", startsAtDate: "", endAtDate: "", deadlineDate: "", deadlineTime: "", link: "", Partners: [], tracks: [], status: "Pending Approval" });
      setPartnerInput("");
      setTrackInput("");
  };

  // Step 1: Check Email
  const handleEmailCheck = async (e) => {
      e.preventDefault();
      setModal(prev => ({ ...prev, loading: true, error: '' }));
      try {
          const res = await fetch('http://localhost:3001/check-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: authData.email })
          });
          
          if (res.ok) {
              const data = await res.json();
              if (data.exists) {
                  setModal(prev => ({ ...prev, step: 'details', loading: false, userExists: true, hostID: data.userId || 1 }));
              } else {
                  alert("You need to sign up first.");
                  window.location.href = '/signup';
              }
          } else {
              setModal(prev => ({ ...prev, error: 'Failed to verify email.', loading: false }));
          }
      } catch (err) {
          setTimeout(() => {
              const simulateExists = authData.email.includes("test");
              if (simulateExists) {
                  setModal(prev => ({ ...prev, step: 'details', loading: false, userExists: true, hostID: 1 }));
              } else {
                  alert("You need to sign up first.");
                  window.location.href = '/signup';
              }
          }, 800);
      }
  };

  // Step 2A: Journal Registration Submit
  const handleJournalSubmit = async (e) => {
      e.preventDefault();
      setModal(prev => ({ ...prev, loading: true, error: '' }));
      try {
          const payload = {
              email: authData.email,
              password: authData.password,
              journalName: journalData.name,
              journalLink: journalData.link,
              publication: journalData.publication
          };

          const res = await fetch('http://localhost:3001/journals/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          const data = await res.json();

          if (res.ok) {
              setModal(prev => ({ ...prev, step: 'success', loading: false }));
          } else {
              setModal(prev => ({ ...prev, error: data.error || 'Failed to submit journal request.', loading: false }));
          }
      } catch (err) {
          setModal(prev => ({ ...prev, error: 'Network error. Please make sure the server is running.', loading: false }));
      }
  };

  // Step 2B: Conference Registration Submit
  const handleConferenceSubmit = async (e) => {
      e.preventDefault();
      setModal(prev => ({ ...prev, loading: true, error: '' }));
      
      const payload = {
        name: confData.name,
        location: `${confData.city}, ${confData.country}`,
        startsAt: new Date(`${confData.startsAtDate}T00:00:00`).toISOString(), 
        endAt: new Date(`${confData.endAtDate}T23:59:59`).toISOString(),
        deadline: new Date(`${confData.deadlineDate}T${confData.deadlineTime}`).toISOString(),
        link: confData.link,
        status: confData.status,
        Partners: confData.Partners,
        tracks: confData.tracks, 
        hostID: modal.hostID,
        password: authData.password
      };

      try {
        const response = await fetch("http://localhost:3001/conference/registeration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            setModal(prev => ({ ...prev, step: 'success', loading: false }));
        } else {
            setModal(prev => ({ ...prev, error: data.error || data.message || 'Failed to register conference.', loading: false }));
        }
      } catch (error) {
         setModal(prev => ({ ...prev, error: 'Network error. Please make sure the server is running.', loading: false }));
      }
  };

  // Conference Form Helpers
  const addPartner = () => {
    if (partnerInput.trim() && !confData.Partners.includes(partnerInput.trim())) {
      setConfData(prev => ({ ...prev, Partners: [...prev.Partners, partnerInput.trim()] }));
      setPartnerInput("");
    }
  };
  const removePartner = (partner) => {
      setConfData(prev => ({ ...prev, Partners: prev.Partners.filter(p => p !== partner) }));
  };
  const addTrack = () => {
    if (trackInput.trim() && !confData.tracks.includes(trackInput.trim())) {
      setConfData(prev => ({ ...prev, tracks: [...prev.tracks, trackInput.trim()] }));
      setTrackInput("");
    }
  };
  const removeTrack = (track) => {
      setConfData(prev => ({ ...prev, tracks: prev.tracks.filter(t => t !== track) }));
  };

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
  ];

  const features = [
    {
      icon: <Layers className="h-8 w-8 text-[#059669]" />,
      title: "Unified Academic Ecosystem",
      description: "Seamlessly bridge continuous Journal publications and event-based Conference management. Use one account to submit papers, review manuscripts, and chair tracks.[cite: 1]",
    },
    {
      icon: <Users className="h-8 w-8 text-[#059669]" />,
      title: "Comprehensive Chair Management",
      description: "Dedicated, role-based portals for Authors, Reviewers, Editors-in-Chief, Track Chairs, Publication Chairs, and Registration Chairs to manage responsibilities without clutter.[cite: 1]",
    },
    {
      icon: <BookOpen className="h-8 w-8 text-[#059669]" />,
      title: "Advanced Peer Review System",
      description: "Support for automated reviews and structured 5-point multidimensional scoring criteria (Originality, Clarity, Soundness, Significance, Relevance).[cite: 1]",
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-[#059669]" />,
      title: "High-Performance Architecture",
      description: "Built with global connection pooling and edge caching via Prisma Accelerate to ensure zero latency and complete reliability even during peak submission deadlines.[cite: 1]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Header */}
      <header className="border-b border-[#e5e7eb] bg-[#ffffff]/95 backdrop-blur supports-[backdrop-filter]:bg-[#ffffff]/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          
          {/* Left Side: Logo + Main Nav */}
          <div className="flex items-center gap-8 lg:gap-12">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-[#059669] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-5 lg:space-x-6">
              <a href="#features" className="text-[#6b7280] hover:text-[#1f2937] font-medium transition-colors">
                Features
              </a>
              <a href="#stats" className="text-[#6b7280] hover:text-[#059669] font-medium transition-colors">
                Platform Stats
              </a>
              <button
                onClick={() => openModal('journal')}
                className="text-[#6b7280] hover:text-[#059669] font-medium transition-colors"
              >
                Host a Journal
              </button>
              <button
                onClick={() => openModal('conference')}
                className="text-[#6b7280] hover:text-[#059669] font-medium transition-colors"
              >
                Host a Conference
              </button>
            </nav>
          </div>

          {/* Right Side: Auth Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <a
              href="/signin"
              className="inline-flex items-center justify-center rounded-md text-sm font-bold transition-colors h-9 px-4 border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f3f4f6] hover:text-[#059669]"
            >
              Sign In
            </a>
            <a href="/signup" className="inline-flex items-center justify-center rounded-md text-sm font-bold transition-colors bg-[#059669] text-white hover:bg-[#047857] h-9 px-4 shadow-sm">
              Get Started
            </a>
          </div>

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
            <button 
                onClick={() => openModal('journal')}
                className="inline-flex items-center justify-center rounded-md font-bold transition-colors bg-white border-2 border-[#059669] text-[#059669] hover:bg-emerald-50 shadow-sm text-lg px-6 py-4"
            >
              Register a Journal
            </button>
            <button 
                onClick={() => openModal('conference')}
                className="inline-flex items-center justify-center rounded-md font-bold transition-colors bg-white border-2 border-[#059669] text-[#059669] hover:bg-emerald-50 shadow-sm text-lg px-6 py-4"
            >
              Register a Conference
            </button>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
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

      {/* How It Works Pipeline */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-4">Master the Pipeline in 3 Steps</h2>
            <p className="text-xl text-[#6b7280]">Transform your academic workflow from draft to final publication.</p>
          </div>

          <div className="flex justify-center mb-12 relative z-20">
            <div className="bg-gray-100 p-1 rounded-lg inline-flex shadow-sm border border-gray-200">
              <button
                onClick={() => setActivePipeline('conference')}
                className={`px-6 py-2.5 rounded-md text-sm font-bold transition-all ${activePipeline === 'conference' ? 'bg-white text-[#059669] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Conference Workflow
              </button>
              <button
                onClick={() => setActivePipeline('journal')}
                className={`px-6 py-2.5 rounded-md text-sm font-bold transition-all ${activePipeline === 'journal' ? 'bg-white text-[#059669] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Journal Workflow
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-6 left-1/6 right-1/6 h-0.5 bg-emerald-100 z-0"></div>
            
            {activePipeline === 'conference' ? (
                <>
                    <div className="text-center relative z-10 animate-fade-in">
                      <div className="w-12 h-12 bg-[#059669] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">1</div>
                      <h3 className="text-lg font-bold mb-2 text-[#1f2937]">Submission & Track Routing</h3>
                      <p className="text-[#6b7280] text-sm">Authors securely upload their PDFs, select specific conference tracks, tag co-authors, and instantly receive a uniquely generated Paper ID.[cite: 1]</p>
                    </div>
                    <div className="text-center relative z-10 animate-fade-in" style={{ animationDelay: '100ms' }}>
                      <div className="w-12 h-12 bg-[#059669] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">2</div>
                      <h3 className="text-lg font-bold mb-2 text-[#1f2937]">Chair Assignment & Scoring</h3>
                      <p className="text-[#6b7280] text-sm">Track Chairs assign domain experts. Reviewers evaluate manuscripts using a structured 5-point multidimensional scoring system.[cite: 1]</p>
                    </div>
                    <div className="text-center relative z-10 animate-fade-in" style={{ animationDelay: '200ms' }}>
                      <div className="w-12 h-12 bg-[#059669] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">3</div>
                      <h3 className="text-lg font-bold mb-2 text-[#1f2937]">Triage & Event Rollout</h3>
                      <p className="text-[#6b7280] text-sm">Chief Chairs execute final decisions, while Publication and Registration Chairs handle the final event rollout logistics.[cite: 1]</p>
                    </div>
                </>
            ) : (
                <>
                    <div className="text-center relative z-10 animate-fade-in">
                      <div className="w-12 h-12 bg-[#059669] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">1</div>
                      <h3 className="text-lg font-bold mb-2 text-[#1f2937]">Manuscript Submission</h3>
                      <p className="text-[#6b7280] text-sm">Authors submit their research papers, define precise focus keywords, and provide necessary metadata for the target journal.</p>
                    </div>
                    <div className="text-center relative z-10 animate-fade-in" style={{ animationDelay: '100ms' }}>
                      <div className="w-12 h-12 bg-[#059669] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">2</div>
                      <h3 className="text-lg font-bold mb-2 text-[#1f2937]">Editorial Peer Review</h3>
                      <p className="text-[#6b7280] text-sm">The Editor-in-Chief assigns a handling Editor, who invites dedicated domain experts to rigorously evaluate the manuscript's academic validity.</p>
                    </div>
                    <div className="text-center relative z-10 animate-fade-in" style={{ animationDelay: '200ms' }}>
                      <div className="w-12 h-12 bg-[#059669] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">3</div>
                      <h3 className="text-lg font-bold mb-2 text-[#1f2937]">Revision & Publication</h3>
                      <p className="text-[#6b7280] text-sm">Authors respond directly to editorial feedback and submit revised drafts seamlessly until the final publication verdict is reached.</p>
                    </div>
                </>
            )}
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

      {/* Platform Stats Section */}
      <section id="stats" className="py-12 px-4 bg-emerald-50/50 border-y border-emerald-100">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-emerald-200">
            <div className="p-4">
              <div className="text-4xl md:text-5xl font-bold text-[#059669] mb-2">{platformStats.users}</div>
              <div className="text-emerald-800 font-bold uppercase tracking-wider text-xs">Registered Users</div>
            </div>
            <div className="p-4">
              <div className="text-4xl md:text-5xl font-bold text-[#059669] mb-2">{platformStats.journals}</div>
              <div className="text-emerald-800 font-bold uppercase tracking-wider text-xs">Registered Journals</div>
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

      {/* --- UNIFIED REGISTRATION MODAL --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] overflow-y-auto backdrop-blur-sm">
            <div className={`bg-white rounded-xl shadow-2xl w-full my-8 ${modal.step === 'details' && modal.type === 'conference' ? 'max-w-3xl' : 'max-w-md'} overflow-hidden relative`}>
                
                {/* Modal Header */}
                <div className="flex justify-between items-center p-5 border-b border-[#e5e7eb] bg-[#f9fafb]">
                    <h3 className="text-lg font-bold text-[#1f2937]">
                        {modal.step === 'email' && `Host a ${modal.type === 'journal' ? 'Journal' : 'Conference'}`}
                        {modal.step === 'details' && `${modal.type === 'journal' ? 'Journal' : 'Conference'} Details`}
                        {modal.step === 'success' && "Success!"}
                    </h3>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Modal Body */}
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    {modal.error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded border border-red-200">
                            {modal.error}
                        </div>
                    )}

                    {/* Step 1: Email Check */}
                    {modal.step === 'email' && (
                        <form onSubmit={handleEmailCheck} className="space-y-4">
                            <p className="text-sm text-gray-600 mb-4">Enter your email address to begin the registration process.</p>
                            <div>
                                <label className="block text-sm font-medium text-[#374151] mb-1">Email Address</label>
                                <input 
                                    type="email" required placeholder="director@university.edu" 
                                    value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} 
                                    className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none"
                                />
                            </div>
                            <button disabled={modal.loading} type="submit" className="w-full py-2.5 bg-[#059669] text-white font-bold text-sm rounded-lg hover:bg-[#047857] transition-colors disabled:bg-gray-400">
                                {modal.loading ? "Checking..." : "Continue"}
                            </button>
                        </form>
                    )}

                    {/* Step 2A: Journal Details */}
                    {modal.step === 'details' && modal.type === 'journal' && (
                        <form onSubmit={handleJournalSubmit} className="space-y-4">
                            {modal.userExists && (
                                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm mb-4 border border-emerald-100">
                                    Welcome back! Please provide the details for your new journal.
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-[#374151] mb-1">Journal Name</label>
                                <input type="text" required placeholder="e.g. Global Journal of Technology" value={journalData.name} onChange={e => setJournalData({...journalData, name: e.target.value})} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#374151] mb-1">Official Link (Optional)</label>
                                <input type="url" placeholder="https://" value={journalData.link} onChange={e => setJournalData({...journalData, link: e.target.value})} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#374151] mb-1">Publishing Organization / Body</label>
                                <input type="text" required placeholder="e.g. IEEE, Springer, University Name" value={journalData.publication} onChange={e => setJournalData({...journalData, publication: e.target.value})} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none" />
                            </div>
                            
                            {modal.userExists && (
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Confirm Your Password</label>
                                    <input type="password" required value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none" />
                                </div>
                            )}

                            <button disabled={modal.loading} type="submit" className="w-full py-2.5 mt-2 bg-[#059669] text-white font-bold text-sm rounded-lg hover:bg-[#047857] transition-colors disabled:bg-gray-400">
                                {modal.loading ? "Submitting Request..." : "Submit Journal Request"}
                            </button>
                        </form>
                    )}

                    {/* Step 2B: Conference Details */}
                    {modal.step === 'details' && modal.type === 'conference' && (
                        <form onSubmit={handleConferenceSubmit} className="space-y-4">
                            {modal.userExists && (
                                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm mb-4 border border-emerald-100">
                                    Welcome back! Please provide the details for your new conference.
                                </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Conference Name *</label>
                                    <input type="text" required placeholder="e.g. TechConf 2024" value={confData.name} onChange={e => setConfData({...confData, name: e.target.value})} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Conference Website *</label>
                                    <input type="url" required placeholder="https://" value={confData.link} onChange={e => setConfData({...confData, link: e.target.value})} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">City *</label>
                                    <input type="text" required placeholder="e.g. New York" value={confData.city} onChange={e => setConfData({...confData, city: e.target.value})} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Country *</label>
                                    <select required value={confData.country} onChange={e => setConfData({...confData, country: e.target.value})} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none">
                                        <option value="">Select a country</option>
                                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Start Date *</label>
                                    <input type="date" required value={confData.startsAtDate} onChange={e => setConfData({...confData, startsAtDate: e.target.value})} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">End Date *</label>
                                    <input type="date" required value={confData.endAtDate} onChange={e => setConfData({...confData, endAtDate: e.target.value})} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Submission Deadline Date *</label>
                                    <input type="date" required value={confData.deadlineDate} onChange={e => setConfData({...confData, deadlineDate: e.target.value})} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Submission Deadline Time *</label>
                                    <input type="time" required value={confData.deadlineTime} onChange={e => setConfData({...confData, deadlineTime: e.target.value})} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none" />
                                </div>
                            </div>
                            
                            {/* Tracks & Partners Inline */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Tracks (Optional)</label>
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="e.g. AI/ML" value={trackInput} onChange={e => setTrackInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTrack())} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none" />
                                        <button type="button" onClick={addTrack} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 font-medium">Add</button>
                                    </div>
                                    {confData.tracks.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {confData.tracks.map(t => (
                                                <span key={t} className="px-2 py-1 bg-emerald-50 text-[#059669] text-xs font-medium rounded border border-emerald-200 flex items-center gap-1">
                                                    {t} <button type="button" onClick={() => removeTrack(t)} className="hover:text-emerald-800">✕</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Partners (Optional)</label>
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="e.g. IEEE" value={partnerInput} onChange={e => setPartnerInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addPartner())} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none" />
                                        <button type="button" onClick={addPartner} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 font-medium">Add</button>
                                    </div>
                                    {confData.Partners.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {confData.Partners.map(p => (
                                                <span key={p} className="px-2 py-1 bg-emerald-50 text-[#059669] text-xs font-medium rounded border border-emerald-200 flex items-center gap-1">
                                                    {p} <button type="button" onClick={() => removePartner(p)} className="hover:text-emerald-800">✕</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {modal.userExists && (
                                <div className="pt-2 border-t mt-4">
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Confirm Your Password</label>
                                    <input type="password" required value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none" />
                                </div>
                            )}

                            <button disabled={modal.loading} type="submit" className="w-full py-3 mt-4 bg-[#059669] text-white font-bold text-sm rounded-lg hover:bg-[#047857] transition-colors disabled:bg-gray-400">
                                {modal.loading ? "Submitting Request..." : "Submit Conference Request"}
                            </button>
                        </form>
                    )}

                    {/* Step 3: Success */}
                    {modal.step === 'success' && (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-emerald-100 text-[#059669] rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h4 className="text-xl font-bold text-[#1f2937] mb-2">Request Submitted!</h4>
                            <p className="text-[#6b7280] text-sm mb-6">
                                Your application for <strong>{modal.type === 'journal' ? journalData.name : confData.name}</strong> has been sent to our platform admins for review. You will receive an email once it is approved.
                            </p>
                            <button onClick={closeModal} className="w-full py-2.5 bg-[#f3f4f6] text-[#374151] font-bold text-sm rounded-lg hover:bg-[#e5e7eb] transition-colors">
                                Return to Home
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  )
}