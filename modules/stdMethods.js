"use strict"; 

const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
    host: '127.0.0.1:9200',
    log: 'error'
});

// Check if the given Index exists
const existIndex = function indexExists(indexName) {
    return esClient.indices.exists({
        index: indexName
    });
};

// create the given index
const initIndex = function initIndex(indexName) {
    return esClient.indices.create({
        index: indexName
    });
};

// delete a given Index
const deleteIndex = function deleteIndex(indexName) {
    existIndex(indexName).then(function (exists){
      if(exists){
          console.log('Index deleted');
          return esClient.indices.delete({
              index: indexName
          });
      }
    });
};

module.exports = {existIndex, initIndex, deleteIndex};