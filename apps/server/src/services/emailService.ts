import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "Zoop";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const ensureEmailProvider = () => {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    throw new Error("Email provider is not configured on server");
  }
};

export const sendOTPEmail = async (
  email: string,
  otp: string,
  name?: string,
) => {
  ensureEmailProvider();
  const msg = {
    to: email,
    from: {
      email: SENDGRID_FROM_EMAIL!,
      name: SENDGRID_FROM_NAME,
    },
    subject: "Verify Your Email - Zoop",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#f8fafc;border-radius:12px">
        <h1 style="margin:0 0 12px;color:#111827">Verify your Zoop account</h1>
        <p style="margin:0 0 12px;color:#374151">Hi ${name || "there"},</p>
        <p style="margin:0 0 16px;color:#374151">Use this One-Time Password to continue:</p>
        <p style="font-size:28px;letter-spacing:6px;font-weight:700;margin:0 0 16px;color:#111827">${otp}</p>
        <p style="margin:0;color:#6b7280">This OTP expires in 5 minutes.</p>
      </div>
    `,
  };

  await sgMail.send(msg);
};

export const sendStockAvailableEmail = async (
  email: string,
  productTitle: string,
) => {
  ensureEmailProvider();
  const msg = {
    to: email,
    from: {
      email: SENDGRID_FROM_EMAIL!,
      name: SENDGRID_FROM_NAME,
    },
    subject: `${productTitle} is back in stock on Zoop`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#f8fafc;border-radius:12px">
        <h1 style="margin:0 0 12px;color:#111827">Back in stock</h1>
        <p style="margin:0 0 12px;color:#374151">Good news. <strong>${productTitle}</strong> is available again.</p>
        <p style="margin:0;color:#6b7280">Open Zoop and complete your order before stock runs out.</p>
      </div>
    `,
  };

  await sgMail.send(msg);
};

export const sendAccountDeletionOTPEmail = async (
  email: string,
  otp: string,
  name?: string,
) => {
  ensureEmailProvider();
  await sgMail.send({
    to: email,
    from: {
      email: SENDGRID_FROM_EMAIL!,
      name: SENDGRID_FROM_NAME,
    },
    subject: "Confirm account deletion - Zoop",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#fff7ed;border-radius:12px">
        <h1 style="margin:0 0 12px;color:#7c2d12">Delete account confirmation</h1>
        <p style="margin:0 0 12px;color:#374151">Hi ${name || "there"},</p>
        <p style="margin:0 0 16px;color:#374151">We received a request to delete your Zoop account. Use this OTP to confirm:</p>
        <p style="font-size:28px;letter-spacing:6px;font-weight:700;margin:0 0 16px;color:#111827">${otp}</p>
        <p style="margin:0;color:#6b7280">This OTP expires in 5 minutes. If this wasn't you, ignore this email.</p>
      </div>
    `,
  });
};

export const sendRetentionEmail = async (
  email: string,
  name?: string,
) => {
  ensureEmailProvider();
  await sgMail.send({
    to: email,
    from: {
      email: SENDGRID_FROM_EMAIL!,
      name: SENDGRID_FROM_NAME,
    },
    subject: "We’d love to keep you at Zoop",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#ecfdf5;border-radius:12px">
        <h1 style="margin:0 0 12px;color:#065f46">We value your account</h1>
        <p style="margin:0 0 12px;color:#374151">Hi ${name || "there"},</p>
        <p style="margin:0 0 12px;color:#374151">Before you go, our support team can help resolve any issue quickly.</p>
        <p style="margin:0;color:#6b7280">Reply to this email if you'd like help. We're here for you.</p>
      </div>
    `,
  });
};

export const sendAccountDeletedEmail = async (
  email: string,
  accountType: "customer" | "seller" | "admin" | "user" = "user",
) => {
  ensureEmailProvider();
  await sgMail.send({
    to: email,
    from: {
      email: SENDGRID_FROM_EMAIL!,
      name: SENDGRID_FROM_NAME,
    },
    subject: "Your Zoop account has been deleted",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#f8fafc;border-radius:12px">
        <h1 style="margin:0 0 12px;color:#111827">Account deleted</h1>
        <p style="margin:0 0 12px;color:#374151">Your ${accountType} account has been deleted from Zoop.</p>
        <p style="margin:0;color:#6b7280">If this was not expected, contact support immediately.</p>
      </div>
    `,
  });
};

export const sendAccountStatusEmail = async (
  email: string,
  action: "banned" | "unbanned" | "deleted",
  reason?: string,
) => {
  ensureEmailProvider();
  const heading =
    action === "banned"
      ? "Account suspended"
      : action === "unbanned"
        ? "Account restored"
        : "Account deleted";
  await sgMail.send({
    to: email,
    from: {
      email: SENDGRID_FROM_EMAIL!,
      name: SENDGRID_FROM_NAME,
    },
    subject: `${heading} - Zoop`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#f8fafc;border-radius:12px">
        <h1 style="margin:0 0 12px;color:#111827">${heading}</h1>
        <p style="margin:0 0 12px;color:#374151">Your Zoop account status has changed: <strong>${action}</strong>.</p>
        ${reason ? `<p style="margin:0 0 12px;color:#374151">Reason: ${reason}</p>` : ""}
        <p style="margin:0;color:#6b7280">Contact support if you need assistance.</p>
      </div>
    `,
  });
};

export const sendWelcomeEmail = async (email: string, name?: string) => {
  ensureEmailProvider();
  await sgMail.send({
    to: email,
    from: {
      email: SENDGRID_FROM_EMAIL!,
      name: SENDGRID_FROM_NAME,
    },
    subject: "Welcome to Zoop",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#f0fdf4;border-radius:12px">
        <h1 style="margin:0 0 12px;color:#14532d">Welcome to Zoop</h1>
        <p style="margin:0 0 12px;color:#374151">Hi ${name || "there"},</p>
        <p style="margin:0 0 12px;color:#374151">Your account is active and ready to explore local-first shopping.</p>
        <p style="margin:0;color:#6b7280">Thanks for joining Zoop.</p>
      </div>
    `,
  });
};
