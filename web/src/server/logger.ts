import pino from "pino";

const SENSITIVE_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "req.headers.x-hub-signature-256",
  "req.headers.stripe-signature",
  "password",
  "*.password",
  "token",
  "*.token",
  "apiKey",
  "*.apiKey",
  "secret",
  "*.secret",
  "accessToken",
  "*.accessToken",
  "pageAccessToken",
  "*.pageAccessToken",
  "credentials",
  "*.credentials",
  "stripe.apiKey",
  "stripe.webhookSecret",
  "totpSecret",
  "*.totpSecret",
  "totpCode",
  "*.totpCode",
  "recoveryCode",
  "*.recoveryCode",
  "refresh_token",
  "*.refresh_token",
  "access_token",
  "*.access_token",
  "id_token",
  "*.id_token",
  "sessionToken",
  "*.sessionToken",
  "client_secret",
  "*.client_secret",
  "verify_token",
  "*.verify_token",
  "signed_request",
  "*.signed_request",
  "webhookSecret",
  "*.webhookSecret",
];

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  redact: {
    paths: SENSITIVE_PATHS,
    censor: "[REDACTED]",
  },
  base: {
    service: "pumai",
    env: process.env.NODE_ENV ?? "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isProd ? {} : {
    transport: {
      target: "pino/file",
      options: { destination: 1 },
    },
  }),
});

export function scoped(scope: string) {
  return logger.child({ scope });
}
