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
			return captures[replacement] || replacement;
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

var orderlessOperators = {
	'+': true,
	'*': true
};

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

function* treePermutations(tree) {
	if (!Array.isArray(tree)) {
		yield tree;
	} else if (tree.length == 0) {
		yield [];
	} else if (orderlessOperators[head(tree)]) {
		for (var newTail of permutations(tail(tree))) {
			for (var tailPerm of treePermutations(newTail)) {
				yield [head(tree)].concat(tailPerm);
			}
		}
	} else {
		for (var newHead of treePermutations(head(tree))) {
			for (var tailPerm2 of treePermutations(tail(tree))) {
				yield [newHead].concat(tailPerm2);
			}
		}
	}
}

function findMatchAndReplace(tree, pattern, replacement) {
	for (var treePerm of treePermutations(tree)) {
		var matchInfo = findMatch(pattern, treePerm);
		if (matchInfo) {
			var [subtreeIndices, captures] = matchInfo;
			return replace(treePerm, subtreeIndices, replacement, captures);
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

var flatOperators = {
	'+': true,
	'*': true
};

function flattenFlatOperators(tree) {
	if (!Array.isArray(tree)) {
		return tree;
	}
	if (tree.length == 0) {
		return tree;
	}
	if (flatOperators[head(tree)]) {
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

var replacements = [];

function evalReplacements(tree) {
	tree = flattenFlatOperators(tree);
	if (head(tree) === 'define') {
		replacements.push([tree[1], tree[2]]);
		return '\\text{stored definition}';
	}
	var newTree = tree;
	do {
		tree = newTree;
		// newest to oldest
		for (var i = replacements.length - 1; i >= 0; i--) {
			var [pattern, replacement] = replacements[i];
			newTree = flattenFlatOperators(findMatchAndReplace(newTree, pattern, replacement));
		}
	} while (!treeEquals(tree, newTree));
	return tree;
}
