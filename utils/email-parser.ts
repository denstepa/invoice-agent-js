interface EmailAddress {
  address: string;
  name?: string;
}

export interface EmailMetadata {
  from: EmailAddress;
  to: EmailAddress[];
  subject: string;
  date: string;
  message_id: string;
  text?: string;
}

export function parseEmailFormData(formData: FormData): EmailMetadata {
  // Parse 'from' field - expected format: "Name <email@domain.com>" or just "email@domain.com"
  const fromRaw = formData.get('from') as string;
  const from = parseEmailAddress(fromRaw);

  // Parse 'to' field(s) - could be multiple recipients
  const toRaw = formData.get('to') as string;
  const to = toRaw ? [parseEmailAddress(toRaw)] : [];

  // Get other metadata
  const subject = formData.get('subject') as string || '';
  const date = formData.get('date') as string || new Date().toISOString();
  const messageId = formData.get('message-id') as string || '';
  const text = formData.get('text') as string || '';

  return {
    from,
    to,
    subject,
    date,
    message_id: messageId,
    text
  };
}

function parseEmailAddress(emailString: string): EmailAddress {
  if (!emailString) {
    return { address: 'unknown' };
  }

  // Match pattern: "Name <email@domain.com>" or just "email@domain.com"
  const match = emailString.match(/^(?:"?([^"]*)"?\s+)?<?([^<>\s]+@[^<>\s]+)>?$/);
  
  if (match) {
    const [, name, address] = match;
    return {
      address: address.trim(),
      name: name ? name.trim() : undefined
    };
  }

  // Fallback: assume the whole string is an email address
  return { address: emailString.trim() };
} 