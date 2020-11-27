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
					latex.push(literalToken(text));
				} else {
					var arguments = [];
					while (inp.peek() == '{') {
						var [arg, newInp] = parseBracketed(inp);
						arguments.push(arg);
						inp = newInp;
					}
					latex.push(...expandCommand(command, arguments));
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
				latex.push(literalToken(n));
			} else if (isWhitespace(inp.peek())) {
				// skip whitespace
				inp.consume();
			} else if (isAlpha(inp.peek())) {
				// variable
				latex.push(literalToken(inp.consume()));
			} else {
				// operator
				latex.push(operatorToken(inp.consume()));
			}
		}
		return [latex, inp];
	}

	var tokens = parseLatexInp(makeInp(s))[0];
	tokens.push(endToken());
	return tokens;
}

function expandCommand(command, arguments) {
	switch (command) {
	case 'frac':
		if (arguments.length != 2) {
			throw 'improper \\frac usage';
		}
		return [operatorToken('('), ...arguments[0], operatorToken(')'), operatorToken('/'), operatorToken('('), ...arguments[1], operatorToken(')')];
	case 'sqrt':
		if (arguments.length != 1) {
			throw 'improper \\sqrt usage';
		}
		return [operatorToken('('), ...arguments[0], operatorToken(')'), operatorToken('^'), operatorToken('('), literalToken(1), operatorToken('/'), literalToken(2), operatorToken(')')];
	case 'cdot':
		return [operatorToken('*')];
	default:
		throw 'unsupported command: ' + command;
	}
}

var token, next;

function parseExpr(latex) {
	next = makeInp(latex).consume;
	token = next();
	return expression();
}

function expression(rbp = 0) {
	var t = token;
	token = next();
	var left = t.nud();
	while (rbp < token.lbp) {
		t = token;
		token = next();
		left = t.led(left);
	}
	return left;
}

function literalToken(value) {
	return {
		nud: function() {
			return value;
		}
	};
}

function operatorToken(op) {
	switch (op) {
	case '+':
		return operatorAddToken();
	case '-':
		return operatorSubToken();
	case '*':
		return operatorMulToken();
	case '/':
		return operatorDivToken();
	case '^':
		return operatorPowToken();
	case '(':
		return operatorLparenToken();
	case ')':
		return operatorRparenToken();
	default:
		throw 'unsupported operator: ' + op;
	}
}

function operatorAddToken() {
	return {
		lbp: 10,
		led: function(left) {
			return ['+', left, expression(10)];
		}
	};
}

function operatorSubToken() {
	return {
		lbp: 10,
		nud: function() {
			return ['-', expression(100)];
		},
		led: function(left) {
			return ['-', left, expression(10)];
		}
	};
}

function operatorMulToken() {
	return {
		lbp: 20,
		led: function(left) {
			return ['*', left, expression(20)];
		}
	};
}

function operatorDivToken() {
	return {
		lbp: 20,
		led: function(left) {
			return ['/', left, expression(20)];
		}
	};
}

function operatorPowToken() {
	return {
		lbp: 30,
		led: function(left) {
			return ['^', left, expression(30-1)];
		}
	};
}

function operatorLparenToken() {
	return {
		lbp: 0,
		nud: function() {
			var expr = expression();
			if (!token.isRparen) {
				throw 'expecting closing )';
			}
			token = next();
			return expr;
		}
	};
}

function operatorRparenToken() {
	return {
		isRparen: true,
		lbp: 0
	};
}

function endToken() {
	return {
		lbp: 0
	};
}

function parse(s) {
	return parseExpr(parseLatex(s));
}
