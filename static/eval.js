var MQ = MathQuill.getInterface(2);

const MQ_CONFIG = {
	spaceBehavesLikeTab: true,
	leftRightIntoCmdGoes: 'up',
	restrictMismatchedBrackets: true,
	supSubsRequireOperand: true,
	autoCommands: 'pi theta forall equiv sqrt lambda neq cross in Sigma Pi'
};

MQ.config(MQ_CONFIG);

// new unique id (stupid)
let newId = _ => Math.random().toString(36).substring(2);

function render(thing) {
	if (!thing) return $('<span></span>');
	let elem;
	switch (thing.type) {
	case 'LatexInput':
		elem = $('<span class="input">' + thing.latex + '</span>');
		MQ.MathField(elem[0]);
		return elem;
	case 'LatexOutput':
		elem = $('<span>' + thing.latex + '</span>');
		MQ.StaticMath(elem[0]);
		return elem;
	default:
		throw 'unsupported type of thing: ' + thing.type;
	}
}

function unrender(elem) {
	if (MQ(elem[0]) instanceof MQ.MathField) {
		return {
			type: 'LatexInput',
			latex: MQ(elem[0]).latex(),
		};
	}
	throw 'cannot unrender ' + elem;
}

function runCell(key) {
	console.log('running cell ' + key);
	let cell = NOTEBOOK.cells[key];
	cell.input = unrender($('#input'+key).children(0)); // maybe do this onchange as well?
	switch (cell.type) {
	case 'code':
		if (cell.input.type !== 'LatexInput')
			throw 'unsupported input type for code cells: ' + cell.input.type;
		// remove old replacements
		for (let key of cell.replacementKeys) {
			delete NOTEBOOK.replacements[key];
		}
		let tree = parse(cell.input.latex);
		if (tree[0] === 'define') {
			cell.output = undefined; // ??
			cell.replacementKeys = addDefine(tree, NOTEBOOK.replacements);
		} else {
			cell.output = {
				type: 'LatexOutput',
				latex: printLatex(evalReplacements(tree, NOTEBOOK.replacements))
			};
		}
		break;
	default:
		throw 'unsupported cell type ' + cell.type;
	}
	$('#output'+key).children(0).replaceWith(render(cell.output));
}

function deleteCell(key) {
	console.log('deleting cell ' + key);
	let cell = NOTEBOOK.cells[key];
	if (cell.type === 'code') {
		for (let key of cell.replacementKeys) {
			delete NOTEBOOK.replacements[key];
		}
	}
	$('#cell' + key).remove();
}

function renderCell(key) {
	let cell = NOTEBOOK.cells[key];
	return $('<div id="cell' + key + '"></div>').append(
		$('<p id="input' + key + '"></p>').append(render(cell.input)),
		$('<p id="output' + key + '"></p>').append(render(cell.output)),
		$('<p><button onclick=runCell("' + key + '")>evaluate cell</button><button onclick=deleteCell("' + key + '")>delete cell</button></p>'),
	);
}

function addCell() {
	let key = newId();
	NOTEBOOK.cells[key] = {
		type: 'code',
		input: {
			type: 'LatexInput',
			latex: ''
		},
		replacementKeys: [],
	};
	$('#cells').append(renderCell(key));
}

// display NOTEBOOK
$('#title').val(NOTEBOOK.title);

for (let key of Object.keys(NOTEBOOK.cells)) {
	$('#cells').append(renderCell(key));
}

if (Object.keys(NOTEBOOK.cells).length === 0) {
	addCell();
}

// stuff to make title look good
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

// update NOTEBOOK.title
$('#title').on('change', function() {
	NOTEBOOK.title = $('#title').val();
});

function saveNotebook() {
	$.ajax({
		type: 'POST',
		contentType: 'application/json; charset=utf-8',
		url: '/save',
		data: JSON.stringify(NOTEBOOK),
		success: function(status) {
			console.log(status);
			let newPathname = '/notebooks/' + NOTEBOOK.title;
			if (window.location.pathname !== newPathname) {
				window.history.pushState({}, "Tabula", newPathname);
			}
		},
	});
}
