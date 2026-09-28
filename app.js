// app.js：后缀排名阶梯视图（文本带、轮次阶梯、相邻公共前缀、查询台）
import { commonOf } from "./suffix.js";
import { copyState, load, build, locate } from "./ops.js";

function applyEvent(state, event) {
  if (event.kind === "load") {
    return load(state, event.text);
  }
  if (event.kind === "build") {
    return build(state);
  }
  if (event.kind === "locate") {
    return locate(state, event.i, event.j);
  }
  throw Object.assign(new Error("E_KIND"), { code: "E_KIND" });
}

export function render(spec) {
  let state = copyState(spec.state);
  const failed = [];
  const log = [];
  let index = 0;
  for (const event of spec.events || []) {
    index += 1;
    const before = state.located;
    try {
      state = applyEvent(state, event);
      log.push([index, event.kind, state.located > before ? "定位" : "过账", ""]);
    } catch (error) {
      const mark = error && error.code ? error.code : "E_KIND";
      failed.push([event.kind, mark]);
      log.push([index, event.kind, "打回", String(mark)]);
    }
  }
  const text = state.text || "";
  const n = text.length;
  const sa = state.sa || [];
  const rank = state.rank || [];
  const lcp = state.lcp || [];
  const groups = state.groups || [];

  const aligned = sa.length === n && rank.length === n && lcp.length === n;
  let sa_perm = aligned;
  const seen = {};
  for (const at of sa) {
    if (typeof at !== "number" || at < 0 || at >= n || seen[at]) {
      sa_perm = false;
    }
    seen[at] = true;
  }
  let sorted_ok = aligned;
  for (let k = 1; k < sa.length; k += 1) {
    if (!(text.slice(sa[k - 1]) < text.slice(sa[k]))) {
      sorted_ok = false;
    }
  }
  let rank_ok = aligned;
  for (let k = 0; k < sa.length; k += 1) {
    if (rank[sa[k]] !== k) {
      rank_ok = false;
    }
  }
  for (let at = 0; at < rank.length; at += 1) {
    if (sa[rank[at]] !== at) {
      rank_ok = false;
    }
  }
  let lcp_ok = aligned && lcp.length > 0 && lcp[0] === 0;
  for (let k = 1; k < lcp.length; k += 1) {
    const bound = Math.min(n - sa[k - 1], n - sa[k]);
    if (typeof lcp[k] !== "number" || lcp[k] < 0 || lcp[k] > bound) {
      lcp_ok = false;
    } else if (lcp[k] !== commonOf(text.slice(sa[k - 1]), text.slice(sa[k]))) {
      lcp_ok = false;
    }
  }
  let groups_ok = true;
  for (let t = 1; t < groups.length; t += 1) {
    if (groups[t] < groups[t - 1]) {
      groups_ok = false;
    }
  }
  const final_groups = groups.length > 0 && groups[groups.length - 1] === n;

  let repeat_len = 0;
  let repeat_at = -1;
  for (let k = 1; k < lcp.length; k += 1) {
    if (lcp[k] > repeat_len) {
      repeat_len = lcp[k];
      repeat_at = Math.min(sa[k - 1], sa[k]);
    }
  }
  let lcp_sum = 0;
  for (const value of lcp) {
    lcp_sum += value;
  }
  const distinct = n * (n + 1) / 2 - lcp_sum;

  return {
    text: text,
    sa: sa.slice(),
    rank: rank.slice(),
    lcp: lcp.slice(),
    orders: (state.orders || []).map(function (row) { return row.slice(); }),
    ranks: (state.ranks || []).map(function (row) { return row.slice(); }),
    groups: groups.slice(),
    start_order: (state.start_order || []).slice(),
    start_rank: (state.start_rank || []).slice(),
    queries: (state.queries || []).map(function (row) { return row.slice(); }),
    loaded: state.loaded,
    builds: state.builds,
    located: state.located,
    rounds: (state.orders || []).length,
    repeat_len: repeat_len,
    repeat_at: repeat_at,
    distinct: distinct,
    lcp_sum: lcp_sum,
    sa_perm: sa_perm,
    sorted_ok: sorted_ok,
    rank_ok: rank_ok,
    lcp_ok: lcp_ok,
    groups_ok: groups_ok,
    final_groups: final_groups,
    aligned: aligned,
    log: log,
    failed_events: failed.length,
    failed_marks: failed,
    count_events: (spec.events || []).length
  };
}
