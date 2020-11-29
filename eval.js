var MQ = MathQuill.getInterface(2);
var maxID = 0

var config = {
	spaceBehavesLikeTab: true,
	leftRightIntoCmdGoes: 'up',
	restrictMismatchedBrackets: true,
	supSubsRequireOperand: true,
	autoCommands: 'pi theta forall equiv'
};

function addInputBox() {
	var id = maxID + 1
	console.log(id)
	maxID = id
	$("#fields").append("<p><span id=\"I" + id + "\" style=\"width: 100%\"></span></p>",
		"<p id=\"O" + id + "\"></p>",
		"<p><button onclick=\"updateOutputBox(" + id + ")\">evaluate cell</button></p>");
	var mathSpan = $("span:last")[0];
	console.log($(this))
	MQ.MathField(mathSpan, config);
}

function updateOutputBox(id) {
	var mathSpan = document.getElementById("I" + id);
	var parsed = document.getElementById("O" + id);
	var mathField = MQ.MathField(mathSpan, config);
	parsed.textContent = JSON.stringify(parse(mathField.latex()));
}
