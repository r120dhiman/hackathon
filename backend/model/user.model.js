const mongoose = require("mongoose");
const {randomBytes, createHmac} = require("crypto");


const UserSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: String,
  password: String,
  salt: String,
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

UserSchema.pre("save", function(next) {
    const user = this;
    if (!user.isModified("password") || !user.password) {
        return next();
    }
    
    const Salt = randomBytes(16).toString('hex');
    const hashedPassword = createHmac('sha256', Salt)
        .update(user.password)
        .digest('hex');
        
    user.password = hashedPassword;
    user.salt = Salt;
    next();
});

module.exports = mongoose.model("User", UserSchema);
