export type LoginFormPayload = {
  email: string
  password: string
  remember: boolean
}

export type LoginFormErrors = Partial<Record<keyof LoginFormPayload, string>>

function readFormValue(formData: FormData, key: keyof LoginFormPayload) {
  const value = formData.get(key)

  return typeof value === "string" ? value : ""
}

export function getLoginFormPayload(formData: FormData): LoginFormPayload {
  return {
    email: readFormValue(formData, "email").trim(),
    password: readFormValue(formData, "password"),
    remember: formData.get("remember") === "on",
  }
}

export function validateLoginForm(payload: LoginFormPayload): LoginFormErrors {
  const errors: LoginFormErrors = {}

  if (!payload.email) {
    errors.email = "Enter your work email."
  }

  if (!payload.password) {
    errors.password = "Enter your password."
  }

  return errors
}
