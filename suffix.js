// suffix.js：倍增键、顺序、位次与公共前缀
export function keyOf(rank, at, step) {
  const n = rank.length;
  const second = at + step < n ? rank[at + step] : -1;
  return [rank[at], second];
}

export function orderOf(rank, step) {
  const n = rank.length;
  const order = [];
  for (let at = 0; at < n; at += 1) {
    order.push(at);
  }
  order.sort(function (left, right) {
    const leftKey = keyOf(rank, left, step);
    const rightKey = keyOf(rank, right, step);
    if (leftKey[0] !== rightKey[0]) {
      return leftKey[0] - rightKey[0];
    }
    if (leftKey[1] !== rightKey[1]) {
      return leftKey[1] - rightKey[1];
    }
    return left - right;
  });
  return order;
}

export function ranksOf(order, rank, step) {
  const n = rank.length;
  const next = new Array(n).fill(0);
  let group = 0;
  let prev = null;
  for (const at of order) {
    const key = keyOf(rank, at, step);
    if (prev !== null && (key[0] !== prev[0] || key[1] !== prev[1])) {
      group += 1;
    }
    next[at] = group;
    prev = key;
  }
  return next;
}

export function commonOf(left, right) {
  const bound = Math.min(left.length, right.length);
  let at = 0;
  while (at < bound && left[at] === right[at]) {
    at += 1;
  }
  return at;
}
