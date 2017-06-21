"use strict"; 

const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
    host: '127.0.0.1:9200',
    log: 'error'
});

const stdMethods = require('./stdMethods');

// search in a given index with a search body
const search = function search(index, body){
    stdMethods.existIndex(index).then(function(exists){
        if(exists){
            console.log('Retrieve all entries for index ' + index);
            return esClient.search({index: index, body: body});
        } else {
            return '' + index + ' does not exist in the Database';
        }
    });

};

// return all entries for a given index
const searchAll = function searchAll(index){
    let body = {
        from: 0,
        query: {
            match_all: {}
        }
    };
    return esClient.search({index: index, body: body});
};

module.exports = {search, searchAll};