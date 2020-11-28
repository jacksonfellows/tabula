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
			captures[captureVar(pattern)] = tree;
			return true;
		}
		if (isCapture(head(pattern))) {
			if (matchRec(tail(pattern), tail(tree))) {
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

function findMatchAndReplace(tree, pattern, replacement) {
	var matchInfo = findMatch(pattern, tree);
	if (matchInfo) {
		var [subtreeIndices, captures] = matchInfo;
		return replace(tree, subtreeIndices, replacement, captures);
	}
	return null;
}
