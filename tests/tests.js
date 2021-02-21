var MQ = MathQuill.getInterface(2);

var config = {
	spaceBehavesLikeTab: true,
	leftRightIntoCmdGoes: 'up',
	restrictMismatchedBrackets: true,
	supSubsRequireOperand: true,
	autoCommands: 'pi theta forall equiv sqrt'
};

const TESTS = [
	[
		{
			"in": "a.-a.\\equiv 0",
			"out": "\\text{stored definition}"
		},
		{
			"in": "b-b",
			"out": "0"
		},
		{
			"in": "\\left(a^2+6\\right)-\\left(6+a^2\\right)",
			"out": "0"
		}
	],
	[
		{
			"in": "a\\equiv 1",
			"out": "\\text{stored definition}"
		},
		{
			"in": "b\\equiv 2",
			"out": "\\text{stored definition}"
		},
		{
			"in": "a+b",
			"out": "3"
		}
	],
	[
		{
			"in": "5^2",
			"out": "25"
		},
		{
			"in": "1^{2^2}",
			"out": "1"
		},
		{
			"in": "2^2",
			"out": "4"
		}
	],
	[
		{
			"in": "\\frac{a}{b}^2",
			"out": "\\left(\\frac{a}{b}\\right)^2"
		}
	],
	[
		{
			"in": "\\ln \\left[\\frac{a.}{b.}\\right]\\equiv \\ln \\left[a\\right]-\\ln \\left[b\\right]",
			"out": "\\text{stored definition}"
		},
		{
			"in": "\\ln \\left[\\frac{x}{y}\\right]",
			"out": "\\ln \\left[x\\right]-\\ln \\left[y\\right]"
		}
	],
	[
		{
			"in": "b+ca",
			"out": "ac+b"
		}
	],
	[
		{
			"in": "a.-a.\\equiv0",
			"out": "\\text{stored definition}"
		},
		{
			"in": "\\text{free}\\left[x-x,x\\right]",
			"out": "\\text{true}"
		},
		{
			"in": "\\text{free}\\left[x+x,x\\right]",
			"out": "\\text{false}"
		}
	],
	[
		{
			"in": "d\\left[c.y.,x.\\right]\\equiv cd\\left[y,x\\right]\\forall\\text{free}\\left[c,x\\right]",
			"out": "\\text{stored definition}"
		},
		{
			"in": "d\\left[x.,x.\\right]\\equiv1",
			"out": "\\text{stored definition}"
		},
		{
			"in": "d\\left[y.^{n.},x.\\right]\\equiv d\\left[y,x\\right]\\cdot n\\cdot y^{n-1}\\forall\\text{free}\\left[n,x\\right]",
			"out": "\\text{stored definition}"
		},
		{
			"in": "d\\left[2x^5,x\\right]",
			"out": "10x^4"
		}
	],
	[
		{
			"in": "4/2",
			"out": "2"
		},
		{
			"in": "3/2",
			"out": "3/2"
		},
		{
			"in": "5/10",
			"out": "1/2"
		}
	],
	[
		{
			"in": "\\frac{a.^{x.?}b.?}{a.^{y.?}c.?}\\equiv\\frac{a^{x-y}b}{c}",
			"out": "\\text{stored definition}"
		},
		{
			"in": "\\frac{x^2yz^5}{xy^4z^2}",
			"out": "xy^{-3}z^3"
		},
		{
			"in": "\\frac{x^3}{x}",
			"out": "x^2"
		}
	],
	[
		{
			"in": "a\\equiv3",
			"out": "\\text{stored definition}"
		},
		{
			"in": "a+a",
			"out": "6"
		},
		{
			"in": "a\\equiv1",
			"out": "\\text{stored definition}"
		},
		{
			"in": "a+a",
			"out": "2"
		}
	],
	[
		{
			"in": "\\frac{1}{2}+\\frac{3}{2}+\\frac{1}{9}-\\frac{1}{9}",
			"out": "2"
		},
		{
			"in": "-\\frac{1}{2}",
			"out": "\\frac{-1}{2}"
		},
		{
			"in": "2+\\frac{1}{2}",
			"out": "\\frac{5}{2}"
		},
		{
			"in": "2-\\frac{1}{2}",
			"out": "\\frac{3}{2}"
		}
	],
	[
		{
			"in": "a\\equiv-1",
			"out": "\\text{stored definition}"
		},
		{
			"in": "a",
			"out": "-1"
		}
	]
];


var n_failed = 0;
var n_passed = 0;
var replacements = [];

for (var notebook of TESTS) {
	for (var cell of notebook) {
		var expect_in = cell['in'];
		var expect_out = cell['out'];
		var actual_out;
		try {
			actual_out = printLatex(evalReplacements(parse(expect_in), replacements));
		} catch (err) {
			actual_out = '\\text{' + err + '}';
		}
		var passed = treeEquals(parse(expect_out), parse(actual_out));

		$("#fields").append("<p><span></span></p>");
		MQ.StaticMath($("p span").last()[0], config).latex(expect_in);

		$("#fields").append(`<p class = "${passed ? 'passed' : 'failed'}"><span></span></p>`);
		MQ.StaticMath($("p span").last()[0], config).latex(actual_out);

		if (passed) {
			n_passed++;
		} else {
			$("#fields").append("<p>Expected value:</p><p><span></span></p>");
			MQ.StaticMath($("p span").last()[0], config).latex(expect_out);
			n_failed++;
		}

		$("#fields").append("<hr></hr>");

	}
	$("#fields").append("<br></br><br></br>");
	replacements = [];
}

$('#report').text(`${n_passed} out of ${n_failed + n_passed} tests passed`).addClass(n_failed == 0 ? 'passed' : 'failed');
