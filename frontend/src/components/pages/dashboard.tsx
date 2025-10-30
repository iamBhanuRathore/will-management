import { useWill } from "@/contexts/WillContext";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@solana/wallet-adapter-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateWillModal } from "@/components/CreateWillModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InheritWillModal } from "../InheritWillModal";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { solanaConnection } from "@/lib/solana";
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

  const getStatusBadge = (status: string) => {
    let variant: "default" | "destructive" | "outline" | "secondary" = "default";
    if (status === "INITIALIZED") {
      variant = "default";
    } else if (status === "REVOKED") {
      variant = "destructive";
    } else if (status === "CLAIMED") {
      variant = "outline";
    } else if (status === "EXPIRED") {
      variant = "secondary";
    } else {
      variant = "default";
    }
    return <Badge variant={variant}>{status}</Badge>;
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
  useEffect(() => {
    async function getSolBalance() {
      if (!publicKey) return;
      try {
        // 3. Call getBalance
        const lamports = await connection.getBalance(publicKey);

        // Convert lamports to SOL
        const solBalance = lamports / LAMPORTS_PER_SOL;

        console.log(`Balance in Lamports: ${lamports}`);
        console.log(`Balance in SOL: ${solBalance}`);
        setBalance(solBalance);
      } catch (error) {
        console.error("Error fetching balance:", error);
        return 0;
      }
    }
    getSolBalance();
  }, [publicKey]);
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Manage your digital legacy with ease.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex justify-between">
              <p>Wallet Information</p>
              <p>{balance}</p>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {publicKey ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Your wallet address:</p>
                <a href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
                  {publicKey.toBase58()}
                </a>
              </div>
            ) : (
              <p>Wallet not connected.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="mb-2">My Created Wills</CardTitle>
            <CardDescription>These are the wills you have created for others.</CardDescription>
          </div>
          <CreateWillModal />
        </CardHeader>
        <CardContent>
          {loading ? (
            renderSkeleton()
          ) : myWills.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-5">You haven't created any wills yet.</p> <CreateWillModal />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Will Name</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myWills.map((will: any) => (
                  <TableRow key={will.id}>
                    <TableCell>{will.willName}</TableCell>
                    <TableCell>{will.beneficiaryName || will.beneficiaryAddress}</TableCell>
                    <TableCell>{getStatusBadge(will.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wills for Me</CardTitle>
          <CardDescription>These are the wills that have been created for you.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            renderSkeleton()
          ) : beneficiaryWills.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No wills have been created for you yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Will Name</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>TimeLock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beneficiaryWills.map((will: any) => (
                  <TableRow key={will.id}>
                    <TableCell>{will.willName}</TableCell>
                    <TableCell>{will.creator.username || will.creator.address}</TableCell>
                    <TableCell>{getStatusBadge(will.status)}</TableCell>
                    <TableCell>{format(will.timeLock, "dd-MMM-yyyy hh:mm:ss")}</TableCell>
                    <TableCell>
                      <InheritWillModal will={will} onClaimed={() => {}} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
