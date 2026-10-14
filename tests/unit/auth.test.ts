// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validations/auth";
import { hashPassword, comparePassword, DUMMY_HASH } from "@/lib/password";
import { createSessionToken, verifySessionToken } from "@/lib/session";
import { validateCallbackUrl } from "@/lib/auth";
import { Role } from "@prisma/client";

describe("Authentication Unit Tests", () => {
  describe("Registration Validation", () => {
    it("accepts valid registration input", () => {
      const valid = {
        name: "Sarah Connor",
        email: "sarah@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };
      const res = registerSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("normalizes email to trimmed lowercase", () => {
      const input = {
        name: "Sarah",
        email: "   SARAH.Connor@Example.COM  ",
        password: "Password123",
        confirmPassword: "Password123",
      };
      const res = registerSchema.safeParse(input);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.email).toBe("sarah.connor@example.com");
      }
    });

    it("rejects mismatched passwords", () => {
      const input = {
        name: "Sarah",
        email: "sarah@example.com",
        password: "Password123",
        confirmPassword: "DifferentPassword123",
      };
      const res = registerSchema.safeParse(input);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe("Passwords do not match.");
      }
    });

    it("rejects weak password (less than 8 chars)", () => {
      const input = {
        name: "Sarah",
        email: "sarah@example.com",
        password: "Pass1",
        confirmPassword: "Pass1",
      };
      const res = registerSchema.safeParse(input);
      expect(res.success).toBe(false);
    });

    it("rejects password without numbers", () => {
      const input = {
        name: "Sarah",
        email: "sarah@example.com",
        password: "PasswordOnly",
        confirmPassword: "PasswordOnly",
      };
      const res = registerSchema.safeParse(input);
      expect(res.success).toBe(false);
    });

    it("rejects password without letters", () => {
      const input = {
        name: "Sarah",
        email: "sarah@example.com",
        password: "1234567890",
        confirmPassword: "1234567890",
      };
      const res = registerSchema.safeParse(input);
      expect(res.success).toBe(false);
    });

    it("ignores any role property passed in client payload", () => {
      const payloadWithAdminRole = {
        name: "Hacker",
        email: "hacker@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        role: "ADMIN",
      };
      const res = registerSchema.safeParse(payloadWithAdminRole);
      expect(res.success).toBe(true);
      if (res.success) {
        // Output type should not have client-supplied role
        expect((res.data as Record<string, unknown>).role).toBeUndefined();
      }
    });
  });

  describe("Password Hashing & Timing Attack Mitigation", () => {
    it("hashes and correctly verifies passwords", async () => {
      const plain = "SecureP@ss123";
      const hash = await hashPassword(plain);
      expect(hash).not.toBe(plain);
      expect(await comparePassword(plain, hash)).toBe(true);
      expect(await comparePassword("WrongPassword1", hash)).toBe(false);
    });

    it("verifies against DUMMY_HASH without throwing", async () => {
      const result = await comparePassword("anyPassword123", DUMMY_HASH);
      expect(result).toBe(false);
    });
  });

  describe("JWT Session Tokens", () => {
    it("creates and successfully verifies valid session token", async () => {
      const token = await createSessionToken({
        userId: "user-cuid-123",
        role: Role.MEMBER,
      });

      expect(typeof token).toBe("string");
      const decoded = await verifySessionToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe("user-cuid-123");
      expect(decoded?.role).toBe(Role.MEMBER);
    });

    it("rejects tampered token", async () => {
      const token = await createSessionToken({
        userId: "user-123",
        role: Role.MEMBER,
      });
      const tampered = token.slice(0, -6) + "abcdef";
      const decoded = await verifySessionToken(tampered);
      expect(decoded).toBeNull();
    });

    it("rejects random string token", async () => {
      const decoded = await verifySessionToken("invalid.jwt.token");
      expect(decoded).toBeNull();
    });
  });

  describe("Open Redirect Protection (callbackUrl)", () => {
    it("allows valid relative URLs", () => {
      expect(validateCallbackUrl("/resources")).toBe("/resources");
      expect(validateCallbackUrl("/reservations/new")).toBe("/reservations/new");
      expect(validateCallbackUrl("/resources/123?page=2")).toBe("/resources/123?page=2");
    });

    it("rejects absolute external URLs", () => {
      expect(validateCallbackUrl("https://evil.com")).toBe("/");
      expect(validateCallbackUrl("http://attacker.com/steal")).toBe("/");
    });

    it("rejects protocol-relative URLs", () => {
      expect(validateCallbackUrl("//evil.com")).toBe("/");
      expect(validateCallbackUrl("//attacker.com/path")).toBe("/");
    });

    it("defaults to / when null or empty", () => {
      expect(validateCallbackUrl(null)).toBe("/");
      expect(validateCallbackUrl("")).toBe("/");
      expect(validateCallbackUrl(undefined)).toBe("/");
    });
  });
});
