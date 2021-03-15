var MQ = MathQuill.getInterface(2);

var NOTEBOOK = {
	inputs: [],
	outputs: [],
	replacements: []
};

var config = {
	spaceBehavesLikeTab: true,
	leftRightIntoCmdGoes: 'up',
	restrictMismatchedBrackets: true,
	supSubsRequireOperand: true,
	autoCommands: 'pi theta forall equiv sqrt lambda neq cross'
};

function addInputBox() {
	var id = NOTEBOOK.inputs.length;
	$("#fields").append("<p><span id=\"I" + id + "\" style=\"width: 100%\"></span></p>",
		"<p><span id=\"O" + id + "\"></span></p>",
		"<p><button onclick=\"updateOutputBox(" + id + ")\">evaluate cell</button></p>");
	var inputSpan = $("#I" + id)[0];
	var outputSpan = $("#O" + id)[0];
	NOTEBOOK.inputs.push(MQ.MathField(inputSpan, config));
	NOTEBOOK.outputs.push(MQ.StaticMath(outputSpan, config));
	NOTEBOOK.inputs[id].focus();
}

function updateOutputBox(id) {
	NOTEBOOK.outputs[id].latex(printLatex(evalReplacements(
		parse(NOTEBOOK.inputs[id].latex()),
		NOTEBOOK.replacements
	)));
}

function updateAllOutputBoxes() {
	for (var id = 0; id < NOTEBOOK.inputs.length; id++) {
		updateOutputBox(id);
	}
}

function setTitle(newTitle) {
	$('#title').val(newTitle);
}

function getTitle() {
	return $('#title').val();
}

function getNotebookState() {
	return {
		title: getTitle(),
		inputsLatex: NOTEBOOK.inputs.map(i => i.latex()),
		outputsLatex: NOTEBOOK.outputs.map(o => o.latex()),
		replacements: NOTEBOOK.replacements
	};
}

function setNotebookState(state) {
	if (state) {
		setTitle(state.title);
		for (let i = 0; i < state.inputsLatex.length; i++) {
			addInputBox();
			NOTEBOOK.inputs[i].latex(state.inputsLatex[i]);
			NOTEBOOK.outputs[i].latex(state.outputsLatex[i]);
		}
		NOTEBOOK.replacements = state.replacements;
	}
}

function saveNotebook() {
	$.ajax({
		type: 'POST',
		contentType: 'application/json; charset=utf-8',
		url: '/save',
		data: JSON.stringify(getNotebookState()),
		success: function (status) {
			console.log(status);
		},
	});
	let newPathname = '/notebooks/' + getTitle();
	if (window.location.pathname !== newPathname) {
		window.location.pathname = newPathname;
	}
}

function printRegressionTest() {
	let testCase = [];
	for (let i = 0; i < NOTEBOOK.inputs.length; i++) {
		testCase.push({
			"in": NOTEBOOK.inputs[i].latex(),
			"out": NOTEBOOK.outputs[i].latex()
		});
	}
	console.log(JSON.stringify(testCase, null, '\t'));
}

$("#title").on("focusin", function () {
	$(this).addClass('mq-focused');
}).on("focusout", function () {
	$(this).removeClass('mq-focused');
	$(this).css('border-color', 'transparent');
}).on("mouseenter", function () {
	$(this).css('border-color', 'gray');
}).on("mouseleave", function () {
	if (!$(this).hasClass('mq-focused')) {
		$(this).css('border-color', 'transparent');
	}
});
