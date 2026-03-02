import { db } from "../config/firebase";

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOTP = async (email: string, otp: string): Promise<string> => {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.collection("otps").doc(email).set({
    otp,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
  });
  return expiresAt.toISOString();
};

export const verifyOTP = async (
  email: string,
  otp: string,
): Promise<boolean> => {
  const doc = await db.collection("otps").doc(email).get();
  if (!doc.exists) return false;

  const data = doc.data()!;
  if (new Date() > new Date(data.expiresAt)) {
    await db.collection("otps").doc(email).delete();
    return false;
  }

  if (data.otp !== otp) return false;

  await db.collection("otps").doc(email).delete();
  return true;
};
