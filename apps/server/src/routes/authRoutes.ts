import express from 'express';
import {
  registerCustomer,
  login,
  registerSeller,
  getSellerDashboard,
  syncUser,
  adminCreateUser,
  getMyProfile,
  updateMyProfile,
  resendOTP,
  requestLoginOTP,
  verifyLoginOTP,
  verifyPhoneLogin,
  verifyPhoneSignup,
  requestDeleteAccountOTP,
  confirmDeleteAccount,
} from '../controllers/authController';
import {
  authenticate,
  authorize,
  requireCompletedProfile,
} from '../middleware/authMiddleware';
import { signupWithOTP, verifyOTP } from "../controllers/authController";

const router = express.Router();

router.post("/signup", signupWithOTP);
router.post("/verify-otp", verifyOTP);
router.post("/verify-phone-signup", verifyPhoneSignup);
router.post("/resend-otp", resendOTP);
router.post("/login/request-otp", requestLoginOTP);
router.post("/login/verify-otp", verifyLoginOTP);
router.post("/login/verify-phone", verifyPhoneLogin);
router.post('/register-customer', registerCustomer);
router.post('/login', login);
router.post('/register-seller', registerSeller);
router.post('/sync', authenticate, syncUser);
router.post('/admin-create-user', authenticate, authorize(['admin']), adminCreateUser);
router.get('/seller-dashboard', authenticate, authorize(['seller']), requireCompletedProfile, getSellerDashboard);
router.get('/profile', authenticate, getMyProfile);
router.put('/profile', authenticate, updateMyProfile);
router.post('/delete-account/request-otp', authenticate, requestDeleteAccountOTP);
router.post('/delete-account/confirm', authenticate, confirmDeleteAccount);

export default router;
