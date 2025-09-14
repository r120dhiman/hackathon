const jwt=require('jsonwebtoken');

const authenticateToken=(req,res,next)=>{
    const token=req.headers.authorization;
    if(!token){
        return res.status(401).json({message:"Unauthorized"});
    }
    const decoded=jwt.verify(token, process.env.JWT_SECRET);
    req.user=decoded;
    next();
}
const createToken=(user)=>{
    return jwt.sign({id:user._id, email:user.email}, process.env.JWT_SECRET, {expiresIn:'1h'});
}

module.exports={authenticateToken, createToken};