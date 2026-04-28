// src/services/emailService.js
// ============================================================
// NEXUS PLATFORM — Email OTP Service via EmailJS
// ✅ Sends REAL OTP to user's actual email address
// ✅ Works on Vercel — no backend needed
// ✅ Free tier: 200 emails/month (more than enough for testing)
//
// SETUP (5 minutes):
// 1. Go to https://www.emailjs.com and create a FREE account
// 2. Add Email Service (Gmail recommended): Dashboard → Email Services → Add New
// 3. Create Email Template: Dashboard → Email Templates → Create New
//    Template must have these variables:
//      {{to_name}}   → recipient's name
//      {{to_email}}  → recipient's email
//      {{otp_code}}  → the 6-digit code
//      {{app_name}}  → "Nexus Platform"
// 4. Copy Service ID, Template ID, Public Key into your .env file
// ============================================================

import emailjs from '@emailjs/browser';

const SERVICE_ID  = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

export const isEmailConfigured = () =>
  Boolean(SERVICE_ID && SERVICE_ID !== 'your_service_id_here');

/**
 * Generate a cryptographically random 6-digit OTP
 */
export const generateOTP = () => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000));
};

/**
 * Send OTP to user's real email
 * @param {string} toEmail  — recipient email
 * @param {string} toName   — recipient name
 * @param {string} otpCode  — 6-digit code
 * @returns {{ success: boolean, error?: string }}
 */
export const sendOTPEmail = async (toEmail, toName, otpCode) => {
  // If EmailJS not configured → fall back to showing the code in a toast (local dev)
  if (!isEmailConfigured()) {
    console.info(`[EmailJS not configured] OTP for ${toEmail}: ${otpCode}`);
    return { success: true, localMode: true };
  }

  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_name:  toName  || 'User',
        to_email: toEmail,
        otp_code: otpCode,
        app_name: 'Nexus Platform',
      },
      PUBLIC_KEY
    );
    return { success: true };
  } catch (err) {
    console.error('EmailJS error:', err);
    return { success: false, error: 'Failed to send email. Please try again.' };
  }
};
