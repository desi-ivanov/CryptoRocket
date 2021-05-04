import { StackScreenProps } from "@react-navigation/stack"
import React, { useMemo } from 'react'
import { View } from 'react-native'
import Header from "../components/Header"
import { useAuth } from "../context/AuthContext"
import { use24HrTicker } from "../hooks/use24HrTicker"
import { maybe } from "../util/Maybe"
import { Pairs } from "./TrendingScreen"

export default function FavoritesScreen(props: StackScreenProps<RootStackParams, "Tabs">) {
  const authCtx = useAuth();
  const res = use24HrTicker();


  const favouritePairs = useMemo(() => new Set(authCtx.user.map(x => x.favoritePairs).orElse([])), [authCtx.user.get()?.favoritePairs]);

  return (
    <View style={{ backgroundColor: "#fff", flex: 1 }}>
      <Header title="Favourites" />
      <Pairs
        navigationProps={props}
        data={maybe(res.data).map(x => x.filter(p => favouritePairs.has(p.symbol))).orElse([])}
        revalidate={res.revalidate}
        isValidating={res.isValidating}
      />
    </View>
  )
}
