import unittest
from os import listdir
from solver import SudokuSolver

class TestSudokuSolver(unittest.TestCase):

	def test_easy_puzzle(self):
		solver = SudokuSolver("puzzles/9x9_easy.csv")
		expected = self.loadSolution("puzzles/9x9_easy_solution.csv")
		actual = solver.toString(solver.solve())
		self.assertEquals(expected, actual)

	def test_hard_puzzle(self):
		solver = SudokuSolver("puzzles/9x9_hard.csv")
		expected = self.loadSolution("puzzles/9x9_hard_solution.csv")
		actual = solver.toString(solver.solve())
		self.assertEquals(expected, actual)

	def test_large_puzzle(self):
		solver = SudokuSolver("puzzles/25x25_hard.csv")
		expected = self.loadSolution("puzzles/25x25_hard_solution.csv")
		actual = solver.toString(solver.solve())
		self.assertEquals(expected, actual)

	def loadSolution(self, file):
		solution = ""
		with open(file, 'r') as f:
			for line in f:
				# Strip line to remove different carriage returns (^M, \r)
				# and place a line break.
				solution += line.strip() + "\n"
		return solution.strip()

if __name__ == '__main__':
    unittest.main()
