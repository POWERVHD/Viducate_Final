import { PrismaClient } from "@prisma/client";

// Add logging for debugging
let prisma;

try {
  // Check if we already have a connection (for Next.js hot reloading)
  if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient();
    console.log("Production: New PrismaClient initialized");
  } else {
    // In development, preserve connection between hot reloads
    if (!globalThis.prisma) {
      globalThis.prisma = new PrismaClient({
        log: ["query", "error", "warn"],
      });
      console.log("Development: New PrismaClient initialized");
    }
    prisma = globalThis.prisma;
    console.log("Development: Using existing PrismaClient");
  }
} catch (error) {
  console.error("Failed to initialize Prisma Client:", error);
  throw new Error(`Prisma Client initialization failed: ${error.message}`);
}

export const db = prisma;
