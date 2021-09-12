import React, { useContext, useEffect, useState } from "react";
import firebase from "firebase";
import { Nothing, Maybe, Just } from "../util/Maybe";
import * as api from "../api/api";
import * as Analytics from 'expo-firebase-analytics';

export type AuthContextType = {
  auth: Maybe<firebase.User>
  user: Maybe<User>
  alerts: { id: string, data: PriceAlert }[]
  signInAnonimously: () => Promise<firebase.User>
  signInWithApple: () => Promise<firebase.User>
  login: (email: string, password: string) => Promise<firebase.User>
  signup: (name: string, email: string, password: string) => Promise<firebase.User>
  logout: () => Promise<void>
  addOrRemoveFavourite: (pair: string) => Promise<void>
  trade: (fromAsset: string, toAsset: string, quantity: number) => Promise<void>
  addAlert: (symbol: string, percentage: number) => Promise<unknown>
  removeAlert: (id: string) => Promise<void>
}
export const AuthContext = React.createContext<AuthContextType>(null as any);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{}> = ({ children }) => {
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
        Analytics.setUserId(u.uid);
        setAuth(Just(u));
        api.addUserNotificationToken(u);
        prevUserSub = api.UserCollection
          .doc(u.uid)
          .onSnapshot(snap => {
            const uData = snap.data();
            if(uData) {
              setUser(Just(uData));
            }
          });
        prevAlertsSub = api.AlertsCollection(u.uid)
          .onSnapshot(({ docs }) => setAlerts(docs.map(doc => ({ id: doc.id, data: doc.data() }))))
      } else {
        setAuth(Nothing());
        setUser(Nothing());
        setAlerts([]);
      }
    });
  }, [])

  return (
    <AuthContext.Provider
      value={{
        auth
        , alerts
        , user
        , login: (email: string, password: string) => api.login(email, password)
        , signup: async (name, email, password) => {
          const res = await api.signup(name, email, password);
          setAuth(Just(res.auth));
          setUser(Just(res.user));
          return res.auth;
        }
        , logout: async () => {
          await api.logout(auth.getOrThrow());
          setUser(Nothing());
          setAuth(Nothing());
        }
        , signInAnonimously: async () => {
          const res = await api.signInAnonymously();
          setAuth(Just(res.auth));
          setUser(Just(res.user));
          return res.auth;
        }
        , addOrRemoveFavourite: (symbol) => api.addOrRemoveFavourite(auth.getOrThrow(), user.getOrThrow(), symbol)
        , trade: (fromAsset, toAsset, quantity) => api.trade(auth.getOrThrow(), user.getOrThrow(), fromAsset, toAsset, quantity)
        , addAlert: (symbol, percentage) => api.addAlert(auth.getOrThrow())(symbol, percentage)
        , removeAlert: (id) => api.removeAlert(auth.getOrThrow(), id)
        , signInWithApple: async () => {
          const res = await api.signInWithApple();
          setAuth(Just(res.auth));
          setUser(Just(res.user));
          return res.auth;
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
