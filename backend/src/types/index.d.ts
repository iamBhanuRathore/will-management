declare namespace Express {
  export interface Request {
    user?: {
      // id: string; Removing this only using the address in here
      address: string;
    };
  }
}
