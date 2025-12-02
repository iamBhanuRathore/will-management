import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote, Star } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Alex Chen",
    role: "Crypto Investor",
    content: "I was always worried about what would happen to my private keys if something happened to me. LegacyLock gave me peace of mind.",
    avatar: "AC",
    rating: 5,
  },
  {
    name: "Sarah Johnson",
    role: "Digital Artist",
    content: "The interface is so easy to use. I set up my digital will in minutes. Knowing my art portfolio is secure for my kids is priceless.",
    avatar: "SJ",
    rating: 5,
  },
  {
    name: "Michael Smith",
    role: "Software Engineer",
    content: "As a developer, I appreciate the technical details. Shamir's Secret Sharing on Solana is the perfect use case for this.",
    avatar: "MS",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 px-4 bg-background/50 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-sm">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trusted by Early Adopters</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">What People Are Saying</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Join thousands who trust LegacyLock to protect their digital legacy.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}>
              <Card className="h-full border-border/50 bg-card/50 hover:bg-card hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Quote className="w-12 h-12 text-primary" />
                </div>

                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.name}`} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-sm">{testimonial.name}</h4>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-sm">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
