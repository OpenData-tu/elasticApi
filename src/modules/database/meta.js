
const sources = [
    {
        name: "weather",
        measurement: ["ambienttemperatur", "humidity","precipitation"]
    },
    {
        name: "blume",
        measurement: ["luftpartikel"]
    },
    {
        name: "pegelonlinewterlevel",
        measurement: ["waterlevel"]
    },{
        name: "bfs-uv",
        measurement: ["uv"]
    }
]

function getSources(){
    return new Promise((resolve, reject) => {
        resolve(sources.map(el => el.name))
    })
}

module.exports = {getSources};