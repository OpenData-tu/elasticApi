"use strict"; 

const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
    host: '127.0.0.1:9200',
    log: 'warning'
});

const bulkIndex = function bulkIndex(index, type, data) {
    let bulkBody = [];

    data.forEach(item => {
        bulkBody.push({
            index: {
                _index: index,
                _type: type,
                _id: item.id
            }
        });

        bulkBody.push(item);
    });

    esClient.bulk({body: bulkBody})
        .then(res => {
            let errorCount = 0;
            res.items.forEach(item => {
                if (item.index && item.index.error){
                    console.log(++errorCount, item.index.error);
                }
            });
            console.log('Successfully indexed ${data.length - errorCount} out of ${data.length} items!');
        })
        .catch(console.err);
};

module.exports = {bulkIndex};