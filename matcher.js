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

function findMatchAndReplace(pattern, tree, replacement) {
	function findMatchAndReplaceRec(pattern, tree, replacement) {
		for (let captures of matches(pattern, tree)) { // max 1 iteration
			return replaceCaptures(replacement, captures);
		}
		if (Array.isArray(pattern) && Array.isArray(tree) && head(pattern) === head(tree) && hasAttribute(head(pattern), 'flat') && pattern.length < tree.length) {
			if (hasAttribute(head(pattern), 'orderless')) {
				for (let perm of permutations(tail(tree))) {
					for (let start = 0; start < perm.length; start++) {
						for (let end = start + 1; end <= perm.length; end++) {
							if (start == 0 && end == perm.length) {
								continue; // avoid infinite recursion
							}
							if (end - start == 1 && hasAttribute(head(pattern), 'oneIdentity')) {
								continue; // will be covered later
							}
							let subtree = [head(pattern), ...perm.slice(start, end)];
							let newTree = findMatchAndReplaceRec(pattern, subtree, replacement);
							if (newTree !== null) {
								perm.splice(start, end - start, newTree);
								return [head(pattern), ...perm];
							}
						}
					}
				}
			} else {
				for (let start = 0; start < tree.length - 1; start++) {
					for (let end = start + 1; end <= tree.length - 1; end++) {
						if (start == 0 && end == tree.length - 1) {
							continue; // avoid infinite recursion
						}
						if (end - start == 1 && hasAttribute(head(pattern), 'oneIdentity')) {
							continue; // will be covered later
						}
						let subtree = [head(pattern), ...tree.slice(start+1, end+1)];
						let newTree = findMatchAndReplaceRec(pattern, subtree, replacement);
						if (newTree !== null) {
							tree.splice(start + 1, end - start, newTree);
							return tree;
						}
					}
				}
			}
		}
		if (Array.isArray(tree)) {
			for (let i = 1; i < tree.length; i++) {
				let newTree = findMatchAndReplaceRec(pattern, tree[i], replacement);
				if (newTree !== null) {
					tree[i] = newTree;
					return tree;
				}
			}
		}
		return null;
	}

	let newTree = findMatchAndReplaceRec(pattern, tree, replacement);
	return newTree !== null ? newTree : tree;
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

function* nGroupings(array, n) {
	if (n == 1) {
		yield [array];
	} else {
		for (let i = 1; i < array.length - n + 2; i++) {
			for (let end of nGroupings(array.slice(i), n-1)) {
				yield [array.slice(0,i)].concat(end);
			}
		}
	}
}

function* listMatches(patternList, treeList, captures) {
	if (patternList.length == treeList.length) {
		if (patternList.length == 0) {
			yield captures;
		} else {
			for (let newCaptures of matches(head(patternList), head(treeList), captures)) {
				yield* listMatches(tail(patternList), tail(treeList), newCaptures);
			}
		}
	}
}

function* matches(pattern, tree, captures = {}) {
	if (!Array.isArray(pattern) && !Array.isArray(tree)) {
		if (pattern === tree)
			yield captures;
	} else if (isCapture(pattern)) {
		if (captures[captureVar(pattern)]) {
			if (!matches(captures[captureVar(pattern)], tree, captures).next().done)
				yield captures;
		} else {
			yield Object.assign({[captureVar(pattern)]: tree}, captures);
		}
	} else if (head(pattern) === head(tree)) {
		if (pattern.length == tree.length) { // need to be the same length to match this way
			if (hasAttribute(head(pattern), 'orderless')) {
				for (let treeTailOrder of permutations(tail(tree))) {
					yield* listMatches(tail(pattern), treeTailOrder, captures);
				}
			} else {
				yield* listMatches(tail(pattern), tail(tree), captures);
			}
		} else if (pattern.length < tree.length && hasAttribute(head(pattern), 'flat')) {
			if (hasAttribute(head(pattern), 'orderless')) {
				for (let perm of permutations(tail(tree))) {
					for (let tailGrouping of nGroupings(perm, pattern.length - 1)) {
						tailGrouping = tailGrouping.map(x => x.length == 1 && hasAttribute(head(pattern), 'oneIdentity') ? x[0] : [head(pattern), ...x]);
						yield* listMatches(tail(pattern), tailGrouping, captures);
					}
				}
			} else {
				for (let tailGrouping of nGroupings(tail(tree), pattern.length - 1)) {
					tailGrouping = tailGrouping.map(x => x.length == 1 && hasAttribute(head(pattern), 'oneIdentity') ? x[0] : [head(pattern), ...x]);
					yield* listMatches(tail(pattern), tailGrouping, captures);
				}
			}
		}
	}
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
		remainingSum.sort();
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
		remainingProduct.sort();
		return remainingProduct.length == 0 ? product : (product == 1 ? ['*', ...remainingProduct] : ['*', product, ...remainingProduct]);
	case '^':
		if (!isNaN(evaledTail[0]) && !isNaN(evaledTail[1])) {
			return evaledTail[0] ** evaledTail[1];
		}
	default:
		return [head(tree), ...evaledTail];
	}
}

function simplify(tree) {
	return evalConstants(flattenFlatOperators(tree));
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

var replacements = [];

function evalReplacements(tree) {
	tree = simplify(tree);
	if (head(tree) === 'define') {
		replacements.push([tree[1], tree[2]]);
		return '\\text{stored definition}';
	}
	console.time('evalReplacements');
	var newTree;
	var changeMade = true;
	while (changeMade) {
		changeMade = false;
		// newest to oldest
		for (var i = replacements.length - 1; i >= 0; i--) {
			var [pattern, replacement] = replacements[i];
			newTree = simplify(findMatchAndReplace(pattern, tree, replacement));
			if (!treeEquals(tree, newTree)) {
				changeMade = true;
				tree = newTree;
			}
		}
	}
	console.timeEnd('evalReplacements');
	return tree;
}
