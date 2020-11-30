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
		s = '';
		for (i = 1; i < tree.length; i++) {
			if (Array.isArray(tree[i]) && tree[i][0] == '+') {
				s += '\\left(' + printLatex(tree[i]) + '\\right)';
			} else if (tree[i] == -1) {
				s = '-' + s;
			} else {
				s += printLatex(tree[i]);
			}
		}
		return s;
	default:
		throw 'cannot print operator: ' + tree[0];
	}
}
