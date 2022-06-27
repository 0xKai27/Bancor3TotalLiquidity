const {Parser} = require('json2csv');
const fs = require('fs');

// Convert JSON to CSV
function json2csv(obj, fields) {

    let opts = { fields };
    let parser = new Parser(opts)
    let csv = parser.parse(obj, opts)

    return csv;
}

// Export to local drive
function exportCsv(csv, path) {
    fs.writeFile(path, csv, err => {
        if (err) {
            console.log(err);
        }
    })    
}

module.exports = {
    json2csv,
    exportCsv
}