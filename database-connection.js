// database-connection.js
// Where we connect to Airtable and handle requests from server.js
require('dotenv').config();

// ⚠️ Configure routes between API paths and tables here!

const tableRoutes = {
    ai: 'AI in Science Fiction', //example route
    table1: 'table-1',
    table2: 'table-2'
};

// ^ These are the tables we'll be loading
// The :table parameter in the path /api/:table/list/:page
// should match to keys in this object, example:

// https://airtable-api-proxy.glitch.me/api/ai/list/0
// http://127.0.0.1:50809/api/table1/list/0
// maps to 'AI in Science Fiction'

const viewName = 'Grid view';

// We'll assume each table has a "Grid view" view, and target that in our queries


const Airtable = require('airtable');

const base = new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

// ^ Configure Airtable using values in 🗝.env


const Bottleneck = require('bottleneck');
const rateLimiter = new Bottleneck({
    minTime: 1050 / 5
}) // ~5 requests per second

// ^ Bottleneck, instanced as rateLimiter, allows us to conform to rate limits specified by Airtable's API

//    Failure to comply with the Airtable rate limit locks down its API for 30 seconds:
//    https://airtable.com/api

const cache = require('./caching');

// ^ caching.js reads and writes local files 

function sendResultWithResponse(result, response) {
    response.status(200).end(JSON.stringify(result));
}

function cachePathForRequest(request) {
    return '.newcache' + request.path + '.json';
}

function tableNameFromRequest(request) {

    return tableRoutes[request.params.table];
}


module.exports = {

    handleListRequest: function (request, response) {

        var cachePath = cachePathForRequest(request);

        var cachedResult = cache.readCacheWithPath(cachePath);

        if (cachedResult != null) {
            console.log("Cache hit. Returning cached result for " + request.path);
            sendResultWithResponse(cachedResult, response);
        }
        else {

            console.log("Cache miss. Loading from Airtable for " + request.path);

            var pageNumber = 0;

            rateLimiter.wrap(base(tableNameFromRequest(request)).select({
                view: viewName,
                pageSize: 3 //This page size is unnecessarily small, for demonstration purposes.
                //You should probably use the default of 100 in your own code.
            }).eachPage(function page(records, fetchNextPage) {

                if (pageNumber == request.params.page) {

                    var results = {};

                    records.forEach(function (record) {

                        results[record.id] = record.fields;

                    });

                    cache.writeCacheWithPath(cachePath, results);
                    console.log("Returning records");
                    sendResultWithResponse(results, response);

                } else {
                    pageNumber++;
                    fetchNextPage();
                }

            }, function done(error) {
                sendResultWithResponse([error], response);
            }));

        }

    }

}