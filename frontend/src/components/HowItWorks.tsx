import { Wallet, FileKey, UserCheck, Clock } from "lucide-react";

const steps = [
  {
    icon: <Wallet className="w-8 h-8 text-primary" />,
    title: "Connect Wallet",
    description: "Connect your Solana wallet to securely interact with the blockchain.",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    icon: <FileKey className="w-8 h-8 text-primary" />,
    title: "Create Will",
    description: "Draft your digital will and encrypt your secrets using advanced cryptography.",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-500/10 to-pink-500/10",
  },
  {
    icon: <UserCheck className="w-8 h-8 text-primary" />,
    title: "Assign Beneficiaries",
    description: "Designate who will receive your assets and when they can access them.",
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/10 to-teal-500/10",
  },
  {
    icon: <Clock className="w-8 h-8 text-primary" />,
    title: "Set Time Lock",
    description: "Your will remains sealed until the specified time has passed.",
    gradient: "from-orange-500 to-amber-500",
    bgGradient: "from-orange-500/10 to-amber-500/10",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-secondary/30 via-secondary/10 to-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.1),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(var(--accent)/0.05),_transparent_50%)]" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">How It Works</h2>
          <p className="text-xl text-muted-foreground">Secure your legacy in four simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-8 left-[12.5%] w-[75%] h-0.5 bg-gradient-to-r from-blue-500/50 via-purple-500/50 via-emerald-500/50 to-orange-500/50 -z-10 -translate-y-1/2" />

          {steps.map((step, index) => (
            <div key={index} className="relative flex flex-col items-center text-center group">
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.bgGradient} border-2 border-transparent flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 z-10 relative backdrop-blur-sm`}
              >
                <div className={`text-transparent bg-clip-text bg-gradient-to-br ${step.gradient}`}>{step.icon}</div>
                <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br ${step.gradient} text-white flex items-center justify-center text-sm font-bold shadow-md`}>
                  {index + 1}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
