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
import { Wallet, FileText, Clock, Shield, ArrowRight, History, User, AlertCircle } from "lucide-react";

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
    let variant: "default" | "destructive" | "outline" | "secondary" = "default";
    let className = "";

    switch (status) {
      case "INITIALIZED":
        variant = "default";
        className = "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20";
        break;
      case "REVOKED":
        variant = "destructive";
        className = "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20";
        break;
      case "CLAIMED":
        variant = "outline";
        className = "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20";
        break;
      case "EXPIRED":
        variant = "secondary";
        className = "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20";
        break;
      default:
        variant = "default";
    }
    return (
      <Badge variant={variant} className={className}>
        {status}
      </Badge>
    );
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );

  const StatCard = ({ title, value, icon: Icon, description, gradient }: any) => (
    <Card className="overflow-hidden relative border-none shadow-lg hover:shadow-xl transition-all duration-300">
      <div className={`absolute inset-0 opacity-10 ${gradient}`}></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground z-10">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground z-10" />
      </CardHeader>
      <CardContent className="z-10 relative">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-8 min-h-screen bg-background/50 bg-grid-pattern">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">Dashboard</h1>
          <p className="text-muted-foreground text-lg">Manage your digital legacy and inheritance securely.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-sm bg-background/50 backdrop-blur">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Devnet Connected
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-primary/90 to-purple-600/90 text-primary-foreground border-none shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute -right-10 -top-10 h-64 w-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
          <CardHeader>
            <CardTitle className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-primary-foreground/80 font-medium">Total Balance</p>
                <h2 className="text-4xl font-bold tracking-tight">{balance.toFixed(4)} SOL</h2>
              </div>
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                <Wallet className="h-6 w-6 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80 bg-black/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Wallet Connected
              </div>
              {publicKey && (
                <div className="space-y-1">
                  <p className="text-xs text-primary-foreground/60 uppercase tracking-wider">Wallet Address</p>
                  <a
                    href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono hover:text-white transition-colors flex items-center gap-2 opacity-90 hover:opacity-100"
                  >
                    {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <StatCard title="Active Wills" value={myWills.length} icon={FileText} description="Wills you have created" gradient="bg-blue-500" />
        <StatCard title="Pending Inheritance" value={beneficiaryWills.filter((w: any) => w.status !== "CLAIMED").length} icon={Clock} description="Wills waiting for you" gradient="bg-purple-500" />
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
              <p className="text-muted-foreground">Manage the wills you have created for your beneficiaries.</p>
            </div>
            <CreateWillModal />
          </div>

          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6">{renderSkeleton()}</div>
              ) : myWills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="p-4 bg-primary/5 rounded-full">
                    <FileText className="h-12 w-12 text-primary/40" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No Wills Created Yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">Start securing your digital legacy by creating your first will today.</p>
                  </div>
                  <CreateWillModal />
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-semibold">Will Name</TableHead>
                        <TableHead className="font-semibold">Beneficiary</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myWills.map((will: any) => (
                        <TableRow key={will.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-primary/10 rounded-md">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              {will.willName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span className="font-mono text-xs">{will.beneficiaryName || `${will.beneficiaryAddress.slice(0, 6)}...`}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(will.status)}</TableCell>
                          <TableCell className="text-right font-mono">{will.amount ? `${will.amount} SOL` : "-"}</TableCell>
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
                <History className="h-6 w-6 text-purple-600" />
                Inheritance
              </h2>
              <p className="text-muted-foreground">Wills assigned to you.</p>
            </div>
          </div>

          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm h-full">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6">{renderSkeleton()}</div>
              ) : beneficiaryWills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="p-4 bg-purple-500/5 rounded-full">
                    <Clock className="h-12 w-12 text-purple-500/40" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No Inheritance Found</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">You haven't been designated as a beneficiary in any wills yet.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {beneficiaryWills.map((will: any) => (
                    <div key={will.id} className="p-4 hover:bg-muted/50 transition-all duration-200 group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-base flex items-center gap-2">
                            {will.willName}
                            {getStatusBadge(will.status)}
                          </h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            From: <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{will.creator.username || will.creator.address.slice(0, 8)}...</span>
                          </p>
                        </div>
                        <InheritWillModal will={will} onClaimed={() => {}} />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Unlock: {format(will.timeLock, "dd MMM yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>{will.status === "CLAIMED" ? "Claimed" : "Pending"}</span>
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
  );
};

export default Dashboard;
