import idl from "./idl/will_management.json" with { type: "json" };
import { Program } from "@coral-xyz/anchor";
import type { Connection } from "@solana/web3.js";

export const useProgram = (connection: Connection) => {
  // The program ID is read from the IDL file's metadata.
  const program = new Program(idl as any, { connection });
  return { program, programId: program.programId.toBase58() };
};
