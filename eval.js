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

addInputBox();

function addInputBox() {
	var id = ++maxID;
	$("#fields").append("<p><span id=\"I" + id + "\" style=\"width: 100%\"></span></p>",
		"<p><span id=\"O" + id + "\"></span></p>",
		"<p><button onclick=\"updateOutputBox(" + id + ")\">evaluate cell</button></p>");
	var inputSpan = $("#I" + id)[0];
	var outputSpan = $("#O" + id)[0];
	inputs.push(MQ.MathField(inputSpan, config));
	outputs.push(MQ.StaticMath(outputSpan, config));
	inputs[id].focus();
}

function updateOutputBox(id) {
	outputs[id].latex(printLatex(evalReplacements(parse(inputs[id].latex()))));
}

function updateAllOutputBoxes() {
	for (var id = 0; id < inputs.length; id++) {
		updateOutputBox(id);
	}
}

function download(content, fileName, contentType) {
    var a = document.createElement('a');
    var file = new Blob([content], {type: contentType});
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
		cells: inputs.map(i => i.latex())
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
	reader.onload = function(e) {
		var contents = e.target.result;
		loadNotebookFromFile(contents);
	};
	reader.readAsText(file);

	$(e.target).prop('value', '');
}

function loadNotebookFromFile(file) {
	console.log('loading file');
	let notebook = JSON.parse(file);
	setTitle(notebook.title);
	let cells = notebook.cells;
	// stupid
	replacements = [];
	$('#fields').empty();
	inputs = [];
	maxID = -1;
	outputs = [];
	for (let cell of cells) {
		addInputBox();
		inputs[inputs.length - 1].latex(cell);
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
