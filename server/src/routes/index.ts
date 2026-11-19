import { Router } from "express";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import donorRoutes from "./donorRoutes.js";
import donorsRoutes from "./donorsRoutes.js";
import stockRoutes from "./stockRoutes.js";
import campRoutes from "./campRoutes.js";
import requestRoutes from "./requestRoutes.js";
import responseRoutes from "./responseRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import adminRoutes from "./adminRoutes.js";
import locationRoutes from "./locationRoutes.js";

const api = Router();

api.use("/auth", authRoutes);
api.use("/profile", profileRoutes);
api.use("/donor", donorRoutes);
api.use("/donors", donorsRoutes);
api.use("/stock", stockRoutes);
api.use("/camps", campRoutes);
api.use("/requests", requestRoutes);
api.use("/responses", responseRoutes);
api.use("/dashboard", dashboardRoutes);
api.use("/admin", adminRoutes);
api.use("/", locationRoutes); // /districts + /availability (public)

export default api;
