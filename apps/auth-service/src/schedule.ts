import sendMailInvite from "./utils/mailer";
import { isBefore, subMinutes } from "date-fns";

const scheduledInviteEmail = async (startsAt, inviteToken, participants) => {
  if (!startsAt || isBefore(new Date(startsAt), new Date())) {
    // If startsAt is missing or already started, send immediately
    return sendMailInvite(inviteToken, participants);
  }

  const scheduledTime = subMinutes(new Date(startsAt), 30).getTime();
  const delay = scheduledTime - Date.now();

  if (delay <= 0) {
    // If interview is within 30 mins or already started, send now
    return sendMailInvite(inviteToken, participants);
  }

  // Schedule the email 30 minutes before the interview
  setTimeout(() => {
    sendMailInvite(inviteToken, participants);
  }, delay);
};

export default scheduledInviteEmail;
