import { ShieldCheck, Lock, Server, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: <ShieldCheck className="w-10 h-10 text-primary" />,
    title: "Bank-Grade Encryption",
    description: "Your data is encrypted with AES-256 before it ever leaves your device. We never see your raw data.",
    gradient: "from-green-500 to-emerald-600",
    textGradient: "from-green-400 to-emerald-500",
  },
  {
    icon: <Lock className="w-10 h-10 text-primary" />,
    title: "Shamir's Secret Sharing",
    description: "Your key is split into multiple parts. No single part can unlock your will. It requires a threshold to reconstruct.",
    gradient: "from-violet-500 to-purple-600",
    textGradient: "from-violet-400 to-purple-500",
  },
  {
    icon: <Server className="w-10 h-10 text-primary" />,
    title: "Decentralized Storage",
    description: "Encrypted shares are distributed across the Solana blockchain, ensuring no single point of failure.",
    gradient: "from-blue-500 to-indigo-600",
    textGradient: "from-blue-400 to-indigo-500",
  },
  {
    icon: <Eye className="w-10 h-10 text-primary" />,
    title: "Transparent Code",
    description: "Our smart contracts are open-source and verified. You can inspect exactly how your will is handled.",
    gradient: "from-amber-500 to-orange-600",
    textGradient: "from-amber-400 to-orange-500",
  },
];

const SecuritySection = () => {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/10 border border-primary/20">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Uncompromised Security</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Trust, Our Priority</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We use state-of-the-art cryptography and blockchain technology to ensure your digital legacy is safe, private, and immutable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm hover:shadow-xl group overflow-hidden relative">
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient}`} />

              <CardHeader>
                <div className={`mb-4 p-3 rounded-lg bg-gradient-to-br ${feature.gradient} bg-opacity-10 w-fit group-hover:scale-110 transition-transform duration-300`}>
                  <div className={`text-transparent bg-clip-text bg-gradient-to-br ${feature.textGradient}`}>{feature.icon}</div>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
