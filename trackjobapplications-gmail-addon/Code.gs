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
    url: '',
    source: 'other',
    applied_date: today,
    status: 'applied',
    notes: notes,
  };

  var result = apiFetch('/applications/', 'post', payload);

  if (result.code === 201 || result.code === 200) {
    var card = buildSuccessCard(company, position);
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
