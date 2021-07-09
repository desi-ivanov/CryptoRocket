// JEST mocks, uncomment for tests

// if(process.env.JEST_WORKER_ID) {
  // WebSocket = require("ws");
  // fetch = require("cross-fetch");
// }

class Queuer {
  private queue: (() => Promise<void>)[] = [];
  private running: boolean = false;
  public run(f: () => Promise<void>) {
    const that = this;
    if(!that.running) {
      that.running = true;
      f().finally(async () => {
        while(that.queue.length > 0) {
          await that.queue.shift()?.();
        }
        that.running = false;
      });
    } else {
      that.queue.push(f);
    }
  }
  public destroy() {
    this.running = false;
    this.queue = [];
  }
}

type BinanceTickerMessage = {
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
  "n": number,
  "o": string
  "p": string
  "q": string
  "s": string
  "v": string
  "w": string
  "x": string
}
class Binance {
  private ws: WebSocket | null;
  private priceSubs: Map<string, ({ id: number, f: (price: number) => void })[]>;
  private lock: Queuer;
  public constructor() {
    this.ws = null;
    this.lock = new Queuer();
    this.priceSubs = new Map();
    this.connect();
  }

  public subscribePrice(product_id: string, onPrice: (price: number) => void) {
    const upcase = product_id.toUpperCase();
    if(!this.priceSubs.has(upcase)) {
      this.subscribe(upcase);
    }
    const subId = Date.now();
    this.priceSubs.set(upcase, (this.priceSubs.get(upcase) ?? []).concat({ id: subId, f: onPrice }));
    const that = this;
    return () => {
      that.priceSubs.set(upcase, (that.priceSubs.get(upcase) ?? []).filter(x => x.id !== subId));
    }
  }
  private async subscribe(product_id: string) {
    this.lock.run(async () => {
      try {
        if(this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws?.send(JSON.stringify({
            "method": "SUBSCRIBE",
            "params": [`${product_id.toLowerCase()}@ticker`],
            "id": Date.now()
          }));
        } else {
          setTimeout(() => this.subscribe(product_id), 1000); // retry
        }
      } catch(err) {
        console.error("Error while subscribing on binance for " + product_id, err);
      }
      await new Promise(r => setTimeout(r, 2000)); // inance rate limiting
    });
  }

  private connect() {
    const that = this;
    this.ws?.close();
    that.ws = new WebSocket("wss://stream.binance.com:9443/ws");
    that.ws.onopen = () => {
      console.log("Connection with binance enstablished successfully");
      that.ws!.onmessage = ({ data }) => {
        const parsed: BinanceTickerMessage = JSON.parse(data.toString());
        if("s" in parsed) {
          that.priceSubs.get(parsed.s)?.forEach(s => s.f(parseFloat(parsed.c)));
        }
      };
    }
    that.ws.onclose = () => {
      console.log("Binance websocket got closed... Reconnecting");
      setTimeout(() => {
        that.lock.destroy();
        that.connect();
        [...that.priceSubs.keys()].forEach(k => that.subscribe(k));
      }, 1000);
    };
  }

  public ticker(product_id: string): Promise<{
    symbol: string
    price: string
  }> {
    return get(`/ticker/price?symbol=${product_id.toUpperCase()}`)
      .then(res => res.ok ? res.json() : Promise.reject(res.text()));
  }
}

function get(endpoint: string) {
  return fetch(`https://api.binance.com/api/v3${endpoint}`, { method: "GET" });
}

let instance: Binance | null = null;
function getInstance(): Binance {
  if(instance === null) {
    instance = new Binance();
  }
  return instance;
}

export default {
  instance: getInstance
};


