function makeInp(s) {
	var i = 0;
	return {
		peek: function() {
			return s[i];
		},
		consume: function() {
			return s[i++];
		}
	};
}

function isDigit(c) {
	return '0' <= c && c <= '9';
}

function isValidCommandChar(c) {
	return !/[ {}\\,]/.test(c);
}

function isWhitespace(c) {
	return c == ' ';
}

function charToDigit(c) {
	return c - '0';
}

function isAlpha(c) {
	return /[a-z]/i.test(c);
}

function parseLatex(s) {
	function parseBracketed(inp) {
		inp.consume();
		var [contents, newInp] = parseLatexInp(inp);
		inp = newInp;
		if (inp.consume() != '}') {
			throw 'no closing }';
		}
		return [contents, inp];
	}

	function parseLatexInp(inp) {
		var latex = [];
		while (inp.peek() && inp.peek() != '}') {
			if (inp.peek() == '\\') {
				// command
				inp.consume();
				var command = '';
				while (inp.peek() && isValidCommandChar(inp.peek())) {
					var c = inp.consume();
					command += c;
					if (/[\[\](){}]/.test(c)) {
						break;
					}
				}
				if (command === 'text') {
					if (inp.consume() != '{') {
						throw '\\text with no {';
					}
					var text = '';
					while (inp.peek() != '}') {
						text += inp.consume();
					}
					if (inp.consume() != '}') {
						throw 'no closing } in \\text';
					}
					latex.push({type: 'text', text});
				} else {
					var arguments = [];
					while (inp.peek() == '{') {
						var [arg, newInp] = parseBracketed(inp);
						arguments.push(arg);
						inp = newInp;
					}
					latex.push({type: 'command', command, arguments});
				}
			}
			else if (inp.peek() == '{') {
				var [arg, newInp] = parseBracketed(inp);
				latex.push(arg);
				inp = newInp;
			} else if (isDigit(inp.peek())) {
				// number
				var n = 0;
				while (isDigit(inp.peek())) {
					n = n * 10 + charToDigit(inp.consume());
				}
				latex.push({type: 'number', value: n});
			} else if (isWhitespace(inp.peek())) {
				// skip whitespace
				inp.consume();
			} else if (isAlpha(inp.peek())) {
				// variable
				latex.push({type: 'variable', variable: inp.consume()});
			} else {
				// operator
				latex.push({type: 'operator', operator: inp.consume()});
			}
		}
		return [latex, inp];
	}

	return parseLatexInp(makeInp(s))[0];
}

