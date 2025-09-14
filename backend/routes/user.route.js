const {Router} = require("express");
const { allUsers, newUser ,updateUser, resetpassword, deleteUser, login, dbconnection} = require("../controllers/user.controller");
const userRouter= Router();


userRouter.get("/users", allUsers);
userRouter.post("/user", newUser);
userRouter.put("/user/:id", updateUser);
userRouter.put("/user/resetpassword/:id", resetpassword);
userRouter.delete("/user/:id", deleteUser);
userRouter.post("/login", login);
userRouter.post("/dbconnection", dbconnection);

module.exports = userRouter;