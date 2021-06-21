var MQ = MathQuill.getInterface(2);

const MQ_CONFIG = {
	spaceBehavesLikeTab: true,
	leftRightIntoCmdGoes: 'up',
	restrictMismatchedBrackets: true,
	supSubsRequireOperand: true,
	autoCommands: 'pi theta forall equiv sqrt lambda neq cross Sigma Pi not same'
};

MQ.config(MQ_CONFIG);

// new unique id (stupid)
let newId = _ => Math.random().toString(36).substring(2);

let calculators = {};

function render(thing, key, oldElem) {
	if (!thing) return $('<span></span>');
	let elem;
	switch (thing.type) {
	case 'LatexInput':
		elem = $('<span class="cancel wide mq">' + thing.latex + '</span>');
		MQ.MathField(elem[0]);
		return elem;
	case 'LatexOutput':
		elem = $('<span class="cancel mq">' + thing.latex + '</span>');
		MQ.StaticMath(elem[0]);
		return elem;
	case 'TextInput':
		return $('<input class="cancel" "type="text">').val(thing.text);
	case 'DesmosGraph':
		if (key in calculators) {
			let calculator = calculators[key];
			calculator.setExpression({
				id: key,
				latex: thing.latex
			});
			return oldElem;
		}
		elem = $('<div class="cancel" style="width: 600px; height: 400px;"></div>');
		let calculator = Desmos.GraphingCalculator(elem[0], {
			expressions: false,
		});
		calculators[key] = calculator;
		calculator.setExpression({
			id: key,
			latex: thing.latex,
		});
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
	if (elem.is('input') && elem.prop('type') === 'text') {
		return {
			type: 'TextInput',
			text: elem.val(),
		};
	}
	throw 'cannot unrender ' + elem;
}

function runCell(key) {
	console.log('running cell ' + key);
	let cell = NOTEBOOK.cells[key];
	cell.input = unrender($('#input'+key).children(0)); // maybe do this on change as well?
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
	case 'graph':
		if (cell.input.type !== 'LatexInput')
			throw 'unsupported input type for graph cells: ' + cell.input.type;
		let evaled = printDesmosLatex(evalReplacements(parse(cell.input.latex), NOTEBOOK.replacements));
		console.log('rendering ' + evaled + ' in desmos');
		cell.output = {
			type: 'DesmosGraph',
			latex: evaled,
		};
		break;
	case 'import':
		if (cell.input.type !== 'TextInput')
			throw 'unsupported input type for import cells: ' + cell.input.type;
		$.ajax({
			url: '/replacements/' + cell.input.text,
			dataType: 'json',
			success: function(newReplacements) {
				// remove old import
				for (let key of cell.replacementKeys) {
					delete NOTEBOOK.replacements[key];
				}
				for (let replacement of newReplacements) {
					let key = newId();
					NOTEBOOK.replacements[key] = replacement;
					cell.replacementKeys.push(key);
				}
				console.log('imported ' + cell.input.text);
			}
		});
		break;
	default:
		throw 'unsupported cell type ' + cell.type;
	}
	$('#output'+key).children(0).replaceWith(render(cell.output, key, $('#output'+key).children(0)));
}

function deleteCell(key) {
	console.log('deleting cell ' + key);
	let cell = NOTEBOOK.cells[key];
	if (cell.type === 'code' || cell.type === 'import') {
		for (let key of cell.replacementKeys) {
			delete NOTEBOOK.replacements[key];
		}
	}
	$('#cell' + key).remove();
	delete NOTEBOOK.cells[key];
	NOTEBOOK.cellOrder.splice(NOTEBOOK.cellOrder.indexOf(key), 1);
}

function renderCell(key) {
	let cell = NOTEBOOK.cells[key];
	return $('<div id="cell' + key + '" class="cell"></div>').append(
		$('<p id="input' + key + '"></p>').append(render(cell.input, key)),
		$('<p id="output' + key + '"></p>').append(render(cell.output, key)),
		$('<p><button onclick=runCell("' + key + '")>evaluate cell</button><button onclick=deleteCell("' + key + '")>delete cell</button><span style="float: right;">' + cell.type + '</span></p>'),
	);
}

function appendCell(key) {
	$('#cells').append(renderCell(key));
	if (!NOTEBOOK.cellOrder.includes(key))
		NOTEBOOK.cellOrder.push(key);
}

function addCodeCell() {
	let key = newId();
	NOTEBOOK.cells[key] = {
		type: 'code',
		input: {
			type: 'LatexInput',
			latex: ''
		},
		replacementKeys: [],
	};
	appendCell(key);
}

function addGraphCell() {
	let key = newId();
	NOTEBOOK.cells[key] = {
		type: 'graph',
		input: {
			type: 'LatexInput',
			latex: '',
		},
	};
	appendCell(key);
}

function addImportCell() {
	let key = newId();
	NOTEBOOK.cells[key] = {
		type: 'import',
		input: {
			type: 'TextInput',
			text: ''
		},
		replacementKeys: [],
	};
	appendCell(key);
}

function updateCellOrder() {
	NOTEBOOK.cellOrder = $('#cells').sortable('toArray').map(x => x.substring(4)); // remove cell prefix from id
}

// display NOTEBOOK
$('#cells').sortable({
	axis: 'y',
	update: function(event, ui) {
		updateCellOrder();
	},
	cancel: '.cancel',
});

$('#title').val(NOTEBOOK.title);

for (let key of NOTEBOOK.cellOrder) {
	appendCell(key);
}

if (Object.keys(NOTEBOOK.cells).length === 0) {
	addCodeCell();
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
