import AIAssistant from "@/components/AiAssistant";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import QASection from "@/components/QaSection";
import SecuritySection from "@/components/SecuritySection";
import TechnicalArchitecture from "@/components/TechnicalArchitecture";
import Testimonials from "@/components/Testimonials";

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Hero />
      <HowItWorks />
      <TechnicalArchitecture />
      <SecuritySection />
      <AIAssistant />
      <Testimonials />
      <QASection />

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border bg-background">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} LegacyLock. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
