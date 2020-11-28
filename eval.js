var MQ = MathQuill.getInterface(2);

var mathSpan = document.getElementById('math');
var parsed = document.getElementById('parsed');

var config = {
	handlers: { edit: function() {
		parsed.textContent = JSON.stringify(parse(mathField.latex()));
	}},
	spaceBehavesLikeTab: true,
	leftRightIntoCmdGoes: 'up',
	restrictMismatchedBrackets: true,
	supSubsRequireOperand: true,
	autoCommands: 'pi theta forall equiv'
};

var mathField = MQ.MathField(mathSpan, config);
