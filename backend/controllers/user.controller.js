const User=require("../model/user.model");
const allUsers= async (req,res)=>{
    const users=await User.find();
    res.status(200).json({users, toal_users:users.length});
}

const newUser=async (req, res)=>{
    const {name, age, email, password}=req.body;
    if(!name || !age || !email || !password){
        return res.status(400).json({message:"All fields are required"});
    }
    const userExists=await User.findOne({email});
    if(userExists){
        return res.status(400).json({message:"User already exists"});
    }
    const user=new User({name, age, email, password});
    await user.save();
    res.status(201).json({message:"User created successfully", user});
}

module.exports={allUsers, newUser};