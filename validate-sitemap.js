const fs = require('fs');
const xml2js = require('xml2js');

const parser = new xml2js.Parser();
const sitemap = fs.readFileSync('sitemap.xml', 'utf8');

parser.parseString(sitemap, (err, result) => {
    if (err) {
        console.error("XML Parsing Error:", err);
    } else {
        console.log("XML is valid.");
        console.log("URL Count:", result.urlset.url.length);
    }
});
