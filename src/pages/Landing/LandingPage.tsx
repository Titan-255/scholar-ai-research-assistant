import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  MessageSquare,
  FileSearch,
  CheckCircle2,
  Star,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } },
  };

  const pricingPlans = [
    {
      name: 'Starter',
      price: 0,
      description: 'Ideal for students and individual researchers.',
      features: [
        'Up to 3 PDF uploads',
        'Max. 10 MB per file',
        'Basic semantic QA engine',
        'Local storage support',
      ],
      cta: 'Start for Free',
      popular: false,
    },
    {
      name: 'Researcher Pro',
      price: isYearly ? 12 : 15,
      description: 'Perfect for graduate students and active professionals.',
      features: [
        'Unlimited PDF uploads',
        'Max. 100 MB per file',
        'Advanced GPT-4 QA parsing',
        '10 GB cloud workspace storage',
        'Priority index queues',
        'Cross-document querying',
      ],
      cta: 'Upgrade to Pro',
      popular: true,
    },
    {
      name: 'Institution',
      price: 'Custom',
      description: 'Tailored for research labs, libraries, and universities.',
      features: [
        'Dedicated secure compute node',
        'Enterprise SSO / AD integration',
        'Custom fine-tuned models',
        'Full document encryption compliance',
        '24/7 dedicated support representative',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center space-y-8"
        >
          {/* Badge indicator */}
          <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
            <span>Introducing Phase 1 Interactive Frontend</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight max-w-4xl mx-auto"
          >
            Chat with your{' '}
            <span className="bg-gradient-to-r from-indigo-650 to-violet-650 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
              PDF Documents
            </span>{' '}
            using advanced AI
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            ScholarAI allows you to upload academic papers, textbook chapters, or technical manuals, index them in seconds, and run Perplexity-like semantic QA chats instantly.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto"
            >
              Get Started for Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto"
            >
              Upload Demo PDF
            </Button>
          </motion.div>

          {/* Animated Interface Preview Mockup */}
          <motion.div
            variants={itemVariants}
            className="relative mt-12 max-w-5xl mx-auto rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-soft-lg bg-white dark:bg-slate-950 p-2"
          >
            <div className="h-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 space-x-2">
              <div className="h-3 w-3 bg-red-400 rounded-full" />
              <div className="h-3 w-3 bg-yellow-400 rounded-full" />
              <div className="h-3 w-3 bg-green-400 rounded-full" />
              <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded-md ml-4" />
            </div>
            <div className="h-80 sm:h-96 md:h-[450px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
              <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-md">
                <FileSearch className="h-12 w-12 text-indigo-500 animate-pulse" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">Secure Local PDF Parsing</h3>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-normal">
                  Our indexing pipeline extracts text layout elements, tables, and mathematical formulas using a localized state environment.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                  Open Interactive App
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-950/40 border-y border-slate-100 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
              Tailored for Researchers and Professionals
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Skip endless CTRL+F. Get structured summaries and reference citations instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hoverEffect>
              <CardContent className="space-y-4 pt-5">
                <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl text-indigo-650 shrink-0 w-fit">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">ChatGPT-like Chat Dialogues</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Interactive dialogue interface with formatting support. Paste math formulations, ask clarifying questions, and get precise references.
                </p>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="space-y-4 pt-5">
                <div className="bg-violet-555/10 p-3 rounded-xl text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 shrink-0 w-fit">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">Fast Document Indexing</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Instant preprocessing and metadata extraction. Track progress stages from file loading to indexing completion in real time.
                </p>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="space-y-4 pt-5">
                <div className="bg-cyan-555/10 p-3 rounded-xl text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400 shrink-0 w-fit">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">Private & Local Control</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Privacy first. Keep track of storage usage metrics. Safe environment to test and manage references before publishing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
            Workflow in Three Steps
          </h2>
          <p className="text-sm text-slate-500">
            No convoluted setups. Simple, rapid workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 hidden md:block z-0" />
          
          {[
            { step: '01', title: 'Upload PDFs', desc: 'Drag-and-drop research files or textbook chapters directly into the workspace.' },
            { step: '02', title: 'Wait for Indexing', desc: 'Our background compiler runs layouts extraction and tokenizes paragraphs.' },
            { step: '03', title: 'Start Chatting', desc: 'Query terms, extract summaries, and let the AI find accurate content sources.' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-4 relative z-10 bg-slate-50 dark:bg-slate-900 px-4">
              <div className="h-12 w-12 rounded-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 shadow-sm text-sm">
                {item.step}
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">{item.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
              Loved by Academic Pioneers
            </h2>
            <p className="text-sm text-slate-500">
              Read how ScholarAI helps accelerate literature surveys.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Dr. Sarah Jenkins', role: 'Bioinformatics Researcher', quote: 'Finding references across 100+ genomic papers used to take weeks. ScholarAI allows me to query across documents and get accurate citations in seconds.' },
              { name: 'Alex Rivera', role: 'Computer Science PhD Candidate', quote: 'The mathematical equation support is exceptional. It parses complex formulations from preprints, saving massive reading time.' },
              { name: 'Chloe Chen', role: 'Patent Attorney', quote: 'Precision matters in IP law. Being able to extract precise pages and paragraphs related to search claims has changed our workflow.' },
            ].map((t, idx) => (
              <Card key={idx} hoverEffect>
                <CardContent className="space-y-4 pt-5">
                  <div className="flex items-center space-x-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current shrink-0" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-550 dark:text-slate-400 italic leading-relaxed">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-650">
                      {t.name.split(' ')[1][0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">{t.name}</h4>
                      <p className="text-[9px] text-slate-400">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="text-sm text-slate-500">
            Start free. Upgrade as your paper vault grows.
          </p>

          {/* Toggle Monthly/Yearly */}
          <div className="flex items-center justify-center space-x-3 pt-2">
            <span className={`text-xs font-bold ${!isYearly ? 'text-indigo-600' : 'text-slate-400'}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="h-6 w-11 bg-slate-200 dark:bg-slate-800 rounded-full relative p-0.5 focus:outline-none transition-colors"
            >
              <div
                className={`h-5 w-5 bg-indigo-600 rounded-full shadow-md transform transition-transform duration-200 ${
                  isYearly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-bold ${isYearly ? 'text-indigo-600' : 'text-slate-400'} flex items-center`}>
              Yearly
              <span className="ml-1.5 px-2 py-0.5 text-[9px] font-semibold bg-emerald-100 text-emerald-600 rounded-full dark:bg-emerald-950/40">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {pricingPlans.map((plan, idx) => (
            <Card
              key={idx}
              className={`relative flex flex-col justify-between ${
                plan.popular
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-950 scale-102 z-10'
                  : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800/80'
              }`}
            >
              <CardContent className="space-y-6 pt-2.5">
                {plan.popular && (
                  <span className="absolute top-0 right-5 transform -translate-y-1/2 px-3 py-1 text-[9px] font-bold uppercase tracking-wider bg-indigo-600 text-white rounded-full">
                    Most Popular
                  </span>
                )}

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-450 dark:text-slate-400 min-h-[32px]">{plan.description}</p>
                </div>

                <div className="flex items-baseline space-x-1.5 py-2 border-b border-slate-50 dark:border-slate-850/50">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                  </span>
                  {typeof plan.price === 'number' && (
                    <span className="text-xs text-slate-400">/ month</span>
                  )}
                </div>

                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-350 py-2">
                  {plan.features.map((f, fIdx) => (
                    <li key={fIdx} className="flex items-start space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-850/50">
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  className="w-full"
                  onClick={() => navigate('/register')}
                >
                  {plan.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg text-white">ScholarAI</span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              ScholarAI is an advanced web platform allowing you to index literature vaults and run semantic AI queries over PDFs. Built with clean, robust interfaces.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Legal</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">GDPR & Compliance</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-550">
          © {new Date().getFullYear()} ScholarAI. All rights reserved. Built for Phase 1 Frontend presentation.
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
