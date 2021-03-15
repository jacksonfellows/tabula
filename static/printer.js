function isConstant(tree) {
	if (!Array.isArray(tree)) {
		return !isNaN(tree);
	}
	if (['+', '*', '/', '^'].includes(tree[0])) {
		return tree.slice(1).every(isConstant);
	}
	return false;
}

function printLatex(tree) {
	if (!Array.isArray(tree)) {
		return tree === true ? '\\text{true}' : (tree === false ? '\\text{false}' : String(tree));
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
				if (i > 0 && isConstant(tail[i-1]) && isConstant(tail[i])) {
					s += '\\cdot' + printLatex(tail[i]);
				} else {
					s += printLatex(tail[i]);
				}
			}
		}
		return s;
	case '/':
		return '\\frac{' + printLatex(tree[1]) + '}{' + printLatex(tree[2]) + '}';
	case '^':
		// TODO use treeEq
		if (JSON.stringify(tree[2]) === JSON.stringify(['/', 1, 2])) {
			return '\\sqrt{' + printLatex(tree[1]) + '}';
		}
		return (Array.isArray(tree[1]) ? '\\left(' + printLatex(tree[1]) + '\\right)' : printLatex(tree[1])) + '^' + '{' + printLatex(tree[2]) + '}';
	case '=': case '!=': case '>': case '>=': case '<': case '<=':
		return printLatex(tree[1]) + {'=': '=', '!=': '\\ne ', '>': '>', '>=': '\\ge ', '<': '<', '<=': '\\le '}[tree[0]] + printLatex(tree[2]);
	case 'list':
		return '\\left\\{' + tree.slice(1).map(printLatex).join(',') + '\\right\\}';
	case 'cross':
		return printLatex(tree[1]) + '\\times ' + printLatex(tree[2]);
	default:
		return '\\text{' + tree[0] + '}\\left[' + tree.slice(1).map(printLatex).join(',') + '\\right]';
	}
}