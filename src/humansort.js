const split = require('split');
const streamToArray = require('stream-to-array');
const Q = require('q');
const fs = require('fs');
const inquirer = require('inquirer');
const asyncSort = Q.nfbind(require('async-merge-sort'));

const sameStr = 'I like them the same';

let argv = require('yargs')
    .usage('Usage: $0 [file]')
    .example('$0 list.txt', 'rank list from a file')
    .demand(1)
	.alias('d', 'delimiter')
    .default('d', '(?:\r?\n)+', '/(\\r?\\n)+/')
    .describe('d', 'delimiter regex between list items')
    .alias('o', 'output')
    .describe('o', 'output file')
    .help('h')
    .alias('h', 'help')
	.argv;

const stream = fs.createReadStream(argv._[0])
.pipe(split(new RegExp(argv.delimiter), null, { trailing: false }));

streamToArray(stream)
.then(arr => {
    // Ask user to compare as we sort
    return asyncSort(arr, (a, b, cb) => {
        inquirer.prompt({
            type: 'list',
            name: 'comparison',
            message: 'Which do you like better?',
            choices: [a, b, sameStr]
        }, answers => {
            switch(answers.comparison) {
                case a: return cb(null, -1);
                case b: return cb(null, 1);
                case sameStr: return cb(null, 0);
            }
            return cb('No answer chosen.');
        });
    });
})
.then(sortedArray => {
    // Output sorted list
    console.log();
    const output = sortedArray.map((item, index) => {
        return (index + 1) + '. ' + item;
    }).join('\n') + '\n';
    console.log(output);
    if(argv.output) {
        return Q.nfcall(fs.writeFile, argv.output, output);
    }
})
.catch(err => {
    console.error(err);
    process.exit(1);
});
