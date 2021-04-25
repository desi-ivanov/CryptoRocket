"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Lock = /** @class */ (function () {
    function Lock() {
        this.isAcquired = false;
        this.queue = [];
    }
    Lock.prototype.acquire = function () {
        var _this = this;
        if (!this.isAcquired) {
            this.isAcquired = true;
            return Promise.resolve();
        }
        return new Promise(function (resolve) { return _this.queue.push(resolve); });
    };
    Lock.prototype.reset = function () {
        this.isAcquired = false;
        this.queue = [];
    };
    Lock.prototype.release = function () {
        var _a;
        if (this.queue.length > 0) {
            (_a = this.queue.shift()) === null || _a === void 0 ? void 0 : _a();
        }
        else {
            this.isAcquired = false;
        }
    };
    return Lock;
}());
exports.default = Lock;
