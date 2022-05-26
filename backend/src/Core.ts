import admin from "firebase-admin";
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { Binance } from "./Binance";
import { Synchronized } from "./Synchronized.decorator";
import { zip } from "./util";
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

class NotificationsManager {
  private expo = new Expo();
  private memo: Record<string, Set<string>> = {};
  private isWatching = false
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
  private async ensureWatching() {
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

  private async get(uid: string): Promise<string[]> {
    await this.ensureWatching();
    return [...(this.memo[uid] ?? new Set())];
  }

  async notify(uid: string, message: Omit<Partial<ExpoPushMessage>, "to">) {
    const tokens = await this.get(uid);
    const messages = tokens.map(t => ({ ...message, to: t }));
    const tickets = await this.expo.sendPushNotificationsAsync(messages);
    if(tickets.some(tick => tick.status === "error" && tick.details?.error === "DeviceNotRegistered")) {
      const toRemove: string[] = zip(tickets, tokens)
        .filter(([tick]) => tick.status === "error" && tick.details?.error === "DeviceNotRegistered")
        .map(([, tok]) => tok);
      await UsersCollection.doc(uid).update({
        notificationTokens: admin.firestore.FieldValue.arrayRemove(...toRemove)
      });
    }
  }

}

export class Core {
  binance = new Binance();
  unsubsMap: Record<string, () => void> = {};
  ntfManager = new NotificationsManager();

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
          await this.ntfManager.notify(data.uid, {
            title: data.symbol
            , body: `${currentPrice > prevPrice ? "🟢" : "🔵"} ${prevPrice.toFixed(2)} → ${currentPrice.toFixed(2)} ${currentPrice > prevPrice ? "📈" : "📉"} ${((currentPrice / prevPrice - 1) * 100).toFixed(2)}%`
            , data: { type: "chart", symbol: data.symbol }
          });
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