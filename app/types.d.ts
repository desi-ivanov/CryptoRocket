declare type RootStackParams = {
  Tabs: undefined
  Chart: { symbol: string }
  Trade: { symbol: string, type: "buy" | "sell" }
  Alert: { symbol: string }
  Signup: undefined
  Login: undefined
  PasswordReset: undefined
  PickSymbolScreen: { onFinish: (symbol: string) => void }
}

declare type PriceTicker = {
  symbol: string
  priceChange: string
  priceChangePercent: string
  weightedAvgPrice: string
  prevClosePrice: string
  lastPrice: string
  lastQty: string
  bidPrice: string
  bidQty: string
  askPrice: string
  askQty: string
  openPrice: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
  openTime: number
  closeTime: number
  firstId: number
  lastId: number
  count: number
}

declare type ExchangeInfo = {
  timezone: string
  serverTime: number
  symbols: {
    symbol: string
    baseAsset: string
    baseAssetPrecision: number
    quoteAsset: string
    quotePrecision: number
    quoteAssetPrecision: number
  }[]
}

declare type User = {
  name: string
  email: string
  favoritePairs: string[]
  wallet: Record<string, number>
  notificationTokens: string[]
}

declare type Transaction = {
  fromAsset: string
  toAsset: string
  quantity: number
  price: number
}

declare type PriceAlert = {
  uid: string
  symbol: string
  priceTop: number
  priceBottom: number
  percentage: number
}