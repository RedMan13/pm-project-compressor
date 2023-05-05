console.log('starting...')

const compiler = require('./src')
const fs = require('fs')

const inPath = process.argv[2]
const outPath = process.argv[3]

console.log('reading file...')

fs.readFile(inPath, (err, data) => {
    if (err) throw err

    console.log('parsing file data...')

    compiler(data, true)
        .then(resData => {
            console.log('writing compressed file data...')
            fs.writeFile(outPath, resData, err => {
                if (err) throw err
                console.log('finnished!')
            })
        })
        .catch(err => {
            throw err || 'Unkown error'
        })
})