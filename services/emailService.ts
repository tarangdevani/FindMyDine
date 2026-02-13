
import emailjs from '@emailjs/browser';

// --- CONFIGURATION ---
// REPLACE THESE WITH YOUR ACTUAL EMAILJS KEYS
const EMAILJS_SERVICE_ID = "service_ty8c4mb"; 
const EMAILJS_TEMPLATE_ID = "template_n32ublf"; 
const EMAILJS_PUBLIC_KEY = "m_-SsHlF6TDFFuDps"; 

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

interface EmailParams {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  action_url?: string;
  action_text?: string;
}

export const sendStaffEmail = async (params: EmailParams): Promise<boolean> => {
  // Safety check to prevent sending with empty email
  if (!params.to_email) {
    console.error("EmailJS Error: Recipient email is missing.");
    return false;
  }

  try {
    // We send multiple variations of common keys (to_email, email, recipient) 
    // to ensure the EmailJS template picks up the address regardless of how it is configured in the dashboard.
    const templateParams = {
      to_email: params.to_email,
      email: params.to_email,        // Common default
      recipient: params.to_email,    // Another common default
      user_email: params.to_email,   // Another possibility
      
      to_name: params.to_name,
      name: params.to_name,          // Common default
      
      subject: params.subject,
      message: params.message,
      action_url: params.action_url || window.location.origin,
      action_text: params.action_text || "View Dashboard",
    };

    console.log("Sending email with params:", templateParams);

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      console.log('Email sent successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to send email:', error);
    // Return true to allow the UI to proceed even if email fails (optional choice)
    // or return false if you want to block success. 
    // Here we return false to indicate the specific email action failed.
    return false;
  }
};
