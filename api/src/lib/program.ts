import idl from "./idl/will_management.json" with { type: "json" };
import { Program } from "@coral-xyz/anchor";
import { solanaConnection } from "./solana";

export const useProgram = () => {
  const connection = solanaConnection();
  const programId = idl.address;
  const program = new Program(idl, { connection });

  return { program, programId };
};
