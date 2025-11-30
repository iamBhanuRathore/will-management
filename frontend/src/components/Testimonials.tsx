import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Alex Chen",
    role: "Crypto Investor",
    content: "I was always worried about what would happen to my private keys if something happened to me. LegacyLock gave me peace of mind.",
    avatar: "AC",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Sarah Johnson",
    role: "Digital Artist",
    content: "The interface is so easy to use. I set up my digital will in minutes. Knowing my art portfolio is secure for my kids is priceless.",
    avatar: "SJ",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    name: "Michael Smith",
    role: "Software Engineer",
    content: "As a developer, I appreciate the technical details. Shamir's Secret Sharing on Solana is the perfect use case for this.",
    avatar: "MS",
    gradient: "from-purple-500 to-indigo-500",
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 px-4 bg-secondary/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Early Adopters</h2>
          <p className="text-xl text-muted-foreground">See what others are saying about LegacyLock</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2 border-transparent hover:border-primary/20 shadow-lg bg-card relative overflow-hidden group transition-all duration-300 hover:shadow-2xl">
              {/* Gradient border effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg`} />

              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Quote className="w-24 h-24 text-foreground" />
              </div>
              <CardHeader className="flex flex-row items-center gap-4 pb-2 relative z-10">
                <div className={`p-0.5 rounded-full bg-gradient-to-br ${testimonial.gradient}`}>
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.name}`} />
                    <AvatarFallback className={`bg-gradient-to-br ${testimonial.gradient} text-white`}>{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-muted-foreground italic">"{testimonial.content}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
