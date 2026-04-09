const obj = {
  name: "client",
  from(table) {
    if (!this) throw new Error("this is undefined in from");
    return this.name + " " + table;
  },
  auth: {
    getUser() { return "user"; }
  }
};
const proxy = new Proxy({}, {
  get: (_, prop) => obj[prop]
});
try {
  console.log(proxy.from('users'));
} catch (e) {
  console.error("error:", e.message);
}
