import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Clock, Feather } from "lucide-react";

const Landing = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
          Secure Your Digital Legacy
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          A decentralized application for creating and managing wills on the Solana blockchain.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link to="/login">Get Started</Link>
          </Button>
        </div>
      </div>
      <div className="container mx-auto px-4 pb-16">
        <div className="grid gap-8 md:grid-cols-3">
          <Card>
            <CardHeader className="flex items-center">
              <ShieldCheck className="w-8 h-8 mr-2 text-primary" />
              <CardTitle>Secure & Decentralized</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Built on the Solana blockchain, your wills are secure, private, and tamper-proof.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center">
              <Feather className="w-8 h-8 mr-2 text-primary" />
              <CardTitle>Easy to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Our intuitive interface makes it easy to create, manage, and inherit wills.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center">
              <Clock className="w-8 h-8 mr-2 text-primary" />
              <CardTitle>Time-locked Inheritance</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Set a time lock on your wills to ensure they are only accessible at the right time.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Landing;