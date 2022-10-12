// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();

// API route to list rows from Airtable:

const connection = require('./database-connection');

app.get("/api/:table/list/:page", function (request, response) {
  console.log("Handling API request");
  connection.handleListRequest(request, response);
});

app.get("/api*", function (request, response) {

  const responseObject = {
    Error: "Invalid path"
  }

  response.status(400).end(JSON.stringify(responseObject));
});

// when index route accessed, send readme converted to html
app.get("/", function (req, res) {
  fs.readFile('README.md', 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }
    res.send(head + markdownConverter.makeHtml(data) + footer);
  })
})

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});