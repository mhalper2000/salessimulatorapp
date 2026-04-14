const BASE_URL = "https://salesscripter.com/pro";

export async function getUserDetails() {
  const res = await fetch(`${BASE_URL}/sales-simulator/user-details`);
  const json = await res.json();
  console.log("Fetched user details:", json);

  return {
    username: json.userInfo.login,
    subscription: json.subscription,
  };
}

export async function fetchFields(username: string) {
  const res = await fetch(
    `${BASE_URL}/simulator/get-fields?username=${username}`,
  );
  try {
    return await res.json();
  } catch (e) {
    console.log("Error parsing fields response:", e);
    return Promise.resolve({}); // or handle the error as needed
  }
}

export async function saveFields(payload: any) {
  await fetch(`${BASE_URL}/simulator/save-fields`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
