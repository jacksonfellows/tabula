function printLatex(tree) {
	if (!Array.isArray(tree)) {
		return String(tree);
	}
	var s, i;
	switch (tree[0]) {
	case '+':
		s = '';
		for (i = 1; i < tree.length; i++) {
			var p = printLatex(tree[i]);
			if (i == 1 || p.startsWith('-')) {
				s += p;
			} else {
				s += '+' + p;
			}
		}
		return s;
	case '*':
		var nNegatives = tree.slice(1).filter(v => v == -1).length;
		s = nNegatives % 2 == 0 ? '' : '-';
		var tail = tree.slice(1).filter(v => v != -1);
		for (i = 0; i < tail.length; i++) {
			if (Array.isArray(tail[i]) && tail[i][0] == '+') {
				s += '\\left(' + printLatex(tail[i]) + '\\right)';
			} else {
				if (i > 0 && !isNaN(tail[i-1]) && !isNaN(tail[i])) {
					s += '\\cdot' + printLatex(tail[i]);
				} else {
					s += printLatex(tail[i]);
				}
			}
		}
		return s;
	default:
		throw 'cannot print operator: ' + tree[0];
	}
}
