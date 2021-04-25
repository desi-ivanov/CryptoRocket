import WebSocket from "ws";
import Lock from "./Lock";
import { sleep } from "./util";
const WSEndpoint = "wss://stream.binance.com:9443/ws";

type TickerData = {
  "A": string
  "B": string
  "C": number
  "E": number
  "F": number
  "L": number
  "O": number
  "P": string
  "Q": string
  "a": string
  "b": string
  "c": string
  "e": string
  "h": string
  "l": string
  "n": number
  "o": string
  "p": string
  "q": string
  "s": string
  "v": string
  "w": string
  "x": string
}

class BinanceWebsocket {
  private ws: WebSocket;
  private lock: Lock;
  private onConnect: () => void;
  private onMessageHandler: (data: WebSocket.Data) => void;
  private failedMessages: string[];
  constructor(onConnect: () => void) {
    this.onConnect = onConnect;
    this.lock = new Lock();
    this.ws = this.connect();
    this.failedMessages = [];
    this.onMessageHandler = () => { };
  }

  private handleConnected() {
    console.log("Websocket connected");
    this.failedMessages.forEach(msg => this.send(msg));
    this.onConnect();
  }

  private connect(): WebSocket {
    this.lock.reset();
    this.lock.acquire();
    this.ws = new WebSocket(WSEndpoint);
    this.ws.on("open", () => {
      this.lock.release();
      this.ws.on("message", data => {
        this.onMessageHandler(data);
      });
      this.handleConnected()
    });
    this.ws.on("close", () => {
      console.log("Websocket disconnected. Reconnecting");
      this.connect();
    });
    this.ws.on("ping", () => this.ws.pong());
    return this.ws;
  }

  public async send(str: string) {
    await this.lock.acquire();
    try {
      console.log("Sending", str);
      this.ws.send(str);
      await sleep(5000); // binance rate limit
    } catch(err) {
      this.failedMessages.push(str);
      console.log("Failed to send message: ", err);
    } finally {
      this.lock.release();
    }
  }

  public onMessage = (cb: (data: WebSocket.Data) => void) => {
    this.onMessageHandler = cb;
  }
}

export class Binance {
  private ws: BinanceWebsocket;
  private symbolSubsMap: Map<string, ({ id: number, f: (price: number) => void })[]>;

  constructor() {
    this.ws = new BinanceWebsocket(() => this.handleReconnect());
    this.symbolSubsMap = new Map();
    this.ws.onMessage((data) => this.handleMessage(data));
  }

  private handleMessage(data: WebSocket.Data) {
    const parsed: TickerData = JSON.parse(data.toString());
    if("s" in parsed) {
      this.symbolSubsMap.get(parsed.s)?.forEach(s => s.f(parseFloat(parsed.c)));
    }
  }

  private handleReconnect() {
    const that = this;
    console.log("Handling connection enstablished");
    for(const symbol of this.symbolSubsMap.keys()) {
      that.subscribe(symbol);
    }
  }

  public subscribePrice(_symbol: string, onPrice: (price: number) => void) {
    const symbol = _symbol.toUpperCase();
    if(!this.symbolSubsMap.has(symbol)) {
      this.subscribe(symbol);
    }
    const subId = Date.now();
    this.symbolSubsMap.set(symbol, (this.symbolSubsMap.get(symbol) ?? []).concat({ id: subId, f: onPrice }));
    return () => {
      this.symbolSubsMap.set(symbol, (this.symbolSubsMap.get(symbol) ?? []).filter(x => x.id !== subId));
    }
  }

  private async subscribe(symbol: string) {
    console.log("Subscribing for " + symbol);
    this.ws.send(JSON.stringify({
      "method": "SUBSCRIBE",
      "params": [`${symbol.toLowerCase()}@ticker`],
      "id": Date.now() + Math.floor(Math.random() * 10)
    }));
  }
}
