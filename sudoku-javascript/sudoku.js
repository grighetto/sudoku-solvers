function Sudoku(container) {
	this.container = document.getElementById(container);
	this.n;
	this.nSquared;
	this.hints;
	this.numbers;
	this.actionStack;	
};

Sudoku.prototype.parse = function(line){
	var n = Math.sqrt(Math.sqrt(line.length));
	
	this.n = n;
	this.nSquared = n * n;
	this.numbers = this.range(1, this.nSquared);
	this.hints = [];
	
	for (var i = 0; i < this.nSquared; i++) {
		for (var j = 0; j < this.nSquared; j++) {
			var index = (this.nSquared * i) + j;
			if(this.hints[i] == undefined) this.hints[i] = [];
			var num = parseInt(line[index]);
			if(num == 0)
				this.hints[i][j] = undefined;
			else
				this.hints[i][j] = num;
		}
	}
}

Sudoku.prototype.random = function(min, max){
	return Math.floor(Math.random()*(max-min+1)+min);
}

Sudoku.prototype.range = function(start, end){
	var array = [];
	for (var i = start; i <= end; i++) {
		array.push(i);
	}
	return array;
}

Sudoku.prototype.addAction = function(func, params){
	this.actionStack.push({func: func, params: params});
}

Sudoku.prototype.putIntoGrid = function(params){
	var td = document.getElementById(params.i+"-"+params.j);
	td.innerHTML = params.number;
}

Sudoku.prototype.markNeighbours = function(params){
	for(var i = 0; i < params.length; i++){
		var cell = params[i];
		var td = document.getElementById(cell.i+"-"+cell.j);
		td.className += " neighbours";
	}
}

Sudoku.prototype.unmarkNeighbours = function(params){
	for(var i = 0; i < params.length; i++){
		var cell = params[i];
		var td = document.getElementById(cell.i+"-"+cell.j);
		td.classList.remove('neighbours');
		td.classList.remove('failed-neighbours');
		td.classList.remove('green-neighbours');
	}
}

Sudoku.prototype.greenNeighbours = function(params){
	for(var i = 0; i < params.length; i++){
		var cell = params[i];
		var td = document.getElementById(cell.i+"-"+cell.j);
		td.className += " green-neighbours";
	}
}

Sudoku.prototype.failedNeighbours = function(params){
	for(var i = 0; i < params.length; i++){
		var cell = params[i];
		var td = document.getElementById(cell.i+"-"+cell.j);
		td.className += " failed-neighbours";
	}
}

Sudoku.prototype.run = function(action, callback, delay){	
 	function exec(){
		action.func(action.params);
		setTimeout(function() { if(callback != undefined) callback(); }, delay);
	};
	return exec;
}

Sudoku.prototype.dispatchActions = function(delay){	
	var callback;
	while(this.actionStack.length != 0){
		var action = this.actionStack.pop();
		callback = this.run(action, callback, delay);
	}
	callback();
}

Sudoku.prototype.rowCost = function(row, solution){
	var repeats = 0;
	var seen = [];
	for(var i = 0; i < this.nSquared; i++){
		var current = seen[solution[row][i]];
		if(current == undefined){
			seen[solution[row][i]] = 1
		}else{
			repeats++;
		}
	}
	return repeats;
}

Sudoku.prototype.columnCost = function(column, solution){
	var repeats = 0;
	var seen = [];
	for(var i = 0; i < this.nSquared; i++){
		var current = seen[solution[i][column]];
		if(current == undefined){
			seen[solution[i][column]] = 1
		}else{
			repeats++;
		}
	}
	return repeats;
}

Sudoku.prototype.getProbability = function(delta, temperature){
	return Math.pow(Math.E, ( -1 * delta ) / temperature);
}

Sudoku.prototype.standardDeviation = function(a){
    var t = a.length;
    for(var m, s = 0, l = t; l--; s += a[l]);
    for(m = s / t, l = t, s = 0; l--; s += Math.pow(a[l] - m, 2));
    return Math.sqrt(s / t);
}

Sudoku.prototype.findNonFixedCell = function(){
	var i = this.random(0, this.nSquared -1);
	var j = this.random(0, this.nSquared - 1);
	// Make sure cell[i][j] is non-fixed
	while(this.hints[i] != undefined && this.hints[i][j] != undefined){
		i = this.random(0, this.nSquared - 1);
		j = this.random(0, this.nSquared - 1);
	}
	return {i: i, j: j};
}

Sudoku.prototype.isSameSquare = function(cell1, cell2){
	var squareRow1 = Math.ceil(Math.abs( (cell1.i + 1) / this.n) ) * this.n;
	var squareColumn1 = Math.ceil(Math.abs( (cell1.j + 1) / this.n) ) * this.n;
	var squareRow2 = Math.ceil(Math.abs( (cell2.i + 1) / this.n) ) * this.n;
	var squareColumn2 = Math.ceil(Math.abs( (cell2.j + 1) / this.n) ) * this.n;
	if(squareRow1 == squareRow2 && squareColumn1 == squareColumn2)
		return true;
	return false;
}

Sudoku.prototype.neighbourhoodOperator = function(){
	var cell1 = this.findNonFixedCell();
	var cell2 = this.findNonFixedCell();
	
	while( (cell1.i == cell2.i && cell1.j == cell2.j) || !this.isSameSquare(cell1, cell2)){
		cell2 = this.findNonFixedCell();
	}

	this.addAction(this.markNeighbours, [cell1,cell2]);
	
	return [cell1,cell2];
}

Sudoku.prototype.swap = function(solution, cell1, cell2){
	var val1 = solution[cell1.i][cell1.j];
	var val2 = solution[cell2.i][cell2.j];
	solution[cell1.i][cell1.j] = val2;
	solution[cell2.i][cell2.j] = val1;
}

Sudoku.prototype.cellCosts = function(solution, cell1, cell2, rowsCost, colsCost){
	rowsCost[cell1.i] = this.rowCost(cell1.i, solution);
	if(cell1.i != cell2.i)
		rowsCost[cell2.i] = this.rowCost(cell2.i, solution);

	colsCost[cell1.j] = this.columnCost(cell1.j, solution);
	if(cell1.j != cell2.j)
		colsCost[cell2.j] = this.columnCost(cell2.j, solution);
}

Sudoku.prototype.checkCost = function(solution, neighbours, rowsCost, colsCost){
	var cell1 = neighbours[0];
	var cell2 = neighbours[1];
	var newTotalCost = 0;
	
	this.swap(solution, cell1, cell2);
	this.cellCosts(solution, cell1, cell2, rowsCost, colsCost);
		
	for(var i = 0; i < rowsCost.length; i++){
		newTotalCost += rowsCost[i] + colsCost[i];
	}
	
	return newTotalCost;
}

Sudoku.prototype.neighboursSuccess = function(solution, neighbours, rowsCost, colsCost, totalCost){
	var cell1 = neighbours[0];
	var cell2 = neighbours[1];
	var val1 = solution[cell1.i][cell1.j];
	var val2 = solution[cell2.i][cell2.j];
	this.addAction(this.putIntoGrid,{i: cell1.i, j: cell1.j, number: val1});
	this.addAction(this.putIntoGrid,{i: cell2.i, j: cell2.j, number: val2});
	this.addAction(this.greenNeighbours, [cell1,cell2]);
	this.addAction(this.unmarkNeighbours, [cell1,cell2]);
	this.addAction(this.putIntoGrid,{i: cell1.i, j: this.nSquared + 1, number: rowsCost[cell1.i]});
	this.addAction(this.putIntoGrid,{i: cell2.i, j: this.nSquared + 1, number: rowsCost[cell2.i]});
	this.addAction(this.putIntoGrid,{i: this.nSquared + 1, j: cell1.j, number: colsCost[cell1.j]});
	this.addAction(this.putIntoGrid,{i: this.nSquared + 1, j: cell2.j, number: colsCost[cell2.j]});
	this.addAction(this.putIntoGrid,{i: this.nSquared + 1, j: this.nSquared + 1, number: totalCost});	
}

Sudoku.prototype.neighboursFailed = function(neighbours){
	var cell1 = neighbours[0];
	var cell2 = neighbours[1];
	this.addAction(this.failedNeighbours, [cell1,cell2]);
	this.addAction(this.unmarkNeighbours, [cell1,cell2]);
}

Sudoku.prototype.moveNeighbours = function(solution, neighbours, rowsCost, colsCost, totalCost, temperature){
	var newTotalCost = this.checkCost(solution, neighbours, rowsCost, colsCost);
	
	var prob = this.getProbability(newTotalCost - totalCost, temperature);
	var cell1 = neighbours[0];
	var cell2 = neighbours[1];
	
	if(newTotalCost < totalCost || prob >= .8){
		this.neighboursSuccess(solution, neighbours, rowsCost, colsCost, newTotalCost);
		return newTotalCost;
	}else{
		this.neighboursFailed(neighbours);
		this.swap(solution, cell1, cell2);
		this.cellCosts(solution, cell1, cell2, rowsCost, colsCost);
		return totalCost;
	}
}


Sudoku.prototype.candidateSolution = function(){
	var solution = []; 
	var vertical = -1;

	// Loop through each n x n square
	for(var s = 0; s < this.nSquared; s++){
		var square = s % this.n;
		vertical = square != 0 ? vertical : vertical + 1;

		// Hints in the given square
		var square_hints = []
		// Blank cells in the square
		var square_blanks = []

		// Loop through the columns in a square
		for(var i = square * this.n; i < (square+1) * this.n; i++){
			// Loop through the lines in a column
			for(var j = vertical * this.n; j < (vertical + 1) * this.n; j++){
				if(this.hints[i][j] != undefined){
					square_hints.push(this.hints[i][j])
					if(solution[i] == undefined)
						solution[i] = [];
					solution[i][j] = this.hints[i][j];
				}
				else
					square_blanks.push([i,j])
			}
		}
		
		var numbers = this.range(1, this.nSquared);

		// Take out the hints from the list of numbers to be added to the grid
		for(var h = 0; h < square_hints.length; h++){
			var index = numbers.indexOf(square_hints[h]);			
			numbers.splice(index, 1);
		}
		
		// Pick the numbers randomly from the list and place them in the grid	
		for(var b = 0; b < square_blanks.length; b++){
			var row = square_blanks[b][0]
			var column = square_blanks[b][1]
			if(solution[row] == undefined)
				solution[row] = [];
			var rand = this.random(0, numbers.length - 1);
			var number = numbers.splice(rand, 1);
			solution[row][column] = number[0];
			this.addAction(this.putIntoGrid,{i: row, j: column, number: number});
		}
	}

	return solution;
}

Sudoku.prototype.draw = function() {
	tbl = document.createElement('table');
	
	for(var i = 0; i < this.nSquared; i++){
		var tr = tbl.insertRow(i);
		for(var j = 0; j < this.nSquared; j++){
			var td = tr.insertCell(j);
			td.id = i+"-"+j;
			var hint = (this.hints[i] == undefined || this.hints[i][j] == undefined) ? "" : this.hints[i][j];
			td.className = hint == "" ? "blank" : "hint";
			td.className += (j+1) % this.n == 0 ? " thick-right" : "";
			td.className += (i+1) % this.n == 0 ? " thick-bottom" : "";
			td.className += i == 0 ? " thick-top" : "";
			td.className += j == 0 ? " thick-left" : "";
			td.innerHTML = hint;
		}
	}
	
	// Empty space row
	var blank_row = tbl.insertRow(this.nSquared);
	for(var j = 0; j < this.nSquared; j++){
		var td = blank_row.insertCell(j);
		td.id = this.nSquared+"-"+j;
		td.className = "transparent";
	}
	
	// Cost row
	var cost_row = tbl.insertRow(this.nSquared+1);
	for(var j = 0; j < this.nSquared; j++){
		var td = cost_row.insertCell(j);
		td.id = (this.nSquared+1)+"-"+j;
		td.className = "cost";
	}
	
	// Empty space column
	for(var i = 0; i < this.nSquared; i++){
		var td = tbl.rows[i].insertCell(this.nSquared);
		td.id = i+"-"+this.nSquared;
		td.className = "transparent";
	}
	
	// Cost column
	for(var i = 0; i < this.nSquared; i++){
		var td = tbl.rows[i].insertCell(this.nSquared + 1);
		td.id = i+"-"+(this.nSquared + 1);
		td.className = "cost";
	}
	
	// Empty space cell
	var td = tbl.rows[this.nSquared + 1].insertCell(this.nSquared);
	td.id = (this.nSquared + 1)+"-"+this.nSquared;
	td.className = "transparent";
	
	// Total cost cell
	var td = tbl.rows[this.nSquared + 1].insertCell(this.nSquared + 1);
	td.id = (this.nSquared + 1)+"-"+(this.nSquared + 1);
	td.className = "total-cost";

	this.container.appendChild(tbl);
}


Sudoku.prototype.solve = function(delay){
	while(true){
		this.actionStack = new Array();
		var solution = this.candidateSolution();

		var totalCost = 0;
		var rowsCost = [];
		var colsCost = [];

		// Calculate row costs
		for(var i = 0; i < this.nSquared; i++){
			var cost = this.rowCost(i, solution);
			rowsCost[i] = cost;
			totalCost += cost;
			this.addAction(this.putIntoGrid, {i: i, j: this.nSquared + 1, number: cost});
		}

		// Calculate column costs
		for(var j = 0; j < this.nSquared; j++){
			var cost = this.columnCost(j, solution);
			colsCost[j] = cost;
			totalCost += cost;
			this.addAction(this.putIntoGrid, {i: this.nSquared + 1, j: j, number: cost});
		}

		// Total cost
		this.addAction(this.putIntoGrid, {i: this.nSquared + 1, j: this.nSquared + 1, number: totalCost});	

		var costsSample = [];
		for(var c = 0; c < 10; c++){
			var neighbours = this.neighbourhoodOperator();

			oldCost = totalCost;
			totalCost = this.checkCost(solution, neighbours, rowsCost, colsCost);
			costsSample[c] = oldCost - totalCost;
			this.neighboursSuccess(solution, neighbours, rowsCost, colsCost, totalCost);
		}

		var temperature = this.standardDeviation(costsSample);

		var reheat = false, attempts = 0;
		while(totalCost != 0){
			var neighbours = this.neighbourhoodOperator();
			totalCost = this.moveNeighbours(solution, neighbours, rowsCost, colsCost, totalCost, temperature);
			temperature *= .9;
			attempts++;
			if(attempts >= 5000){
				reheat = true;
				break;
			}
		}
		if(!reheat){
			break;
		}

	}
	this.dispatchActions(delay);
}

var xmlhttp = new XMLHttpRequest();
xmlhttp.open("GET","puzzles.txt",false);
xmlhttp.send();
var puzzles = xmlhttp.responseText.split("\n");
var select = document.getElementsByTagName('select')[0];
var solve = document.getElementsByTagName('button')[0];

for(var i=0; i < puzzles.length; i++) {
    select.options.add(new Option("Sudoku " + (i+1), i))
}

var sdk = new Sudoku("container");

select.onchange = function(){
	document.getElementById("container").innerHTML = "";
	sdk.parse(puzzles[this.selectedIndex].trim());
	sdk.draw();
	solve.disabled = false;
}
solve.onclick = function(){
	this.disabled = true;
	var delay = document.getElementById("delay").value;
	sdk.solve(delay);
}

sdk.parse(puzzles[0].trim());
sdk.draw();

