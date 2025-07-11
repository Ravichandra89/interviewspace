import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail-invite",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Method to send the Inivitation token to user
const sendMailInvite = async (
  inviteToken: string,
  participants: Array<{
    email: string;
    name: string;
    startsAt: Date;
  }>
) => {
  for (const user of participants) {
    try {
      await transporter.sendMail({
        from: `"Interview Team" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Your Interview is starting soon",
        html: `
          <p>Hi ${user.name},</p>
          <p>Your interview is scheduled to start at <strong>${user.startsAt.toLocaleString()}</strong>.</p>
          <p>
            <a href="${
              process.env.FRONTEND_URL
            }/interview?token=${inviteToken}">
              Click here to join your interview
            </a>
          </p>
          <p>If you have any issues, please reach out to us.</p>
        `,
      });

      console.log(`Invite email sent to ${user.email}`);
    } catch (error) {
      console.error(
        `Failed to sent invite email to participants: ${user.email}`,
        error
      );
    }
  }
};


export default sendMailInvite;