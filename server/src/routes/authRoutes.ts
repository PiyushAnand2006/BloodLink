import { Router } from "express";
import { requireAuth, validateBody } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import {
  googleLogin,
  login,
  logout,
  me,
  register,
  registerEmail,
} from "../controllers/authController.js";
import { googleLoginSchema } from "../validators/index.js";

const router = Router();

router.post("/google", authLimiter, validateBody(googleLoginSchema), googleLogin);
router.post("/register", authLimiter, register); // Google sign-up (controller parses credential + profile)
router.post("/register-email", authLimiter, registerEmail); // email + password sign-up
router.post("/login", authLimiter, login); // email + password sign-in
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
