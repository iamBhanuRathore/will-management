import { Button } from "@/components/ui/button";
import { Shield, Clock, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Lock className="w-8 h-8 text-accent-foreground" />,
    title: "Cryptographically Secure",
    description: "Your secrets are split and encrypted, ensuring absolute privacy.",
  },
  {
    icon: <Clock className="w-8 h-8 text-accent-foreground" />,
    title: "Time-Locked",
    description: "Set the exact moment your will becomes accessible.",
  },
  {
    icon: <Shield className="w-8 h-8 text-accent-foreground" />,
    title: "Decentralized",
    description: "No single point of failure or control.",
  },
];

const FeatureCard = ({ feature, index }: { feature: Feature; index: number }) => (
  <div
    className="group flex flex-col items-center p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 animate-fade-in-up"
    style={{ animationDelay: `${0.8 + index * 0.2}s` }}
  >
    <div className="p-3 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">{feature.icon}</div>
    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
    <p className="text-sm text-muted-foreground text-center">{feature.description}</p>
  </div>
);

const Hero = () => {
  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.1),_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(var(--accent)/0.05),_transparent_70%)]" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]" />

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 animate-fade-in-up">
            <Shield className="w-4 h-4 text-accent-foreground" />
            <span className="text-sm font-medium">Secured by Solana Blockchain</span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent leading-tight animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Secure Your Digital Legacy with <span className="bg-accent text-accent-foreground/70 rounded-sm">&nbsp; LegacyLock &nbsp;</span>
          </h1>

          <p className="text-xl md:text-2xl mb-12 text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            A revolutionary way to protect and pass on your most important digital assets using advanced cryptography and blockchain technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            <Link to="/dashboard">
              <Button variant="default" size="lg" className="text-lg shadow-lg hover:shadow-xl transition-shadow">
                Create Your Will
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg hover:bg-accent/10 transition-colors" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              Learn More
            </Button>
          </div>

          <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
