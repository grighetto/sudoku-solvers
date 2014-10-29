Usage
======

```
usage: solver.py [-h] [-o OUTPUT] INPUT

positional arguments:
  INPUT       input CSV file

optional arguments:
  -h, --help  show this help message and exit
  -o OUTPUT   write to output file, otherwise, print to console
```

The input must be a CSV file formatted like this:

```
0,3,5,2,9,0,8,6,4
0,8,2,4,1,0,7,0,3
7,6,4,3,8,0,0,9,0
2,1,8,7,3,9,0,4,0
0,0,0,8,0,4,2,3,0
0,4,3,0,5,2,9,7,0
4,0,6,5,7,1,0,0,9
3,5,9,0,2,8,4,1,7
8,0,0,9,0,0,5,2,6
```

where zero values represent blank cells in the Sudoku puzzle.

Of course, the grid doesn't need to be of order 9, actually, you can find a sample 25x25 sudoku in the *puzzles* folder.

By the default, the solution is written to the console, but you can supply an output file with the **-o** parameter.

##### Limitations:

For now, this implementation requires the values in the grid to be integers (it's common to find large puzzles that use letters or other symbols instead of numbers).