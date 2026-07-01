import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Shield } from "lucide-react";
import { useAuth } from "@/providers/AuthContext";

type Section = { title: string; paragraphs: string[] };

const LAST_UPDATED = "1 July 2026";

const SECTIONS: Section[] = [
  {
    title: "1. Introduction",
    paragraphs: [
      'Welcome to PrepSmart LC ("PrepSmart", "we", "us", or "our"), operated by Score Smart PTE. These Terms and Conditions ("Terms") govern your access to and use of the PrepSmart Language Cert preparation platform, including our website, practice tools, mock tests, AI scoring features, and related services (collectively, the "Service").',
      "By creating an account, signing in, or using the Service, you agree to be bound by these Terms. If you do not agree, you must not use the Service.",
    ],
  },
  {
    title: "2. Eligibility",
    paragraphs: [
      "You must be at least 16 years old to use the Service. If you are under 18, you confirm that you have permission from a parent or legal guardian.",
      "You are responsible for ensuring that your use of the Service complies with applicable laws in your country of residence.",
    ],
  },
  {
    title: "3. Account registration",
    paragraphs: [
      "You must provide accurate and complete information when registering. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.",
      "Notify us immediately at contact@scoresmartpte.com if you suspect unauthorised access to your account.",
    ],
  },
  {
    title: "4. Use of the Service",
    paragraphs: [
      "PrepSmart LC is an independent Language Cert Academic preparation platform. We are not affiliated with, endorsed by, or sponsored by LanguageCert or Pearson. Practice content, scores, and feedback are for preparation purposes only and do not guarantee exam results.",
      "You agree not to: copy, scrape, or redistribute question content; share account access with others; attempt to reverse-engineer or disrupt the Service; use automated tools to access the platform without permission; or use the Service for any unlawful purpose.",
    ],
  },
  {
    title: "5. Subscriptions and payments",
    paragraphs: [
      "Some features require a paid subscription (Pro Plans). Prices, billing cycles, and included features are shown at the time of purchase.",
      "Subscriptions renew automatically unless cancelled before the renewal date. Refunds are handled according to the refund policy displayed at checkout or as required by applicable consumer law.",
      "We may change pricing or plan features with reasonable notice. Continued use after changes take effect constitutes acceptance of the updated terms.",
    ],
  },
  {
    title: "6. AI scoring and practice feedback",
    paragraphs: [
      "Speaking and writing tasks may be scored using automated transcription and AI analysis. Scores and feedback are estimates designed to help you practise and are not official Language Cert results.",
      "AI outputs may occasionally be inaccurate. You should not rely solely on automated scores when preparing for your exam.",
    ],
  },
  {
    title: "7. Intellectual property",
    paragraphs: [
      "All platform content, branding, software, and materials are owned by Score Smart PTE or our licensors and are protected by copyright and other intellectual property laws.",
      "You receive a limited, non-exclusive, non-transferable licence to access the Service for personal exam preparation. You may not reproduce, sell, or publish our content without written consent.",
    ],
  },
  {
    title: "8. Privacy",
    paragraphs: [
      "Your personal data is handled in accordance with our Privacy Policy. By using the Service, you consent to the collection and use of information as described there.",
    ],
  },
  {
    title: "9. Disclaimer of warranties",
    paragraphs: [
      'The Service is provided on an "as is" and "as available" basis. We do not warrant that the Service will be uninterrupted, error-free, or free of security vulnerabilities.',
      "We disclaim all warranties to the fullest extent permitted by law, including implied warranties of merchantability and fitness for a particular purpose.",
    ],
  },
  {
    title: "10. Limitation of liability",
    paragraphs: [
      "To the maximum extent permitted by law, Score Smart PTE shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including loss of data, exam results, or profits.",
      "Our total liability for any claim relating to the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim, or AUD $100 if no payment was made.",
    ],
  },
  {
    title: "11. Termination",
    paragraphs: [
      "We may suspend or terminate your account if you breach these Terms or if required for security or legal reasons.",
      "You may stop using the Service at any time. Upon termination, your right to access the Service ends, but provisions that by nature should survive (including liability limits and intellectual property) will remain in effect.",
    ],
  },
  {
    title: "12. Changes to these Terms",
    paragraphs: [
      "We may update these Terms from time to time. We will post the revised version on this page and update the \"Last updated\" date. Material changes may also be notified by email or in-app notice.",
      "Continued use of the Service after changes become effective constitutes acceptance of the revised Terms.",
    ],
  },
  {
    title: "13. Governing law",
    paragraphs: [
      "These Terms are governed by the laws of Australia. Any disputes shall be subject to the exclusive jurisdiction of the courts of Australia, unless mandatory consumer protection laws in your country require otherwise.",
    ],
  },
  {
    title: "14. Contact us",
    paragraphs: [
      "For questions about these Terms, contact us at:",
      "Email: contact@scoresmartpte.com",
      "Score Smart PTE — PrepSmart LC",
    ],
  },
];

export function TermsPage() {
  const { user } = useAuth();
  const backTo = user ? "/dashboard" : "/login";
  const backLabel = user ? "Back to dashboard" : "Back to login";

  return (
    <div className="relative min-h-dvh bg-[#0f0f1a] font-sans text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 size-96 rounded-full bg-blue-600/8 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 size-80 rounded-full bg-cyan-600/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <Link
          to={backTo}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>

        <header className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
            <Shield className="size-3.5 text-cyan-400" />
            Legal
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white md:text-4xl">Terms &amp; Conditions</h1>
          <p className="text-sm text-white/45">Last updated: {LAST_UPDATED}</p>
        </header>

        <div className="space-y-6 rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl shadow-black/30 md:p-8">
          <div className="flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <FileText className="mt-0.5 size-5 shrink-0 text-cyan-400" />
            <p className="text-sm leading-relaxed text-white/70">
              Please read these Terms carefully before using PrepSmart LC. They explain your rights and
              responsibilities when using our Language Cert practice platform.
            </p>
          </div>

          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-base font-bold text-white">{section.title}</h2>
              <div className="space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="text-sm leading-relaxed text-white/65">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-white/35">
          © {new Date().getFullYear()} Score Smart PTE · PrepSmart LC
        </p>
      </div>
    </div>
  );
}
