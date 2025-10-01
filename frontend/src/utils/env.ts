type Env = {
  VITE_RPC_URL: string;
  VITE_SERVER_URL: string;
};

// Use a proxy to check for valid keys and ensure string values.
const env: Env = new Proxy(import.meta.env, {
  get(target, prop: string, receiver) {
    const value = Reflect.get(target, prop, receiver);

    if (typeof value === "undefined") {
      throw new Error(`Environment variable ${prop} is not set.`);
    }

    // You can add more checks here, like ensuring it's a string
    if (typeof value !== "string") {
      throw new Error(`Environment variable ${prop} is not a string.`);
    }

    return value;
  },
}) as unknown as Env;

export default env;
