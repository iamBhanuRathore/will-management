import { ShieldCheck, Lock, Server, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: <ShieldCheck className="w-8 h-8" />,
    title: "Bank-Grade Encryption",
    description: "Your data is encrypted with AES-256 before it ever leaves your device. We never see your raw data.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: <Lock className="w-8 h-8" />,
    title: "Shamir's Secret Sharing",
    description: "Your key is split into multiple parts. No single part can unlock your will. It requires a threshold to reconstruct.",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    icon: <Server className="w-8 h-8" />,
    title: "Decentralized Storage",
    description: "Encrypted shares are distributed across the Solana blockchain, ensuring no single point of failure.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: <Eye className="w-8 h-8" />,
    title: "Transparent Code",
    description: "Our smart contracts are open-source and verified. You can inspect exactly how your will is handled.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
];

const SecuritySection = () => {
  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-sm">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Uncompromised Security</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Your Trust, Our Priority</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">State-of-the-art cryptography and blockchain technology ensure your digital legacy is safe, private, and immutable.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}>
              <Card className="h-full border-border/50 bg-card/50 hover:bg-card hover:shadow-md transition-all duration-300 group">
                <CardHeader>
                  <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <div className={`${feature.color}`}>{feature.icon}</div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
