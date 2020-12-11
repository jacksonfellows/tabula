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
        var expect_in = notebook[a]['in']
        var expect_out = notebook[a]['out']
        console.log(expect_out == printLatex(evalReplacements(parse(expect_in))));
    }
    replacements = []
}