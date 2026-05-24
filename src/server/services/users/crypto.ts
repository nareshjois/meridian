import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const PASSWORD_SALT_BYTES = 16
const PASSWORD_KEY_LENGTH = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(PASSWORD_SALT_BYTES)
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH)
  return `${salt.toString("hex")}:${hash.toString("hex")}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [saltHex, hashHex] = storedHash.split(":")
  if (!saltHex || !hashHex) {
    return false
  }

  const salt = Buffer.from(saltHex, "hex")
  const expected = Buffer.from(hashHex, "hex")
  const actual = scryptSync(password, salt, expected.length)

  if (expected.length !== actual.length) {
    return false
  }

  return timingSafeEqual(expected, actual)
}

export function generateToken(): string {
  return randomBytes(32).toString("hex")
}

export function hashToken(token: string): string {
  return scryptSync(token, "meridian-token-salt", 32).toString("hex")
}
