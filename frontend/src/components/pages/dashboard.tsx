import { useWill } from "@/contexts/WillContext";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@solana/wallet-adapter-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateWillModal } from "@/components/CreateWillModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import useCopyToClipboard from "@/hooks/use-copy-to-clipboard";
import { Check, Copy } from "lucide-react";

const Dashboard = () => {
  const { myWills, beneficiaryWills, loading, fetchWills, inheritWill } = useWill();
  const { publicKey } = useWallet();
  const [claimedShare, setClaimedShare] = useState<any>(null);
  const [_, copy] = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (publicKey) {
      fetchWills();
    }
  }, [publicKey, fetchWills]);

  const handleInherit = async (willId: string) => {
    try {
      const data = await inheritWill(willId);
      setClaimedShare(data);
      setIsCopied(false);
    } catch (error) {
      // Error is already logged in context
    }
  };

  const handleCopy = (text: string) => {
    copy(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getStatusBadge = (will: any) => {
    if (will.isClaimed) {
      return <Badge variant="destructive">Claimed</Badge>;
    }
    if (will.isRevoked) {
      return <Badge variant="secondary">Revoked</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Manage your digital legacy with ease.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Wallet Information</CardTitle>
          </CardHeader>
          <CardContent>
            {publicKey ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Your wallet address:</p>
                <a
                  href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline break-all"
                >
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
            <CardTitle>My Created Wills</CardTitle>
            <CardDescription>These are the wills you have created for others.</CardDescription>
          </div>
          <CreateWillModal />
        </CardHeader>
        <CardContent>
          {loading ? (
            renderSkeleton()
          ) : myWills.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">You haven't created any wills yet.</p>
              <CreateWillModal>
                <Button variant="link" className="mt-2">
                  Create a Will
                </Button>
              </CreateWillModal>
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
                    <TableCell>{will.beneficiaryName}</TableCell>
                    <TableCell>{getStatusBadge(will)}</TableCell>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beneficiaryWills.map((will: any) => (
                  <TableRow key={will.id}>
                    <TableCell>{will.willName}</TableCell>
                    <TableCell>{will.creator.username || will.creator.address}</TableCell>
                    <TableCell>{getStatusBadge(will)}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => handleInherit(will.id)}
                            disabled={will.isClaimed || will.isRevoked || new Date() < new Date(will.timeLock)}
                          >
                            Claim
                          </Button>
                        </DialogTrigger>
                        {claimedShare && (
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Inheritance Claimed</DialogTitle>
                              <DialogDescription>
                                Here is the secret share from the platform. Keep it safe.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 space-y-4">
                              <div className="bg-muted p-4 rounded-md relative">
                                <pre className="break-all text-sm">
                                  <code>{JSON.stringify(claimedShare, null, 2)}</code>
                                </pre>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 h-8 w-8"
                                  onClick={() => handleCopy(JSON.stringify(claimedShare, null, 2))}
                                >
                                  {isCopied ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>
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
