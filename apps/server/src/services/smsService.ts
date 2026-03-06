const SMS_API_URL = process.env.SMS_API_URL;
const SMS_API_KEY = process.env.SMS_API_KEY;
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || "ZOOP";

const firebasePhoneAuthError =
  "Firebase Phone Auth does not send OTP from this server. Enable Phone Authentication in Firebase Console and complete the client-side reCAPTCHA phone flow, or configure a dedicated SMS gateway for backend OTP.";

const ensureSmsProvider = () => {
  if (!SMS_API_URL || !SMS_API_KEY) {
    throw new Error(firebasePhoneAuthError);
  }
};

export const sendOTPPhoneMessage = async (phone: string, otp: string, name?: string) => {
  ensureSmsProvider();
  const response = await fetch(SMS_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SMS_API_KEY}`,
    },
    body: JSON.stringify({
      to: phone,
      sender: SMS_SENDER_ID,
      message: `Hi ${name || "there"}, your Zoop OTP is ${otp}. It expires in 5 minutes.`,
    }),
  });

  if (!response.ok) {
    throw new Error("Could not send OTP to phone number");
  }
};

export const sendWelcomePhoneMessage = async (phone: string, name?: string) => {
  ensureSmsProvider();
  const response = await fetch(SMS_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SMS_API_KEY}`,
    },
    body: JSON.stringify({
      to: phone,
      sender: SMS_SENDER_ID,
      message: `Welcome to Zoop${name ? `, ${name}` : ""}. Your account is ready.`,
    }),
  });

  if (!response.ok) {
    throw new Error("Could not send welcome SMS");
  }
};
