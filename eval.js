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

addInputBox();

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

function download(content, fileName, contentType) {
	var a = document.createElement('a');
	var file = new Blob([content], { type: contentType });
	a.href = URL.createObjectURL(file);
	a.download = fileName;
	a.click();
}

function setTitle(newTitle) {
	$('#title').val(newTitle);
}

function getTitle() {
	return $('#title').val();
}

function saveNotebook() {
	let notebookData = JSON.stringify({
		title: getTitle(),
		cells: NOTEBOOK.inputs.map(i => i.latex())
	});
	download(notebookData, getTitle() + '.tabula', 'text/json');
}

function loadFile() {
	$('#getFile').click();
}

$('#getFile').on('change', readFile);

function readFile(e) {
	var file = e.target.files[0];
	if (!file) {
		console.log('no file');
		return;
	}
	var reader = new FileReader();
	reader.onload = function (e) {
		var contents = e.target.result;
		loadNotebookFromFile(contents);
	};
	reader.readAsText(file);

	$(e.target).prop('value', '');
}

function loadNotebookFromFile(file) {
	console.log('loading file');
	let newnotebook = JSON.parse(file);
	setTitle(newnotebook.title);
	let cells = newnotebook.cells;
	$('#fields').empty();
	NOTEBOOK = {
		inputs: [],
		outputs: [],
		replacements: []
	};
	for (let cell of cells) {
		addInputBox();
		NOTEBOOK.inputs[NOTEBOOK.inputs.length - 1].latex(cell);
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
