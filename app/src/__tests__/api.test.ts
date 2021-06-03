import "../firebaseInit"
import * as api from "../api/api";
const testUserEmail = "test@test.com";
const testUserPassword = "12341234";
describe('api', () => {
  it('login successful', async (finish) => {
    const auth = await api.login(testUserEmail, testUserPassword);
    const user = await api.UserCollection.doc(auth.uid).get();
    const userData = user.data();
    expect(userData).toBeDefined();
    expect(auth.email).toBe(testUserEmail);
    finish();
  });

  it('trading something', async (finish) => {
    try {
      const auth = await api.login(testUserEmail, testUserPassword);
      const user = await api.UserCollection.doc(auth.uid).get();
      const userData = user.data();
      expect(userData).toBeDefined();
      if(!userData) {
        throw new Error("user not found");
      }
      const coin = Object.entries(userData.wallet).find(([asset, amt]) => amt > 1);
      if(coin) {
        const sourceAsset = coin[0];
        const qty = coin[1];
        const destinationAsset = sourceAsset === "USDT" ? "BTC" : "USDT";
        await api.trade(auth, userData, sourceAsset, destinationAsset, qty);
      }

      finish();
    } catch(err) {
      console.error(err);
      finish(err);
    }
  });
  it('create and delete alert', async (finish) => {
    try {
      const auth = await api.login(testUserEmail, testUserPassword);
      const al = await api.addAlert(auth)("BTCUSDT", 10);
      await api.removeAlert(auth, al.id);

      finish();
    } catch(err) {
      finish(err);
    }
  });
  it('create favourite', async (finish) => {
    try {
      const auth = await api.login(testUserEmail, testUserPassword);
      const user = await api.UserCollection.doc(auth.uid).get();
      await api.addOrRemoveFavourite(auth, user.data()!, "BTCUSDT");
      finish();
    } catch(err) {
      finish(err);
    }
  });
});
