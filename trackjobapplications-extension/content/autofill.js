/**
 * TrackJobs Auto-Fill Content Script
 * Multi-strategy form field detection + framework-aware filling
 * Uses battle-tested patterns from Chromium & Firefox autofill heuristics
 * Injected programmatically via chrome.scripting.executeScript (activeTab)
 */

(function () {
  'use strict';

  if (window.__tjaAutofillInjected) return;
  window.__tjaAutofillInjected = true;

  // ==================== FIELD MAPPINGS ====================
  // Patterns derived from Chromium autofill_regex_constants.cc
  // and Firefox HeuristicsRegExp.sys.mjs

  const FIELD_MAPPINGS = {
    firstName: {
      // Chromium: first.*name|initials|fname|first$|given.*name|vorname|nombre|forename|prénom|prenom
      pattern: /first.*name|^first$|given.*name|fname|forename|prénom|prenom|vorname|nombre|initials/i,
      excludePattern: /last|surname|family|company|firm|full.?name/i,
      autocomplete: ['given-name'],
      inputTypes: ['text'],
      priority: 1,
    },
    lastName: {
      // Chromium: last.*name|lname|surname|last$|secondname|family.*name|nachname|apellidos?
      pattern: /last.*name|^last$|surname|family.*name|lname|nachname|apellidos?|cognome|secondname/i,
      excludePattern: /first|given|forename|company|maiden|full.?name/i,
      autocomplete: ['family-name'],
      inputTypes: ['text'],
      priority: 2,
    },
    email: {
      // Chromium: e.?mail|courriel|correo.*electr
      // Bitwarden: (^e-?mail$)|(^email-?address$)
      pattern: /e[-_.]?mail|courriel|correo|email[-_]?addr/i,
      excludePattern: /confirm|verify|retype|re[-_]?enter|recruiter.*email|manager.*email|hiring.*email/i,
      autocomplete: ['email'],
      inputTypes: ['email', 'text'],
      priority: 3,
    },
    phone: {
      // Chromium: (?<neg>phonetic)|phone|mobile|contact.?number|telefon|telefoon|numer.*telefonu
      pattern: /phone|mobile|contact.?number|tel(?:ephone)?|cell(?:phone)?|telefon|telefoon|numer.*telefonu|mobile.?num|phone.?num/i,
      excludePattern: /phonetic|fax/i,
      autocomplete: ['tel', 'tel-national', 'tel-local'],
      inputTypes: ['tel', 'text', 'number'],
      priority: 4,
    },
    location: {
      // Chromium city: city|town|\bort\b|stadt|suburb|ciudad|localidad|poblacion|ville
      pattern: /location|^city$|city.?state|current.?location|city.?country|town|\bort\b|stadt|ciudad|ville|where.?(?:are|do).?you|based.?in|your.?location/i,
      excludePattern: /street.?addr|zip.?code|postal.?code|^state$|province|job.?location|office.?location/i,
      autocomplete: ['address-level2'],
      inputTypes: ['text'],
      priority: 5,
    },
    linkedin: {
      pattern: /linked[-_.]?in|li[-_]?url|li[-_]?profile|linkedin.?url|linkedin.?profile/i,
      excludePattern: null,
      autocomplete: [],
      inputTypes: ['url', 'text'],
      priority: 6,
    },
    github: {
      pattern: /git[-_.]?hub|github.?url|github.?profile/i,
      excludePattern: null,
      autocomplete: [],
      inputTypes: ['url', 'text'],
      priority: 7,
    },
    portfolio: {
      pattern: /website|portfolio|personal.?(?:site|url|page|website)|homepage|^url$/i,
      excludePattern: /linkedin|github|twitter|facebook|company|job/i,
      autocomplete: ['url'],
      inputTypes: ['url', 'text'],
      priority: 8,
    },
    university: {
      // Greenhouse: school_name_id, school_name
      pattern: /school|university|college|institution|alma.?mater|school.?name/i,
      excludePattern: /high.?school/i,
      autocomplete: [],
      inputTypes: ['text', 'select-one'],
      priority: 9,
    },
    degree: {
      // Greenhouse: degree_id
      pattern: /degree|education.?level|qualification|degree.?type/i,
      excludePattern: null,
      autocomplete: [],
      inputTypes: ['text', 'select-one'],
      priority: 10,
    },
    gpa: {
      pattern: /\bgpa\b|grade.?point|cgpa|cumulative.?gpa/i,
      excludePattern: null,
      autocomplete: [],
      inputTypes: ['text', 'number'],
      priority: 11,
    },
    graduationYear: {
      // Greenhouse: end_date (year part)
      pattern: /graduation.?year|end.?(?:date.?)?year|completion.?year|year.?of.?graduation|grad.?year/i,
      excludePattern: /start|begin/i,
      autocomplete: [],
      inputTypes: ['text', 'number', 'select-one'],
      priority: 12,
    },
    workAuthorization: {
      pattern: /authori[sz]ed?.?to.?work|work.?authori[sz]|legally.?(?:authori[sz]|eligible|permitted)|eligib(?:le|ility).?to.?work|right.?to.?work|legally.?work/i,
      excludePattern: null,
      autocomplete: [],
      inputTypes: ['select-one', 'text'],
      priority: 13,
    },
    sponsorship: {
      pattern: /sponsorship|visa.?sponsor|require.?(?:visa|sponsorship)|need.?(?:visa|sponsorship)|immigration.?sponsor|future.?sponsor/i,
      excludePattern: null,
      autocomplete: [],
      inputTypes: ['select-one', 'text'],
      priority: 14,
    },
    gender: {
      pattern: /gender|^sex$|gender.?identity/i,
      excludePattern: null,
      autocomplete: ['sex'],
      inputTypes: ['select-one', 'text'],
      priority: 15,
    },
    veteranStatus: {
      pattern: /veteran|vet.?status|military.?(?:status|service)|protected.?veteran/i,
      excludePattern: null,
      autocomplete: [],
      inputTypes: ['select-one', 'text'],
      priority: 16,
    },
    ethnicity: {
      pattern: /ethnicity|^race$|ethnic|racial|race.?ethnicity/i,
      excludePattern: /hispanic|latino/i,
      autocomplete: [],
      inputTypes: ['select-one', 'text'],
      priority: 17,
    },
    disabilityStatus: {
      pattern: /disabilit|disabled|handicap/i,
      excludePattern: null,
      autocomplete: [],
      inputTypes: ['select-one', 'text'],
      priority: 18,
    },
  };

  // Composite/virtual fields — derived from profile data, not stored directly
  const COMPOSITE_FIELDS = {
    fullName: {
      pattern: /full.?name|^name$|your.?name|candidate.?name|applicant.?name|^legal.?name$/i,
      excludePattern: /first|last|surname|family|given|company|school|university|display|user|nick/i,
      autocomplete: ['name'],
      inputTypes: ['text'],
      priority: 0, // highest priority — match before first/last
      getValue: (profile) => {
        const parts = [profile.firstName, profile.lastName].filter(Boolean);
        return parts.join(' ') || null;
      },
    },
    currentCompany: {
      pattern: /current.?(?:company|employer|organization|organisation)|company.?name|employer|most.?recent.?(?:company|employer)|present.?(?:company|employer)|where.?do.?you.?(?:work|currently)/i,
      excludePattern: /hiring|job|apply|target|desired|preferred/i,
      autocomplete: ['organization'],
      inputTypes: ['text'],
      priority: 19,
      getValue: (profile) => profile.currentCompany || null,
    },
  };

  // ==================== DOM UTILITIES ====================

  class DOMUtils {
    static isVisible(element) {
      if (!element) return false;
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    static isInteractive(element) {
      return (
        !element.disabled &&
        !element.readOnly &&
        element.type !== 'hidden' &&
        element.type !== 'submit' &&
        element.type !== 'button' &&
        element.type !== 'file' &&
        element.type !== 'checkbox' &&
        element.type !== 'radio' &&
        element.type !== 'image' &&
        element.type !== 'reset'
      );
    }

    static getLabelText(input) {
      const sources = [];

      // 1. Explicit <label for="id">
      if (input.id) {
        try {
          const label = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
          if (label) sources.push(label.textContent);
        } catch (_) { /* invalid selector */ }
      }

      // 2. Parent <label> wrapping
      const parentLabel = input.closest('label');
      if (parentLabel) sources.push(parentLabel.textContent);

      // 3. aria-label
      const ariaLabel = input.getAttribute('aria-label');
      if (ariaLabel) sources.push(ariaLabel);

      // 4. aria-labelledby (supports space-separated IDs)
      const labelledBy = input.getAttribute('aria-labelledby');
      if (labelledBy) {
        for (const id of labelledBy.split(/\s+/)) {
          const el = document.getElementById(id);
          if (el) sources.push(el.textContent);
        }
      }

      // 5. title attribute
      const title = input.getAttribute('title');
      if (title) sources.push(title);

      // 6. data-label / data-field-label
      for (const attr of ['data-label', 'data-field-label', 'data-field-name']) {
        const val = input.getAttribute(attr);
        if (val) sources.push(val);
      }

      // 7. Previous siblings (search back up to 3)
      let sibling = input.previousElementSibling;
      let siblingChecks = 0;
      while (sibling && siblingChecks < 3) {
        if (['LABEL', 'SPAN', 'DIV', 'P', 'STRONG', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(sibling.tagName)) {
          const text = sibling.textContent.trim();
          if (text && text.length > 1 && text.length < 200) {
            sources.push(text);
            break;
          }
        }
        sibling = sibling.previousElementSibling;
        siblingChecks++;
      }

      // 8. Container label/legend search
      if (sources.length === 0) {
        const container = input.closest(
          'div, fieldset, li, section, article, ' +
          '[class*="field"], [class*="question"], [class*="form-group"], ' +
          '[class*="form-row"], [class*="input-group"], [data-field], [data-testid]'
        );
        if (container) {
          const legend = container.querySelector('legend');
          if (legend && !legend.contains(input)) sources.push(legend.textContent);

          const labelEl = container.querySelector('label, [class*="label"], [class*="Label"]');
          if (labelEl && !labelEl.contains(input)) sources.push(labelEl.textContent);

          if (sources.length === 0) {
            const clone = container.cloneNode(true);
            clone.querySelectorAll('input, select, textarea, button, script, style, option, svg, [role="listbox"]').forEach((el) => el.remove());
            const text = clone.textContent.replace(/\s+/g, ' ').trim();
            if (text && text.length > 1 && text.length < 300) sources.push(text);
          }
        }
      }

      // 9. aria-describedby
      const describedBy = input.getAttribute('aria-describedby');
      if (describedBy) {
        for (const id of describedBy.split(/\s+/)) {
          const el = document.getElementById(id);
          if (el) {
            const text = el.textContent.trim();
            if (text.length > 1 && text.length < 200) sources.push(text);
          }
        }
      }

      return sources.join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
    }

    static getSignals(input) {
      // Collect ALL text signals for matching
      return {
        id: (input.id || '').toLowerCase(),
        name: (input.name || '').toLowerCase(),
        placeholder: (input.placeholder || '').toLowerCase(),
        type: (input.type || '').toLowerCase(),
        autocomplete: (input.autocomplete || '').toLowerCase(),
        label: DOMUtils.getLabelText(input),
        dataAttrs: [
          input.getAttribute('data-testid'),
          input.getAttribute('data-test-id'),
          input.getAttribute('data-qa'),
          input.getAttribute('data-field-id'),
          input.getAttribute('data-field'),
          input.getAttribute('data-automation-id'),
        ].filter(Boolean).join(' ').toLowerCase(),
      };
    }

    static collectInputs() {
      const inputs = new Set();

      // Main document
      document.querySelectorAll('input, textarea, select').forEach((el) => inputs.add(el));

      // Shadow DOM (open roots only)
      const walkShadowRoots = (root) => {
        root.querySelectorAll('*').forEach((el) => {
          if (el.shadowRoot) {
            el.shadowRoot.querySelectorAll('input, textarea, select').forEach((input) => inputs.add(input));
            walkShadowRoots(el.shadowRoot);
          }
        });
      };
      try { walkShadowRoots(document); } catch (_) { /* ignore */ }

      // Same-origin iframes (recursive)
      const walkIframes = (doc) => {
        doc.querySelectorAll('iframe').forEach((iframe) => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              iframeDoc.querySelectorAll('input, textarea, select').forEach((el) => inputs.add(el));
              walkIframes(iframeDoc);
            }
          } catch (_) { /* cross-origin */ }
        });
      };
      walkIframes(document);

      return Array.from(inputs);
    }
  }

  // ==================== FIELD MATCHER ====================

  class FieldMatcher {
    /**
     * Multi-signal scoring: accumulates points from all matching signals
     * Unlike the previous version which broke on first match,
     * this version combines evidence from multiple sources.
     */
    static calculateScore(input, mapping) {
      const signals = DOMUtils.getSignals(input);
      const allText = [signals.id, signals.name, signals.placeholder, signals.label, signals.dataAttrs].join(' ');

      // Exclude check — test on all text at once
      if (mapping.excludePattern && mapping.excludePattern.test(allText)) return 0;

      let score = 0;
      const pattern = mapping.pattern;

      // 1. Autocomplete attribute (strongest standard signal — 60pts)
      for (const ac of mapping.autocomplete) {
        if (signals.autocomplete === ac || signals.autocomplete.includes(ac)) {
          score += 60;
          break;
        }
      }

      // 2. Input type match (semantic HTML — 10-30pts)
      if (mapping.inputTypes.includes(signals.type)) {
        score += 10;
        if (['email', 'tel', 'url'].includes(signals.type) && signals.type === mapping.inputTypes[0]) {
          score += 20;
        }
      }

      // 3. Pattern match on name attribute (most reliable after autocomplete — 40pts)
      //    ATS systems: first_name, last_name, email (Greenhouse)
      //    applicantFirstName, applicantEmail (Workday)
      //    _systemfield_email (Ashby)
      if (pattern.test(signals.name)) score += 40;

      // 4. Pattern match on id (35pts)
      if (pattern.test(signals.id)) score += 35;

      // 5. Pattern match on label text (35pts — very reliable for human-readable forms)
      if (pattern.test(signals.label)) score += 35;

      // 6. Pattern match on placeholder (25pts)
      if (pattern.test(signals.placeholder)) score += 25;

      // 7. Pattern match on data attributes (30pts — data-testid, data-qa, data-automation-id)
      if (pattern.test(signals.dataAttrs)) score += 30;

      return Math.min(score, 100);
    }

    static findBestMatch(fieldName, inputs, usedInputs) {
      const mapping = FIELD_MAPPINGS[fieldName] || COMPOSITE_FIELDS[fieldName];
      if (!mapping) return null;

      let bestMatch = null;
      let bestScore = 30; // Minimum confidence threshold

      for (const input of inputs) {
        if (usedInputs.has(input)) continue;
        if (!DOMUtils.isVisible(input)) continue;
        if (!DOMUtils.isInteractive(input)) continue;

        const score = this.calculateScore(input, mapping);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = input;
        }
      }

      return bestMatch;
    }
  }

  // ==================== FORM FILLER ====================

  class FormFiller {
    static SYNONYMS = {
      // Gender
      male: ['man', 'masculine', 'm', 'male'],
      female: ['woman', 'feminine', 'f', 'female'],
      man: ['male', 'm', 'masculine'],
      woman: ['female', 'f', 'feminine'],
      'm': ['male', 'man', 'masculine'],
      'f': ['female', 'woman', 'feminine'],
      'non-binary': ['nonbinary', 'non binary', 'genderqueer', 'other', 'prefer to self-describe', 'non-binary', 'x'],
      // Decline options
      'decline': ['decline to self-identify', "i don't wish to answer", 'prefer not to say', 'prefer not to answer', 'not specified', 'choose not to disclose', 'decline', 'i do not wish to self-identify'],
      'decline to self-identify': ["i don't wish to answer", 'prefer not to say', 'prefer not to answer', 'decline', 'not specified', 'i do not wish to self-identify'],
      'prefer not to say': ['decline to self-identify', "i don't wish to answer", 'prefer not to answer', 'decline', 'not specified', 'i do not wish to self-identify'],
      // Yes/No
      yes: ['y', 'true', '1', 'yes', 'si', 'oui', 'ja'],
      no: ['n', 'false', '0', 'no', 'non', 'nein'],
      // Veteran
      'not a veteran': ['no', 'n', 'i am not a protected veteran', 'i am not a veteran', 'i don\'t wish to answer'],
      // Ethnicity
      'white': ['caucasian', 'white (not hispanic or latino)', 'white'],
      'asian': ['asian (not hispanic or latino)', 'asian'],
      'black': ['black or african american', 'african american', 'black or african american (not hispanic or latino)'],
      'hispanic': ['hispanic or latino', 'latino', 'latina', 'latinx'],
      'two or more': ['two or more races', 'multiracial', 'mixed', 'two or more races (not hispanic or latino)'],
    };

    static setValue(element, value) {
      const originalValue = element.value;

      if (element.tagName === 'SELECT') {
        return this.setSelectValue(element, value);
      }

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;

      // Focus
      element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      element.focus();

      // Clear first (some React forms don't update if value is same)
      if (element.tagName === 'INPUT' && nativeInputValueSetter) {
        nativeInputValueSetter.call(element, '');
      } else if (element.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(element, '');
      }
      element.dispatchEvent(new Event('input', { bubbles: true }));

      // Set actual value using native setter (bypasses React/Angular getter/setter)
      if (element.tagName === 'INPUT' && nativeInputValueSetter) {
        nativeInputValueSetter.call(element, value);
      } else if (element.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(element, value);
      }

      element.value = value;
      element.setAttribute('value', value);

      // Reset React internal value tracker so React sees the change
      const tracker = element._valueTracker;
      if (tracker) tracker.setValue('');

      // Dispatch framework events
      this.dispatchEvents(element, value);

      // Blur
      element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

      return element.value !== originalValue || element.value === value;
    }

    static setSelectValue(selectEl, value) {
      const originalValue = selectEl.value;
      const valueLower = String(value).toLowerCase().trim();
      const options = Array.from(selectEl.options);

      // Filter out placeholder/disabled options
      const validOptions = options.filter((o) => {
        const v = o.value.trim();
        const t = o.text.trim().toLowerCase();
        return v && v !== '' && !o.disabled &&
          t !== '' && t !== '-- select --' && t !== 'select' &&
          t !== 'choose...' && t !== 'please select' && !t.startsWith('--');
      });

      let match = null;

      // 1. Exact text match
      match = validOptions.find((o) => o.text.trim().toLowerCase() === valueLower);

      // 2. Exact value match
      if (!match) match = validOptions.find((o) => o.value.trim().toLowerCase() === valueLower);

      // 3. Option text contains value
      if (!match) match = validOptions.find((o) => o.text.trim().toLowerCase().includes(valueLower));

      // 4. Value contains option text
      if (!match) {
        match = validOptions.find((o) => {
          const optText = o.text.trim().toLowerCase();
          return optText.length > 1 && valueLower.includes(optText);
        });
      }

      // 5. Synonym matching (bidirectional)
      if (!match) {
        const allSynonyms = new Set(this.SYNONYMS[valueLower] || []);
        for (const [key, vals] of Object.entries(this.SYNONYMS)) {
          if (vals.includes(valueLower)) allSynonyms.add(key);
        }

        for (const syn of allSynonyms) {
          match = validOptions.find((o) => {
            const optText = o.text.trim().toLowerCase();
            const optVal = o.value.trim().toLowerCase();
            return optText === syn || optVal === syn || optText.includes(syn);
          });
          if (match) break;
        }
      }

      // 6. Word overlap fuzzy matching
      if (!match) {
        let bestScore = 0;
        for (const opt of validOptions) {
          const optText = opt.text.trim().toLowerCase();
          const score = this.fuzzyScore(optText, valueLower);
          if (score > bestScore && score > 0.5) {
            bestScore = score;
            match = opt;
          }
        }
      }

      if (match) {
        selectEl.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
        selectEl.focus();

        // Use native setter for React selects
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
        if (nativeSetter) nativeSetter.call(selectEl, match.value);
        selectEl.value = match.value;

        // Reset React tracker
        const tracker = selectEl._valueTracker;
        if (tracker) tracker.setValue('');

        this.dispatchEvents(selectEl, match.value);
        selectEl.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
        return selectEl.value !== originalValue;
      }

      return false;
    }

    static fuzzyScore(str1, str2) {
      if (!str1 || !str2) return 0;
      if (str1 === str2) return 1;
      if (str1.includes(str2) || str2.includes(str1)) return 0.9;

      // Word overlap
      const words1 = str1.split(/[\s,_-]+/).filter(Boolean);
      const words2 = str2.split(/[\s,_-]+/).filter(Boolean);
      let matchCount = 0;
      for (const w1 of words1) {
        if (w1.length < 2) continue;
        if (words2.some((w2) => w2.length > 1 && (w1 === w2 || w1.includes(w2) || w2.includes(w1)))) {
          matchCount++;
        }
      }
      return matchCount / Math.max(words1.length, words2.length);
    }

    static dispatchEvents(element, value) {
      // Full event chain that Chrome autofill triggers
      const strVal = String(value);

      try { element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true })); } catch (_) {}
      try { element.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: strVal })); } catch (_) {}
      try { element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true })); } catch (_) {}

      // Angular support
      try {
        if (element.getAttribute('ng-model') || element.getAttribute('data-ng-model') || element.getAttribute('formcontrolname')) {
          element.dispatchEvent(new CustomEvent('ngModelChange', { bubbles: true, detail: strVal }));
        }
      } catch (_) {}

      // Keyboard events (helps Vue and some custom frameworks)
      try { element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Unidentified' })); } catch (_) {}
      try { element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Unidentified' })); } catch (_) {}
    }

    static addVisualFeedback(element, success = true) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const originalBg = element.style.backgroundColor;
      const originalTransition = element.style.transition;
      element.style.transition = 'background-color 0.3s ease';
      element.style.backgroundColor = success ? '#d1fae5' : '#fee2e2';
      setTimeout(() => {
        element.style.backgroundColor = originalBg;
        element.style.transition = originalTransition;
      }, 1500);
    }
  }

  // ==================== AUTO-FILL ORCHESTRATOR ====================

  function autoFill(profile) {
    const inputArray = DOMUtils.collectInputs();
    const usedInputs = new Set();
    let filledCount = 0;
    const filledFields = [];

    // 1. Try composite fields first (fullName, currentCompany)
    for (const [fieldName, mapping] of Object.entries(COMPOSITE_FIELDS)) {
      const value = mapping.getValue(profile);
      if (!value) continue;

      const match = FieldMatcher.findBestMatch(fieldName, inputArray, usedInputs);
      if (match) {
        try {
          const filled = FormFiller.setValue(match, String(value));
          if (filled) {
            usedInputs.add(match);
            filledCount++;
            filledFields.push(fieldName);
            FormFiller.addVisualFeedback(match, true);
          }
        } catch (_) {
          FormFiller.addVisualFeedback(match, false);
        }
      }
    }

    // 2. Regular profile fields (skip firstName/lastName if fullName was filled)
    const sortedFields = Object.entries(profile)
      .filter(([key, value]) => {
        if (!value) return false;
        // If fullName was already filled, skip individual first/last name
        if (filledFields.includes('fullName') && (key === 'firstName' || key === 'lastName')) return false;
        return true;
      })
      .sort((a, b) => {
        const priorityA = FIELD_MAPPINGS[a[0]]?.priority || 99;
        const priorityB = FIELD_MAPPINGS[b[0]]?.priority || 99;
        return priorityA - priorityB;
      });

    for (const [fieldName, value] of sortedFields) {
      const match = FieldMatcher.findBestMatch(fieldName, inputArray, usedInputs);
      if (match) {
        try {
          const filled = FormFiller.setValue(match, String(value));
          if (filled) {
            usedInputs.add(match);
            filledCount++;
            filledFields.push(fieldName);
            FormFiller.addVisualFeedback(match, true);
          }
        } catch (_) {
          FormFiller.addVisualFeedback(match, false);
        }
      }
    }

    return { filledCount, totalFields: sortedFields.length + Object.keys(COMPOSITE_FIELDS).length, filledFields };
  }

  // ==================== MESSAGE LISTENER ====================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUTOFILL') {
      const result = autoFill(message.profile);
      sendResponse(result);
    }
    return false;
  });
})();
