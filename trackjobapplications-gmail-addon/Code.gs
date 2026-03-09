// --- Main Entry Points ---

// Triggered when user opens the add-on from the sidebar
function onHomepage(e) {
  if (!isLoggedIn()) {
    return buildLoginCard();
  }

  // If opened from an email context, extract data
  if (e && e.gmail && e.gmail.messageId) {
    var data = extractFromEmail(e);
    return buildJobCard(data);
  }

  // Generic homepage when not viewing an email
  var card = CardService.newCardBuilder();
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('TrackJobApplications')
      .setSubtitle('Open an email to track a job application')
  );

  var section = CardService.newCardSection();
  section.addWidget(
    CardService.newDecoratedText()
      .setText('Navigate to an email and this add-on will help you extract job info and save it.')
      .setWrapText(true)
  );

  // Logout button
  section.addWidget(
    CardService.newTextButton()
      .setText('Logout')
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(CardService.newAction().setFunctionName('onLogout'))
  );

  card.addSection(section);
  return card.build();
}

// Triggered when user opens/views an email
function onGmailMessage(e) {
  if (!isLoggedIn()) {
    return buildLoginCard();
  }

  var data = extractFromEmail(e);
  return buildJobCard(data);
}

// --- Action Handlers ---

function onLogin(e) {
  var formInputs = e.formInput;
  var email = formInputs.email || '';
  var password = formInputs.password || '';

  if (!email || !password) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Please fill in both fields'))
      .build();
  }

  var result = login(email, password);

  if (result.success) {
    // Navigate to homepage after login
    var card = onHomepage(e);
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(card))
      .setNotification(CardService.newNotification().setText('Logged in successfully'))
      .build();
  }

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(result.error))
    .build();
}

function onLogout(e) {
  logout();
  var card = buildLoginCard();
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card))
    .setNotification(CardService.newNotification().setText('Logged out'))
    .build();
}

function onTrackJob(e) {
  var formInputs = e.formInput;
  var params = e.parameters || {};

  var company = formInputs.company || '';
  var position = formInputs.position || '';
  var notes = formInputs.notes || '';

  if (!company || !position) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Company and position are required'))
      .build();
  }

  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  var payload = {
    company: company,
    position: position,
    url: params.url || '',
    source: 'other',
    applied_date: today,
    status: params.status || 'to_apply',
    notes: notes,
  };

  var result = apiFetch('/applications/', 'post', payload);

  if (result.code === 201 || result.code === 200) {
    // Link the email to the newly created application
    var appId = result.data.id;
    if (appId && params.messageId) {
      _linkEmailToApplication(appId, params);
    }
    var card = buildSuccessCard(company, position, params.url || '');
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(card))
      .setNotification(CardService.newNotification().setText('Application saved!'))
      .build();
  }

  var errorMsg = 'Failed to save';
  if (result.data && result.data.detail) {
    errorMsg = result.data.detail;
  } else if (result.data && result.data.non_field_errors) {
    errorMsg = result.data.non_field_errors.join(', ');
  } else if (result.error) {
    errorMsg = result.error;
  }

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(errorMsg))
    .build();
}

function onLinkEmail(e) {
  var params = e.parameters || {};
  var appId = params.applicationId;

  if (!appId) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('No application selected'))
      .build();
  }

  _linkEmailToApplication(parseInt(appId, 10), params);

  var statusMsg = 'Email linked';
  if (params.suggestedStatus) {
    statusMsg += ' (suggested: ' + params.suggestedStatus + ')';
  }

  var card = buildEmailLinkedCard(params.suggestedStatus, parseInt(appId, 10));
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card))
    .setNotification(CardService.newNotification().setText(statusMsg))
    .build();
}

function onApplySuggestedStatus(e) {
  var params = e.parameters || {};
  var appId = parseInt(params.applicationId, 10);
  var newStatus = params.suggestedStatus;

  if (!appId || !newStatus) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Missing parameters'))
      .build();
  }

  var result = apiFetch('/applications/' + appId + '/', 'patch', { status: newStatus });

  if (result.code === 200) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Status updated to: ' + newStatus))
      .build();
  }

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('Failed to update status'))
    .build();
}

function onSearchApplications(e) {
  var params = e.parameters || {};
  var company = params.subject || '';

  // Search for matching applications
  var searchQuery = '';
  if (company) {
    // Extract company from email data for better matching
    var senderEmail = params.senderEmail || '';
    var domain = senderEmail.split('@')[1] || '';
    if (domain && !domain.match(/gmail|yahoo|hotmail|outlook/i)) {
      searchQuery = domain.split('.')[0];
    }
  }

  var endpoint = '/applications/?page_size=10';
  if (searchQuery) {
    endpoint += '&search=' + encodeURIComponent(searchQuery);
  }

  var result = apiFetch(endpoint, 'get');

  if (result.code === 200 && result.data && result.data.results) {
    var card = buildSearchResultsCard(result.data.results, params);
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().pushCard(card))
      .build();
  }

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('Failed to load applications'))
    .build();
}

function _linkEmailToApplication(appId, params) {
  var emailPayload = {
    message_id: params.messageId || '',
    thread_id: params.threadId || '',
    subject: params.subject || '',
    sender_email: params.senderEmail || 'unknown@email.com',
    sender_name: params.senderName || '',
    email_type: params.emailType || 'general',
    snippet: params.snippet || '',
    suggested_status: params.suggestedStatus || '',
    received_at: params.receivedAt || new Date().toISOString(),
  };

  apiFetch('/applications/' + appId + '/emails/', 'post', emailPayload);
}
