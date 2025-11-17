import { ZodObject, ZodError } from "zod";

// Middleware factory that takes a Zod schema
export const validate = (schema: ZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Zod will validate req.body, req.params, and req.query based on the schema structure
    const result = await schema.parseAsync({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    req.body = result.body; // Update req.body with validated data
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // Format errors for a clear API response
      const formattedErrors = error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return res.status(400).json({ success: false, errors: formattedErrors });
    }
    // Handle unexpected errors during validation
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
