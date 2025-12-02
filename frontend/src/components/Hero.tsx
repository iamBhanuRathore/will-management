import { Button } from "@/components/ui/button";
import { Shield, Clock, Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const features = [
  {
    icon: <Lock className="w-6 h-6 text-violet-500" />,
    title: "Cryptographically Secure",
    description: "Your secrets are split and encrypted, ensuring absolute privacy.",
  },
  {
    icon: <Clock className="w-6 h-6 text-blue-500" />,
    title: "Time-Locked",
    description: "Set the exact moment your will becomes accessible.",
  },
  {
    icon: <Shield className="w-6 h-6 text-emerald-500" />,
    title: "Decentralized",
    description: "No single point of failure or control.",
  },
];

const Hero = () => {
  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Clean, Subtle Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-violet-500 opacity-20 blur-[100px]" />

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            <span className="text-sm font-medium text-muted-foreground">Secured by Solana Blockchain</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight"
          >
            Secure Your Digital
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500">Legacy Forever</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl mb-12 text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light"
          >
            The most secure way to protect and pass on your digital assets.
            <br className="hidden md:block" />
            Powered by <span className="text-foreground font-medium">Shamir's Secret Sharing</span> and <span className="text-foreground font-medium">Blockchain</span>.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="flex flex-col sm:flex-row gap-4 justify-center mb-24">
            <Link to="/dashboard">
              <Button size="lg" className="text-lg px-8 py-6 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105">
                <Sparkles className="w-5 h-5 mr-2" />
                Create Your Will
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 rounded-full border-2 hover:bg-secondary/50 transition-all hover:scale-105"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              Learn How It Works
            </Button>
          </motion.div>

          <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-violet-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/5"
              >
                <div className="mb-4 inline-block p-3 rounded-xl bg-secondary group-hover:bg-violet-500/10 transition-colors">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
