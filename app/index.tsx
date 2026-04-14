import { RootState } from "@/redux/store";
import { Redirect } from "expo-router";
import { useSelector } from "react-redux";

export default function Index() {
  const { isLoggedIn, loading } = useSelector((state: RootState) => state.auth);

  // Wait until SecureStore restore finishes
  if (loading) return null;

  return <Redirect href={"/login"} />;
}
