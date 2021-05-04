import { NavigationProp, useNavigation } from "@react-navigation/core";
import firebase from "firebase"
import { useAuth } from "../context/AuthContext";

export function useProtected() {
  const nav = useNavigation<NavigationProp<RootStackParams>>();
  const authctx = useAuth();

  return (f: (x: [firebase.User, User]) => void) => {
    authctx.auth.zip(authctx.user)
      .ifPresentOrElse(f, () => {
        nav.navigate("Signup");
      });
  }
}