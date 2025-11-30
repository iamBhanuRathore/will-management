import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWill } from "@/contexts/WillContext";
import { Textarea } from "@/components/ui/textarea";
import { addYears, format, isValid } from "date-fns";

const getUpdateDate = (): Date => {
  return addYears(new Date(), 1);
};

export function CreateWillModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 💡 Initialize with valid test data
  const [willName, setWillName] = useState("");
  const [willDescription, setWillDescription] = useState("");
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("");

  // State holds the Date object
  const [timeLock, setTimeLock] = useState<Date>(getUpdateDate());

  const [secret, setSecret] = useState("");
  const { createWill } = useWill();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    try {
      await createWill({
        willName,
        willDescription,
        beneficiaryAddress,
        timeLock,
        secret,
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create will", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            <Input required id="willName" value={willName} onChange={(e) => setWillName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="willDescription">Description</Label>
            <Input required id="willDescription" value={willDescription} onChange={(e) => setWillDescription(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="beneficiaryAddress">Beneficiary Address</Label>
            <Input required id="beneficiaryAddress" value={beneficiaryAddress} onChange={(e) => setBeneficiaryAddress(e.target.value)} />
          </div>
          <Label htmlFor="timeLock">Time Lock (Date)</Label>
          <Input
            required
            id="timeLock"
            type="datetime-local"
            value={isValid(timeLock) ? format(timeLock, "yyyy-MM-dd'T'HH:mm") : ""}
            min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              if (isValid(newDate)) {
                setTimeLock(newDate);
              }
            }}
          />
          <div className="col-span-2">
            <Label htmlFor="secret">Wallet Secret</Label>
            <Textarea required rows={3} id="secret" value={secret} onChange={(e) => setSecret(e.target.value)} />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Will"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
