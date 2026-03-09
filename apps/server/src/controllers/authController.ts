import { Request, Response } from 'express';
import { db, auth } from '../config/firebase';
import { User, Role } from '../types';
import * as admin from 'firebase-admin';
import {
  generateOTP,
  storeOTP,
  verifyOTP as verifyOTPService,
} from "../services/otpService";
import {
  sendOTPEmail,
  sendAccountDeletionOTPEmail,
  sendRetentionEmail,
  sendAccountDeletedEmail,
  sendWelcomeEmail,
} from "../services/emailService";
import { sendWelcomePhoneMessage } from "../services/smsService";

type SellerRecord = {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  gstNumber?: string;
  panNumber: string;
  ownerName: string;
  email: string;
  phone: string;
  address: any;
  banking: any;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const normalizePhoneNumber = (value: any) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
};

const normalizeEmail = (value: any) =>
  String(value || "").trim().toLowerCase();

const isDeletedAccount = (record: any) =>
  !!record &&
  (record.isDeleted === true ||
    String(record.status || "").toLowerCase() === "deleted" ||
    String(record.accountState || "").toLowerCase() === "deleted");

const getDeletedAccountRef = (email: string) =>
  db.collection("deleted_accounts").doc(normalizeEmail(email));

const archiveDeletedAccount = async ({
  uid,
  email,
  role,
  reason,
  deletedBy,
  source,
  profile,
}: {
  uid?: string;
  email: string;
  role?: string;
  reason?: string;
  deletedBy?: string;
  source: "self-service" | "admin";
  profile?: Record<string, any> | null;
}) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;
  await getDeletedAccountRef(normalizedEmail).set(
    {
      email: normalizedEmail,
      uid: uid || null,
      role: role || profile?.role || "customer",
      deletedAt: new Date().toISOString(),
      deletedBy: deletedBy || null,
      reason: reason || null,
      source,
      profileSnapshot: profile || null,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
};

const removeFirebaseUserIfPresent = async (uid: string) => {
  if (!uid) return;
  try {
    await auth.deleteUser(uid);
  } catch (error: any) {
    if (String(error?.code || "") !== "auth/user-not-found") {
      throw error;
    }
  }
};

const releaseDeletedEmailForReuse = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;

  let authUser: admin.auth.UserRecord | null = null;
  try {
    authUser = await auth.getUserByEmail(normalizedEmail);
  } catch (error: any) {
    if (String(error?.code || "") !== "auth/user-not-found") {
      throw error;
    }
  }

  if (!authUser) return;

  const [profileDoc, deletedMarker] = await Promise.all([
    db.collection("users").doc(authUser.uid).get(),
    getDeletedAccountRef(normalizedEmail).get(),
  ]);
  const profile = profileDoc.exists ? (profileDoc.data() as any) : null;
  const shouldRelease =
    !profileDoc.exists || isDeletedAccount(profile) || deletedMarker.exists;

  if (!shouldRelease) return;

  await Promise.all([
    removeFirebaseUserIfPresent(authUser.uid),
    db.collection("pending_users").doc(normalizedEmail).delete().catch(() => {}),
  ]);
};

// Add these functions to authController.ts

export const signupWithOTP = async (req: Request, res: Response) => {
  try {
    const { password, displayName, role, phone, address, city, state, pincode, gender, otpChannel } = req.body;
    const email = normalizeEmail(req.body?.email);

    // Validate input
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await releaseDeletedEmailForReuse(email);

    // Check if user exists in Firebase
    try {
      const existingUser = await auth.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "This email is already registered. Please login instead." });
      }
    } catch (error: any) {
      // User doesn't exist, continue
      if (error.code !== 'auth/user-not-found') {
        console.error('Error checking user:', error);
      }
    }

    // Generate and send OTP to a real email channel.
    const channel = String(otpChannel || "email").toLowerCase() === "phone" ? "phone" : "email";
    const otpRecipient = channel === "phone" ? normalizePhoneNumber(phone) : String(email || "").trim().toLowerCase();
    if (!otpRecipient) {
      return res.status(400).json({ error: channel === "phone" ? "Phone is required for phone OTP" : "Email is required for OTP" });
    }
    let expiresAt: string | null = null;
    if (channel === "email") {
      const otp = generateOTP();
      expiresAt = await storeOTP(otpRecipient, otp);
      await sendOTPEmail(email, otp, displayName);
    }

    // Store pending user
    await db
      .collection("pending_users")
      .doc(email)
      .set({
        email,
        password, // Hash this in production!
        displayName,
        role: role || "customer",
        phone: normalizePhoneNumber(phone),
        address: address || "",
        city: city || "",
        state: state || "",
        pincode: pincode || "",
        gender: gender || "",
        otpChannel: channel,
        createdAt: new Date().toISOString(),
      });

    res.json({
      message: channel === "phone" ? "Phone verification required" : "OTP sent successfully",
      email,
      otpChannel: channel,
      otpRecipient,
      expiresAt,
      resendAfterSec: channel === "phone" ? 0 : 60,
      phoneAuthRequired: channel === "phone",
    });
  } catch (error: any) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ error: error.message || "Signup failed" });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const { otp, otpChannel, otpRecipient } = req.body;
    const channel = String(otpChannel || "email").toLowerCase() === "phone" ? "phone" : "email";
    if (channel === "phone") {
      return res.status(400).json({ error: "Use Firebase phone verification for mobile OTP" });
    }
    const recipient = String(otpRecipient || email || "").trim().toLowerCase();

    const isValid = await verifyOTPService(recipient || email, otp);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Get pending user
    const pendingUserDoc = await db
      .collection("pending_users")
      .doc(email)
      .get();
    if (!pendingUserDoc.exists) {
      return res.status(400).json({ error: "Registration data not found" });
    }

    const userData = pendingUserDoc.data()!;

    // Create Firebase user
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      emailVerified: true,
    });

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, { role: userData.role });

    // Create user document
    await db.collection("users").doc(userRecord.uid).set({
      id: userRecord.uid,
      email: userData.email,
      displayName: userData.displayName,
      phone: normalizePhoneNumber(userData.phone),
      address: userData.address || "",
      city: userData.city || "",
      state: userData.state || "",
      pincode: userData.pincode || "",
      gender: userData.gender || "",
      role: userData.role,
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      ...(userData.role === 'seller' && {
        isApproved: false,
        onboardingCompleted: false
      })
    });

    // Delete pending user and clear any deletion tombstone for a fresh signup.
    await Promise.all([
      db.collection("pending_users").doc(email).delete(),
      getDeletedAccountRef(email).delete().catch(() => {}),
    ]);

    await Promise.allSettled([
      sendWelcomeEmail(userData.email, userData.displayName),
      userData.phone ? sendWelcomePhoneMessage(userData.phone, userData.displayName) : Promise.resolve(),
    ]);

    // Generate token
    const customToken = await auth.createCustomToken(userRecord.uid);

    res.json({
      message: "Email verified successfully",
      token: customToken,
      user: {
        uid: userRecord.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
export const registerCustomer = async (req: Request, res: Response) => {
  const { password, name, phone, city, state, pincode, address } = req.body;
  const email = normalizeEmail(req.body?.email);

  try {
    await releaseDeletedEmailForReuse(email);
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone ? normalizePhoneNumber(phone) : undefined,
    });

    const userData: User & Record<string, any> = {
      id: userRecord.uid,
      displayName: name,
      email,
      phone: normalizePhoneNumber(phone),
      address: address || '',
      city: city || '',
      state: state || '',
      pincode: pincode || '',
      role: 'customer',
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(userRecord.uid).set(userData);
    await getDeletedAccountRef(email).delete().catch(() => {});
    
    // Set custom claims for role-based auth
    await auth.setCustomUserClaims(userRecord.uid, { role: 'customer' });

    res.status(201).json({ message: 'Customer registered successfully', user: userData });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  // Login is handled on the client-side with Firebase Auth SDK.
  // The client then sends the ID token to the backend for verification if needed.
  // However, for pure API login (without client SDK), we would need a custom flow or use the REST API.
  // Assuming the client uses the SDK, this endpoint might be for session cookie creation or additional data fetching.
  
  // Here we just return a message saying to use the client SDK.
  res.status(200).json({ message: 'Please use Firebase Client SDK to sign in and get an ID token.' });
};

export const registerSeller = async (req: Request, res: Response) => {
  const {
    businessName,
    businessType,
    gstNumber,
    panNumber,
    ownerName,
    email: rawEmail,
    phone,
    password,
    address,
    banking,
  } = req.body;
  const email = normalizeEmail(rawEmail);

  try {
    await releaseDeletedEmailForReuse(email);
    // 1. Create a user (if not exists)
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (e) {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: ownerName,
        phoneNumber: normalizePhoneNumber(phone),
      });
    }

    // 2. Set role to 'seller'
    await auth.setCustomUserClaims(userRecord.uid, { role: 'seller' });

    // 3. Create Sellers document
    const sellerId = db.collection('sellers').doc().id;
    const sellerData: SellerRecord = {
      id: sellerId,
      userId: userRecord.uid,
      businessName,
      businessType,
      gstNumber,
      panNumber,
      ownerName,
      email,
      phone: normalizePhoneNumber(phone),
      address,
      banking,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('sellers').doc(sellerId).set(sellerData);

    // 4. Update user document with role + seller onboarding details so Admin can verify
    const userData: Record<string, any> = {
      id: userRecord.uid,
      displayName: ownerName,
      email,
      role: 'seller',
      verificationStatus: 'pending',
      businessName,
      businessType,
      gstNumber: gstNumber || '',
      panNumber,
      phone: normalizePhoneNumber(phone),
      addressLine1: address?.addressLine1 || '',
      addressLine2: address?.addressLine2 || '',
      city: address?.city || '',
      state: address?.state || '',
      pincode: address?.pincode || '',
      address: address ? `${address.addressLine1 || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}` : '',
      bankName: banking?.bankName || '',
      accountHolderName: banking?.accountHolderName || '',
      accountNumber: banking?.accountNumber || '',
      ifscCode: banking?.ifscCode || '',
      onboardingCompletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.collection('users').doc(userRecord.uid).set(userData, { merge: true });
    await getDeletedAccountRef(email).delete().catch(() => {});

    res.status(201).json({ message: 'Seller registration submitted successfully', sellerId });
  } catch (error: any) {
    console.error('Error registering seller:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getSellerDashboard = async (req: Request, res: Response) => {
  // Stub for dashboard data
  res.json({
    message: 'Welcome to Seller Dashboard',
    stats: {
      products: 10,
      orders: 5,
      revenue: 15000,
    },
  });
};

export const syncUser = async (req: Request, res: Response) => {
  const user = (req as any).user; // Decoded token from middleware
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
    const requestedRole = req.body.role === 'seller' ? 'seller' : 'customer';
    const mode = String(req.body?.mode || "login").toLowerCase() === "signup"
      ? "signup"
      : "login";
    const normalizedEmail = normalizeEmail(user.email);
    const deletedMarker = normalizedEmail
      ? await getDeletedAccountRef(normalizedEmail).get()
      : null;
    
    if (!userDoc.exists) {
      if (deletedMarker?.exists && mode !== "signup") {
        return res.status(403).json({
          error:
            "This account was deleted. Sign up again to create a new account or use the account recovery email if available.",
        });
      }
      // Create user if not exists (e.g. first time Google login)
      const userData: User & Record<string, any> = {
        id: user.uid,
        name: user.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        phone: normalizePhoneNumber(user.phone_number),
        address: '',
        city: '',
        state: '',
        pincode: '',
        addresses: [],
        wishlistIds: [],
        role: requestedRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(requestedRole === 'seller' && {
            isApproved: false,
            onboardingCompleted: false
        })
      };
      await db.collection('users').doc(user.uid).set(userData);
      if (deletedMarker?.exists) {
        await getDeletedAccountRef(normalizedEmail).delete().catch(() => {});
      }
      // Set custom claims
      await auth.setCustomUserClaims(user.uid, { role: requestedRole });
      return res.json({ user: userData });
    }

    let userData = userDoc.data() as User & Record<string, any>;
    if (isDeletedAccount(userData)) {
      return res.status(403).json({
        error:
          "This account was deleted. Sign up again to create a new account or use the account recovery email if available.",
      });
    }

    if (
      requestedRole === 'seller' &&
      String(userData.role || 'customer') === 'customer'
    ) {
      userData = {
        ...userData,
        role: 'seller',
        verificationStatus:
          userData.verificationStatus === 'pending' ||
          userData.verificationStatus === 'approved' ||
          userData.verificationStatus === 'rejected'
            ? userData.verificationStatus
            : undefined,
        onboardingCompleted: false,
        updatedAt: new Date().toISOString(),
      };
      await db.collection('users').doc(user.uid).set(userData, { merge: true });
      await auth.setCustomUserClaims(user.uid, { role: 'seller' });
    }

    // Special Case: Auto-promote admin email to admin role
    if (user.email === 'admin@zoop.com' && userData.role !== 'admin') {
      userData.role = 'admin';
      await db.collection('users').doc(user.uid).update({ role: 'admin' });
      await auth.setCustomUserClaims(user.uid, { role: 'admin' });
    }

    // Check if role in custom claims matches db role, if not update claims
    if (user.role !== userData.role) {
       await auth.setCustomUserClaims(user.uid, { role: userData.role });
    }

    res.json({ user: userData });
  } catch (error: any) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: error.message });
  }
};
export const adminCreateUser = async (req: Request, res: Response) => {
  const { password, displayName, role } = req.body;
  const email = normalizeEmail(req.body?.email);

  try {
    const requester = (req as any).user;
    if (
      String(role || "").toLowerCase() === "admin" &&
      String(requester?.email || "").toLowerCase() !== "admin@zoop.com"
    ) {
      return res.status(403).json({
        error: "Only super admin (admin@zoop.com) can add admins",
      });
    }
    if (String(email || "").toLowerCase() === "admin@zoop.com") {
      return res.status(409).json({
        error: "admin@zoop.com is reserved for super admin",
      });
    }

    await releaseDeletedEmailForReuse(email);

    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });

    await auth.setCustomUserClaims(userRecord.uid, { role: role || 'customer' });

    const userData: User = {
      id: userRecord.uid,
      displayName: displayName,
      email,
      role: (role as Role) || 'customer',
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(userRecord.uid).set(userData);
    await getDeletedAccountRef(email).delete().catch(() => {});

    res.status(201).json({ message: 'User created successfully', user: userData });
  } catch (error: any) {
    console.error('Error in adminCreateUser:', error);
    const message = String(error?.message || '');
    if (message.includes('ENOTFOUND accounts.google.com') || message.includes('app/invalid-credential')) {
      return res.status(503).json({
        error: 'Admin user creation requires valid Firebase server credentials with network access. Please configure a service account JSON locally.',
      });
    }
    res.status(400).json({ error: error.message });
  }
};

export const requestDeleteAccountOTP = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const email = normalizeEmail(user?.email);
    if (!email) return res.status(400).json({ error: "Email not found for user" });

    const profileDoc = await db.collection("users").doc(user.uid).get();
    if (!profileDoc.exists) {
      return res.status(404).json({ error: "Profile not found" });
    }
    const profile = profileDoc.data() as any;
    if (profile?.isDeleted) {
      return res.status(400).json({ error: "Account already deleted" });
    }

    const otp = generateOTP();
    const key = `delete:${email}`;
    const expiresAt = await storeOTP(key, otp);
    await Promise.all([
      sendAccountDeletionOTPEmail(
        email,
        otp,
        profile?.displayName || profile?.name || user?.name,
      ),
      sendRetentionEmail(email, profile?.displayName || profile?.name || user?.name),
    ]);

    res.json({
      message: "Deletion OTP sent to your email",
      expiresAt,
      resendAfterSec: 60,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Could not send deletion OTP" });
  }
};

export const confirmDeleteAccount = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const email = normalizeEmail(user?.email);
    const otp = String(req.body?.otp || "").trim();
    const reason = String(req.body?.reason || "").trim();
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const valid = await verifyOTPService(`delete:${email}`, otp);
    if (!valid) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const userRef = db.collection("users").doc(user.uid);
    const userDoc = await userRef.get();
    const userProfile = (userDoc.data() as any) || {};
    const role = userProfile?.role || user.role || "customer";
    await userRef.set(
      {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: user.uid,
        deletionReason: reason || "Self-requested account deletion",
        disabled: true,
        status: "deleted",
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    await Promise.all([
      archiveDeletedAccount({
        uid: user.uid,
        email,
        role,
        reason: reason || "Self-requested account deletion",
        deletedBy: user.uid,
        source: "self-service",
        profile: userProfile,
      }),
      db.collection("pending_users").doc(email).delete().catch(() => {}),
    ]);

    // Remove the Firebase auth user so the same email can be used for a fresh signup.
    await removeFirebaseUserIfPresent(user.uid);
    if (String(role) === "seller") {
      const products = await db.collection("products").where("sellerId", "==", user.uid).get();
      const batch = db.batch();
      products.docs.forEach((d) => {
        batch.set(
          d.ref,
          {
            moderationStatus: "removed",
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      });
      await batch.commit();
    }
    await sendAccountDeletedEmail(email, role);
    res.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Could not delete account" });
  }
};

export const requestLoginOTP = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const channel = String(req.body?.otpChannel || "email").toLowerCase() === "phone" ? "phone" : "email";
    if (!email) return res.status(400).json({ error: "Email is required" });

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (String(error?.code || "") === "auth/user-not-found") {
        return res.status(404).json({ error: "No account found for this email" });
      }
      throw error;
    }
    if (!userRecord?.uid) {
      return res.status(404).json({ error: "No account found for this email" });
    }

    const profileDoc = await db.collection("users").doc(userRecord.uid).get();
    const profile = profileDoc.exists ? (profileDoc.data() as any) : {};
    if (!profileDoc.exists || isDeletedAccount(profile)) {
      await releaseDeletedEmailForReuse(email);
      return res.status(403).json({
        error:
          "This account has been deleted. Sign up again to create a new account or use the recovery email if available.",
      });
    }
    const otpRecipient = channel === "phone" ? normalizePhoneNumber(profile?.phone) : email;
    if (!otpRecipient) {
      return res.status(400).json({ error: "Phone number is not available for this account" });
    }
    let expiresAt: string | null = null;
    if (channel === "email") {
      const otp = generateOTP();
      const otpKey = `login:${otpRecipient}`;
      expiresAt = await storeOTP(otpKey, otp);
      await sendOTPEmail(email, otp, userRecord.displayName || "User");
    }

    res.json({
      message: channel === "phone" ? "Phone verification required" : "Login OTP sent successfully",
      email,
      otpChannel: channel,
      otpRecipient,
      expiresAt,
      resendAfterSec: channel === "phone" ? 0 : 60,
      phoneAuthRequired: channel === "phone",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Could not send login OTP" });
  }
};

export const verifyLoginOTP = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const channel = String(req.body?.otpChannel || "email").toLowerCase() === "phone" ? "phone" : "email";
    if (channel === "phone") {
      return res.status(400).json({ error: "Use Firebase phone verification for mobile OTP" });
    }
    const otpRecipient = String(req.body?.otpRecipient || "").trim();
    const otp = String(req.body?.otp || "").trim();
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

    const otpKey = `login:${otpRecipient || email}`;
    const isValid = await verifyOTPService(otpKey, otp);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (String(error?.code || "") === "auth/user-not-found") {
        return res.status(404).json({ error: "No account found for this email" });
      }
      throw error;
    }
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    const userData = userDoc.exists ? (userDoc.data() as any) : {};
    if (!userDoc.exists || isDeletedAccount(userData)) {
      await releaseDeletedEmailForReuse(email);
      return res.status(403).json({
        error:
          "This account has been deleted. Sign up again to create a new account or use the recovery email if available.",
      });
    }
    const customToken = await auth.createCustomToken(userRecord.uid);

    res.json({
      message: "Login successful",
      token: customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || userData?.displayName || "",
        role: userData?.role || "customer",
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Could not verify login OTP" });
  }
};
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const channel = String(req.body?.otpChannel || 'email').toLowerCase() === 'phone' ? 'phone' : 'email';
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const pendingDoc = await db.collection('pending_users').doc(email).get();
    if (!pendingDoc.exists) {
      return res.status(404).json({ error: 'No pending signup found for this email' });
    }

    const pending = pendingDoc.data() as any;
    const recipient = channel === 'phone' ? normalizePhoneNumber(pending?.phone) : email;
    if (!recipient) {
      return res.status(400).json({ error: 'Phone number is not available for this signup' });
    }
    let expiresAt: string | null = null;
    if (channel === 'email') {
      const otp = generateOTP();
      expiresAt = await storeOTP(recipient, otp);
      await sendOTPEmail(email, otp, pending?.displayName || 'User');
    }

    res.json({
      message: channel === 'phone' ? 'Phone verification required' : 'OTP resent successfully',
      otpChannel: channel,
      otpRecipient: recipient,
      expiresAt,
      resendAfterSec: channel === 'phone' ? 0 : 60,
      phoneAuthRequired: channel === 'phone',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyPhoneSignup = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const idToken = String(req.body?.idToken || '').trim();
    if (!email || !idToken) {
      return res.status(400).json({ error: 'Email and Firebase phone token are required' });
    }

    const pendingUserDoc = await db.collection('pending_users').doc(email).get();
    if (!pendingUserDoc.exists) {
      return res.status(404).json({ error: 'Registration data not found' });
    }
    const userData = pendingUserDoc.data() as any;
    const decoded = await auth.verifyIdToken(idToken);
    const verifiedPhone = normalizePhoneNumber(decoded.phone_number);
    const expectedPhone = normalizePhoneNumber(userData?.phone);
    if (!verifiedPhone || !expectedPhone || verifiedPhone !== expectedPhone) {
      return res.status(400).json({ error: 'Verified mobile number does not match signup details' });
    }

    try {
      await auth.updateUser(decoded.uid, {
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        phoneNumber: verifiedPhone,
      });
    } catch (error: any) {
      if (String(error?.code || '') === 'auth/user-not-found') {
        await auth.createUser({
          uid: decoded.uid,
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName,
          phoneNumber: verifiedPhone,
        });
      } else {
        throw error;
      }
    }

    await auth.setCustomUserClaims(decoded.uid, { role: userData.role || 'customer' });
    await db.collection('users').doc(decoded.uid).set({
      id: decoded.uid,
      email: userData.email,
      displayName: userData.displayName,
      phone: verifiedPhone,
      address: userData.address || "",
      city: userData.city || "",
      state: userData.state || "",
      pincode: userData.pincode || "",
      gender: userData.gender || "",
      role: userData.role || 'customer',
      isEmailVerified: false,
      isPhoneVerified: true,
      createdAt: new Date().toISOString(),
      ...(userData.role === 'seller' && {
        isApproved: false,
        onboardingCompleted: false,
      }),
    }, { merge: true });

    await Promise.all([
      db.collection('pending_users').doc(email).delete(),
      getDeletedAccountRef(email).delete().catch(() => {}),
    ]);
    await Promise.allSettled([
      sendWelcomeEmail(userData.email, userData.displayName),
      verifiedPhone ? sendWelcomePhoneMessage(verifiedPhone, userData.displayName) : Promise.resolve(),
    ]);

    const customToken = await auth.createCustomToken(decoded.uid);
    res.json({
      message: 'Mobile verified successfully',
      token: customToken,
      user: {
        uid: decoded.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role || 'customer',
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not verify mobile signup' });
  }
};

export const verifyPhoneLogin = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const idToken = String(req.body?.idToken || '').trim();
    if (!email || !idToken) {
      return res.status(400).json({ error: 'Email and Firebase phone token are required' });
    }

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (String(error?.code || "") === "auth/user-not-found") {
        return res.status(404).json({ error: "No account found for this email" });
      }
      throw error;
    }
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (!userDoc.exists) {
      await releaseDeletedEmailForReuse(email);
      return res.status(404).json({ error: 'Profile not found for this account' });
    }
    const profile = userDoc.data() as any;
    if (isDeletedAccount(profile)) {
      await releaseDeletedEmailForReuse(email);
      return res.status(403).json({
        error:
          'This account has been deleted. Sign up again to create a new account or use the recovery email if available.',
      });
    }
    const expectedPhone = normalizePhoneNumber(profile?.phone || userRecord.phoneNumber);
    if (!expectedPhone) {
      return res.status(400).json({ error: 'Phone number is not available for this account' });
    }

    const decoded = await auth.verifyIdToken(idToken);
    const verifiedPhone = normalizePhoneNumber(decoded.phone_number);
    if (!verifiedPhone || verifiedPhone !== expectedPhone) {
      return res.status(400).json({ error: 'Verified mobile number does not match this account' });
    }

    const customToken = await auth.createCustomToken(userRecord.uid);
    res.json({
      message: 'Login successful',
      token: customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || profile?.displayName || "",
        role: profile?.role || "customer",
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not verify mobile login' });
  }
};

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'Profile not found' });
    res.json({ id: userDoc.id, ...(userDoc.data() as any) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const payload = req.body || {};
    const allowedCommon = [
      'displayName',
      'name',
      'phone',
      'altPhone',
      'address',
      'addressLine1',
      'addressLine2',
      'city',
      'state',
      'pincode',
      'landmark',
      'addresses',
      'defaultLocation',
      'gender',
      'dateOfBirth',
      'photoURL',
    ];
    const allowedSeller = [
      'businessName',
      'businessType',
      'gstNumber',
      'panNumber',
      'bankName',
      'accountHolderName',
      'accountNumber',
      'ifscCode',
      'bio',
      'panCardUrl',
      'gstCertificateUrl',
      'cancelledChequeUrl',
      'storeSettings',
      'notificationPreferences',
      'vacationMode',
      'autoRestock',
      'orderNotifications',
      'lowStockAlerts',
      'customerMessages',
      'weeklyReports',
      'payoutPreference',
      'upiId',
      'showPhoneOnProduct',
      'showEmailOnProduct',
      'sameDayCutoffHour',
      'sameDayDeliveryWindowHours',
    ];
    const allowed = new Set([
      ...allowedCommon,
      ...(user.role === 'seller' ? allowedSeller : []),
    ]);

    const updates: Record<string, any> = {};
    Object.keys(payload).forEach((key) => {
      if (allowed.has(key)) updates[key] = payload[key];
    });
    updates.updatedAt = new Date().toISOString();

    await db.collection('users').doc(user.uid).set(updates, { merge: true });
    const updated = await db.collection('users').doc(user.uid).get();
    res.json({ message: 'Profile updated', profile: { id: updated.id, ...(updated.data() as any) } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
