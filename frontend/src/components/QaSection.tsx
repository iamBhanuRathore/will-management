import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

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
    <section className="py-20 px-4 bg-gradient-to-b from-secondary/20 to-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
            <MessageCircle className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Common Questions</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Frequently Asked Questions</h2>
          <p className="text-xl text-muted-foreground">Everything you need to know about securing your digital legacy</p>
        </div>

        <Card className="border border-border shadow-lg hover:shadow-xl transition-shadow">
          <Accordion type="single" collapsible className="w-full">
            {qaItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border last:border-0">
                <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-primary/5 transition-colors">
                  <span className="text-lg font-semibold text-left">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-muted-foreground leading-relaxed text-base">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </div>
    </section>
  );
};

export default QASection;
