import pino from "pino";

const SENSITIVE_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
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
