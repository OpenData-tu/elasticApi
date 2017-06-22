# TU Open Data Elasticsearch API


A RESTful API for Elasticsearch wrapping the official Elasticsearch client for Node.js and adding functionality and mapped to the OpenData Project.
The official low-level Elasticsearch client for Node.js and the browser.


## Features

 TODO

## Use and start of API

! Elasticsearch has to be running. Standard HOST is localhost:9200.
```
npm install
node app

// To change the address of the Elasticsearch DB
HOST=[custom host and port] node app

// Change the port of the API
PORT=[custom port] node app
```

## Supported Calls/Routes
Root route is localhost:port/api
### GET
 -  /                               -> home route, index.html
 - /indices                         -> display all indices (excluding the system indices)
 - /indices/indexName               -> display all documents for the given index 
 - /indices/docs/docID              -> display a document for the given id
 - /indices/indexName/suggest/input -> ...

 ### POST
  - /indices/indexName/search -> TODO: search using a request body

## Helpful Links
 - [Quick Start](http://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/quick-start.html)
 - [API](http://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html)
 - [Configuration](http://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/configuration.html)
 - [Changelog](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/changelog.html)
 - [Logging](http://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/logging.html)
 - 

## Supported Elasticsearch Versions

Elasticsearch.js provides support for, and is regularly tested against, Elasticsearch releases 0.90.12 and greater. We also test against the latest changes in several branches in the Elasticsearch repository. To tell the client which version of Elastisearch you are using, and therefore the API it should provide, set the `apiVersion` config param. [More info](http://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/configuration.html#config-options)