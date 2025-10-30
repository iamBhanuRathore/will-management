import idl from "../idl/will_management.json";
import { useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, web3 } from "@coral-xyz/anchor";
import { solanaConnection } from "@/lib/solana";

// const PROGRAM_ID = new web3.PublicKey("CcjnCrW2Gf4WsZpcu3Jn8k4biHCwKUBn1Ce8QS7ZWP7D");
const PROGRAM_ID = new web3.PublicKey(idl.address);
export const useProgram = () => {
  const connection = solanaConnection();
  const wallet = useWallet();

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "processed",
  });
  const program = new Program(idl as any, provider);
  // @ts-ignore
  // const program = new Program(idl as any,PROGRAM_ID, provider);

  return { program, provider };
};
