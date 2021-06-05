var MQ = MathQuill.getInterface(2);

var NOTEBOOK = {
	inputs: [],
	outputs: [],
	replacements: [],
	imports: [],
	importMap: {}
};

var config = {
	spaceBehavesLikeTab: true,
	leftRightIntoCmdGoes: 'up',
	restrictMismatchedBrackets: true,
	supSubsRequireOperand: true,
	autoCommands: 'pi theta forall equiv sqrt lambda neq cross in Sigma'
};

var VALID_IMPORTS = [];

function setImports(imports) {
	if (imports)
		VALID_IMPORTS = imports;
}

function addSelectedImport(val) {
	let id = NOTEBOOK.imports.length;
	$('#imports').append('<p><select id="import' + id + '"' + (val in NOTEBOOK.importMap ? ' disabled' : '') + '>' + VALID_IMPORTS.filter(i => i === val || !(i in NOTEBOOK.importMap)).map(i => '<option value="' + i + '" ' + (val === i ? 'selected' : '') + '>' + i + '</option>').join('') + '</select><button onclick=doImport(' + id + ')>import</button></p>');
	NOTEBOOK.imports.push($('#import' + id).val());
}

function addImport() {
	let valid = VALID_IMPORTS.filter(i => !(i in NOTEBOOK.importMap));
	if (valid.length == 0)
		window.alert('no valid imports available');
	else
		addSelectedImport(valid[0]);
}

function doImport(id) {
	let val = $('#import' + id).val();
	NOTEBOOK.imports[id] = val;
	$.ajax({
		url: '/replacements/' + val,
		dataType: 'json',
		success: function(importReplacements) {
			let oldLen = NOTEBOOK.replacements.length;
			NOTEBOOK.replacements = NOTEBOOK.replacements.concat(importReplacements);
			let newLen = NOTEBOOK.replacements.length;
			NOTEBOOK.importMap[val] = [];
			for (let i = oldLen; i < newLen; i++) {
				NOTEBOOK.importMap[val].push(i);
			}
			$('#import' + id).attr('disabled', true);
			console.log('imported notebook ' + val);
		}
	});
}

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
		replacements: NOTEBOOK.replacements,
		imports: NOTEBOOK.imports,
		importMap: NOTEBOOK.importMap
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
		NOTEBOOK.importMap = state.importMap;
		state.imports.forEach(i => 
			addSelectedImport(i)
		);
	}
}

function saveNotebook() {
	$.ajax({
		type: 'POST',
		contentType: 'application/json; charset=utf-8',
		url: '/save',
		data: JSON.stringify(getNotebookState()),
		success: function(status) {
			console.log(status);
			let newPathname = '/notebooks/' + getTitle();
			if (window.location.pathname !== newPathname) {
				window.location.pathname = newPathname;
			}
		},
	});
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
