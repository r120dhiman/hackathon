const {Router} = require("express");
const {getDashboardData} = require("../controllers/dashboard.controller");
const dashboardRouter=Router();

dashboardRouter.get("/", getDashboardData);

module.exports=dashboardRouter;