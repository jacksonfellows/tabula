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

function findMatchAndReplace(pattern, tree, replacement, cond, replacements) {
	function findMatchAndReplaceRec(pattern, tree, replacement, cond) {
		for (let captures of matches(pattern, tree, cond, replacements)) { // max 1 iteration
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
							let newTree = findMatchAndReplaceRec(pattern, subtree, replacement, cond);
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
						let subtree = [head(pattern), ...tree.slice(start + 1, end + 1)];
						let newTree = findMatchAndReplaceRec(pattern, subtree, replacement, cond);
						if (newTree !== null) {
							tree.splice(start + 1, end - start, newTree);
							return tree;
						}
					}
				}
			}
		}
		if (Array.isArray(tree)) {
			let changeMade = false;
			for (let i = 1; i < tree.length; i++) {
				let newTree = findMatchAndReplaceRec(pattern, tree[i], replacement, cond);
				if (newTree !== null) {
					tree[i] = newTree;
					changeMade = true;
				}
			}
			if (changeMade)
				return tree;
		}
		return null;
	}

	let newTree = findMatchAndReplaceRec(pattern, deepCopyTree(tree), replacement, cond);
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
			yield* permutations(array, k - 1);
			var tmp;
			if (k % 2) {
				tmp = array[0];
				array[0] = array[k - 1];
				array[k - 1] = tmp;
			} else {
				tmp = array[i];
				array[i] = array[k - 1];
				array[k - 1] = tmp;
			}
		}
	}
}

function* nGroupings(array, n) {
	if (n == 1) {
		yield [array];
	} else {
		for (let i = 1; i < array.length - n + 2; i++) {
			for (let end of nGroupings(array.slice(i), n - 1)) {
				yield [array.slice(0, i)].concat(end);
			}
		}
	}
}

function* listMatches(patternList, treeList, cond, replacements, captures) {
	if (patternList.length == treeList.length) {
		if (patternList.length == 0) {
			yield captures;
		} else {
			for (let newCaptures of matches(head(patternList), head(treeList), cond, replacements, captures)) {
				yield* listMatches(tail(patternList), tail(treeList), cond, replacements, newCaptures);
			}
		}
	}
}

function* matches(pattern, tree, cond, replacements, captures = {}) {
	if (!Array.isArray(pattern) && !Array.isArray(tree)) {
		if (pattern === tree)
			yield captures;
	} else if (isCapture(pattern)) {
		if (captures[captureVar(pattern)]) {
			if (!matches(captures[captureVar(pattern)], tree, cond, replacements, captures).next().done)
				yield captures;
		} else {
			let newCaptures = Object.assign({ [captureVar(pattern)]: tree }, captures);
			if (cond === undefined || evalReplacements(replaceCaptures(cond, newCaptures), replacements) === true)
				yield newCaptures;
		}
	} else if (head(pattern) === head(tree)) {
		if (pattern.length == tree.length) { // need to be the same length to match this way
			if (hasAttribute(head(pattern), 'orderless')) {
				for (let treeTailOrder of permutations(tail(tree))) {
					yield* listMatches(tail(pattern), treeTailOrder, cond, replacements, captures);
				}
			} else {
				yield* listMatches(tail(pattern), tail(tree), cond, replacements, captures);
			}
		} else if (pattern.length < tree.length && hasAttribute(head(pattern), 'flat')) {
			if (hasAttribute(head(pattern), 'orderless')) {
				for (let perm of permutations(tail(tree))) {
					for (let tailGrouping of nGroupings(perm, pattern.length - 1)) {
						tailGrouping = tailGrouping.map(x => x.length == 1 && hasAttribute(head(pattern), 'oneIdentity') ? x[0] : [head(pattern), ...x]);
						yield* listMatches(tail(pattern), tailGrouping, cond, replacements, captures);
					}
				}
			} else {
				for (let tailGrouping of nGroupings(tail(tree), pattern.length - 1)) {
					tailGrouping = tailGrouping.map(x => x.length == 1 && hasAttribute(head(pattern), 'oneIdentity') ? x[0] : [head(pattern), ...x]);
					yield* listMatches(tail(pattern), tailGrouping, cond, replacements, captures);
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

function treeValue(tree) {
	if (!Array.isArray(tree)) {
		return tree;
	} else {
		if (['+', '*'].includes(head(tree))) {
			for (let i = 1; i < tree.length; i++) {
				let val = treeValue(tree[i]);
				if (isNaN(val))
					return val;
			}
		}
		return treeValue(tree[1]);
	}
}

function makeComparator(f) {
	return (a, b) => {
		let x = f(a);
		let y = f(b);
		return x === y ? 0 : (x > y ? 1 : -1);
	};
}

function sortTrees(trees) {
	trees.sort(makeComparator(treeValue));
}

function gcd(a, b) {
	return b == 0 ? a : gcd(b, a % b);
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
			sortTrees(remainingSum);
			return remainingSum.length == 0 ? sum : (sum == 0 ? (remainingSum.length == 1 ? remainingSum[0] : ['+', ...remainingSum]) : ['+', sum, ...remainingSum]);
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
			sortTrees(remainingProduct);
			return remainingProduct.length == 0 ? product : (product == 1 ? (remainingProduct.length == 1 ? remainingProduct[0] : ['*', ...remainingProduct]) : ['*', product, ...remainingProduct]);
		case '/':
			if (!isNaN(evaledTail[0]) && !isNaN(evaledTail[1])) {
				let x = gcd(evaledTail[0], evaledTail[1]);
				let n = evaledTail[0] / x;
				let d = evaledTail[1] / x;
				return d == 1 ? n : ['/', n, d];
			}
		case '^':
			if (!isNaN(evaledTail[0]) && !isNaN(evaledTail[1])) {
				return evaledTail[0] ** evaledTail[1];
			}
			if (evaledTail[1] == 1)
				return evaledTail[0];
		case '=':
			if (!isNaN(evaledTail[0]) && !isNaN(evaledTail[1]))
				return evaledTail[0] === evaledTail[1];
			if (treeEquals(evaledTail[0], evaledTail[1]))
				return true;
		case '!=':
			if (!isNaN(evaledTail[0]) && !isNaN(evaledTail[1]))
				return evaledTail[0] !== evaledTail[1];
			if (treeEquals(evaledTail[0], evaledTail[1]))
				return false;
		case '>':
			if (!isNaN(evaledTail[0]) && !isNaN(evaledTail[1]))
				return evaledTail[0] > evaledTail[1];
		case '>=':
			if (!isNaN(evaledTail[0]) && !isNaN(evaledTail[1]))
				return evaledTail[0] >= evaledTail[1];
		case '<':
			if (!isNaN(evaledTail[0]) && !isNaN(evaledTail[1]))
				return evaledTail[0] < evaledTail[1];
		case '<=':
			if (!isNaN(evaledTail[0]) && !isNaN(evaledTail[1]))
				return evaledTail[0] <= evaledTail[1];
		default:
			return [head(tree), ...evaledTail];
	}
}

function simplify(tree) {
	return evalConstants(flattenFlatOperators(tree));
}

function treeFree(tree, subtree) {
	if (treeEquals(tree, subtree))
		return false;
	if (!Array.isArray(tree))
		return true;
	return tail(tree).every(sub => treeFree(sub, subtree));
}

function evalFunctions(tree) {
	if (!Array.isArray(tree)) {
		return tree;
	}
	if (tree.length == 0) {
		return tree;
	}
	var evaledTail = tail(tree).map(evalFunctions);
	switch (head(tree)) {
		case 'free':
			return treeFree(evaledTail[0], evaledTail[1]);
		default:
			return [head(tree), ...evaledTail];
	}
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

function evalToFixedPoint(tree, replacements) {
	let newTree;
	let changeMade = true;
	while (changeMade) {
		changeMade = false;
		// newest to oldest
		for (let i = replacements.length - 1; i >= 0; i--) {
			let [pattern, replacement, cond] = replacements[i];
			newTree = simplify(findMatchAndReplace(pattern, tree, replacement, cond, replacements));
			if (!treeEquals(tree, newTree)) {
				changeMade = true;
				tree = newTree;
			}
		}
	}
	return tree;
}

function findFirstOptional(tree, indices = []) {
	if (!Array.isArray(tree)) {
		return null;
	}
	if (head(tree) === '?') {
		return indices;
	}
	for (let i = 1; i < tree.length; i++) {
		let o = findFirstOptional(tree[i], indices.concat([i]));
		if (o !== null)
			return o;
	}
	return null;
}

function setIndex(tree, value, indices) {
	if (indices.length == 1) {
		tree.splice(indices[0], 1, value);
	} else {
		setIndex(tree[indices[0]], value, tail(indices));
	}
}

function treeAt(tree, indices) {
	if (indices.length == 0) {
		return tree;
	}
	if (indices.length == 1) {
		return tree[indices[0]];
	}
	return treeAt(tree[indices[0]], tail(indices));
}

function getDefault(tree, parentIndices, childIndex) {
	let op = head(treeAt(tree, parentIndices));
	if (op === "*") {
		return 1;
	}
	if (op === "+") {
		return 0;
	}
	if (op === "/" && childIndex == 2) {
		return 1;
	}
	if (op === "^" && childIndex == 2) {
		return 1;
	}
	throw "invalid optional";
}

function expandOptionals(pattern, replacement, cond) {
	let indices = findFirstOptional(pattern);
	if (indices === null) {
		return [[pattern, replacement, cond]];
	}
	let samePattern = deepCopyTree(pattern);
	setIndex(samePattern, treeAt(samePattern, indices)[1], indices);

	let defaultPattern = deepCopyTree(pattern);
	let defaultReplacement = deepCopyTree(replacement);
	let toReplace = treeAt(defaultPattern, indices)[1];
	let defaultVal = getDefault(defaultPattern, indices.slice(0, -1), indices[indices.length - 1]);

	if (isCapture(toReplace)) {
		toReplace = toReplace[1];
		if (Array.isArray(toReplace)) {
			if (head(treeAt(defaultPattern, indices.slice(0, -1))) === head(toReplace)) {
				let captures = {};
				for (let i = 1; i < toReplace.length; i++)
					captures[toReplace[i]] = defaultVal;
				defaultReplacement = replaceCaptures(defaultReplacement, captures);
			} else {
				throw 'invalid optional - subexpression of this type not supported';
			}
		} else {
			defaultReplacement = replaceCaptures(defaultReplacement, { [toReplace]: defaultVal });
		}
	}

	setIndex(defaultPattern, defaultVal, indices);

	return expandOptionals(defaultPattern, defaultReplacement, cond).concat(expandOptionals(samePattern, replacement, cond));
}


function evalReplacements(tree, replacements) {
	tree = simplify(tree);
	if (head(tree) === 'define') {
		for (let newReplacement of expandOptionals(tree[1], tree[2], tree[3])) {
			newReplacement[0] = simplify(newReplacement[0]);
			newReplacement[1] = simplify(newReplacement[1]);
			replacements.push(newReplacement);
		}
		return '\\text{stored definition}';
	}
	let timeString = 'evalReplacements(' + JSON.stringify(tree) + ')';
	console.time(timeString);
	let newTree;
	let changeMade = true;
	while (changeMade) {
		changeMade = false;
		tree = evalToFixedPoint(tree, replacements);
		newTree = evalFunctions(tree);
		if (!treeEquals(tree, newTree)) {
			changeMade = true;
			tree = newTree;
		}
	}
	console.timeEnd(timeString);
	return tree;
}
