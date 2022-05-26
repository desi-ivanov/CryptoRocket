import admin from "firebase-admin";
import { Expo } from 'expo-server-sdk';
import { Binance } from "./Binance";
import { Synchronized } from "./Synchronized.decorator";
const serviceAccount = require("../service-account.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

type PriceAlert = {
  uid: string
  symbol: string
  priceTop: number
  priceBottom: number
  percentage: number
}
const AlertsCollection = admin.firestore().collectionGroup("alerts") as admin.firestore.CollectionGroup<PriceAlert>;
const UsersCollection = admin.firestore().collection("users") as admin.firestore.CollectionReference<{
  name: string
  email: string
  favoritePairs: string[]
  wallet: Record<string, number>
  notificationTokens: string[]
}>;

class NotificationTokenResolver {
  memo: Record<string, Set<string>> = {};
  isWatching = false
  constructor() {

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
  }
  @Synchronized()
  async ensureWatching() {
    if(this.isWatching) return;
    const initial = await UsersCollection.get();
    this.memo = Object.fromEntries(initial.docs.map(r => [r.id, new Set(r.data().notificationTokens)]));
    UsersCollection.onSnapshot(snap => {
      snap.docChanges().forEach(change => {
        if(change.type === "added") {
          this.memo[change.doc.id] = new Set(change.doc.data().notificationTokens);
        } else if(change.type === "modified") {
          this.memo[change.doc.id] = new Set(change.doc.data().notificationTokens);
        } else if(change.type === "removed") {
          delete this.memo[change.doc.id];
        }
      });
    });
    this.isWatching = true;
  }

  async get(uid: string): Promise<string[]> {
    await this.ensureWatching();
    return [...(this.memo[uid] ?? new Set())];
  }

}

export class Core {
  expo = new Expo();
  binance = new Binance();
  unsubsMap: Record<string, () => void> = {};
  ntfTokenResolver = new NotificationTokenResolver();

  async subscribeAlert(data: PriceAlert, docRef: FirebaseFirestore.DocumentReference<PriceAlert>): Promise<void> {
    this.unsubsMap[docRef.id] = this.binance.subscribePrice(data.symbol, async (currentPrice) => {
      try {
        if(data.percentage >= 0.005
          && (
            currentPrice < data.priceBottom
            || currentPrice > data.priceTop
          )
        ) {
          console.log("Notifying", currentPrice, data)

          const prevPrice = (data.priceTop + data.priceBottom) / 2;
          data.priceTop = currentPrice * (1 + data.percentage);
          data.priceBottom = currentPrice * (1 - data.percentage);
          await docRef.update({ priceTop: data.priceTop, priceBottom: data.priceBottom });

          const notifTokens = await this.ntfTokenResolver.get(data.uid);
          if(notifTokens.length > 0) {
            await this.expo.sendPushNotificationsAsync([{
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

  async unsubscribeAlert(id: string): Promise<void> {
    this.unsubsMap[id]?.();
  }

  start() {
    AlertsCollection
      .onSnapshot((snap) => {
        snap.docChanges().forEach(change => {
          if(change.type === "added") {
            const data = change.doc.data();
            this.subscribeAlert(data, change.doc.ref);
          } else if(change.type === "removed") {
            this.unsubscribeAlert(change.doc.id);
          }
        })
      });

  }
}