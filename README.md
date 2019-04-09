This is a workshop in understanding the SQL language, parsing, interpreting, and database access.

The goal is to write an interpreter for a small subset of the SQL language. This involves learning a bit of parsing, a bit of interpreting, understanding the semantics of a simple subset of SQL, and writing some datastructures representing a database.

1. SQL

Consider a very simple language for accessing a database. Based on what we know from Sequelize, let us think of the database as consisting of models. The models have attributes. For example, a model of students and courses might be:

A Student has a name, and a GPA
A Course has a course number ('CS 101', 'HIST 230'), a title ('Intro to computers', 'The French Revolution') and the number of credits (3 credits for a 1 semester course, for example.)
A student will take many courses, and will get a grade for each course. The average of those grades weighted by credit is the GPA.

Exercise: write the sequelize models and associations

Solution: TODO

Student
  Id
  First Name
  Last Name
  GPA

Course
  Id
  Course Number
  Title
  Credits

Grade
  StudentId
  CourseId
  Grade

Now let's write some functions to work with this database. Suppose that we want a list of all students and their GPA, sorted by last name ascending

Exercise: write that function

Solution:

function StudentsAndGPAsByLastNameAscending () {
  student.findAll({ FirstName, LastName, GPA }) ... etc
}

Exercise: Produce a list of students sorted by GPA descending

SQL is a language for writing database queries (and also for writing database manipulation: create, update, and delete operations)

Here are the functions above, as they appear in SQL:

Select FirstName, LastName, GPA from Student order by LastName asc

Select FirstName, LastName, GPA from Student order by GPA desc

Sidebar:

You can see how SQL could be useful for running ad-hoc queries - you can do that is psql.
You can set logging: true in a server to see the SQL generated by Sequelize
(TODO - show)

The full SQL language is fairly complex. We're going to write an interpreter for a simple subset: a very simplified form of the select statement (TODO? and for extra credit, insert, update, and delete.)

Here is an informal description of the first miniSQL language we're going to implement:

A select statement contains the name of a table and a list of attributes. The form of a valid select  statement is 

  select attribute, attribute, ... from table

An informal description like that leaves a lot of open questions: how many attributes can there be? Is zero ok? Is there a simple way to specify that we want all attributes? Is the text case-sensitive?

Let's agree that the keywords 'select' and 'from' are case-insensitive. SELECT, Select, select are all valid and mean the same thing. (SeLeCT is ok too - but shame on you if you write that!) Let us also agree that the attribute names and the table name are also case-insensitive. (In reality, in most databases like Postgres, names are case-sensitive: id, ID, and Id are distinct and you will get an attribute not found error if you write a name in the wrong case. You could do case-sensitive names for extra credit if you want: there will be some guidelines in the EC section of the workshop.)

Finally, let us agree that we can write '*' to mean all attributes. So

  select LastName from students

would return a list of last names, while

  select * from students

would return the id, name, and gpa for each student.

You might also already be thinking about the JavaScript code that could recognize a valid select statement, and extract the attributes and the table name. Perhaps something like:

function isValidSelect(str) {
  let attributes = []
  let table
  str = str.downcase()
  if (str.substring(0,5) === 'select') {
    const startOfAttributesIndex = 7
    const endOfAttributesIndex = str.findIndex('from')
    attributes = str.substring(startOfAttributesIndex, endOfAttributesIndex).split(', ')
    const tableNameIndex = endOfAttributesIndex + 'from '.length
    table = str.substring(tableNameIndex)
    return { table, attributes }
  } else {
    return false
  }
}

This is very fragile & inflexible code: it won't recognize SELECT or Select or FROM or From, it assumes there is exactly one space between words, or one space and a comma between attributes, and that the statement ends with the table name. It can't deal with any syntax errors: it will return false if any of the assumptions are violated.

Exercise: Think about how to write a better version

Solution: TODO

2. Grammars and Parsing

'Grammars' are one method that computer science has developed for describing strings to be matched and broken into pieces. A grammar is a set of rules describing a valid string. A grammar for our fragment of SQL might be

<select statement> := 'SELECT' <attributes> 'FROM' <table name>
<attributes> := '*' | <attribute list>
<attribute list> := <attribute name> | <attribute name> ',' <attribute list>
<attribute name> := <string>
<table name> := <string>

The symbol := means 'is defined to be'. You could also read it as 'consists of' or 'contains' or 'is'.

Text in single quotes is literal text. Usually grammars are very strict, and our grammar above will only recognize SELECT and FROM in all caps. We're going to relax that restriction: for us, any text in single quotes will be case-insensitive. Note also the literal asterisk '*' and comma ',' characters.

Text in angle brackets are rule names.

The first grammar rule above, named <select statement>, says that a select statement is defined to be the literal word SELECT followed by attributes (which are described by another grammar rule) followed by the literal work FROM followed by table name (which is described by another grammar rule).

Let's agree that <string> is a primitive in our grammar notation: we know that it means a sequence of characters, and we've already agreed that strings in our SQL language are case-insensitive. We'll agree, too, that string won't contain whitespace (model and attribute names can't contain whitespace in Sequelize, either, nor can JavaScript variable names.)

Finally, let's agree that the grammar is loose about whitespace. It expects at least one space character between 'words' where whitespace is needed, and will tolerate more whitespace: you can write spaces, tabs and newlines freely. So "FROM foo" and "FROM      foo" are both ok, and so is "attr1,attr2,  attr3  ,  attr4".

Sidebar:

We could write grammar rules for strings:

  <string> := <character> | <character> <string>
  <character> := 'A' | 'a' | 'B' | 'b' |, ....

In that second line we'd have to write out all the valid characters: comma and ellipsis are not part of our grammar notation. Also, we'd need to invent some notation to indicate that the characters all have to be consecutive, with no whitespace.

The symbol | means 'or'. According to the second grammar rule above, the <attributes> in a <select statement> can be either the literal '*' asterisk character, or a list of atrributes. And according to the third grammar rule above, a list of attributes can be a single <attribute name> or an <attribute name> followed by a literal ',' comma character, followed by an <attribute list>. This is a recursive definition.

Sidebar:

We could have invented a different kind of grammar notation in which we could write something like:

  <attribute list> := <attribute name> [ ','  ... ]

intended to mean 'an attribute list is an attribute name, optionally followed by more attributes separated by commas. 

You could translate these grammar rules into a set of JavaScript functions:

function parse(string) {
  let words = string.toLowerCase().replace(/ +/g, ' ').replace(/,/g, ' , ').split(' ').filter(s => s.length > 0)
  return selectStatement(words)
}

function selectStatement (words) {
  let word = words.shift()
  if (word !== 'select') return false
  let attrs = attributes(words)
  if (!attrs) return false
  word = words.shift()
  if (word !== 'from') return false
  word = words.shift()
  if (!word) return false
  return { attributes: attrs, tableName: word }
}

function attributes (words) {
  let word = words.shift()
  if (word === '*') return ['*']
  words.unshift(word)
  return attributeList(words)
}

function attributeList (words, attributes = []) {
  let word = words.shift()
  if (word === 'from') return false
  words.unshift(word)
  return attributesList1(words, attributes)
}

function attributesList1(words, attributes) {
  let word = words.shift()
  attributes.push(word)
  word = words.shift()
  if (word === 'from') { words.unshift(word); return attributes }
  if (word === ',') { return attributeList(words, attributes) }
  return false
}

Sidebar

/* Testing */

let string, parse

const tests = [
  {
    string: 'select *  from      students',
    expected: { tableName: 'students', attributes: ['*'] }
  },
  {
    string: 'select foo from students',
    expected: { tableName: 'students', attributes: ['foo'] }
  },
  {
   string: 'select foo, bar, baz  from students',
   expected: { tableName: 'students', attributes: ['foo', 'bar', 'baz'] }
  },
]

function sameAs (test, expected) {
  return test.tableName === expected.tableName &&
         test.attributes.length === expected.attributes.length &&
         test.attributes.every((e,i) => e === expected.attributes[i])
}

let passed = 0

tests.forEach(({string, expected}) => {
  const parse = recognize(string)
  if (sameAs(parse, expected)) {
    passed++
    console.log(`test "${string}" OK table: ${parse.tableName} attributes: ${parse.attributes}`)
  } else {
    console.log(`test "${string}" FAILED result: ${parse}`)
  }
})

console.log(`${passed} of ${tests.length} tests succeeded`)

That wasn't especially good JavaScript code but it shows the essence of the technique of "parsing by recursive descent" - a way to write a simple parser for a simple grammar, often by hand. To write a recursive descent parser, one writes a function for each grammar rule. And it isn't entirely mechanical: for example, the grammar doesn't explicitly indicate that the word 'FROM' ends the list of attributes: you, the parser writer, have to notice that and test for the presence of 'FROM' in three different functions. The details can also get a bit fiddly: you have to pay attention to when to consume a word and to put it back on the list of words so that some other function can use it.

There are algorithms to produce a parser directly from a grammar. Not every language can be represented by such a simple grammar as that for our fragment of SQL. Not every grammar can be parsed ("recognized") by recursive descent. There is a body of theory related to grammars and the kinds of languages that they can recognize and the kinds of parsers that can be produced to recognize these languages.

But for the rest of this workshop, we will stick to hand-written parsers.

Sidebar

TODO References to the classic language theory texts, maybe to more elementary materials or course notes? Research!

3. Back to Databases

Database managers like Postgres, MySql, Oracle, MongoDB, ... (TODO - more) are complex programs designed to handle many clients, lots of traffic, large amounts of data, complicated models with elaborate associations. Queries need to be optimized to run as fast as possible - and this is an art as much as a science because trade-offs often need to be made. Data has to be stored in an optimized manner on the physical disks, based in part on measurements of how often data are accessed at the same time. Indexes can be kept allowing data to be looked up more quickly by various keys.

We're going to write a toy database, a very simple model of a database manager. We're going to keep all the data in memory so that we don't have to think about reading and writing physical files on the disk.

We're going to learn how to run queries on our data: we're going to write an API for doing lookups.

And finally, we're going to write an interpreter that takes a SQL query, and figures out the API calls needed to return the data requested by that query.

Let's return to the student model we first looked at. We could represent each model as an array of tuples, where each tuple is an array of the attributes of that model.

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

We'd also need some kind of dictionary to record the names of the tables that exist in the database, and the names and types of the attributes in each table:

const tables = {
  'Student': students,
  'Course': courses,
  'Grade': grade,
}

const attributes = {
  'Student': [ { name: 'Id', type: Number }, { name: 'FirstName', type: String }, ... ],
  'Course': ...
  'Grade': ...
}

const database = {
  tables: tables,
  attributes: attributes
}

Exercise: finish writing out the attributes dictionary

Solution: TODO

const attributes = {
  'Student': [
               { name: 'Id', type: Number },
               { name: 'FirstName', type: String },
              ],
  'Course': ...
  'Grade': ...
}

Sidebar

This is not the only way or even a particulary good way to store this information. Spend some time thinking about a design, maybe work with a partner. What sorts of operations do you expect to need to perform on these data structures? How would you use the information in the dictionaries and in the data arrays to print out the list of students in last name order ascending, or in GPA order descending?

3.1 Querying the database

Exercise: Using the datastructures above, write a function to console log the list of students in last name order ascending, and another function to console log the students in GPA order descending.

Solution:

  Expect:

  Students by Last Name ascending

  12 Destroyer, Drax 1.0
  10 Quill, Peter 2.9
  11 Raccoon, Rocket 4.0

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

  Students by GPA descending 

  11 Raccoon, Rocket 4.0
  10 Quill, Peter 2.9
  12 Destroyer, Drax 1.0

function displayStudentsByGPADesc (students) {
  console.log('Students by GPA descending')
  students.sort((s1, s2) => s2[3] - s1[3]).forEach(s => console.log(`${s[0]} ${s[2]}, ${s[1]} ${s[3].toFixed(1)}`))
}

Sidebar

Note the details: each sort order has to be specified, and the formatting of the GPA has to be specified - well, that wasn't really written out in the requirements, and it isn't specified anywhere in the models either... more details that need to be filled in!

3.2 Writing a generalized query function

Let's write a generalized query function that takes a table, an array of names of attributes to display, the name of an attribute to sort by, and the sort order 'ASC' or 'DESC'.

Assume the database is represented as above, in the global variables database, table, and attributes

For example, the GPA query above would be

query(database, 'Students', ['Id', 'LastName', 'FirstName', 'GPA'], 'DESC')

We might start off like this:

function query(db, tableName, requestedAttributes, sortBy, sortOrder) {
  const table = db.tables[tableName]
  if (!table) { console.log(`table ${tableName} is not in the database`); return -1; }
  const attrs = db.attributes[table]
  if (!requestedAttributes.each(a => attrs.find(e => e.name === a))) { console.log(`some requested attribute(s) not found in table ${tableName}); return -1; }
  if (sortBy) {
    if (!attrs.find(e => e.name === sortBy)) { ...; return -1; }
    if (sortOrder !== 'ASC' && sortOrder !== 'DESC') { ...; return -1; }
  }

  if (sortBy) {
    table.sort(...).forEach(...)
  } else {
    table.forEach(...)
  }
}

Exercise: Write the rest of the code to figure out the appropriate sort function as determined by the type of the sortBy attribute and the sortOrder, and the console.log statement showing the requsted attributes.

Solution:
TODO

4. From SQL to query

Exercise:

Combine the parse function from section 2 with the query function from section 3.2 into a function that, given a string and the database, runs the requested query

Solution

function SQL(database, string) {
  { attributes, tableName } = parse(string)
  query(database, tableName, attributes)
}

4.1 Adding sort

4.1.1 Extend the grammar

Exercise: extend the grammar in section 2 to include the order by clause of the SQL language. The clause looks like this:

  select lastName, firstName, GPA from student order by lastName Asc

Another example:

  select lastName, firstName, GPA from student order by GPA Desc
  
If you omit Asc or Desc, Asc is the default

Let us agree to extend our grammar notation to indicate optional elements by putting them in square brackets, so

<select statement> := 'SELECT' <attributes> 'FROM' <table name> [<order by>]

means a select statement can have an order by clause, or it can just end with the table name and no order by clause.

Sidebar

There are other notations for optional elements which you will see in the literature: for example, `epsilon` for the empty string.

Solution:

<select statement> := 'SELECT' <attributes> 'FROM' <table name> [ <order by> ]
<attributes> := '*' | <attribute list>
<attribute list> := <attribute name> | <attribute name> ',' <attribute list>
<attribute name> := <string>
<table name> := <string>
<order by> = 'ORDER' 'BY' <attribute name> [ <sort order> ]
<sort order> = 'ASC' | 'DESC'

4.1.2 Extend the parser

Extend the parser to include the order by statement, following the guide provided by the grammar. Extend the return value of the parser to include the sortBy attribute name and the sortOrder value (asc or desc).

Solution:

TODO

4.1.3 Comnbine them!

Combine the extended parse function with the query function.

Solution

function SQL(database, string) {
  { attributes, tableName, sortBy, sortOrder } = parse(string)
  query(database, tableName, attributes, sortBy, sortOrder)
}

5. Indexing

Sort is expensive in time. If we knew that certain sorted queries would be performed often, we could trade space for time by keeping an additional data structures that stored the indexes of the database arrays in the required sorted order. For example, if the descending GPA query were run frequenly, we could store a list of indexes into the students table pre-sorted by GPA descending. We would of course have to update that datastructure every time a student was added or deleted, or the student's GPA changed. So we would have to do some analysis to discover whether it was worthwhile to maintain it. If the students tables change only rarely (say at the start and end of each semester, or perhaps once a week after in class quizzes) while the GPA query is run frequently (perhaps daily for some annoying administrative reason) then it would be worth it.

Exercise: What datastructures do you know for storing values in sorted order?

Exercise: Implement a binary tree that holds the indexes of the student records in GPA descending order.

Exercise: modify the query function so that when the GPA desc sort is requested, the function walks the binary tree from the previous exercise rather than sorting the table:

Exercise: Add a dictionary to the database that specifies the binary tree to use for various sorts. If no index is available, sort the table as we do now.

6. The WHERE clause

Explain the use

Extend the grammar

Extend the recognizer

Extend the Query function

Extra credit: how might indexes be used to make WHERE clauses faster?
