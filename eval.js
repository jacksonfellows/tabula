var MQ = MathQuill.getInterface(2);
var maxID = -1
var mathFields = [];

var config = {
	spaceBehavesLikeTab: true,
	leftRightIntoCmdGoes: 'up',
	restrictMismatchedBrackets: true,
	supSubsRequireOperand: true,
	autoCommands: 'pi theta forall equiv'
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
	var parsed = document.getElementById("O" + id);
	parsed.textContent = JSON.stringify(parse(mathFields[id].latex()));
}

function updateAllOutputBoxes() {
	for (var id = 0; id < mathFields.length; id++) {
		updateOutputBox(id);
	}
}

window.onbeforeunload = function (e) {
	return 'Do you want to leave the page? Your work will not be saved.';
};

addInputBox();