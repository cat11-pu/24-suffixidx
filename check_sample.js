import fs from "node:fs";
import { keyOf, orderOf, ranksOf, commonOf } from "./suffix.js";
import { copyState, load, build, locate } from "./ops.js";

const __lines = [];
function emit(label, value) {
  __lines.push([String(label).replace(/ =$/, ""), value]);
}

const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/text.json", "utf8"));

function apply(state, event) {
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

function fingerprint(one) {
  return JSON.stringify({
    text: one.text, sa: one.sa, rank: one.rank, lcp: one.lcp,
    orders: one.orders, ranks: one.ranks, groups: one.groups,
    start_order: one.start_order, start_rank: one.start_rank,
    queries: one.queries, loaded: one.loaded, builds: one.builds, located: one.located
  });
}

const events = spec.events || [];
let state = copyState(spec.state);
let failed = 0;
const marks = [];
for (const event of events) {
  try {
    state = apply(state, event);
  } catch (error) {
    failed += 1;
    marks.push([event.kind, error && error.code ? error.code : "E_KIND"]);
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

let replay = copyState(spec.state);
let replayFailed = 0;
for (const event of events) {
  try {
    replay = apply(replay, event);
  } catch (error) {
    replayFailed += 1;
  }
}
const half = Math.ceil(events.length / 2);
let left = copyState(spec.state);
for (const event of events.slice(0, half)) {
  try {
    left = apply(left, event);
  } catch (error) {
    /* 前一半出错就跳过 */
  }
}
const midFinger = fingerprint(left);
let right = left;
for (const event of events.slice(half)) {
  try {
    right = apply(right, event);
  } catch (error) {
    /* 后一半出错就跳过 */
  }
}

emit("收尾文本", text);
emit("收尾后缀数组", sa);
emit("收尾位次表", rank);
emit("收尾相邻公共前缀", lcp);
emit("起始顺序", state.start_order || []);
emit("起始位次表", state.start_rank || []);
emit("各轮顺序", state.orders || []);
emit("各轮位次表", state.ranks || []);
emit("各轮分组数", groups);
emit("轮数", (state.orders || []).length);
emit("查询记录", state.queries || []);
emit("装载计数", state.loaded || 0);
emit("建表计数", state.builds || 0);
emit("定位计数", state.located || 0);
emit("最长重复子串长度", repeat_len);
emit("最长重复子串起点", repeat_at);
emit("不同子串个数", distinct);
emit("后缀数组是排列", sa_perm);
emit("后缀数组升序成立", sorted_ok);
emit("位次互逆成立", rank_ok);
emit("相邻公共前缀合规", lcp_ok);
emit("分组数逐轮不减", groups_ok);
emit("收尾分组数等于长度", final_groups);
emit("失败事件数", failed);
emit("失败事件码", marks);
emit("重放不新增", fingerprint(replay) === fingerprint(state) ? 0 : 1);
emit("重放报错条数", replayFailed);
emit("拆两轮中间态不同", midFinger !== fingerprint(state));
emit("拆两轮收尾态一致", fingerprint(right) === fingerprint(state));
emit("辅助键", keyOf([2, 1, 0], 1, 1));
emit("辅助顺序", orderOf([2, 1, 0], 1));
emit("辅助位次", ranksOf([2, 1, 0], [2, 1, 0], 1));
emit("辅助公共前缀", commonOf("banana", "band"));

// ---- 异常路径探针：真调用实现，看它报出什么码 ----
try {
  build(copyState(spec.state));
  emit("未装载就建表报码", "没有报错");
} catch (error) {
  emit("未装载就建表报码", error && error.code ? error.code : String(error.message));
}
try {
  build(copyState(state));
  emit("重复建表报码", "没有报错");
} catch (error) {
  emit("重复建表报码", error && error.code ? error.code : String(error.message));
}
try {
  locate(copyState(spec.state), 0, 1);
  emit("没建表就定位报码", "没有报错");
} catch (error) {
  emit("没建表就定位报码", error && error.code ? error.code : String(error.message));
}
try {
  locate(copyState(state), 0, 6);
  emit("越界定位报码", "没有报错");
} catch (error) {
  emit("越界定位报码", error && error.code ? error.code : String(error.message));
}
try {
  locate(copyState(state), 2, 2);
  emit("相同下标定位报码", "没有报错");
} catch (error) {
  emit("相同下标定位报码", error && error.code ? error.code : String(error.message));
}
try {
  load(copyState(state), "b@nana");
  emit("坏字符装载报码", "没有报错");
} catch (error) {
  emit("坏字符装载报码", error && error.code ? error.code : String(error.message));
}
try {
  load(copyState(state), "a");
  emit("过短装载报码", "没有报错");
} catch (error) {
  emit("过短装载报码", error && error.code ? error.code : String(error.message));
}
try {
  load(copyState(state), 7);
  emit("非字符串装载报码", "没有报错");
} catch (error) {
  emit("非字符串装载报码", error && error.code ? error.code : String(error.message));
}

// ---- 期望值（参考模型算出，见生成器）----
const EXPECTED = {
  "收尾文本": "banana",
  "收尾后缀数组": [
    5,
    3,
    1,
    0,
    4,
    2
  ],
  "收尾位次表": [
    3,
    2,
    5,
    1,
    4,
    0
  ],
  "收尾相邻公共前缀": [
    0,
    1,
    3,
    0,
    0,
    2
  ],
  "起始顺序": [
    1,
    3,
    5,
    0,
    2,
    4
  ],
  "起始位次表": [
    1,
    0,
    13,
    0,
    13,
    0
  ],
  "各轮顺序": [
    [
      5,
      1,
      3,
      0,
      2,
      4
    ],
    [
      5,
      3,
      1,
      0,
      4,
      2
    ],
    [
      5,
      3,
      1,
      0,
      4,
      2
    ]
  ],
  "各轮位次表": [
    [
      2,
      1,
      3,
      1,
      3,
      0
    ],
    [
      3,
      2,
      5,
      1,
      4,
      0
    ],
    [
      3,
      2,
      5,
      1,
      4,
      0
    ]
  ],
  "各轮分组数": [
    4,
    6,
    6
  ],
  "轮数": 3,
  "查询记录": [
    [
      3,
      5,
      1
    ],
    [
      1,
      4,
      4
    ],
    [
      7,
      10,
      1
    ],
    [
      4,
      9,
      0
    ],
    [
      0,
      2,
      0
    ]
  ],
  "装载计数": 2,
  "建表计数": 2,
  "定位计数": 5,
  "最长重复子串长度": 3,
  "最长重复子串起点": 1,
  "不同子串个数": 15,
  "后缀数组是排列": true,
  "后缀数组升序成立": true,
  "位次互逆成立": true,
  "相邻公共前缀合规": true,
  "分组数逐轮不减": true,
  "收尾分组数等于长度": true,
  "失败事件数": 7,
  "失败事件码": [
    [
      "locate",
      "E_SAME"
    ],
    [
      "locate",
      "E_RANGE"
    ],
    [
      "build",
      "E_BUILT"
    ],
    [
      "load",
      "E_CHAR"
    ],
    [
      "load",
      "E_SHORT"
    ],
    [
      "load",
      "E_TEXT"
    ],
    [
      "locate",
      "E_NOBUILD"
    ]
  ],
  "重放不新增": 0,
  "重放报错条数": 7,
  "拆两轮中间态不同": true,
  "拆两轮收尾态一致": true,
  "辅助键": [
    1,
    0
  ],
  "辅助顺序": [
    2,
    1,
    0
  ],
  "辅助位次": [
    2,
    1,
    0
  ],
  "辅助公共前缀": 3,
  "未装载就建表报码": "E_NOLOAD",
  "重复建表报码": "E_BUILT",
  "没建表就定位报码": "E_NOBUILD",
  "越界定位报码": "E_RANGE",
  "相同下标定位报码": "E_SAME",
  "坏字符装载报码": "E_CHAR",
  "过短装载报码": "E_SHORT",
  "非字符串装载报码": "E_TEXT"
};
function __same(got, want) {
  if (typeof got === "string") {
    try {
      const parsed = JSON.parse(got);
      if (JSON.stringify(parsed) === JSON.stringify(want)) {
        return true;
      }
    } catch (error) {
      /* 不是 JSON 就当普通串比 */
    }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) {
    __bad += 1;
    console.log("缺失验收项 " + label);
    continue;
  }
  if (__same(found[1], want)) {
    console.log("一致 " + label + " = " + JSON.stringify(found[1]));
  } else {
    __bad += 1;
    console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(found[1]));
  }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
