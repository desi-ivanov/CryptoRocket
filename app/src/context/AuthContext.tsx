import React, { useContext, useEffect, useState } from "react";
import firebase from "firebase";
import { Nothing, Maybe, Just } from "../util/Maybe";
import Binance from "./Binance";
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from "react-native";

const INITIAL_BALANCE = 1000000;

export type AuthContextType = {
  auth: Maybe<firebase.User>
  user: Maybe<User>
  alerts: { id: string, data: PriceAlert }[]
  login: (email: string, password: string) => Promise<firebase.User>
  signup: (name: string, email: string, password: string) => Promise<firebase.User>
  logout: () => Promise<void>
  addOrRemoveFavourite: (pair: string) => Promise<void>
  trade: (fromAsset: string, toAsset: string, quantity: number) => Promise<void>
  addAlert: (symbol: string, percentage: number) => Promise<void>
  removeAlert: (id: string) => Promise<void>
}
export const AuthContext = React.createContext<AuthContextType>(null as any);
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps { }


const UserCollection = firebase.firestore().collection("users") as firebase.firestore.CollectionReference<User>;
const TransactionsCollection = (uid: string) => UserCollection.doc(uid).collection("transactions") as firebase.firestore.CollectionReference<Transaction>;
const AlertsCollection = (uid: string) => UserCollection.doc(uid).collection("alerts") as firebase.firestore.CollectionReference<PriceAlert>;

const addAlertBase: (curAuth: firebase.User) => AuthContextType["addAlert"] = (curAuth) => async (symbol, percentage) => {
  const tick = await Binance.instance.ticker(symbol);
  const priceTop = parseFloat(tick.price) * (1 + percentage);
  const priceBottom = parseFloat(tick.price) * (1 - percentage);
  await AlertsCollection(curAuth.uid)
    .add({
      percentage
      , symbol
      , priceTop
      , priceBottom
      , uid: curAuth.uid
    });
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [auth, setAuth] = useState<Maybe<firebase.User>>(Nothing());
  const [user, setUser] = useState<Maybe<User>>(Nothing());
  const [alerts, setAlerts] = useState<{ id: string, data: PriceAlert }[]>([]);

  useEffect(() => {
    let prevUserSub = () => { };
    let prevAlertsSub = () => { };
    firebase.auth().onAuthStateChanged((u) => {
      prevUserSub();
      prevAlertsSub();
      if(u) {
        setAuth(Just(u));
        manageNotificationToken(tok => UserCollection
          .doc(u.uid)
          .update({
            notificationTokens: firebase.firestore.FieldValue.arrayUnion(tok)
          }));
        prevUserSub = UserCollection
          .doc(u.uid)
          .onSnapshot(snap => {
            const uData = snap.data();
            if(uData) {
              setUser(Just(uData));
            }
          });
        prevAlertsSub = AlertsCollection(u.uid)
          .onSnapshot(({ docs }) => setAlerts(docs.map(doc => ({ id: doc.id, data: doc.data() }))))
      } else {
        setAuth(Nothing());
        setUser(Nothing());
        setAlerts([]);
      }
    });
  }, [])


  const addAlert: AuthContextType["addAlert"] = async (symbol, percentage) => addAlertBase(auth.getOrThrow())(symbol, percentage)

  return (
    <AuthContext.Provider
      value={{
        auth
        , alerts
        , user
        , login: async (email: string, password: string) => {
          const res = await firebase.auth().signInWithEmailAndPassword(email, password);
          if(!res.user) {
            return Promise.reject("Error");
          }
          return res.user;
        }
        , signup: async (name, email, password) => {
          const res = await firebase.auth().createUserWithEmailAndPassword(email, password);
          if(!res.user) {
            return Promise.reject("error while creating user");
          }
          const newUser: User = { name, wallet: { USDT: INITIAL_BALANCE }, email, favoritePairs: [], notificationTokens: [] };
          await UserCollection.doc(res.user.uid).set(newUser);
          await addAlertBase(res.user)("BTCUSDT", 0.01);
          setAuth(Just(res.user));
          setUser(Just(newUser));
          return res.user;
        }
        , logout: async () => {
          const curAuth = auth.getOrThrow();
          await manageNotificationToken(tok => UserCollection
            .doc(curAuth.uid)
            .update({
              notificationTokens: firebase.firestore.FieldValue.arrayRemove(tok)
            }));
          await firebase.auth().signOut();
          setUser(Nothing());
          setAuth(Nothing());
        }
        , addOrRemoveFavourite: (symbol) => {
          return auth.zip(user).mapLazy(
            ([a, u]) => {
              return UserCollection
                .doc(a.uid)
                .update({
                  favoritePairs: u.favoritePairs.includes(symbol)
                    ? firebase.firestore.FieldValue.arrayRemove(symbol)
                    : firebase.firestore.FieldValue.arrayUnion(symbol)
                });
            }
            , () => Promise.reject("Unauthenticated")
          );
        }
        , trade: async (fromAsset, toAsset, quantity) => {
          const [curAuth, curUser] = auth.zip(user).getOrThrow();
          const tick = await PromsieAny([Binance.instance.ticker(fromAsset + toAsset), Binance.instance.ticker(toAsset + fromAsset)]);
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
        , addAlert
        , removeAlert: async (id) => {
          const curAuth = auth.getOrThrow();
          await AlertsCollection(curAuth.uid)
            .doc(id)
            .delete();
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

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