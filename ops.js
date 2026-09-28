// ops.js：装载、建表、定位
import { keyOf, orderOf, ranksOf, commonOf } from "./suffix.js";

export function copyState(state) {
  return {
    text: state.text || "",
    sa: (state.sa || []).slice(),
    rank: (state.rank || []).slice(),
    lcp: (state.lcp || []).slice(),
    orders: (state.orders || []).map(function (row) { return row.slice(); }),
    ranks: (state.ranks || []).map(function (row) { return row.slice(); }),
    groups: (state.groups || []).slice(),
    start_order: (state.start_order || []).slice(),
    start_rank: (state.start_rank || []).slice(),
    queries: (state.queries || []).map(function (row) { return row.slice(); }),
    loaded: state.loaded || 0,
    builds: state.builds || 0,
    located: state.located || 0
  };
}

function fail(code) {
  throw Object.assign(new Error(code), { code: code });
}

export function load(state, text) {
  if (typeof text !== "string") {
    fail("E_TEXT");
  }
  if (!/^[a-z]+$/.test(text)) {
    fail("E_CHAR");
  }
  if (text.length < 2) {
    fail("E_SHORT");
  }
  const next = copyState(state);
  next.text = text;
  next.sa = [];
  next.rank = [];
  next.lcp = [];
  next.orders = [];
  next.ranks = [];
  next.groups = [];
  next.start_order = [];
  next.start_rank = [];
  next.loaded += 1;
  return next;
}

export function build(state) {
  if (state.loaded === 0) {
    fail("E_NOLOAD");
  }
  const text = state.text;
  const n = text.length;
  if (state.sa.length === n && n > 0) {
    fail("E_BUILT");
  }
  const next = copyState(state);

  next.start_rank = [];
  for (let at = 0; at < n; at += 1) {
    next.start_rank.push(text.charCodeAt(at) - 97);
  }
  next.start_order = next.start_rank.map(function (_value, at) { return at; });
  next.start_order.sort(function (a, b) {
    if (next.start_rank[a] !== next.start_rank[b]) {
      return next.start_rank[a] - next.start_rank[b];
    }
    return a - b;
  });

  let rank = next.start_rank.slice();
  next.orders = [];
  next.ranks = [];
  next.groups = [];
  for (let step = 1; step < n; step *= 2) {
    const order = orderOf(rank, step);
    rank = ranksOf(order, rank, step);
    let groupMax = 0;
    for (const value of rank) {
      if (value > groupMax) {
        groupMax = value;
      }
    }
    next.orders.push(order);
    next.ranks.push(rank.slice());
    next.groups.push(groupMax + 1);
  }

  next.sa = next.orders[next.orders.length - 1].slice();
  next.rank = rank.slice();
  next.lcp = [0];
  for (let k = 1; k < n; k += 1) {
    next.lcp.push(commonOf(text.slice(next.sa[k - 1]), text.slice(next.sa[k])));
  }
  next.builds += 1;
  return next;
}

export function locate(state, i, j) {
  const n = state.text.length;
  if (state.loaded === 0 || state.sa.length !== n) {
    fail("E_NOBUILD");
  }
  if (!Number.isInteger(i) || !Number.isInteger(j) || i < 0 || i >= n || j < 0 || j >= n) {
    fail("E_RANGE");
  }
  if (i === j) {
    fail("E_SAME");
  }
  const next = copyState(state);
  const length = commonOf(next.text.slice(i), next.text.slice(j));
  next.queries.push([i, j, length]);
  next.located += 1;
  return next;
}
