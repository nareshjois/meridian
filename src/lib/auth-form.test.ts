import { describe, expect, it } from "vitest"

import { getLoginFormPayload, validateLoginForm } from "./auth-form"

describe("login form helpers", () => {
  it("normalizes form data into a future auth-service payload", () => {
    const formData = new FormData()
    formData.set("email", "  pilot@meridian.example  ")
    formData.set("password", " keep-the-spaces ")
    formData.set("remember", "on")

    expect(getLoginFormPayload(formData)).toEqual({
      email: "pilot@meridian.example",
      password: " keep-the-spaces ",
      remember: true,
    })
  })

  it("reports missing login fields without changing the payload shape", () => {
    const formData = new FormData()
    formData.set("email", " ")
    formData.set("password", "")

    expect(validateLoginForm(getLoginFormPayload(formData))).toEqual({
      email: "Enter your work email.",
      password: "Enter your password.",
    })
  })
})
