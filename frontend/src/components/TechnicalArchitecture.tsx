import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Server, User, Users, Lock, Unlock, Database, Key, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const TechnicalArchitecture = () => {
  return (
    <section className="py-20 px-4 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 mb-6 rounded-full glass-effect border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Under The Hood</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">Split-Server Trust Architecture</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We use a <span className="text-primary font-semibold">3-out-of-4 Shamir's Secret Sharing</span> threshold to ensure no single party can ever access your data unilaterally.
          </p>
        </motion.div>

        {/* Visual Architecture Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {/* User Node */}
          <Card className="relative overflow-hidden border-primary/20 bg-card/50 backdrop-blur-sm group hover:border-primary/40 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <CardHeader className="text-center pb-2">
              <div className="mx-auto p-3 bg-blue-500/10 rounded-full w-fit mb-2 group-hover:scale-110 transition-transform duration-300">
                <User className="w-8 h-8 text-blue-500" />
              </div>
              <CardTitle className="text-lg">The User</CardTitle>
              <Badge variant="secondary" className="mt-2 bg-blue-500/10 text-blue-500 border-blue-500/20">
                Holds 1 Share
              </Badge>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">Initiates will creation and can revoke access anytime. Cannot recover funds without platform participation.</CardContent>
          </Card>

          {/* Platform Node (Central) */}
          <Card className="relative overflow-hidden border-purple-500/20 bg-card/50 backdrop-blur-sm group hover:border-purple-500/40 transition-colors lg:-mt-8 z-10 shadow-2xl shadow-purple-500/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
            <CardHeader className="text-center pb-2">
              <div className="mx-auto p-4 bg-purple-500/10 rounded-full w-fit mb-2 group-hover:scale-110 transition-transform duration-300">
                <Server className="w-10 h-10 text-purple-500" />
              </div>
              <CardTitle className="text-xl">Platform Server</CardTitle>
              <Badge variant="secondary" className="mt-2 bg-purple-500/10 text-purple-500 border-purple-500/20">
                Holds 2 Shares
              </Badge>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">Acts as a mandatory gatekeeper and auditor. Holds 2 shares but needs 1 more to reconstruct anything.</CardContent>
          </Card>

          {/* Beneficiary Node */}
          <Card className="relative overflow-hidden border-emerald-500/20 bg-card/50 backdrop-blur-sm group hover:border-emerald-500/40 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
            <CardHeader className="text-center pb-2">
              <div className="mx-auto p-3 bg-emerald-500/10 rounded-full w-fit mb-2 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-emerald-500" />
              </div>
              <CardTitle className="text-lg">The Beneficiary</CardTitle>
              <Badge variant="secondary" className="mt-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                Holds 1 Share
              </Badge>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">Can only claim inheritance after the time-lock expires and platform validation succeeds.</CardContent>
          </Card>
        </div>

        {/* Data Flow Visualization */}
        <div className="mb-20 p-8 rounded-2xl bg-secondary/20 border border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
          <h3 className="text-2xl font-bold mb-8 text-center flex items-center justify-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Secure Data Flow
          </h3>

          <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center max-w-[200px] relative z-10">
              <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-4 shadow-sm">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">1. Secret Input</h4>
              <p className="text-xs text-muted-foreground">User inputs seed phrase. It is never stored in plain text.</p>
            </div>

            {/* Arrow 1 */}
            <div className="hidden md:flex flex-1 h-0.5 bg-gradient-to-r from-border to-primary/50 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary/50 rotate-45 transform translate-x-1" />
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center max-w-[200px] relative z-10">
              <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-4 shadow-sm">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <h4 className="font-semibold mb-2">2. MPC Splitting</h4>
              <p className="text-xs text-muted-foreground">Secret is split into 4 shares using Shamir's Secret Sharing.</p>
            </div>

            {/* Arrow 2 */}
            <div className="hidden md:flex flex-1 h-0.5 bg-gradient-to-r from-primary/50 to-border relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-border rotate-45 transform translate-x-1" />
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center max-w-[200px] relative z-10">
              <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-4 shadow-sm">
                <Lock className="w-6 h-6 text-emerald-500" />
              </div>
              <h4 className="font-semibold mb-2">3. Distributed Storage</h4>
              <p className="text-xs text-muted-foreground">Shares are encrypted and distributed. No single point of failure.</p>
            </div>
          </div>
        </div>

        {/* Access Control Matrix */}
        <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-lg">
          <div className="p-6 bg-muted/30 border-b border-border">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Security Guarantee Matrix
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Why your data is mathematically secure against attacks.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Scenario</th>
                  <th className="px-6 py-4 font-semibold text-center">User Share (1)</th>
                  <th className="px-6 py-4 font-semibold text-center">Beneficiary Share (1)</th>
                  <th className="px-6 py-4 font-semibold text-center">Server Shares (2)</th>
                  <th className="px-6 py-4 font-semibold text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="bg-card hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium">User Solo Recovery</td>
                  <td className="px-6 py-4 text-center text-emerald-500">✓</td>
                  <td className="px-6 py-4 text-center text-muted-foreground/30">✗</td>
                  <td className="px-6 py-4 text-center text-muted-foreground/30">✗</td>
                  <td className="px-6 py-4 text-right font-bold text-red-500 flex items-center justify-end gap-2">
                    <Lock className="w-4 h-4" /> FAIL (1/3)
                  </td>
                </tr>
                <tr className="bg-card hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium">Beneficiary Early Claim</td>
                  <td className="px-6 py-4 text-center text-muted-foreground/30">✗</td>
                  <td className="px-6 py-4 text-center text-emerald-500">✓</td>
                  <td className="px-6 py-4 text-center text-muted-foreground/30">✗</td>
                  <td className="px-6 py-4 text-right font-bold text-red-500 flex items-center justify-end gap-2">
                    <Lock className="w-4 h-4" /> FAIL (1/3)
                  </td>
                </tr>
                <tr className="bg-card hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium">Collusion (User + Ben)</td>
                  <td className="px-6 py-4 text-center text-emerald-500">✓</td>
                  <td className="px-6 py-4 text-center text-emerald-500">✓</td>
                  <td className="px-6 py-4 text-center text-muted-foreground/30">✗</td>
                  <td className="px-6 py-4 text-right font-bold text-red-500 flex items-center justify-end gap-2">
                    <Lock className="w-4 h-4" /> FAIL (2/3)
                  </td>
                </tr>
                <tr className="bg-primary/5 hover:bg-primary/10 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary">Legitimate Recovery</td>
                  <td className="px-6 py-4 text-center text-emerald-500">✓</td>
                  <td className="px-6 py-4 text-center text-muted-foreground/30">✗</td>
                  <td className="px-6 py-4 text-center text-emerald-500">✓✓</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-500 flex items-center justify-end gap-2">
                    <Unlock className="w-4 h-4" /> SUCCESS (3/3)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnicalArchitecture;
