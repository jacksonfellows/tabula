function makeInp(s) {
	var i = 0;
	return {
		peek: function(offset = 0) {
			return s[i + offset];
		},
		consume: function() {
			return s[i++];
		}
	};
}

function isDigit(c) {
	return '0' <= c && c <= '9';
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
				while (inp.peek() && inp.peek() !== '{' && inp.peek() !== '\\' && !isWhitespace(inp.peek()) && !isDigit(inp.peek()) && inp.peek() !== "-" && inp.peek() !== '+' && inp.peek() !== ',' && inp.peek() !== '.') {
					var c = inp.consume();
					command += c;
					if (c === '_') {
						command += inp.consume(); // only 1-letter subscripts
					}
					if (!isAlpha(c)) {
						break;
					}
				}
				if (inp.peek() === '\\' && (inp.peek(1) === '{' || inp.peek(1) === '}')) {
					inp.consume();
					command += inp.consume();
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
				var n = '';
				while (isDigit(inp.peek())) {
					n += inp.consume();
				}
				if (inp.peek() === '.') {
					n += inp.consume();
					while (isDigit(inp.peek())) {
						n += inp.consume();
					}
				}
				latex.push(literalToken(Number(n)));
			} else if (isWhitespace(inp.peek())) {
				// skip whitespace
				inp.consume();
			} else if (isAlpha(inp.peek())) {
				// variable
				var v = inp.consume();
				if (inp.peek() == '_') {
					v += inp.consume() + inp.consume(); // TODO: only works for one letter subscripts
				}
				latex.push(literalToken(v));
			} else if (inp.peek() === '.') {
				inp.consume();
				if (inp.peek() === '.') {
					inp.consume();
					latex.push(literalToken(['..', latex.pop().nud()]));
				} else {
					latex.push(literalToken(['.', latex.pop().nud()]));
				}
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
	case 'binom':
		if (arguments.length != 2) {
			throw 'improper \\binom usage';
		}
		return [literalToken('binom'), operatorToken('['), ...arguments[0], operatorToken(','), ...arguments[1], operatorToken(']')];
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
	case '=': case 'ne': case '>': case 'ge': case '<': case 'le': case 'doteq':
		return [operatorToken({'=': '=', 'ne': '!=', '>': '>', 'ge': '>=', '<': '<', 'le': '<=', 'doteq': 'same'}[command])];
	case 'forall': case '?': case 'left{': case 'right}': case 'times': case 'in': case 'neg': case 'dots': case 'left|': case 'right|': case 'bullet':
		return [operatorToken(command)];
	default:
		return [literalToken(command)]; // stupid?
	}
}

function addImplicitMuls(latex) {
	var newLatex = [];
	for (var i = 0; i < latex.length - 1; i++) {
		newLatex.push(latex[i]);
		if ((latex[i].type === 'literal' || latex[i].type === 'rparen' || latex[i].type === 'rbracket' || latex[i].type === 'rcurly' || latex[i].type === 'optional') && (latex[i+1].type === 'literal' || latex[i+1].type === 'lparen' || latex[i+1].type === 'lcurly')) {
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
	case '=': case '!=': case '>': case '>=': case '<': case '<=': case 'same':
		return operatorCompToken(op);
	case 'forall':
		return operatorForallToken();
	case '?':
		return operatorOptionalToken();
	case 'left{':
		return operatorLcurlyToken();
	case 'right}':
		return operatorRcurlyToken();
	case 'times':
		return operatorCrossToken();
	case ':':
		return operatorColonToken();
	case 'in':
		return operatorInToken();
	case ';':
		return operatorSemicolonToken();
	case 'neg':
		return operatorNegToken();
	case 'dots':
		return operatorDotsToken();
	case 'left|':
		return operatorLpipeToken();
	case 'right|':
		return operatorRpipeToken();
	case 'bullet':
		return operatorDotToken();
	default:
		throw 'unsupported operator: ' + op;
	}
}

function operatorDotsToken() {
	return {
		lbp: 7,
		led: function(left) {
			return ['range', left, expression(7)];
		}
	};
}

function operatorAddToken() {
	return {
		lbp: 10,
		led: function(left) {
			return ['+', left, expression(10)];
		},
		nud: function() {
			return '+';
		}
	};
}

function operatorSubToken() {
	return {
		lbp: 10,
		nud: function() {
			return ['*', -1, expression(27)];
		},
		led: function(left) {
			return ['+', left, ['*', -1, expression(10)]];
		}
	};
}

function operatorNegToken() {
	return {
		nud: function() {
			return ['not', expression(27)];
		}
	};
}

function operatorMulToken() {
	return {
		lbp: 20,
		led: function(left) {
			return ['*', left, expression(20)];
		},
		nud: function() {
			return '*';
		}
	};
}

function operatorDotToken() {
	return {
		lbp: 20,
		led: function(left) {
			return ['dot', left, expression(20)];
		},
		nud: function() {
			return 'dot';
		}
	};
}

function operatorCrossToken() {
	return {
		lbp: 19,
		led: function(left) {
			return ['cross', left, expression(19)];
		}
	};
}

// / is only used for fractions right now, so I think this higher precedence is fine
function operatorDivToken() {
	return {
		lbp: 25,
		led: function(left) {
			return ['/', left, expression(35)];
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

function operatorLpipeToken() {
	return {
		type: 'lpipe',
		lbp: 0,
		nud: function() {
			var expr = expression();
			if (token.type !== 'rpipe') {
				throw 'expecting closing |';
			}
			token = next();
			return ['magnitude', expr];
		}
	};
}

function operatorRpipeToken() {
	return {
		type: 'rpipe',
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

function operatorColonToken() {
	return {
		type: 'colon',
		lbp: 0
	};
}

function operatorInToken() {
	return {
		type: 'in',
		lbp: 6,
		led: function(left) {
			return ['in', [left], [expression(6)]];
		}
	};
}

function operatorSemicolonToken() {
	return {
		type: 'semicolon',
		lbp: 5,
		led: function(left) {
			if (left[0] !== 'in')
				throw '(currently) invalid use of ;';
			let right = expression(5);
			return ['in', left[1].concat(right[1]), left[2].concat(right[2])];
		}
	};
}

function operatorLcurlyToken() {
	return {
		type: 'lcurly',
		lbp: 0,
		nud: function() {
			let form = ['list'];
			if (token.type !== 'rcurly') {
				while (true) {
					form.push(expression(0));
					if (token.type !== 'comma') {
						if (token.type === 'colon') {
							form[0] = 'listcomp';
							token = next();
							while (true) {
								form.push(expression(0));
								if (token.type !== 'comma') {
									break;
								}
								token = next();
							}
							if (token.type !== 'rcurly') {
								throw 'expecting closing }';
							}
							token = next();
							return form;
						}
						break;
					}
					token = next();
				}
			}
			if (token.type !== 'rcurly') {
				throw 'expecting closing }';
			}
			token = next();
			return form;
		}
	};
}

function operatorRcurlyToken() {
	return {
		type: 'rcurly',
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
			let right = expression(5);
			if (right[0] === 'forall')
				return ['define', left, right[1], right[2]];
			return ['define', left, right];
		}
	};
}


function operatorOptionalToken() {
	return {
		type: 'optional',
		lbp: 40,
		led: function (left) {
			return ['?', left];
		}
	};
}

function operatorForallToken() {
	return {
		lbp: 6,
		led: function(left) {
			return ['forall', left, expression(6)];
		}
	};
}

function operatorCompToken(comp) {
	return {
		lbp: 7,
		led: function(left) {
			if (Array.isArray(left) && ['=', '!=', '>', '>=', '<', '<=', 'same'].includes(left[0])) {
				throw 'cannot chain comparisons';
			}
			return [comp, left, expression(7)];
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
