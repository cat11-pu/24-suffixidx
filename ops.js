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
  if (!/^[a-z]*$/.test(text)) {
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
  if (state.loaded === 0 || state.text.length < 2) {
    fail("E_NOLOAD");
  }
  if (state.sa.length === state.text.length) {
    fail("E_BUILT");
  }
  const next = copyState(state);
  const n = next.text.length;

  const startRank = [];
  for (let at = 0; at < n; at += 1) {
    startRank.push(next.text.charCodeAt(at) - 97);
  }
  const startOrder = orderOf(startRank, 0);
  next.start_rank = startRank;
  next.start_order = startOrder;

  let rank = startRank;
  let step = 1;
  while (step < n) {
    const order = orderOf(rank, step);
    rank = ranksOf(order, rank, step);
    const groups = Math.max.apply(null, rank) + 1;
    next.orders.push(order);
    next.ranks.push(rank.slice());
    next.groups.push(groups);
    step *= 2;
  }

  const last = next.orders.length - 1;
  next.sa = next.orders[last];
  next.rank = next.ranks[last];

  next.lcp = new Array(n).fill(0);
  for (let k = 1; k < n; k += 1) {
    next.lcp[k] = commonOf(
      next.text.slice(next.sa[k - 1]),
      next.text.slice(next.sa[k])
    );
  }

  next.builds += 1;
  return next;
}

export function locate(state, i, j) {
  if (state.sa.length !== state.text.length || state.loaded === 0) {
    fail("E_NOBUILD");
  }
  const n = state.text.length;
  if (!Number.isInteger(i) || !Number.isInteger(j) || i < 0 || i >= n || j < 0 || j >= n) {
    fail("E_RANGE");
  }
  if (i === j) {
    fail("E_SAME");
  }
  const next = copyState(state);
  const value = commonOf(next.text.slice(i), next.text.slice(j));
  next.queries.push([i, j, value]);
  next.located += 1;
  return next;
}
