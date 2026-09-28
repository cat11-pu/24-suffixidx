import assert from "node:assert";
import { keyOf, orderOf, ranksOf, commonOf } from "../suffix.js";
import { copyState, load, build, locate } from "../ops.js";
import { render } from "../app.js";

const blank = {
  text: "", sa: [], rank: [], lcp: [],
  orders: [], ranks: [], groups: [],
  start_order: [], start_rank: [],
  queries: [], loaded: 0, builds: 0, located: 0
};

let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log("ok " + name);
  } catch (e) {
    failed += 1;
    console.log("FAIL " + name + " :: " + e.message);
  }
}

check("keyOf 给一对", () => {
  assert.ok(Array.isArray(keyOf([2, 1, 0], 1, 1)));
});

check("orderOf 给下标序列", () => {
  assert.ok(Array.isArray(orderOf([2, 1, 0], 1)));
});

check("ranksOf 给位次表", () => {
  assert.ok(Array.isArray(ranksOf([2, 1, 0], [2, 1, 0], 1)));
});

check("commonOf 给整数", () => {
  assert.strictEqual(typeof commonOf("banana", "band"), "number");
});

check("copyState 是深拷", () => {
  const copy = copyState(blank);
  assert.notStrictEqual(copy.orders, blank.orders);
  assert.strictEqual(copy.loaded, 0);
});

check("load 给状态", () => {
  const next = load(blank, "banana");
  assert.ok(Array.isArray(next.sa));
  assert.ok(Array.isArray(next.queries));
});

check("build 与 locate 给状态", () => {
  const built = build(load(blank, "banana"));
  assert.ok(Array.isArray(built.sa));
  assert.ok(Array.isArray(locate(built, 0, 1).queries));
});

check("render 给视图并数事件", () => {
  const view = render({ state: blank, events: [{ kind: "bogus" }] });
  assert.ok(Array.isArray(view.sa));
  assert.strictEqual(view.count_events, 1);
  assert.strictEqual(view.failed_events, 1);
});

console.log("8 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
