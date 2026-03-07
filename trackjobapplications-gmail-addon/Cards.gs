// --- Card UI Builders ---

function buildLoginCard() {
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader().setTitle('TrackJobApplications'));

  var section = CardService.newCardSection();
  section.setHeader('Login to your account');

  section.addWidget(
    CardService.newTextInput()
      .setFieldName('email')
      .setTitle('Email')
      .setHint('your@email.com')
  );

  section.addWidget(
    CardService.newTextInput()
      .setFieldName('password')
      .setTitle('Password')
      .setHint('********')
  );

  section.addWidget(
    CardService.newTextButton()
      .setText('Login')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor('#3b82f6')
      .setOnClickAction(CardService.newAction().setFunctionName('onLogin'))
  );

  card.addSection(section);
  return card.build();
}

function buildJobCard(emailData) {
  var card = CardService.newCardBuilder();
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('Track Job Application')
      .setSubtitle('Save this to your dashboard')
  );

  // Email info section
  var infoSection = CardService.newCardSection();
  infoSection.setHeader('Extracted Info');

  infoSection.addWidget(
    CardService.newTextInput()
      .setFieldName('company')
      .setTitle('Company')
      .setValue(emailData.company || '')
  );

  infoSection.addWidget(
    CardService.newTextInput()
      .setFieldName('position')
      .setTitle('Position')
      .setValue(emailData.position || '')
  );

  infoSection.addWidget(
    CardService.newTextInput()
      .setFieldName('notes')
      .setTitle('Notes')
      .setValue(emailData.notes || '')
      .setMultiline(true)
  );

  var actionParams = {
    subject: emailData.subject || '',
    senderEmail: emailData.senderEmail || '',
    messageId: emailData.messageId || '',
    url: emailData.url || '',
  };

  // Two buttons: Save (To Apply) and Mark as Applied
  infoSection.addWidget(
    CardService.newButtonSet()
      .addButton(
        CardService.newTextButton()
          .setText('Save (To Apply)')
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setBackgroundColor('#6366f1')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onTrackJob')
              .setParameters(Object.assign({}, actionParams, { status: 'to_apply' }))
          )
      )
      .addButton(
        CardService.newTextButton()
          .setText('Mark as Applied')
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setBackgroundColor('#3b82f6')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onTrackJob')
              .setParameters(Object.assign({}, actionParams, { status: 'applied' }))
          )
      )
  );

  card.addSection(infoSection);

  // Logout button
  var footerSection = CardService.newCardSection();
  footerSection.addWidget(
    CardService.newTextButton()
      .setText('Logout')
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(CardService.newAction().setFunctionName('onLogout'))
  );
  card.addSection(footerSection);

  return card.build();
}

function buildSuccessCard(company, position, url) {
  var card = CardService.newCardBuilder();
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('Saved!')
      .setSubtitle(position + ' at ' + company)
  );

  var section = CardService.newCardSection();
  section.addWidget(
    CardService.newDecoratedText()
      .setText('Application has been added to your dashboard.')
      .setWrapText(true)
  );

  if (url) {
    section.addWidget(
      CardService.newTextButton()
        .setText('Apply Now')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#10b981')
        .setOpenLink(CardService.newOpenLink().setUrl(url))
    );
  }

  card.addSection(section);
  return card.build();
}

function buildErrorCard(message) {
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader().setTitle('Error'));

  var section = CardService.newCardSection();
  section.addWidget(
    CardService.newDecoratedText()
      .setText(message)
      .setWrapText(true)
  );

  section.addWidget(
    CardService.newTextButton()
      .setText('Try Again')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor('#ef4444')
      .setOnClickAction(CardService.newAction().setFunctionName('onHomepage'))
  );

  card.addSection(section);
  return card.build();
}
