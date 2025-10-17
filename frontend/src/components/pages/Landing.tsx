import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Landing = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
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
            <CardHeader>
              <CardTitle>Secure & Decentralized</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Built on the Solana blockchain, your wills are secure, private, and tamper-proof.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Easy to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Our intuitive interface makes it easy to create, manage, and inherit wills.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
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