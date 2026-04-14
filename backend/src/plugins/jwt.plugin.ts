import { jwt } from "@elysiajs/jwt";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET must be defined");
}

export const jwtPlugin = jwt({
  name: "jwt",
  secret: jwtSecret,
  exp: "7d"
});
