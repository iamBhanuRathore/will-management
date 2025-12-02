import { useWill } from "@/contexts/WillContext";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@solana/wallet-adapter-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateWillModal } from "@/components/CreateWillModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InheritWillModal } from "../InheritWillModal";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { solanaConnection } from "@/lib/solana";
import { Wallet, FileText, Clock, Shield, ArrowRight, History, User, AlertCircle, Activity } from "lucide-react";

const Dashboard = () => {
  const { myWills, beneficiaryWills, loading, fetchWills } = useWill();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(0);
  const connection = solanaConnection();

  useEffect(() => {
    if (publicKey) {
      fetchWills();
    }
  }, [publicKey, fetchWills]);

  useEffect(() => {
    async function getSolBalance() {
      if (!publicKey) return;
      try {
        const lamports = await connection.getBalance(publicKey);
        const solBalance = lamports / LAMPORTS_PER_SOL;
        setBalance(solBalance);
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance(0);
      }
    }
    getSolBalance();
  }, [publicKey]);

  const getStatusBadge = (status: string) => {
    let className = "";
    let icon = null;

    switch (status) {
      case "INITIALIZED":
        className = "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20";
        icon = <Activity className="w-3 h-3 mr-1" />;
        break;
      case "REVOKED":
        className = "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20";
        icon = <AlertCircle className="w-3 h-3 mr-1" />;
        break;
      case "CLAIMED":
        className = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20";
        icon = <Shield className="w-3 h-3 mr-1" />;
        break;
      case "EXPIRED":
        className = "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20";
        icon = <Clock className="w-3 h-3 mr-1" />;
        break;
      default:
        className = "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
    return (
      <Badge variant="outline" className={`px-2 py-0.5 transition-colors ${className}`}>
        {icon}
        {status}
      </Badge>
    );
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center space-x-4 p-4 rounded-lg bg-muted/50 animate-pulse">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );

  const StatCard = ({ title, value, icon: Icon, description, gradient, iconColor }: any) => (
    <Card className="overflow-hidden relative border-none shadow-lg hover:shadow-xl transition-all duration-300 group bg-card/50 backdrop-blur-sm">
      <div className={`absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${gradient}`}></div>
      <div className={`absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500 rotate-12`}>
        <Icon className={`h-32 w-32 ${iconColor}`} />
      </div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-xl bg-background/50 backdrop-blur-md border border-white/10 shadow-sm ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="z-10 relative">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1 font-medium">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background/50">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border/40">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your digital assets and inheritance.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1.5 gap-2 bg-background">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Devnet Connected
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          {/* Total Balance Card */}
          <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-violet-900/90 via-indigo-900/90 to-background text-white border-white/10 shadow-2xl relative overflow-hidden group">
            {/* Abstract Background Shapes */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/30 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:bg-blue-500/30 transition-all duration-700"></div>

            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-white/60 font-medium text-xs uppercase tracking-[0.2em]">Total Balance</p>
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight mt-1 font-mono">
                    {balance.toFixed(4)} <span className="text-2xl text-white/50 font-sans">SOL</span>
                  </h2>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner group-hover:bg-white/10 transition-colors">
                  <Wallet className="h-6 w-6 text-white/90" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 mt-6">
              <div className="space-y-6">
                {publicKey && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Wallet Address</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                        <span className="text-[10px] text-emerald-400 font-medium tracking-wide">Active</span>
                      </div>
                    </div>
                    <a
                      href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-black/40 hover:bg-black/50 transition-all duration-300 backdrop-blur-md border border-white/5 group/link hover:border-white/20 hover:shadow-lg"
                    >
                      <span className="font-mono text-sm tracking-wider text-white/90">
                        {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
                      </span>
                      <ArrowRight className="h-4 w-4 text-white/40 group-hover/link:text-white group-hover/link:translate-x-1 transition-all" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <StatCard title="Active Wills" value={myWills.length} icon={FileText} description="Wills you have created" gradient="bg-blue-500" iconColor="text-blue-500" />
          <StatCard
            title="Pending Inheritance"
            value={beneficiaryWills.filter((w: any) => w.status !== "CLAIMED").length}
            icon={Clock}
            description="Wills waiting for you"
            gradient="bg-purple-500"
            iconColor="text-purple-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-12 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {/* Created Wills Section */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Created Wills
                </h2>
                <p className="text-muted-foreground">Manage the wills you have created.</p>
              </div>
              <CreateWillModal />
            </div>

            <Card className="border-border/50 shadow-lg bg-card/40 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6">{renderSkeleton()}</div>
                ) : myWills.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                    <div className="p-6 bg-primary/5 rounded-full border border-primary/10 animate-pulse">
                      <FileText className="h-12 w-12 text-primary/40" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">No Wills Created Yet</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">Start securing your digital legacy by creating your first will today.</p>
                    </div>
                    <CreateWillModal />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-b border-border/50">
                          <TableHead className="font-semibold pl-6">Will Name</TableHead>
                          <TableHead className="font-semibold">Beneficiary</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="text-right font-semibold pr-6">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myWills.map((will: any) => (
                          <TableRow key={will.id} className="hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0">
                            <TableCell className="font-medium pl-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                  <FileText className="h-4 w-4" />
                                </div>
                                <span className="font-semibold">{will.willName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div title={will.beneficiaryAddress} className="flex items-center gap-2 text-muted-foreground bg-muted/30 px-2 py-1 rounded-md w-fit">
                                <User className="h-3.5 w-3.5" />
                                <span className="font-mono text-xs">{will.beneficiaryName || `${will.beneficiaryAddress.slice(0, 6)}...`}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(will.status)}</TableCell>
                            <TableCell className="text-right font-mono pr-6">
                              {will.amount ? (
                                <span className="font-bold text-foreground">
                                  {will.amount} <span className="text-xs text-muted-foreground font-normal">SOL</span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Inherited Wills Section */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <History className="h-6 w-6 text-purple-500" />
                  Inheritance
                </h2>
                <p className="text-muted-foreground">Wills assigned to you.</p>
              </div>
            </div>

            <Card className="border-border/50 shadow-lg bg-card/40 backdrop-blur-xl overflow-hidden flex flex-col">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6">{renderSkeleton()}</div>
                ) : beneficiaryWills.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                    <div className="p-6 bg-purple-500/5 rounded-full border border-purple-500/10">
                      <Clock className="h-12 w-12 text-purple-500/40" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">No Inheritance Found</h3>
                      <p className="text-muted-foreground max-w-xs mx-auto">You haven't been designated as a beneficiary in any wills yet.</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {beneficiaryWills.map((will: any) => (
                      <div key={will.id} className="p-5 hover:bg-muted/30 transition-all duration-200 group relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1.5">
                            <h4 className="font-bold text-lg flex items-center gap-2">{will.willName}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <span className="opacity-70">From:</span>
                              <span className="font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">{will.creator.username || will.creator.address.slice(0, 8)}...</span>
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(will.status)}
                            <InheritWillModal will={will} onClaimed={() => {}} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/30">
                            <Clock className="h-3.5 w-3.5 text-purple-500" />
                            <div className="flex flex-col">
                              <span className="opacity-70 text-[10px] uppercase tracking-wider">Unlock Date</span>
                              <span className="font-medium">{format(will.timeLock, "dd MMM yyyy")}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/30">
                            <Activity className="h-3.5 w-3.5 text-blue-500" />
                            <div className="flex flex-col">
                              <span className="opacity-70 text-[10px] uppercase tracking-wider">Status</span>
                              <span className="font-medium">{will.status === "CLAIMED" ? "Claimed" : "Pending"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
