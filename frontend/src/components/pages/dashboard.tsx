import { useWill } from "@/contexts/WillContext";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@solana/wallet-adapter-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateWillModal } from "@/components/CreateWillModal";

const Dashboard = () => {
  const { myWills, beneficiaryWills, loading, fetchWills, inheritWill } = useWill();
  const { publicKey } = useWallet();
  const [claimedShare, setClaimedShare] = useState<any>(null);

  useEffect(() => {
    if (publicKey) {
      fetchWills();
    }
  }, [publicKey, fetchWills]);

  const handleInherit = async (willId: string) => {
    try {
      const data = await inheritWill(willId);
      setClaimedShare(data);
    } catch (error) {
      // Error is already logged in context
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wallet Information</CardTitle>
        </CardHeader>
        <CardContent>
          {publicKey ? (
            <p className="break-all">
              Your wallet address:{" "}
              <a
                href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {publicKey.toBase58()}
              </a>
            </p>
          ) : (
            <p>Wallet not connected.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Created Wills</CardTitle>
          <CreateWillModal />
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
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
                    <TableCell>
                      {will.isClaimed ? "Claimed" : will.isRevoked ? "Revoked" : "Active"}
                    </TableCell>
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
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
                    <TableCell>
                      {will.isClaimed ? "Claimed" : will.isRevoked ? "Revoked" : "Active"}
                    </TableCell>
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
                              <DialogTitle>Inherited Share</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 space-y-2 break-all">
                              <p>Here is the secret share from the platform:</p>
                              <pre className="bg-muted p-2 rounded-md"><code>{JSON.stringify(claimedShare, null, 2)}</code></pre>
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
