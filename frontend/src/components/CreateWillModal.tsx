import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,  DialogContent,  DialogHeader,  DialogTitle,  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWill } from "@/contexts/WillContext";

export function CreateWillModal() {
  const [willName, setWillName] = useState("");
  const [willDescription, setWillDescription] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("");
  const [timeLock, setTimeLock] = useState("");
  const { createWill } = useWill();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWill({
        willName,
        willDescription,
        beneficiaryName,
        beneficiaryAddress,
        timeLock,
      });
      // Close modal and refresh list
    } catch (error) {
      console.error("Failed to create will", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create New Will</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Will</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="willName">Will Name</Label>
            <Input id="willName" value={willName} onChange={(e) => setWillName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="willDescription">Description</Label>
            <Input id="willDescription" value={willDescription} onChange={(e) => setWillDescription(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="beneficiaryName">Beneficiary Name</Label>
            <Input id="beneficiaryName" value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="beneficiaryAddress">Beneficiary Address</Label>
            <Input id="beneficiaryAddress" value={beneficiaryAddress} onChange={(e) => setBeneficiaryAddress(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="timeLock">Time Lock (Date)</Label>
            <Input id="timeLock" type="date" value={timeLock} onChange={(e) => setTimeLock(e.target.value)} />
          </div>
          <Button type="submit">Create Will</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
