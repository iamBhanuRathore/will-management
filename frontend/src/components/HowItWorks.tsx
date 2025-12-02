import { Wallet, FileKey, UserCheck, Clock } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: <Wallet className="w-6 h-6" />,
    title: "Connect Wallet",
    description: "Connect your Solana wallet to securely interact with the blockchain.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    icon: <FileKey className="w-6 h-6" />,
    title: "Create Will",
    description: "Draft your digital will and encrypt your secrets using advanced cryptography.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  {
    icon: <UserCheck className="w-6 h-6" />,
    title: "Assign Beneficiaries",
    description: "Designate who will receive your assets and when they can access them.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Set Time Lock",
    description: "Your will remains sealed until the specified time has passed.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden">
      {/* Subtle Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Simple Process</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Secure your legacy in four simple, secure steps.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-border via-border to-border" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative flex flex-col items-center text-center group"
            >
              <div
                className={`relative z-10 w-24 h-24 rounded-2xl ${step.bgColor} ${step.borderColor} border flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg`}
              >
                <div className={`${step.color}`}>{step.icon}</div>
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-sm font-bold shadow-sm">{index + 1}</div>
              </div>

              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm px-4">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
