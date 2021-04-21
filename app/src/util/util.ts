import { Alert } from "react-native";

export const AlertError = (err: any) => Alert.alert("Error", err?.message);