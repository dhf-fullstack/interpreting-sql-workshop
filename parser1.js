function recognize(string) {
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