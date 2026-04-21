import jwt from "jsonwebtoken";

const PRE_AUTH_SCOPE = "mfa-pre-auth";

/** Sign a short-lived (5 min) pre-auth token returned when MFA is required at login. */
export function signPreAuthToken(userId: string): string {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET must be set");
  return jwt.sign(
    { sub: userId, scope: PRE_AUTH_SCOPE },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );
}

/**
 * Verify a pre-auth token and return the user ID.
 * Throws if the token is invalid, expired, or has the wrong scope.
 */
export function verifyPreAuthToken(token: string): string {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET must be set");
  const payload = jwt.verify(token, process.env.JWT_SECRET) as {
    sub: string;
    scope: string;
  };
  if (payload.scope !== PRE_AUTH_SCOPE)
    throw new Error("Invalid token scope");
  return payload.sub;
}
