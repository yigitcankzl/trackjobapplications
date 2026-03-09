// --- Email Data Extraction ---

function extractFromEmail(e) {
  var data = {
    company: '',
    position: '',
    subject: '',
    senderName: '',
    senderEmail: '',
    notes: '',
    messageId: '',
    url: '',
  };

  if (!e || !e.gmail) return data;

  var messageId = e.gmail.messageId;
  if (!messageId) return data;

  data.messageId = messageId;

  var message = GmailApp.getMessageById(messageId);
  if (!message) return data;

  data.subject = message.getSubject() || '';
  data.senderEmail = extractEmail(message.getFrom());
  data.senderName = extractName(message.getFrom());

  // Extract company from sender
  data.company = guessCompany(data.senderName, data.senderEmail);

  // Extract position from subject
  data.position = guessPosition(data.subject);

  // Build notes
  data.notes = 'From email: ' + data.subject + '\nSender: ' + message.getFrom();

  // Try to extract a job URL from the email body
  var body = message.getPlainBody() || '';
  var urlMatch = body.match(/https?:\/\/[^\s<>"]+(?:job|career|position|apply|opening)[^\s<>"]*/i);
  if (!urlMatch) {
    var allUrls = body.match(/https?:\/\/[^\s<>"]+/g) || [];
    for (var j = 0; j < allUrls.length; j++) {
      if (!allUrls[j].match(/google\.com|gmail\.com|unsubscribe|mailto/i)) {
        urlMatch = [allUrls[j]];
        break;
      }
    }
  }
  data.url = urlMatch ? sanitizeUrl(urlMatch[0]) : '';

  return data;
}

function sanitizeUrl(url) {
  // Only allow http/https, strip trailing punctuation, limit length
  if (!url || !url.match(/^https?:\/\//i)) return '';
  url = url.replace(/[)}\].,;:!?'"]+$/, ''); // strip trailing punctuation
  if (url.length > 2048) return '';
  // Block known dangerous schemes embedded in redirects
  if (url.match(/javascript:|data:|vbscript:/i)) return '';
  return url;
}

function extractEmail(fromHeader) {
  var match = fromHeader.match(/<(.+?)>/);
  if (match) return match[1];
  if (fromHeader.indexOf('@') !== -1) return fromHeader.trim();
  return '';
}

function extractName(fromHeader) {
  var match = fromHeader.match(/^"?(.+?)"?\s*</);
  if (match) return match[1].trim();
  return fromHeader.replace(/<.*>/, '').trim();
}

function guessCompany(name, email) {
  if (name) {
    var fromMatch = name.match(/(?:from|at|@)\s+(.+)/i);
    if (fromMatch) return fromMatch[1].trim();

    if (!name.includes(' ') || name.match(/recruiting|talent|hr|careers/i)) {
      return name;
    }
  }

  // Fallback: email domain
  if (email) {
    var domain = email.split('@')[1];
    if (domain && !domain.match(/gmail|yahoo|hotmail|outlook/)) {
      var company = domain.split('.')[0];
      return company.charAt(0).toUpperCase() + company.slice(1);
    }
  }

  return name || '';
}

function guessPosition(subject) {
  var patterns = [
    /(?:for|re:?\s*)?(?:the\s+)?(.+?)\s+(?:position|role|opening)/i,
    /(?:application|interview|offer)\s+(?:for|:)\s*(.+)/i,
    /(.+?)\s*[-\u2013\u2014]\s*(?:application|interview|update)/i,
  ];

  for (var i = 0; i < patterns.length; i++) {
    var match = subject.match(patterns[i]);
    if (match) {
      return match[1].trim().replace(/^re:\s*/i, '');
    }
  }

  // Fallback: cleaned subject
  return subject.replace(/^(?:re|fwd|fw):\s*/i, '').trim();
}
