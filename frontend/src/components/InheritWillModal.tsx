import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useWill } from "@/contexts/WillContext";
import { Check, Copy } from "lucide-react";
import useCopyToClipboard from "@/hooks/use-copy-to-clipboard";
// import { useProgram } from "@/lib/program";
// import { web3 } from "@coral-xyz/anchor";
// import { useWallet } from "@solana/wallet-adapter-react";

export const InheritWillModal = ({ will, onClaimed }: any) => {
  const [privateKey, setPrivateKey] = useState("");
  // const { program } = useProgram();
  // const { publicKey } = useWallet();
  const { inheritWill } = useWill();
  const [claimedShare, setClaimedShare] = useState<any>(null);
  const { copy, isCopied } = useCopyToClipboard();
  const [isOpen, setIsOpen] = useState(false);
  const handleInherit = async () => {
    // const [willPda] = web3.PublicKey.findProgramAddressSync([new web3.PublicKey(will.creator.address).toBuffer(), Buffer.from(will.willName)], program.programId);
    // console.log(willPda);
    // const acc = await (program.account as any).willAccount.fetch(willPda);
    // console.log(acc);
    // const sig = await program.methods
    //   .claimWill()
    //   .accounts({
    //     will: willPda,
    //     beneficiary: publicKey!,
    //   })
    //   .rpc();

    // console.log("claim_will tx:", sig);
    // then fetch the decrypted secret
    const data = await inheritWill(will.id, privateKey);
    setClaimedShare(data);
    onClaimed();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} disabled={new Date() < new Date(will.timeLock)}>
          Claim
        </Button>
      </DialogTrigger>
      {claimedShare ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inheritance Claimed</DialogTitle>
            <DialogDescription>Here is the secret share from the platform. Keep it safe.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="bg-muted p-4 rounded-md relative">
              <pre className="whitespace-pre-wrap break-all text-sm">
                <code>{claimedShare.originalSecret}</code>
              </pre>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => copy(claimedShare.originalSecret)}>
                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      ) : (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Private Key</DialogTitle>
            <DialogDescription>To claim the inheritance, please enter your private key to decrypt the will's secret.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="privateKey">Private Key</Label>
              <Input id="privateKey" type="password" value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} placeholder="Enter your private key" />
            </div>
            <Button onClick={handleInherit}>Decrypt and Claim</Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
