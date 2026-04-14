/**
 * reportAmemberError
 * Centralized helper to report aMember errors to the support email endpoint.
 */
export async function reportAmemberError(message: string) {
  const REFRESH_TOKEN = process.env.REFRESH_TOKEN || "";
  const SUPPORT_EMAIL =
    process.env.SUPPORT_EMAIL ?? "mhalper@salesscripter.com";
  const SUBJECT = "Error Encountered While Adding User!";

  const params = new URLSearchParams();
  params.append("refreshToken", REFRESH_TOKEN);
  params.append("to", SUPPORT_EMAIL);
  params.append("subject", SUBJECT);
  params.append("html", String(message));

  const url = "https://salesscripter.com/node/sendEmail";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      referer: "https://salesscripter.com",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  try {
    return await res.json();
  } catch (err) {
    return { status: false, error: err };
  }
}

export default reportAmemberError;
