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
	],
	[
		{
			"in": "a\\times b",
			"out": "a\\times b"
		}
	],
	[
		{
			"in": "\\left\\{x..\\right\\}\\equiv f\\left[x\\right]",
			"out": "\\text{stored definition}"
		},
		{
			"in": "\\left\\{1\\right\\}",
			"out": "\\text{f}\\left[1\\right]"
		},
		{
			"in": "\\left\\{a,b\\right\\}",
			"out": "\\text{f}\\left[a,b\\right]"
		},
		{
			"in": "\\left\\{1,2,3\\right\\}",
			"out": "\\text{f}\\left[1,2,3\\right]"
		}
	],
	[
		{
			"in": "f\\left[a..\\right]\\equiv g\\left[x,a,y\\right]",
			"out": "\\text{stored definition}"
		},
		{
			"in": "f\\left[1,2,3\\right]",
			"out": "\\text{g}\\left[x,1,2,3,y\\right]"
		}
	],
	[
		{
			"in": "f\\left[a.,b.\\right]\\equiv a+b",
			"out": "\\text{stored definition}"
		},
		{
			"in": "f\\left[3,6\\right]",
			"out": "9"
		},
		{
			"in": "g\\left[x..\\right]\\equiv h\\left[x\\right]\\forall f\\left[x\\right]>10",
			"out": "\\text{stored definition}"
		},
		{
			"in": "g\\left[5,5\\right]",
			"out": "\\text{g}\\left[5,5\\right]"
		},
		{
			"in": "g\\left[5,6\\right]",
			"out": "\\text{h}\\left[5,6\\right]"
		}
	],
	[
		{
			"in": "x^x",
			"out": "x^x"
		}
	],
	[
		{
			"in": "\\left\\{\\left\\{a,b\\right\\}:a\\in\\left\\{1,2,3\\right\\},b\\in\\left\\{1,2,3\\right\\},a\\le b\\right\\}",
			"out": "\\left\\{\\left\\{1,1\\right\\},\\left\\{1,2\\right\\},\\left\\{1,3\\right\\},\\left\\{2,2\\right\\},\\left\\{2,3\\right\\},\\left\\{3,3\\right\\}\\right\\}"
		},
		{
			"in": "\\left\\{a+b:a\\in\\left\\{1,2,3\\right\\},b\\in\\left\\{1,2,3\\right\\},a\\le b\\right\\}",
			"out": "\\left\\{2,3,4,4,5,6\\right\\}"
		}
	],
	[
		{
			"in": "\\left\\{a..\\right\\}+\\left\\{b..\\right\\}\\equiv\\left\\{x+y:x\\in\\left\\{a\\right\\}|y\\in\\left\\{b\\right\\}\\right\\}",
			"out": "\\text{stored definition}"
		},
		{
			"in": "\\left\\{1,2,3\\right\\}+\\left\\{4,5,6\\right\\}",
			"out": "\\left\\{5,7,9\\right\\}"
		}
	],
	[
		{
			"in": "f\\left[\\left\\{a..\\right\\}\\right]\\equiv\\left\\{-x:x\\in\\left\\{a\\right\\}\\right\\}",
			"out": "\\text{stored definition}"
		},
		{
			"in": "f\\left[\\left\\{1,2,3\\right\\}\\right]",
			"out": "\\left\\{-1,-2,-3\\right\\}"
		}
	],
	[
		{
			"in": "\\left\\{a..\\right\\}+\\left\\{b..\\right\\}\\equiv\\left\\{x+y:x\\in\\left\\{a\\right\\}|y\\in\\left\\{b\\right\\}\\right\\}",
			"out": "\\text{stored definition}"
		},
		{
			"in": "s.\\left\\{a..\\right\\}\\equiv\\left\\{sx:x\\in\\left\\{a\\right\\}\\right\\}",
			"out": "\\text{stored definition}"
		},
		{
			"in": "\\left\\{5,10,3,4\\right\\}-\\left\\{4,20,4,-3\\right\\}",
			"out": "\\left\\{1,-10,-1,7\\right\\}"
		},
		{
			"in": "\\left\\{a\\right\\}-\\left\\{b\\right\\}",
			"out": "\\left\\{a-b\\right\\}"
		},
		{
			"in": "10\\left\\{a,b,c\\right\\}",
			"out": "\\left\\{10a,10b,10c\\right\\}"
		}
	],
	[
		{
			"in": "\\Sigma\\left[\\left\\{a..\\right\\}\\right]\\equiv+\\left[a\\right]",
			"out": "\\text{stored definition}"
		},
		{
			"in": "\\Sigma\\left[\\left\\{a,b,c\\right\\}\\right]",
			"out": "a+b+c"
		},
		{
			"in": "\\left\\{a..\\right\\}\\cdot\\left\\{b..\\right\\}\\equiv\\Sigma\\left[\\left\\{xy:x\\in\\left\\{a\\right\\}|y\\in\\left\\{b\\right\\}\\right\\}\\right]",
			"out": "\\text{stored definition}"
		},
		{
			"in": "\\left\\{a,b,c,d\\right\\}\\cdot\\left\\{w,x,y,z\\right\\}",
			"out": "aw+bx+cy+dz"
		}
	],
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
