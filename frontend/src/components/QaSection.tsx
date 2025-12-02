import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

const QASection = () => {
  const qaItems = [
    {
      question: "How does this actually work?",
      answer:
        "It's a simple yet powerful process. You provide a secret you wish to pass on. We use a technique called 'secret sharing' to break that secret into multiple encrypted pieces, or 'shares.' You hold some, the platform holds some, and the final piece is encrypted for your beneficiary. When your pre-set 'time lock' expires, your beneficiary can use their private key to decrypt their share and combine it with the others to reveal the original secret. It's like a digital key with multiple parts, where no single part can unlock the whole.",
    },
    {
      question: "Is my data safe?",
      answer:
        "Absolutely. Security is our highest priority. Your secret is never stored in one place. It is cryptographically split, and the pieces are distributed. The platform cannot reconstruct your secret on its own. The integrity of this process is guaranteed by the transparency and immutability of the Solana blockchain, ensuring that the rules of your will cannot be changed or tampered with.",
    },
    {
      question: "What is a 'time lock'?",
      answer:
        "A time lock is a condition you set for your will. It is a specific date and time in the future. Your beneficiary cannot claim the will or access its contents until after this time has passed. This ensures your will is executed precisely when you intend it to be.",
    },
    {
      question: "Why use blockchain for this?",
      answer:
        "The blockchain provides transparency, immutability, and decentralization. Once your will is created on the Solana blockchain, its terms cannot be altered by anyone—not by you, the platform, or any third party. This ensures that your wishes are carried out exactly as you intended, with mathematical certainty. The decentralized nature means there's no single point of failure or control.",
    },
    {
      question: "What can I store in my digital will?",
      answer:
        "You can store any sensitive information you wish to pass on: cryptocurrency wallet recovery phrases, private keys, passwords, personal messages, account credentials, or any other digital secrets. The information is encrypted and split using advanced cryptographic techniques, ensuring maximum security until it's time for your beneficiary to receive it.",
    },
  ];

  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden">
      <div className="container mx-auto max-w-4xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-sm">
            <HelpCircle className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Common Questions</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">Everything you need to know about securing your digital legacy.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card/50 border border-border/50 rounded-2xl overflow-hidden"
        >
          <Accordion type="single" collapsible className="w-full">
            {qaItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/50 last:border-0">
                <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-muted/30 transition-all group">
                  <span className="text-lg font-medium text-left pr-4 group-hover:text-primary transition-colors">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2 text-muted-foreground leading-relaxed text-base bg-muted/10">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default QASection;
