var functionAttributes = {
	'+': ['orderless', 'flat', 'oneIdentity'],
	'*': ['orderless', 'flat', 'oneIdentity']
};

function hasAttribute(f, attribute) {
	return functionAttributes[f] && functionAttributes[f].includes(attribute);
}

function head(a) {
	return a[0];
}

function tail(a) {
	return a.slice(1);
}

function isCapture(pattern) {
	return Array.isArray(pattern) && head(pattern) == '.';
}

function captureVar(capture) {
	return capture[1];
}

function match(pattern, tree) {
	function matchRec(pattern, tree) {
		if (!Array.isArray(pattern) && !Array.isArray(tree)) {
			return pattern === tree;
		}
		if (!Array.isArray(pattern) || !Array.isArray(tree)) {
			return false;
		}
		if (pattern.length == 0 && tree.length == 0) {
			return true;
		}
		if (isCapture(pattern)) {
			if (captures[captureVar(pattern)]) {
				return matchRec(captures[captureVar(pattern)], tree);
			}
			captures[captureVar(pattern)] = tree;
			return true;
		}
		if (isCapture(head(pattern))) {
			if (matchRec(tail(pattern), tail(tree))) {
				if (captures[captureVar(head(pattern))]) {
					return matchRec(captures[captureVar(head(pattern))], head(tree));
				}
				captures[captureVar(head(pattern))] = head(tree);
				return true;
			}
			return false;
		}
		if (matchRec(head(pattern), head(tree))) {
			return matchRec(tail(pattern), tail(tree));
		}
		return false;
	}

	var captures = {};
	if (matchRec(pattern, tree)) {
		return captures;
	}
	return false;
}

function findMatch(pattern, tree, indices = []) {
	var captures = match(pattern, tree);
	if (captures) {
		return [indices, captures];
	}
	if (Array.isArray(tree)) {
		for (var i = 0; i < tree.length; i++) {
			var m = findMatch(pattern, tree[i], indices.concat([i]));
			if (m) {
				return m;
			}
		}
	}
	return null;
}

function replace(tree, subtreeIndices, replacement, captures) {
	function replaceRec(tree, subtreeIndices, replacement, captures) {
		if (subtreeIndices.length == 0) {
			return replaceCaptures(replacement, captures);
		}
		for (var i = 0; i < tree.length; i++) {
			if (i == head(subtreeIndices)) {
				tree[i] = replaceRec(tree[i], tail(subtreeIndices), replacement, captures);
				return tree;
			}
		}
		return null;
	}
	return replaceRec(deepCopyTree(tree), subtreeIndices, replacement, captures);
}

function replaceCaptures(replacement, captures) {
	function replaceCapturesRec(replacement, captures) {
		if (!Array.isArray(replacement)) {
			if (captures[replacement] !== undefined) {
				return captures[replacement];
			}
			return replacement;
		}
		for (var i = 0; i < replacement.length; i++) {
			replacement[i] = replaceCapturesRec(replacement[i], captures);
		}
		return replacement;
	}
	return replaceCapturesRec(deepCopyTree(replacement), captures);
}

function deepCopyTree(tree) {
	if (!Array.isArray(tree)) {
		return tree;
	}
	return tree.map(deepCopyTree);
}

function* permutations(array, k) {
	k = k || array.length;
	if (k == 1) {
		yield array;
	} else {
		for (var i = 0; i < k; i++) {
			yield* permutations(array, k-1);
			var tmp;
			if (k % 2) {
				tmp = array[0];
				array[0] = array[k-1];
				array[k-1] = tmp;
			} else {
				tmp = array[i];
				array[i] = array[k-1];
				array[k-1] = tmp;
			}
		}
	}
}

function* treeOrderlessPermutations(tree) {
	if (!Array.isArray(tree)) {
		yield tree;
	} else if (tree.length == 0) {
		yield [];
	} else if (hasAttribute(head(tree), 'orderless')) {
		for (var newTail of permutations(tail(tree))) {
			for (var tailPerm of treeOrderlessPermutations(newTail)) {
				yield [head(tree)].concat(tailPerm);
			}
		}
	} else {
		for (var newHead of treeOrderlessPermutations(head(tree))) {
			for (var tailPerm2 of treeOrderlessPermutations(tail(tree))) {
				yield [newHead].concat(tailPerm2);
			}
		}
	}
}

function* listGroupings(args) {
	if (args.length == 0) {
		yield [];
	} else {
		for (var start of treeFlatGroupings(head(args))) {
			for (var end of listGroupings(tail(args))) {
				yield [start].concat(end);
			}
		}
	}
}

function* treeFlatGroupings(tree) {
	if (!Array.isArray(tree)) {
		yield tree;
	} else if (tree.length == 0) {
		yield [];
	} else if (hasAttribute(head(tree), 'flat')) {
		var op = head(tree);
		var args = tail(tree);
		if (args.length == 1 && hasAttribute(op, 'oneIdentity')) {
			yield* treeFlatGroupings(args[0]);
		} else {
			for (var argGroupings of listGroupings(args)) {
				yield [op].concat(argGroupings);
			}
		}
		if (!(args.length == 2 && hasAttribute(op, 'oneIdentity'))) {
			for (var i = 1; i < args.length; i++) {
				for (var start of treeFlatGroupings([op].concat(args.slice(0,i)))) {
					for (var end of treeFlatGroupings([op].concat(args.slice(i)))) {
						yield [op].concat([start].concat([end]));
					}
				}
			}
		}
	} else {
		for (var tailGroupings of listGroupings(tail(tree))) {
			yield [head(tree)].concat(tailGroupings);
		}
	}
}

const MAX_N_TREES = 10000;

function findMatchAndReplace(tree, pattern, replacement) {
	var n = 0;
	for (var treePerm of treeOrderlessPermutations(tree)) {
		for (var treeGrouping of treeFlatGroupings(treePerm)) {
			if (n++ >= MAX_N_TREES) {
				console.log('too many trees, aborting search for pattern ' + JSON.stringify(pattern) + ' in tree ' + JSON.stringify(tree));
				return tree;
			}
			var matchInfo = findMatch(pattern, treeGrouping);
			if (matchInfo) {
				var [subtreeIndices, captures] = matchInfo;
				return replace(treeGrouping, subtreeIndices, replacement, captures);
			}
		}
	}
	return tree;
}

function treeEquals(a, b) {
	if (!Array.isArray(a) && !Array.isArray(b)) {
		return a === b;
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length != b.length) {
			return false;
		}
		if (a.length == 0 && b.length == 0) {
			return true;
		}
		return treeEquals(head(a), head(b)) && treeEquals(tail(a), tail(b));
	}
	return false;
}

function flattenFlatOperators(tree) {
	if (!Array.isArray(tree)) {
		return tree;
	}
	if (tree.length == 0) {
		return tree;
	}
	if (hasAttribute(head(tree), 'flat')) {
		var newTree = [head(tree)];
		for (var i = 1; i < tree.length; i++) {
			var subtree = flattenFlatOperators(tree[i]);
			if (Array.isArray(subtree) && head(tree) === head(subtree)) {
				newTree.push(...tail(subtree));
			} else {
				newTree.push(subtree);
			}
		}
		return newTree;
	}
	return tree.map(flattenFlatOperators);
}

function evalConstants(tree) {
	if (!Array.isArray(tree)) {
		return tree;
	}
	if (tree.length == 0) {
		return tree;
	}
	var evaledTail = tail(tree).map(evalConstants);
	switch (head(tree)) {
	case '+':
		var sum = 0;
		var remainingSum = [];
		evaledTail.forEach(x => {
			if (isNaN(x)) {
				remainingSum.push(x);
			} else {
				sum += x;
			}
		});
		return remainingSum.length == 0 ? sum : (sum == 0 ? ['+', ...remainingSum] : ['+', sum, ...remainingSum]);
	case '*':
		var product = 1;
		var remainingProduct = [];
		evaledTail.forEach(x => {
			if (isNaN(x)) {
				remainingProduct.push(x);
			} else {
				product *= x;
			}
		});
		return remainingProduct.length == 0 ? product : (product == 1 ? ['*', ...remainingProduct] : ['*', product, ...remainingProduct]);
	default:
		return [head(tree), ...evaledTail];
	}
}

function simplify(tree) {
	return evalConstants(flattenFlatOperators(tree));
}

var replacements = [];

function evalReplacements(tree) {
	tree = simplify(tree);
	if (head(tree) === 'define') {
		replacements.push([tree[1], tree[2]]);
		return '\\text{stored definition}';
	}
	var newTree;
	var changeMade = true;
	while (changeMade) {
		changeMade = false;
		// newest to oldest
		for (var i = replacements.length - 1; i >= 0; i--) {
			var [pattern, replacement] = replacements[i];
			newTree = simplify(findMatchAndReplace(tree, pattern, replacement));
			if (!treeEquals(tree, newTree)) {
				changeMade = true;
				tree = newTree;
			}
		}
	}
	return tree;
}
