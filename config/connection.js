MongoClient= require ('mongodb').MongoClient
const state={
    db:null
}


module.exports.connect=function(done){
    var url = "mongodb://API_CREATION:cMRtYfo6IhXzDtwh@cluster0-shard-00-00.kjv6c.mongodb.net:27017,cluster0-shard-00-01.kjv6c.mongodb.net:27017,cluster0-shard-00-02.kjv6c.mongodb.net:27017/?ssl=true&replicaSet=atlas-b9wvoo-shard-0&authSource=admin&retryWrites=true&w=majority"
     var dbname='Shopping'

     MongoClient.connect(url,(err,data)=>{
         if (err) return done(err)
         state.db=data.db(dbname)
         done()
     })

}

module.exports.get=function(){
    return state.db
}