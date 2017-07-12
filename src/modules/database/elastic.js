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
                "number_of_shards": 3,
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
          .then(()=> console.log("mapping successful set"))
          .catch(()=> console.log("error while setting the mapping"));
        });
      
  }

  _search(req) {
    return new Promise((resolve, reject) => {
      req.params.indexName = "data-" + req.params.indexName + "*";
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
                "interval": req.params.time
              },
              "aggs": {
                "type": {
                  [req.params.type]: {
                    "field": "sensors.temperature.observation_value"
                  }
                }
              }
            }
          }
        },

      }

      if (req.query["location"] && req.query["location"].length === 4) {
        if (!jsonVar.body.query.constant_score.filter["bool"]) {
          let range = jsonVar.body.query.constant_score.filter;
          jsonVar.body.query.constant_score.filter = {
            "bool": {
              "must": []
            }
          }
          jsonVar.body.query.constant_score.filter.bool.must.push(range);
        }
        jsonVar.body.query.constant_score.filter.bool.must.push({
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
}