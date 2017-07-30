"use strict";

const elasticSearch = require('elasticsearch');
let host = process.env.ESHOST || '127.0.0.1:9200';

module.exports = class ELASTIC {
  constructor() {
    this.esClient = new elasticSearch.Client({
      host: host,
      log: 'error'
    });

    this.esClient.ping({
      requestTimeout: 30000,
    }, (error) => {
      if (error) {
        console.error('Elasticsearch cluster is down!');
      } else {
        console.log('ElasticSearch running at ' + host);
        this.setupElsticSearch();
      }
    });
  }

  /**
   * Sets up the basic mapping for all datasources
   */
  setupElsticSearch() {
    console.log("setup");
    this.esClient.indices.getTemplate({
      name: 'datasource_all'
    }).then(() => {
      console.log("Mapping has allready been set!");
    }).catch(() => {
      this.esClient.indices.putTemplate({
          name: 'datasource_all',
          body: {
            "template": "data-*",
            "order": 1,
            "settings": {
              "number_of_shards": 1,
              "number_of_replicas": 3
            },
            "mappings": {
              "_default_": {
                "_all": {
                  "enabled": false
                }
              },
              "data": {
                "properties": {
                  "device": {
                    "type": "keyword"
                  },
                  "location": {
                    "type": "geo_point"
                  },
                  "timestamp": {
                    "type": "date"
                  },
                  "timestamp_record": {
                    "type": "date"
                  },
                  "license": {
                    "type": "text"
                  }
                }
              }
            }
          }
        })
        .then(() => console.log("mapping successful set"))
        .catch(() => console.log("error while setting the mapping"));
    });

  }

  getIndicesByMessurement() {
    //TODO: get actually messurment information and move to meta.js
    return this.getIndices();

  }

  /**
   * Returns all indecies or all indecies belonging to one source
   * @param {String} filter index to filter for
   */
  getIndices(filter) {
    let indicies = "data-*";
    if (filter != undefined && Array.isArray(filter)) {
      indices = filter.map(item => "data-" + item + "*");
    } else if (filter != undefined) {
      indicies = "data-" + filter + "*"
    }
    return new Promise((resolve, reject) => {
      this.esClient.cat.indices({
        "index": indicies,
        "format": "json",
        "s": "index",
        "h": "index"
      }).then(res => {
        resolve(res);
      });

    });
  }

  /**
   * Return all available sources ids
   */
  getSources() {
    return new Promise((resolve, reject) => {
      this.getIndices().then(res => {
        res = res.map(elem => {
          elem = elem.index.substring(5);
          if (elem.indexOf('-') != -1)
            elem = elem.substring(0, elem.indexOf('-'));
          return elem;
        }).filter((elem, pos, arr) => {
          return arr.indexOf(elem) == pos;
        });
        resolve(res);

      });
    });
  }

  /**
   * Does a search at Elastic Search including a aggregation
   * @param {Object} req Request object from the client
   */
  _searchAgg(req) {
    return new Promise((resolve, reject) => {
      //req.params.indexName = "data-" + req.params.indexName + "*";
      let timeGte = "now-1h/m"
      let timeLte = "now/m"
      if (req.query["time"] && req.query["time"].length === 2) {
        timeGte = req.query["time"][0];
        timeLte = req.query["time"][1];

      }
      let jsonVar = {
        index: req.params.indexName,
        size: 0,
        body: {
          "query": {
            "constant_score": {
              "filter": {
                "range": {
                  "timestamp": {
                    "gte": timeGte,
                    "lte": timeLte
                  }
                }
              }
            }
          },
          sort: [{
            "timestamp": {
              "order": "desc"
            }
          }],
          "aggs": {
            "agg_per_time": {
              "date_histogram": {
                "field": "timestamp",
                "interval": req.query.bucket
              },
              "aggs": {
                "type": {
                  [req.query.agg]: {
                    "field": "sensors." + req.query.mess + ".observation_value"
                  }
                }
              }
            }
          }
        },

      }

      if (req.query["location"] && req.query["location"].length === 4) {
        this.addLocationFilterBox(req, jsonVar);
      }
      this.esClient.search(jsonVar)
        .then(function (res) {
          let result = {
            "metadata": {
              time: res.took
            },
            "data": res.aggregations.agg_per_time.buckets.map(d => {
              return {
                timestamp: d.key_as_string,
                value: d.type.value
              }
            })
          }
          return resolve(result);
        })
        .catch(err => {
          return reject(err);
        });


    })
  }

  /**
   * Does a general search at Elastic Search
   * @param {Object} req Request object from the client
   */
  _search(req) {
    return new Promise((resolve, reject) => {
      //req.params.indexName = "data-" + req.params.indexName + "*";
      let timeGte = "now-1h/m"
      let timeLte = "now/m"
      if (req.query["time"] && req.query["time"].length === 2) {
        timeGte = req.query["time"][0];
        timeLte = req.query["time"][1];

      }
      let jsonVar = {
        index: req.params.indexName,
        size: 10000,
        body: {
          "query": {
            "constant_score": {
              "filter": {
                "range": {
                  "timestamp": {
                    "gte": timeGte,
                    "lte": timeLte
                  }
                }
              }
            }
          },
          sort: [{
            "timestamp": {
              "order": "desc"
            }
          }]
        }
      }

      if (req.query['includes']) {
        jsonVar.body['_source'] = {
          "includes": req.query['includes']
        }
        //jsonVar['_source'] = req.query['includes'];

      }

      if (req.query["location"] && req.query["location"].length === 4) {
        this.addLocationFilterBox(req, jsonVar);
      }
      this.esClient.search(jsonVar)
        .then(function (res) {
          let result = {
            "metadata": {
              time: res.took
            },
            "data": res.hits.hits.map(item => item._source)
          }
          return resolve(result);
        })
        .catch(err => {
          return reject(err);
        });
    })
  }

  /**
   * Adds the box location filter to the give query
   */
  addLocationFilterBox(req, query) {
    if (!query.body.query.constant_score.filter["bool"]) {
      let range = query.body.query.constant_score.filter;
      query.body.query.constant_score.filter = {
        "bool": {
          "must": []
        }
      }
      query.body.query.constant_score.filter.bool.must.push(range);
    }
    query.body.query.constant_score.filter.bool.must.push({
      "geo_bounding_box": {
        "location": {
          "top_left": {
            "lat": req.query["location"][0],
            "lon": req.query["location"][1],
          },
          "bottom_right": {
            "lat": req.query["location"][2],
            "lon": req.query["location"][3],
          }
        }
      }
    });
  }
}