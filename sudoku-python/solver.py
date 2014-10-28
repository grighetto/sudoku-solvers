'''

Sudoku Solver using Constraint Propagation and Search.
This implementation is largely based on Peter Norvig's code
available here: http://norvig.com/sudoku.html

This version adjusts the configuration dynamically based on input
and is capable of solving sudokus of larger orders, for instance, 25x25.

Author: Gianluca Righetto

'''
from math import sqrt, ceil
from copy import copy


class SudokuSolver:

	order = None
	cells = None
	digits = None
	values = None
	units = None
	peers = None
	delimiter = "|"

	def __init__(self, file):
		self.file = file

	def getBoxIds(self, i, j, order):
		'''
		Returns an array with the ids of all the cells
		in the same box as cell C(i, j), except for C itself.
		'''
		# Size of the inner boxes (usually, 3 x 3).
		box = int(sqrt(order))
		
		# Determines the coordinate of the top-left cell
		# of the inner box where this cell is located.
		corner_i = int(ceil(abs(i / box)) * box)
		corner_j = int(ceil(abs(j / box)) * box)
		
		# The number of cells in each box is equal to
		# the order of the sudoku.
		ids = [None]*(order-1)

		idx = 0
		for row in xrange(corner_i, corner_i + box):
			for col in xrange(corner_j, corner_j + box):
				if row == i and col == j: continue
				ids[idx] = row*order + col
				idx += 1
		return ids

	def getRowIds(self, i, j, order):
		'''
		Returns an array with the ids of all the cells
		in the same row as the cell C(i,j), except for C itself.
		'''
		return [i*order + pos for pos in xrange(order) if pos != j]

	def getColIds(self, i, j, order):
		'''
		Returns an array with the ids of all the cells
		in the same column as the cell C(i,j), except for C itself.
		'''
		return [j + pos*order for pos in xrange(order) if pos != i]

	def readCSV(self, csv):
		'''
		Convert grid to a dict of possible values, {square: digits}, or
		return False if a contradiction is detected.
		'''
		## To start, every square can be any digit; then assign values from the grid.
		grid = self.grid_values(csv)
		
		for s,d in grid.items():
			if d in self.parse(digits) and not self.assign(values, s, d):
				return False ## (Fail if we can't assign d to square s.)
		return values

	def grid_values(self, csv):
		'''
		Convert grid into a dict of {square: char} with '0' for empties.
		'''
		chars = []
		with open(csv,'r') as f:
			for line in f:
				line = line.split(",")
				chars += [self.addBoundary(c) for c in line if c.strip() != ""]
		chars = "".join(chars)
		self.setVars(chars)
		return dict(zip(cells, self.parse(chars)))

	def addBoundary(self, value):
		'''
		Sorround the value with the delimiter, so we can properly parse
		the string later.
		'''
		return self.delimiter + str(value).strip() + self.delimiter

	def setVars(self, chars):
		'''
		Set variables dynamically based on the input puzzle.
		This allows for solving sudokus of various orders.
		'''
		global order, cells, digits, values, units, peers
		parsed = self.parse(chars)
		order = int(sqrt(len(parsed)))
		cells = range(order**2)
		digits = "".join([self.addBoundary(i) for i in range(1,order+1)])

		values = dict((s, digits) for s in cells)

		units = {}
		for i in range(order):
			for j in range(order):
				section1 = self.getRowIds(i, j, order)
				section2 = self.getColIds(i, j, order)
				section3 = self.getBoxIds(i, j, order)
				units[i * order + j] = [section1, section2, section3]
		peers = dict((s, set(sum(units[s],[]))-set([s])) for s in cells)


	def parse(self, values):
		'''
		The algorithm keeps track of numbers as strings for efficiency.
		For large sudokus, where the numbers contain two digits, we have to
		use a delimiter to determine the boundaries of each number in the string.
		'''
		digit = ""
		parsed = []
		for c in values:
			if c == self.delimiter and self.delimiter in digit:
				digit += c
				parsed.append(digit)
				digit = ""
			else:
				digit += c
		return parsed

	def solve(self):
		grid = self.readCSV(self.file)
		return self.dfs(grid)

	def dfs(self, values):
		'''
		Using depth-first search and propagation, try all possible values.
		'''
		if values is False:
			return False ## Failed earlier
		if all(len(self.parse(values[s])) == 1 for s in cells):
			return values ## Solved!
		## Chose the unfilled square s with the fewest possibilities
		n,s = min((len(self.parse(values[s])), s) for s in cells if len(self.parse(values[s])) > 1)
		return self.some(self.dfs(self.assign(copy(values), s, d)) for d in self.parse(values[s]))

	def assign(self, values, s, d):
		'''
		Eliminate all the other values (except d) from values[s] and propagate.
		Return values, except return False if a contradiction is detected.
		'''
		other_values = values[s].replace(d, '')
		if all(self.eliminate(values, s, d2) for d2 in self.parse(other_values)):
			return values
		else:
			return False

	def some(self, seq):
	    '''
	    Return some element of seq that is true.
	    '''
	    for e in seq:
	        if e: return e
	    return False

	def eliminate(self, values, s, d):
		'''
		Eliminate d from values[s]; propagate when values or places <= 2.
		Return values, except return False if a contradiction is detected.
		'''
		if d not in self.parse(values[s]):
			return values ## Already eliminated
		values[s] = values[s].replace(d,'')
		## (1) If a square s is reduced to one value d2, then eliminate d2 from the peers.
		if len(self.parse(values[s])) == 0:
			return False ## Contradiction: removed last value
		elif len(self.parse(values[s])) == 1:
			d2 = values[s]
			if not all(self.eliminate(values, s2, d2) for s2 in peers[s]):
				return False
		## (2) If a unit u is reduced to only one place for a value d, then put it there.
		for u in units[s]:
			dplaces = [s for s in u if d in self.parse(values[s])]
			if len(dplaces) == 0:
				return False # Contradiction: no place for this value
			elif len(dplaces) == 1:
				# d can only be in one place in unit; assign it there
				if not self.assign(values, dplaces[0], d):
					return False
		return values

	def toString(self, s):
		'''
		Generate a CSV representation of the dict solution.
		'''
		string = ""
		d = self.delimiter
		for (k,v) in s.items():
			if (k + 1) % order == 0:
				string += "%s\n" % v.replace(d,"")
			else:
				string += "%s," % v.replace(d,"")
		return string.strip()

if __name__ == "__main__":
	solver = SudokuSolver("puzzles/9x9_hard.csv")
	solution = solver.solve()
	print solver.toString(solution)
