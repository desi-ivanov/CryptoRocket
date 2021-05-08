import admin from "firebase-admin";
import { Expo } from 'expo-server-sdk';
import { Binance } from "./Binance";
const serviceAccount = require("../service-account.json");

type PriceAlert = {
  uid: string
  symbol: string
  priceTop: number
  priceBottom: number
  percentage: number
}
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const AlertsCollection = admin.firestore().collectionGroup("alerts") as admin.firestore.CollectionGroup<PriceAlert>;
const UsersCollection = admin.firestore().collection("users") as admin.firestore.CollectionReference<{
  name: string
  email: string
  favoritePairs: string[]
  wallet: Record<string, number>
  notificationTokens: string[]
}>;
const expo = new Expo();
const binance = new Binance();
const unsubsMap: Record<string, () => void> = {};

const memo: Record<string, string[]> = {};
async function userNotificationToken(uid: string) {
  if(uid in memo) {
    return memo[uid];
  }
  const toks = await UsersCollection.doc(uid).get().then(v => v.data()?.notificationTokens ?? []);
  memo[uid] = toks;
  UsersCollection.doc(uid).onSnapshot(snap => memo[uid] = snap.data()?.notificationTokens ?? []);
  return toks;
}

async function Subscribe(data: PriceAlert, docRef: FirebaseFirestore.DocumentReference<PriceAlert>): Promise<void> {
  unsubsMap[docRef.id] = binance.subscribePrice(data.symbol, async (currentPrice) => {
    try {
      if(currentPrice < data.priceBottom
        || currentPrice > data.priceTop
      ) {
        console.log("Notifying", currentPrice, data)

        const prevPrice = (data.priceTop + data.priceBottom) / 2;
        data.priceTop = currentPrice * (1 + data.percentage);
        data.priceBottom = currentPrice * (1 - data.percentage);
        await docRef.update({ priceTop: data.priceTop, priceBottom: data.priceBottom });

        const notifTokens = await userNotificationToken(data.uid);
        if(notifTokens.length > 0) {
          await expo.sendPushNotificationsAsync([{
            to: notifTokens
            , title: data.symbol
            , body: `${currentPrice > prevPrice ? "🟢" : "🔵"} ${prevPrice.toFixed(2)} → ${currentPrice.toFixed(2)} ${currentPrice > prevPrice ? "📈" : "📉"} ${((currentPrice / prevPrice - 1) * 100).toFixed(2)}%`
            , data: { type: "chart", symbol: data.symbol }
          }]);
          console.log("Sending", notifTokens)
        }
      }
    } catch(err) {
      console.log(err);
    }
  });
}

async function Unsubscribe(id: string): Promise<void> {
  unsubsMap[id]?.();
}

AlertsCollection
  .onSnapshot((snap) => {
    snap.docChanges().forEach(change => {
      if(change.type === "added") {
        const data = change.doc.data();
        Subscribe(data, change.doc.ref);
      } else if(change.type === "removed") {
        Unsubscribe(change.doc.id);
      }
    })
  });