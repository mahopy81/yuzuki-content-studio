export function getAllowedEmails() {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmail(email?: string | null) {
  const allowedEmails = getAllowedEmails();

  if (!email || allowedEmails.length === 0) {
    return false;
  }

  return allowedEmails.includes(email.toLowerCase());
}
