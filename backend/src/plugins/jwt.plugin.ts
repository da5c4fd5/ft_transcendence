import { jwt } from "@elysiajs/jwt";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be defined");
}

export const jwtPlugin = jwt({
  name: "jwt",
  secret: process.env.JWT_SECRET,
  exp: "7d"
});
