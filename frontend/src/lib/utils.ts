import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const createEncodedMessage = (
  messageText: string,
  nonce: string
): {
  encodedMessage: Uint8Array;
  message: string;
} => {
  const domain = new URL(window.location.href).origin;
  const message = `${messageText} with ${domain}.\nNonce: ${nonce}`;
  // TextEncoder().encode() returns Uint8Array, which is the correct format for most signing APIs.
  const encodedMessage = new TextEncoder().encode(message);

  return { encodedMessage, message };
};
