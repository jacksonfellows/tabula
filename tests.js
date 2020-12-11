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
    ]
];

for (var i in TESTS) {
    var notebook = TESTS[i];
    for (var a in notebook) {
        var expect_in = notebook[a]['in'];
        var expect_out = notebook[a]['out'];

        $("#fields").append("<p><span></span></p>");
        MQ.StaticMath($("p span").last()[0], config).latex(expect_in);

        $("#fields").append("<p><span></span></p>");
        MQ.StaticMath($("p span").last()[0], config).latex(expect_out);

        if (expect_out == printLatex(evalReplacements(parse(expect_in)))) {
            $("p span").last().css("background-color", "green");
        } else {
            $("p span").last().css("background-color", "red");
        }

        $("#fields").append("<hr></hr>");

    }
    $("#fields").append("<br></br><br></br>");
    replacements = []
}