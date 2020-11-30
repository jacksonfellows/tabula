var MQ = MathQuill.getInterface(2);
var maxID = -1;
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
	$("#fields").append("<p><span style=\"width: 100%\"></span></p>",
	                    "<p id=\"O" + id + "\"></p>",
	                    "<p><button onclick=\"updateOutputBox(" + id + ")\">evaluate cell</button></p>");
	var mathSpan = $("span:last")[0];
	mathFields.push(MQ.MathField(mathSpan, config));
}

function updateOutputBox(id) {
	var output = document.getElementById("O" + id);
	output.textContent = JSON.stringify(evalReplacements(parse(mathFields[id].latex())));
}

function updateAllOutputBoxes() {
	for (var id = 0; id < mathFields.length; id++) {
		updateOutputBox(id);
	}
}
