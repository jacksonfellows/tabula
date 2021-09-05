function isPrinterConstant(tree) {
	if (!Array.isArray(tree)) {
		return !isNaN(tree);
	}
	if (['+', '*', '/', '^'].includes(tree[0])) {
		return tree.slice(1).every(isPrinterConstant);
	}
	return false;
}

const special = ['pi', 'rho', 'theta', 'lambda', 'alpha'];

function printLatex(tree) {
	if (!Array.isArray(tree)) {
		if (tree === true)
			return '\\text{true}';
		if (tree === false)
			return '\\text{false}';
		if (!isNaN(tree))
			return String(tree);
		let [pre,sub] = tree.split('_');
		return (special.includes(pre) ? '\\' : '') + tree;
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
				if (i > 0 && isPrinterConstant(tail[i-1]) && isPrinterConstant(tail[i])) {
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
	case 'binom':
		return '\\binom{' + printLatex(tree[1]) + '}{' + printLatex(tree[2]) + '}';
	case '=': case '!=': case '>': case '>=': case '<': case '<=':
		return printLatex(tree[1]) + ' ' + {'=': '=', '!=': '\\ne ', '>': '> ', '>=': '\\ge', '<': '<', '<=': '\\le'}[tree[0]] + ' ' + printLatex(tree[2]);
	case 'list':
		return '\\left\\{' + tree.slice(1).map(printLatex).join(',') + '\\right\\}';
	case 'cross':
		return printLatex(tree[1]) + '\\times ' + printLatex(tree[2]);
	case 'not':
		// only worry about stuff that would actually be under a not (e.g. don't worry about + expressions)
		return '\\not ' + (Array.isArray(tree[1]) && ['=','!=','>','>=','<','<='].includes(tree[1][0]) ? ('\\left(' + printLatex(tree[1]) + '\\right)') : printLatex(tree[1]));
	case 'magnitude':
		return '\\left|' + printLatex(tree[1]) + '\\right|';
	default:
		return '\\text{' + tree[0] + '}\\left[' + tree.slice(1).map(printLatex).join(',') + '\\right]';
	}
}

const operators = ['cos', 'sin'];
const infix = ['+', '*', '>', '>=', '<', '<='];

function printDesmosLatex(tree) {
	if (!Array.isArray(tree)) return operators.includes(tree) ? '\\' + tree : String(tree);
	if (infix.includes(tree[0])) return tree.slice(1).map(x => '\\left(' + printDesmosLatex(x) + '\\right)').join(printDesmosLatex(tree[0]));
	if (tree[0] === '=') return printDesmosLatex(tree[1]) + ' = ' + printDesmosLatex(tree[2]);
	if (tree[0] === '/') return '\\frac{' + printDesmosLatex(tree[1]) + '}{' + printDesmosLatex(tree[2]) + '}';
	if (tree[0] === '^') return '{' + printDesmosLatex(tree[1]) + '}^{' + printDesmosLatex(tree[2]) + '}';
	if (tree[0] === 'list') return '\\left[' + tree.slice(1).map(x => printDesmosLatex(x)).join(',') + '\\right]';
	return printDesmosLatex(tree[0]) + '\\left(' + tree.slice(1).map(printDesmosLatex).join(',') + '\\right)';
}
