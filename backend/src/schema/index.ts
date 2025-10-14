import z from "zod";
import { PublicKey } from "@solana/web3.js";
export const createWillSchema = z.object({
  body: z.object({
    willName: z.string({ error: "willName is required." }).min(1, "willName cannot be empty."),
    willDescription: z.string({ error: "willDescription is required." }).min(1, "willDescription cannot be empty."),
    beneficiaryName: z.string({ error: "beneficiaryName is required." }).min(1, "beneficiaryName cannot be empty."),
    beneficiaryAddress: z.string({ error: "beneficiaryAddress is required." }).regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format."),
    timeLock: z.string({ error: "timeLock is required." }).datetime({ message: "timeLock must be a valid ISO 8601 date-time string." }),
    share1: z.string({ error: "share is required." }).min(1, "The encrypted share cannot be empty."),
    share2: z.string({ error: "share is required." }).min(1, "The encrypted share cannot be empty."),
  }),
});

// Schema for the 'inherit will' request parameters
export const inheritWillSchema = z.object({
  params: z.object({
    willId: z.cuid({ message: "Invalid will ID format." }),
  }),
});

// Schema for requesting a nonce
export const nonceSchema = z.object({
  params: z.object({
    address: z.string().refine((val) => {
      try {
        new PublicKey(val);
        return true;
      } catch (error) {
        return false;
      }
    }, "Invalid Solana address."),
  }),
});

// Schema for the 'verify' (login) request
export const verifySchema = z.object({
  body: z.object({
    address: z.string().refine((val) => {
      try {
        new PublicKey(val);
        return true;
      } catch (error) {
        return false;
      }
    }, "Invalid Solana address."),
    message: z.string().min(1, "Message cannot be empty."),
    signature: z.string().min(1, "Signature cannot be empty."),
  }),
});
