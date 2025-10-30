import AIAssistant from "@/components/AiAssistant";
import Hero from "@/components/Hero";
import QASection from "@/components/QaSection";

const Landing = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <AIAssistant />
      <QASection />
    </div>
  );
};

export default Landing;
