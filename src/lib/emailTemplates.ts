import { buildBaseEmailHtml } from "@/lib/baseEmailLayout";
import { escapeEmailHtml, sanitiseEmailText, truncateEmailText } from "@/lib/emailSanitisation";
import { buildPlainTextEmail } from "@/lib/plainTextEmailTemplates";
import type { EmailNotificationTemplate, TransactionalEmailPayload } from "@/types/emailNotifications";

export function buildTransactionalEmail(input: { template: EmailNotificationTemplate; data: TransactionalEmailPayload["data"]; actionUrl?: string | null; actionLabel?: string | null }): { subject: string; text: string; html: string } {
  const venueName = text(input.data.venueName, "your venue");
  const reference = text(input.data.confirmationReference, "Pending");
  const lines = getLines(input.template, input.data);
  const subject = getSubject(input.template, venueName);
  const bodyHtml = `<div style="font-size:15px;line-height:1.7;color:#423b35">${lines.map((line) => `<p style="margin:0 0 10px">${escapeEmailHtml(line)}</p>`).join("")}</div>`;

  return {
    subject,
    text: buildPlainTextEmail({ title: subject, lines, actionUrl: input.actionUrl, actionLabel: input.actionLabel }),
    html: buildBaseEmailHtml({ title: subject, bodyHtml, actionUrl: input.actionUrl, actionLabel: input.actionLabel, footer: input.template.startsWith("owner_") ? "You received this email because you manage a venue on nokta." : undefined }),
  };

  function getLines(template: EmailNotificationTemplate, data: TransactionalEmailPayload["data"]): string[] {
    const dateTime = `${text(data.requestedDate)} ${text(data.requestedTime)}`.trim();
    const proposedDateTime = `${text(data.proposedDate)} ${text(data.proposedTime)}`.trim();
    const partySize = data.partySize ? `${data.partySize} people` : "";
    switch (template) {
      case "booking_request_confirmation":
        return [`Your booking request for ${venueName} has been sent.`, "This is not confirmed yet. The venue will review your request.", `Requested: ${dateTime}`, `Party size: ${partySize}`, `Reference: ${reference}`].filter(Boolean);
      case "owner_new_booking_request":
        return [`You have a new booking request for ${venueName}.`, `Requested: ${dateTime}`, `Party size: ${partySize}`, `Customer: ${text(data.customerName)}`, `Email: ${text(data.customerEmail)}`, phoneLine(data.customerPhone), optionalLine("Occasion", data.occasion)].filter(Boolean);
      case "booking_request_accepted":
        return [`${venueName} has accepted your booking request. Your booking is confirmed.`, `Confirmed: ${dateTime}`, `Party size: ${partySize}`, `Reference: ${reference}`].filter(Boolean);
      case "booking_request_declined":
        return [`${venueName} was unable to accept your booking request.`, `Requested: ${dateTime}`, `Party size: ${partySize}`, optionalLine("Venue message", data.ownerResponseMessage)].filter(Boolean);
      case "booking_alternative_proposed":
        return [`${venueName} has suggested another date or time for your booking.`, `Original request: ${dateTime}`, `Proposed: ${proposedDateTime}`, `Party size: ${partySize}`, optionalLine("Venue message", data.proposedMessage)].filter(Boolean);
      case "owner_booking_alternative_accepted":
        return [`The customer accepted your proposed booking time for ${venueName}.`, `Confirmed: ${dateTime}`, `Party size: ${partySize}`, `Customer: ${text(data.customerName)}`, `Reference: ${reference}`].filter(Boolean);
      case "owner_booking_alternative_declined":
        return [`The customer declined your proposed booking time for ${venueName}.`, `Original request: ${dateTime}`, `Proposed: ${proposedDateTime}`, `Party size: ${partySize}`, `Customer: ${text(data.customerName)}`, optionalLine("Customer response", data.customerAlternativeResponseMessage)].filter(Boolean);
      case "owner_new_enquiry":
        return [`You have a new enquiry for ${venueName}.`, optionalLine("Type", data.enquiryType), `Customer: ${text(data.customerName)}`, `Email: ${text(data.customerEmail)}`, phoneLine(data.customerPhone), optionalLine("Message", data.message)].filter(Boolean);
      default:
        return ["There is a new nokta notification."];
    }
  }
}

function getSubject(template: EmailNotificationTemplate, venueName: string) {
  switch (template) {
    case "booking_request_confirmation":
      return "Your booking request has been sent";
    case "owner_new_booking_request":
      return `New booking request for ${venueName}`;
    case "booking_request_accepted":
      return "Your booking is confirmed";
    case "booking_request_declined":
      return "Your booking request was declined";
    case "booking_alternative_proposed":
      return `${venueName} proposed another booking time`;
    case "owner_booking_alternative_accepted":
      return "Customer accepted your proposed booking time";
    case "owner_booking_alternative_declined":
      return "Customer declined your proposed booking time";
    case "owner_new_enquiry":
      return `New enquiry for ${venueName}`;
    default:
      return "nokta notification";
  }
}

function optionalLine(label: string, value: unknown) {
  const next = truncateEmailText({ value: String(value ?? ""), maxLength: 500 });
  return next ? `${label}: ${next}` : "";
}

function phoneLine(value: unknown) {
  return optionalLine("Phone", value);
}

function text(value: unknown, fallback = "") {
  return sanitiseEmailText(String(value ?? fallback));
}
