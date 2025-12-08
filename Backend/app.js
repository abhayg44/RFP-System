// app.js
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { startQueueListener } = require("./services/queueListener");
const { startEvaluationListener } = require("./services/evaluationListener");

const clientRoutes = require("./routes/clientRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const emailRoutes = require("./routes/emailRoutes");

const app = express();
connectDB();
startQueueListener();
startEvaluationListener();

app.use(cors());
app.use(express.json());

app.use("/api/client", clientRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/email", emailRoutes);

app.listen(5000, () => console.log("Backend running on port 5000"));
