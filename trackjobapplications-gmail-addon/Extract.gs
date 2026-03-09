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
    threadId: '',
    url: '',
    snippet: '',
    emailType: 'general',
    suggestedStatus: '',
    receivedAt: '',
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
  data.threadId = message.getThread().getId();
  data.receivedAt = message.getDate().toISOString();

  // Extract company from sender
  data.company = guessCompany(data.senderName, data.senderEmail);

  // Extract position from subject
  data.position = guessPosition(data.subject);

  // Build notes
  data.notes = 'From email: ' + data.subject + '\nSender: ' + message.getFrom();

  // Try to extract a job URL from the email body
  var body = message.getPlainBody() || '';
  data.snippet = body.substring(0, 500);

  // Classify email type
  var classification = classifyEmail(data.subject, data.snippet);
  data.emailType = classification.type;
  data.suggestedStatus = classification.suggestedStatus;

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

function classifyEmail(subject, body) {
  var text = (subject + ' ' + body).toLowerCase();

  var offerWords = /pleased to offer|offer (letter|of employment)|extend.{0,20}offer|congratulations.{0,30}(offer|position)|job offer|welcome aboard/i;
  var rejectWords = /unfortunately|regret to inform|not (been )?selected|decided not to|moved forward with other|position has been filled|not a (good )?match|will not be moving forward|unable to offer|rejected|rejection/i;
  var interviewWords = /schedule.{0,20}interview|interview invitation|invite you.{0,20}interview|like to (meet|speak|chat)|phone screen|technical interview|next (step|round|stage)|would you be available/i;

  if (offerWords.test(text)) return { type: 'offer', suggestedStatus: 'offer' };
  if (rejectWords.test(text)) return { type: 'rejection', suggestedStatus: 'rejected' };
  if (interviewWords.test(text)) return { type: 'interview_invite', suggestedStatus: 'interview' };
  return { type: 'general', suggestedStatus: '' };
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
