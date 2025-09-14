const Query=require("../model/query.model");

const getDashboardData=async (req, res)=>{
    const queries=await Query.find({userId:req.body.user_id , collection:req.body.collection});
    res.status(200).json({queries});
}

const getAllQueries = async (req, res) => {
    const queries = await Query.find({});
    res.status(200).json({ queries });
}

module.exports={getDashboardData, getAllQueries};