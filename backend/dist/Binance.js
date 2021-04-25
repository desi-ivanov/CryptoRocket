"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Binance = void 0;
var ws_1 = __importDefault(require("ws"));
var Lock_1 = __importDefault(require("./Lock"));
var util_1 = require("./util");
var WSEndpoint = "wss://stream.binance.com:9443/ws";
var BinanceWebsocket = /** @class */ (function () {
    function BinanceWebsocket(onConnect) {
        var _this = this;
        this.onMessage = function (cb) {
            _this.onMessageHandler = cb;
        };
        this.onConnect = onConnect;
        this.lock = new Lock_1.default();
        this.ws = this.connect();
        this.failedMessages = [];
        this.onMessageHandler = function () { };
    }
    BinanceWebsocket.prototype.handleConnected = function () {
        var _this = this;
        console.log("Websocket connected");
        this.failedMessages.forEach(function (msg) { return _this.send(msg); });
        this.onConnect();
    };
    BinanceWebsocket.prototype.connect = function () {
        var _this = this;
        this.lock.reset();
        this.lock.acquire();
        this.ws = new ws_1.default(WSEndpoint);
        this.ws.on("open", function () {
            _this.lock.release();
            _this.ws.on("message", function (data) {
                _this.onMessageHandler(data);
            });
            _this.handleConnected();
        });
        this.ws.on("close", function () {
            console.log("Websocket disconnected. Reconnecting");
            _this.connect();
        });
        this.ws.on("ping", function () { return _this.ws.pong(); });
        return this.ws;
    };
    BinanceWebsocket.prototype.send = function (str) {
        return __awaiter(this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.lock.acquire()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, 5, 6]);
                        console.log("Sending", str);
                        this.ws.send(str);
                        return [4 /*yield*/, util_1.sleep(5000)];
                    case 3:
                        _a.sent(); // binance rate limit
                        return [3 /*break*/, 6];
                    case 4:
                        err_1 = _a.sent();
                        this.failedMessages.push(str);
                        console.log("Failed to send message: ", err_1);
                        return [3 /*break*/, 6];
                    case 5:
                        this.lock.release();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return BinanceWebsocket;
}());
var Binance = /** @class */ (function () {
    function Binance() {
        var _this = this;
        this.ws = new BinanceWebsocket(function () { return _this.handleReconnect(); });
        this.symbolSubsMap = new Map();
        this.ws.onMessage(function (data) { return _this.handleMessage(data); });
    }
    Binance.prototype.handleMessage = function (data) {
        var _a;
        var parsed = JSON.parse(data.toString());
        if ("s" in parsed) {
            (_a = this.symbolSubsMap.get(parsed.s)) === null || _a === void 0 ? void 0 : _a.forEach(function (s) { return s.f(parseFloat(parsed.c)); });
        }
    };
    Binance.prototype.handleReconnect = function () {
        var e_1, _a;
        var that = this;
        console.log("Handling connection enstablished");
        try {
            for (var _b = __values(this.symbolSubsMap.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var symbol = _c.value;
                that.subscribe(symbol);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    Binance.prototype.subscribePrice = function (_symbol, onPrice) {
        var _this = this;
        var _a;
        var symbol = _symbol.toUpperCase();
        if (!this.symbolSubsMap.has(symbol)) {
            this.subscribe(symbol);
        }
        var subId = Date.now();
        this.symbolSubsMap.set(symbol, ((_a = this.symbolSubsMap.get(symbol)) !== null && _a !== void 0 ? _a : []).concat({ id: subId, f: onPrice }));
        return function () {
            var _a;
            _this.symbolSubsMap.set(symbol, ((_a = _this.symbolSubsMap.get(symbol)) !== null && _a !== void 0 ? _a : []).filter(function (x) { return x.id !== subId; }));
        };
    };
    Binance.prototype.subscribe = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("Subscribing for " + symbol);
                this.ws.send(JSON.stringify({
                    "method": "SUBSCRIBE",
                    "params": [symbol.toLowerCase() + "@ticker"],
                    "id": Date.now() + Math.floor(Math.random() * 10)
                }));
                return [2 /*return*/];
            });
        });
    };
    return Binance;
}());
exports.Binance = Binance;
