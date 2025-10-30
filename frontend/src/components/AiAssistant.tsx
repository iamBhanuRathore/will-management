import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Sparkles } from "lucide-react";

const AIAssistant = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Meet Your Digital Guide</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">The Archivist</h2>
          <p className="text-xl text-muted-foreground">Your trusted custodian of digital legacies</p>
        </div>

        <Card className="border border-border shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="space-y-4 bg-gradient-to-br from-card to-secondary/20">
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                <Bot className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Welcome. I am The Archivist.</CardTitle>
                <CardDescription className="text-base text-muted-foreground">Your guide to securing a digital legacy</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <p className="text-foreground/90 leading-relaxed text-base">
                In our digital world, what happens to our most important online assets, secrets, and messages when we are no longer here to manage them? This platform was created to answer that
                question.
              </p>

              <p className="text-foreground/90 leading-relaxed text-base">
                Here, you can create a secure digital will, time-locked and protected by the power of the Solana blockchain and advanced cryptography. It is a modern solution for a timeless need:
                ensuring your legacy is passed on safely and according to your wishes.
              </p>

              <p className="text-foreground/90 leading-relaxed text-base">
                Your privacy and security are the cornerstones of this service. Your secrets are split and encrypted in such a way that no one—not even I or the platform administrators—can access
                them. Only your designated beneficiary can, and only after the time you've set.
              </p>

              <p className="text-foreground leading-relaxed text-base font-medium">Feel free to ask me anything, or select "Create New Will" to begin.</p>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Core Identity
              </h3>
              <p className="text-muted-foreground leading-relaxed text-base">
                I am The Archivist, a digital custodian dedicated to the preservation and secure transfer of your most important digital legacies. My purpose is to provide a sanctuary for your
                sensitive information, ensuring it is passed on to your chosen beneficiary at the exact moment you intend. I operate on principles of absolute security, cryptographic certainty, and
                profound respect for the legacies you entrust to this platform.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AIAssistant;
