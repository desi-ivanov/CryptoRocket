import firebase from "firebase";
import Binance from "../context/Binance";
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from "react-native";
const INITIAL_BALANCE = 1000000;

export function addOrRemoveFavourite(a: firebase.User, u: User, symbol: string) {
  return UserCollection
    .doc(a.uid)
    .update({
      favoritePairs: u.favoritePairs.includes(symbol)
        ? firebase.firestore.FieldValue.arrayRemove(symbol)
        : firebase.firestore.FieldValue.arrayUnion(symbol)
    })
}

const PromsieAny: <T>(x: Promise<T>[]) => Promise<T> = x => new Promise((res, rej) => {
  let rejCnt = 0;
  const locRej = (er: any) => {
    rejCnt++;
    if(rejCnt === x.length) {
      rej(er);
    }
  }
  x.forEach(v => v.then(res).catch(locRej));
});

export async function trade(curAuth: firebase.User, curUser: User, fromAsset: string, toAsset: string, quantity: number) {
  const tick = await PromsieAny([Binance.instance().ticker(fromAsset + toAsset), Binance.instance().ticker(toAsset + fromAsset)]);
  const realPrice = tick.symbol.startsWith(fromAsset) ? parseFloat(tick.price) : (1 / parseFloat(tick.price));
  const destinationQuantity = quantity * realPrice;
  if(curUser.wallet[fromAsset] < quantity) {
    throw new Error("Insufficent " + fromAsset + " funds");
  }
  await Promise.all([
    UserCollection.doc(curAuth.uid)
      .update({
        [`wallet.${fromAsset}`]: firebase.firestore.FieldValue.increment(-quantity)
        , [`wallet.${toAsset}`]: firebase.firestore.FieldValue.increment(destinationQuantity)
      })
    , TransactionsCollection(curAuth.uid)
      .add({ fromAsset, toAsset, quantity, price: realPrice })
  ]);
}

export function removeAlert(curAuth: firebase.User, id: string) {
  return AlertsCollection(curAuth.uid)
    .doc(id)
    .delete();
}

export const UserCollection = firebase.firestore().collection("users") as firebase.firestore.CollectionReference<User>;
export const TransactionsCollection = (uid: string) => UserCollection.doc(uid).collection("transactions") as firebase.firestore.CollectionReference<Transaction>;
export const AlertsCollection = (uid: string) => UserCollection.doc(uid).collection("alerts") as firebase.firestore.CollectionReference<PriceAlert>;
export async function logout(auth: firebase.User) {
  await manageNotificationToken(tok => UserCollection
    .doc(auth.uid)
    .update({
      notificationTokens: firebase.firestore.FieldValue.arrayRemove(tok)
    }));
  await firebase.auth().signOut();
}


export function addAlert(curAuth: firebase.User) {
  return async (symbol: string, percentage: number) => {
    const tick = await Binance.instance().ticker(symbol);
    const priceTop = parseFloat(tick.price) * (1 + percentage);
    const priceBottom = parseFloat(tick.price) * (1 - percentage);
    return AlertsCollection(curAuth.uid)
      .add({
        percentage
        , symbol
        , priceTop
        , priceBottom
        , uid: curAuth.uid
      });
  }
}

export async function login(email: string, password: string) {
  const res = await firebase.auth().signInWithEmailAndPassword(email, password);
  if(!res.user) {
    return Promise.reject("Error");
  }
  return res.user;
}

export async function signup(name: string, email: string, password: string): Promise<{ auth: firebase.User, user: User }> {
  const auth = await firebase.auth().createUserWithEmailAndPassword(email, password);
  if(!auth.user) {
    return Promise.reject("error while creating user");
  }
  const user: User = { name, wallet: { USDT: INITIAL_BALANCE }, email, favoritePairs: [], notificationTokens: [] };
  await UserCollection.doc(auth.user.uid).set(user);
  await addAlert(auth.user)("BTCUSDT", 0.01);
  return { auth: auth.user, user };
}

export function addUserNotificationToken(user: firebase.User) {
  manageNotificationToken(tok => UserCollection
    .doc(user.uid)
    .update({
      notificationTokens: firebase.firestore.FieldValue.arrayUnion(tok)
    }));

}
async function manageNotificationToken(f: (tok: string) => Promise<void>): Promise<void> {
  if(Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if(existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if(finalStatus === 'granted') {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      await f(token);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }
  if(Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}