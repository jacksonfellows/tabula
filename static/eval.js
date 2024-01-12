var MQ = MathQuill.getInterface(2);

const MQ_CONFIG = {
	spaceBehavesLikeTab: true,
	leftRightIntoCmdGoes: 'up',
	restrictMismatchedBrackets: true,
	supSubsRequireOperand: true,
	autoCommands: 'pi theta rho forall equiv sqrt lambda neq cross Sigma Pi not same to choose dot'
};

MQ.config(MQ_CONFIG);

// new unique id (stupid)
let newId = _ => Math.random().toString(36).substring(2);

let calculators = {};

let callbacks = [];

function runCallbacks() {
	while (callbacks.length > 0)
		callbacks.pop()();
}

function render(thing, key, oldElem) {
	if (!thing || thing.invisible) return $('<span></span>');
	let elem;
	switch (thing.type) {
	case 'LatexInput':
		callbacks.push(() => MQ.MathField($('#input'+key).children(0)[0]));
		return $('<span class="cancel wide mq">' + thing.latex + '</span>');
	case 'LatexOutput':
		callbacks.push(() => MQ.StaticMath($('#output'+key).children(0)[0]));
		return $('<span class="cancel mq">' + thing.latex + '</span>');
	case 'TextInput':
		return $('<input class="cancel" "type="text">').val(thing.text);
	case 'DesmosGraph':
		if (key in calculators) {
			let calculator = calculators[key];
			calculator.setExpression({
				id: key,
				latex: thing.latex,
			});
			calculator.setMathBounds(thing.bounds);
			return oldElem;
		}
		elem = $('<div class="cancel" style="width: 600px; height: 400px;"></div>');
		let calculator = Desmos.GraphingCalculator(elem[0], {
			expressions: false,
		});
		calculator.observe('graphpaperBounds', () => {
			NOTEBOOK.cells[key].output.bounds = calculator.graphpaperBounds.mathCoordinates;
		});
		calculators[key] = calculator;
		calculator.setExpression({
			id: key,
			latex: thing.latex,
		});
		calculator.setMathBounds(thing.bounds);
		return elem;
	case 'TextArea':
		return $('<div class="grow-wrap"></div>').append(
			$('<textarea class="cancel wide" onInput="this.parentNode.dataset.replicatedValue = this.value"></textarea>').val(thing.text).attr('rows', (thing.text.match(/\n/g) || []).length + 1)
		);
	case 'MarkdownOutput':
		return $('<div class="cancel markdown" style="background-color: white;"></div>').html(thing.html).dblclick(e => {
			NOTEBOOK.cells[key].input.invisible = false;
			$('#input'+key).append(renderInput(NOTEBOOK.cells[key], key));
			$('#input'+key).children(0).children(0).focus();
			NOTEBOOK.cells[key].output.invisible = true;
			$('#output'+key).empty();
		});
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
	if (elem.children(0).is('textarea')) {
		return {
			type: 'TextArea',
			text: elem.children(0).val(),
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
			bounds: {
				top: 10,
				bottom: -10,
				left: -10,
				right: 10,
			}
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
	case 'note':
		if (cell.input.type !== 'TextArea')
			throw 'unsupported input type for note cells: ' + cell.input.type;
		cell.output = {
			type: 'MarkdownOutput',
			html: marked.parse(cell.input.text),
		};
		cell.output.invisible = false;
		cell.input.invisible = true;
		$('#input'+key).empty();
		select($('#cell'+key));
		break;
	default:
		throw 'unsupported cell type ' + cell.type;
	}
	if (cell.type !== 'graph')
		$('#output'+key).empty();
	$('#output'+key).append(render(cell.output, key, $('#output'+key).children(0)));
	runCallbacks();
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

function select(cell) {
	$('#cells').children().removeClass('selected-cell');
	cell.removeClass('input-selected-cell').addClass('selected-cell');
	$(document.activeElement).blur();
	return cell;
}

function renderInput(cell, key) {
	let input = render(cell.input, key);
	input.click((e) => e.stopPropagation());
	input.focusin((e) => {
		$('#cells').children().removeClass('selected-cell');
		$('#cell' + key).addClass('input-selected-cell');
	});
	input.focusout((e) => $('#cell' + key).removeClass('input-selected-cell'));
	return input;
}

function renderCell(key) {
	let cell = NOTEBOOK.cells[key];
	return $('<div id="cell' + key + '" class="cell"></div>').append(
		$('<div style="display: flex;"></div>').append(
			$('<div style="flex-grow: 1;"></div>').append(
				$('<div id="input' + key + '"></div>').append(renderInput(cell, key)),
				$('<div id="output' + key + '"></div>').append(render(cell.output, key)),
			),
			$('<div style="width: 60px;"><span style="float: right;">' + cell.type + '</span></div>'),
		),
	).click((e) => select($(e.currentTarget)));
}

function appendCell(key) {
	$('#cells').append(select(renderCell(key)));
	runCallbacks();
	if (!NOTEBOOK.cellOrder.includes(key)) {
		NOTEBOOK.cellOrder.push(key);
		if (NOTEBOOK.cells[key].input.type === 'LatexInput')
			$('#input' + key).children(0).mousedown().mouseup();
		else if (NOTEBOOK.cells[key].input.type === 'TextArea')
			$('#input' + key).children(0).children(0).focus();
		else
			$('#input' + key).children(0).focus();
	}
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

function addNoteCell() {
	let key = newId();
	NOTEBOOK.cells[key] = {
		type: 'note',
		input: {
			type: 'TextArea',
			text: '',
		},
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

let keys = {};

document.onkeydown = document.onkeyup = e => {
	keys[e.key] = e.type === 'keydown';
	if (keys['Shift'] && keys['Enter']) {
		e.preventDefault();
		$('.selected-cell, .input-selected-cell').each((i, cell) => runCell(cell.id.substring(4)));
	}
	if (keys['Backspace']) {
		$('.selected-cell').each((i, cell) => deleteCell(cell.id.substring(4)));
	}
};
