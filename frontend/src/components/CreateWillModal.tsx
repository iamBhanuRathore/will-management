import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWill } from "@/contexts/WillContext";
import { Textarea } from "@/components/ui/textarea";
import { format, addMinutes, addDays } from "date-fns";

const DATETIME_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm";

const getUpdateDate = (): Date => {
  // return addDays(new Date(), 1);
  return addMinutes(new Date(), 1);
};

const formatTimeLock = (date: Date): string => {
  return format(date, DATETIME_LOCAL_FORMAT);
};

export function CreateWillModal() {
  const [isOpen, setIsOpen] = useState(false);

  // 💡 Initialize with valid test data
  const [willName, setWillName] = useState("testing");
  const [willDescription, setWillDescription] = useState("Description Testing");
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("6XCVkH9GbxjNTpjwvWXFEHteMsyak3VKFTc5sQc2udHX");

  // State holds the Date object
  const [timeLock, setTimeLock] = useState<Date>(getUpdateDate());
  // The minimum date string for the 'min' attribute
  const minTimeString = formatTimeLock(getUpdateDate());

  const [secret, setSecret] = useState("Secret to be Tested");
  const { createWill } = useWill();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWill({
        willName,
        willDescription,
        beneficiaryAddress,
        // timeLock is already a Date object
        timeLock,
        secret,
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create will", error);
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
            <Input id="willName" value={willName} onChange={(e) => setWillName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="willDescription">Description</Label>
            <Input id="willDescription" value={willDescription} onChange={(e) => setWillDescription(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="beneficiaryAddress">Beneficiary Address</Label>
            <Input required id="beneficiaryAddress" value={beneficiaryAddress} onChange={(e) => setBeneficiaryAddress(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="timeLock">Time Lock (Date)</Label>
            <Input
              required
              id="timeLock"
              type="datetime-local"
              value={formatTimeLock(timeLock)}
              min={minTimeString}
              // The event.target.value is a string ("YYYY-MM-DDThh:mm"), which is passed to the Date constructor.
              onChange={(e) => setTimeLock(new Date(e.target.value))}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="secret">Wallet Secret</Label>
            <Textarea rows={3} required id="secret" value={secret} onChange={(e) => setSecret(e.target.value)} />
          </div>
          <Button type="submit">Create Will</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
