var MQ = MathQuill.getInterface(2);
var maxID = -1;

var inputs = [];
var outputs = [];

var config = {
	spaceBehavesLikeTab: true,
	leftRightIntoCmdGoes: 'up',
	restrictMismatchedBrackets: true,
	supSubsRequireOperand: true,
	autoCommands: 'pi theta forall equiv sqrt lambda neq'
};

function addInputBox() {
	var id = ++maxID;
	$("#fields").append("<p><button title=\"evaluate cell\" onclick=\"updateOutputBox(" + id + ")\">►</button>" +
		"<span id=\"I" + id + "\" style=\"width: 95%\"></span></p>",
		"<p><span>⟶ </span><span id=\"O" + id + "\"></span></p>",
		" <hr></hr>"
	);
	var inputSpan = $("#I" + id)[0];
	var outputSpan = $("#O" + id)[0];
	inputs.push(MQ.MathField(inputSpan, config).focus());
	outputs.push(MQ.StaticMath(outputSpan, config));
}

function updateOutputBox(id) {
	if ((inputs[id].latex()) != '') {
		outputs[id].latex(printLatex(evalReplacements(parse(inputs[id].latex()))));
	} else { }

}

function updateAllOutputBoxes() {
	for (var id = 0; id < inputs.length; id++) {
		updateOutputBox(id);
	}
}

function printRegressionTest() {
	let testCase = [];
	for (let i = 0; i < inputs.length; i++) {
		testCase.push({
			"in": inputs[i].latex(),
			"out": outputs[i].latex()
		});
	}
	console.log(JSON.stringify(testCase, null, '\t'));
}
