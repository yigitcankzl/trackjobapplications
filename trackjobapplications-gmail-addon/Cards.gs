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

  // Email type detection banner
  if (emailData.emailType && emailData.emailType !== 'general') {
    var typeSection = CardService.newCardSection();
    var typeLabels = {
      'rejection': '🔴 Rejection Email Detected',
      'interview_invite': '🟢 Interview Invitation Detected',
      'offer': '🎉 Job Offer Detected',
    };
    typeSection.addWidget(
      CardService.newDecoratedText()
        .setText(typeLabels[emailData.emailType] || emailData.emailType)
        .setWrapText(true)
    );
    if (emailData.suggestedStatus) {
      typeSection.addWidget(
        CardService.newDecoratedText()
          .setText('Suggested status: ' + emailData.suggestedStatus)
          .setWrapText(true)
      );
    }
    card.addSection(typeSection);
  }

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
    senderName: emailData.senderName || '',
    messageId: emailData.messageId || '',
    threadId: emailData.threadId || '',
    url: emailData.url || '',
    snippet: (emailData.snippet || '').substring(0, 200),
    emailType: emailData.emailType || 'general',
    suggestedStatus: emailData.suggestedStatus || '',
    receivedAt: emailData.receivedAt || '',
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

  // Link to existing application section
  var linkSection = CardService.newCardSection();
  linkSection.setHeader('Link to Existing Application');
  linkSection.addWidget(
    CardService.newDecoratedText()
      .setText('Have an existing application? Search and link this email to it.')
      .setWrapText(true)
  );
  linkSection.addWidget(
    CardService.newTextButton()
      .setText('Search & Link')
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('onSearchApplications')
          .setParameters(actionParams)
      )
  );
  card.addSection(linkSection);

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

function buildSearchResultsCard(applications, emailParams) {
  var card = CardService.newCardBuilder();
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('Select Application')
      .setSubtitle('Link this email to an application')
  );

  if (!applications || applications.length === 0) {
    var emptySection = CardService.newCardSection();
    emptySection.addWidget(
      CardService.newDecoratedText()
        .setText('No applications found. Create a new one instead.')
        .setWrapText(true)
    );
    card.addSection(emptySection);
    return card.build();
  }

  var section = CardService.newCardSection();
  var count = Math.min(applications.length, 10);
  for (var i = 0; i < count; i++) {
    var app = applications[i];
    var linkParams = Object.assign({}, emailParams, {
      applicationId: String(app.id),
    });
    section.addWidget(
      CardService.newDecoratedText()
        .setText(app.company + ' — ' + app.position)
        .setBottomLabel(app.status + ' | ' + app.applied_date)
        .setWrapText(true)
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('onLinkEmail')
            .setParameters(linkParams)
        )
    );
  }

  card.addSection(section);
  return card.build();
}

function buildEmailLinkedCard(suggestedStatus, applicationId) {
  var card = CardService.newCardBuilder();
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('Email Linked!')
      .setSubtitle('Email has been linked to the application')
  );

  var section = CardService.newCardSection();
  section.addWidget(
    CardService.newDecoratedText()
      .setText('This email is now linked to your application.')
      .setWrapText(true)
  );

  if (suggestedStatus) {
    section.addWidget(
      CardService.newDecoratedText()
        .setText('Suggested status update: ' + suggestedStatus)
        .setWrapText(true)
    );
    section.addWidget(
      CardService.newTextButton()
        .setText('Apply Status: ' + suggestedStatus)
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#10b981')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('onApplySuggestedStatus')
            .setParameters({
              applicationId: String(applicationId),
              suggestedStatus: suggestedStatus,
            })
        )
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
