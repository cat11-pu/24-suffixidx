// ops.js：装载、建表、定位（基线：一律原样返回）
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

export function load(state, text) {
  return state;
}

export function build(state) {
  return state;
}

export function locate(state, i, j) {
  return state;
}
