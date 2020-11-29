var MQ = MathQuill.getInterface(2);

var mathSpan = document.getElementById('math');
var parsed = document.getElementById('parsed');

var config = {
	handlers: {
		edit: function () {
			parsed.textContent = JSON.stringify(parse(mathField.latex()));
		}
	},
	spaceBehavesLikeTab: true,
	leftRightIntoCmdGoes: 'up',
	restrictMismatchedBrackets: true,
	supSubsRequireOperand: true,
	autoCommands: 'pi theta forall equiv'
};

var mathField = MQ.MathField(mathSpan, config);

function addField() {
	$("#fields").append("<p><span style=\"width: 100%\"></span></p>",
		"<p>result</p>",
		"<p><button>evaluate cell</button></p>");
	var mathSpan = $("span:last")[0];
	console.log($(this))
	MQ.MathField(mathSpan, config);
}

