const students = [
  // Id, FirstName, LastName, GPA]
  [ 10, 'Peter',  'Quill',     2.9 ],
  [ 11, 'Rocket', 'Raccoon',   4.0 ],
  [ 12, 'Drax',   'Destroyer', 1.0 ]
]

const courses = [
  // Id, CourseNumber, Title, Credits
  [ 1, 'HIS 300', 'Overview of Galactic History', 3.0],
  [ 2, 'MUS 101', 'Popular Music of the 70\'s', 1.0],
  [ 3, 'PCU 412', 'Advanced Mayhem: Strategies and Tactics', 3.0],
]

const grades = [
  // StudentId, CourseId, Grade
  [11, 2, 'A+'],
  [10, 3, 'A+'],
  [12, 1, 'D-'] 
]

/*
  Students by Last Name ascending

  12 Destroyer, Drax 1.0
  10 Quill, Peter 2.9
  11 Raccoon, Rocket 4.0
*/

function lastNameSortAsc(a, b) {
  const aa = a[2].toLowerCase()
  const bb = b[2].toLowerCase()
  if (aa < bb) return -1
  if (aa > bb) return 1
  return 0
}

function displayStudentsByLastNameAsc (students) {
  console.log('Students by Last Name ascending')
  students.sort(lastNameSortAsc).forEach(s => console.log(`${s[0]} ${s[2]}, ${s[1]} ${s[3].toFixed(1)}`))
}

/*
  Students by GPA descending 

  11 Raccoon, Rocket 4.0
  10 Quill, Peter 2.9
  12 Destroyer, Drax 1.0
*/

function displayStudentsByGPADesc (students) {
  console.log('Students by GPA descending')
  students.sort((s1, s2) => s2[3] - s1[3]).forEach(s => console.log(`${s[0]} ${s[2]}, ${s[1]} ${s[3].toFixed(1)}`))
}

displayStudentsByLastNameAsc(students)
displayStudentsByGPADesc(students)