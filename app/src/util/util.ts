import { Alert } from "react-native";
import * as StoreReview from 'expo-store-review';

export const AlertError = (err: any) => Alert.alert("Error", err?.message);

export const AskReview = (afterMillis: number = 5000) => {
  setTimeout(() => {
    StoreReview.hasAction()
      .then((hasAction) => {
        if(hasAction) {
          return StoreReview.requestReview()
        }
      })
      .catch(console.error);
  }, afterMillis);
};
