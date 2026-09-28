// suffix.js：倍增键、顺序、位次与公共前缀
export function keyOf(rank, at, step) {
  const second = at + step < rank.length ? rank[at + step] : -1;
  return [rank[at], second];
}

export function orderOf(rank, step) {
  const order = rank.map(function (_value, at) { return at; });
  order.sort(function (a, b) {
    const ka = keyOf(rank, a, step);
    const kb = keyOf(rank, b, step);
    if (ka[0] !== kb[0]) {
      return ka[0] - kb[0];
    }
    if (ka[1] !== kb[1]) {
      return ka[1] - kb[1];
    }
    return a - b;
  });
  return order;
}

export function ranksOf(order, rank, step) {
  const next = new Array(rank.length);
  let group = -1;
  let previous = null;
  for (const at of order) {
    const key = keyOf(rank, at, step);
    if (previous === null || key[0] !== previous[0] || key[1] !== previous[1]) {
      group += 1;
      previous = key;
    }
    next[at] = group;
  }
  return next;
}

export function commonOf(left, right) {
  const bound = Math.min(left.length, right.length);
  let length = 0;
  while (length < bound && left.charCodeAt(length) === right.charCodeAt(length)) {
    length += 1;
  }
  return length;
}
