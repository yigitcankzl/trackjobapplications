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

  return data;
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
