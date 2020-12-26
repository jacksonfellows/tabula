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
	$("#fields").append("<p><span id=\"I" + id + "\" style=\"width: 100%\"></span></p>",
		"<p><span id=\"O" + id + "\"></span></p>",
		"<p><button onclick=\"updateOutputBox(" + id + ")\">evaluate cell</button></p>");
	var inputSpan = $("#I" + id)[0];
	var outputSpan = $("#O" + id)[0];
	inputs.push(MQ.MathField(inputSpan, config));
	outputs.push(MQ.StaticMath(outputSpan, config));
}

function updateOutputBox(id) {
	outputs[id].latex(printLatex(evalReplacements(parse(inputs[id].latex()))));
}

function updateAllOutputBoxes() {
	for (var id = 0; id < inputs.length; id++) {
		updateOutputBox(id);
	}
}
