function levenshteinDistance (base: string, search: string) {
	if (base === search)
		return 0;

	const n = base.length, m = search.length;
	if (n === 0 || m === 0)
		return n + m;

	let x = 0, y, a, b, c, d, g, h, k;
	const p = new Array(n);
	for (y = 0; y < n;)
		p[y] = ++y;

	for (; (x + 3) < m; x += 4) {
		const e1 = search.charCodeAt(x);
		const e2 = search.charCodeAt(x + 1);
		const e3 = search.charCodeAt(x + 2);
		const e4 = search.charCodeAt(x + 3);
		c = x;
		b = x + 1;
		d = x + 2;
		g = x + 3;
		h = x + 4;
		for (y = 0; y < n; y++) {
			k = base.charCodeAt(y);
			a = p[y];
			if (a < c || b < c) {
				c = (a > b
					? b + 1
					: a + 1);
			} else {
				if (e1 !== k)
					c++;
			}

			if (c < b || d < b) {
				b = (c > d
					? d + 1
					: c + 1);
			} else {
				if (e2 !== k)
					b++;
			}

			if (b < d || g < d) {
				d = (b > g
					? g + 1
					: b + 1);
			} else {
				if (e3 !== k)
					d++;
			}

			if (d < g || h < g) {
				g = (d > h
					? h + 1
					: d + 1);
			} else {
				if (e4 !== k)
					g++;
			}
			p[y] = h = g;
			g = d;
			d = b;
			b = c;
			c = a;
		}
	}

	for (; x < m;) {
		const e = search.charCodeAt(x);
		c = x;
		d = ++x;
		for (y = 0; y < n; y++) {
			a = p[y];
			if (a < c || d < c) {
				d = (a > d
					? d + 1
					: a + 1);
			} else {
				if (e !== base.charCodeAt(y))
					d = c + 1;
				else
					d = c;
			}
			p[y] = d;
			c = a;
		}
		h = d;
	}

	return h;
}

export default (base: string, search: string, lowerOfEqualThan = 4) => levenshteinDistance(base, search) <= lowerOfEqualThan;
