const mongoose=require("mongoose");
const initData=require("./data.js");
const Listing =require("../models/listing.js");

const MONGO_URL="mongodb://127.0.0.1:27017/WanderLust";

main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(MONGO_URL);
}

const initDB=async ()=>{
    await Listing.deleteMany({});
   initData.data = initData.data.map((obj)=>({...obj,owner:"695bd24aad6fb32c8c4d3fe4"}));
    await Listing.insertMany(initData.data);
    console.log("data was initialised");
};

initDB();