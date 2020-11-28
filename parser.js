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
	return !/[0-9 {}\\,-]/.test(c);
}

function isWhitespace(c) {
	return c === ' ';
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
		if (inp.consume() !== '}') {
			throw 'no closing }';
		}
		return [contents, inp];
	}

	function parseLatexInp(inp) {
		var latex = [];
		while (inp.peek() && inp.peek() !== '}') {
			if (inp.peek() === '\\') {
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
					if (inp.consume() !== '{') {
						throw '\\text with no {';
					}
					var text = '';
					while (inp.peek() !== '}') {
						text += inp.consume();
					}
					if (inp.consume() !== '}') {
						throw 'no closing } in \\text';
					}
					latex.push(literalToken(text));
				} else {
					var arguments = [];
					while (inp.peek() === '{') {
						var [arg, newInp] = parseBracketed(inp);
						arguments.push(arg);
						inp = newInp;
					}
					latex.push(...expandCommand(command, arguments));
				}
			}
			else if (inp.peek() === '{') {
				var [arg, newInp] = parseBracketed(inp);
				latex.push(operatorToken('('), ...arg, operatorToken(')'));
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
	case 'left(':
		return [operatorToken('(')];
	case 'right)':
		return [operatorToken(')')];
	case 'left[':
		return [operatorToken('[')];
	case 'right]':
		return [operatorToken(']')];
	case 'equiv':
		return [operatorToken('equiv')];
	default:
		throw 'unsupported command: ' + command;
	}
}

function addImplicitMuls(latex) {
	var newLatex = [];
	for (var i = 0; i < latex.length - 1; i++) {
		newLatex.push(latex[i]);
		if ((latex[i].type === 'literal' || latex[i].type === 'rparen') && (latex[i+1].type === 'literal' || latex[i+1].type === 'lparen')) {
			newLatex.push(operatorToken('*'));
		}
	}
	newLatex.push(latex.length-1);
	return newLatex;
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
		type: 'literal',
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
	case '[':
		return operatorLbracketToken();
	case ']':
		return operatorRbracketToken();
	case ',':
		return operatorCommaToken();
	case 'equiv':
		return operatorEquivToken();
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
			return ['-', expression(27)];
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

// / is only used for fractions right now, so I think this higher precedence is fine
function operatorDivToken() {
	return {
		lbp: 25,
		led: function(left) {
			return ['/', left, expression(25)];
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
		type: 'lparen',
		lbp: 0,
		nud: function() {
			var expr = expression();
			if (token.type !== 'rparen') {
				throw 'expecting closing )';
			}
			token = next();
			return expr;
		}
	};
}

function operatorRparenToken() {
	return {
		type: 'rparen',
		lbp: 0
	};
}

function operatorLbracketToken() {
	return {
		type: 'lbracket',
		lbp: 100,
		led: function(left) {
			var form = [left];
			if (token.type != 'rbracket') {
				while (true) {
					form.push(expression(0));
					if (token.type !== 'comma') {
						break;
					}
					token = next();
				}
			}
			if (token.type !== 'rbracket') {
				throw 'expecting closing ]';
			}
			token = next();
			return form;
		}
	};
}

function operatorRbracketToken() {
	return {
		type: 'rbracket',
		lbp: 0
	};
}

function operatorCommaToken() {
	return {
		type: 'comma'
	};
}

function operatorEquivToken() {
	return {
		lbp: 5,
		led: function(left) {
			return ['define', left, expression(5)];
		}
	};
}

function endToken() {
	return {
		lbp: 0
	};
}

function parse(s) {
	try {
		return parseExpr(addImplicitMuls(parseLatex(s)));
	} catch (err) {
		console.log('caught error ' + err + ' in parse');
		return null;
	}
}
