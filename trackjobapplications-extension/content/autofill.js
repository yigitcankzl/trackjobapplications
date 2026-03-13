/**
 * TrackJobs Auto-Fill Content Script
 * Fuzzy form field matching + multi-framework filling
 * Injected programmatically via chrome.scripting.executeScript (activeTab)
 */

(function () {
  'use strict';

  if (window.__tjaAutofillInjected) return;
  window.__tjaAutofillInjected = true;

  // ==================== FIELD MAPPINGS ====================

  const FIELD_MAPPINGS = {
    firstName: {
      keywords: ['first', 'fname', 'given', 'forename', 'prénom', 'vorname'],
      patterns: [/\bfirst[_-]?name\b/i, /\bfname\b/i, /\bgiven[_-]?name\b/i, /\bforename\b/i, /\bfn\b/i, /\bprenom\b/i],
      excludePatterns: [/\blast\b/i, /\bsurname\b/i, /\bfamily\b/i],
      autocomplete: ['given-name'],
      inputTypes: ['text'],
      priority: 1,
    },
    lastName: {
      keywords: ['last', 'lname', 'surname', 'family', 'nom', 'nachname', 'apellido'],
      patterns: [/\blast[_-]?name\b/i, /\blname\b/i, /\bsurname\b/i, /\bfamily[_-]?name\b/i, /\bln\b/i, /\bnachname\b/i],
      excludePatterns: [/\bfirst\b/i, /\bgiven\b/i, /\bforename\b/i],
      autocomplete: ['family-name'],
      inputTypes: ['text'],
      priority: 2,
    },
    email: {
      keywords: ['email', 'e-mail', 'mail', 'courriel', 'correo'],
      patterns: [/\be[-_]?mail\b/i, /\bemail[_-]?addr/i, /\bcorreo/i],
      excludePatterns: [/\bconfirm/i, /\bverify/i, /\bretype/i, /\bre[-_]?enter/i, /\brecruiter/i, /\bmanager/i, /\bcontact.*email/i],
      autocomplete: ['email'],
      inputTypes: ['email', 'text'],
      priority: 3,
    },
    phone: {
      keywords: ['phone', 'tel', 'mobile', 'cell', 'téléphone', 'telefon', 'cellphone'],
      patterns: [/\bphone\b/i, /\btel(?:ephone)?\b/i, /\bmobile\b/i, /\bcell(?:phone)?\b/i, /\bphone[_-]?num/i, /\bmobile[_-]?num/i, /\bcontact[_-]?num/i],
      excludePatterns: [/\bfax\b/i],
      autocomplete: ['tel', 'tel-national', 'tel-local'],
      inputTypes: ['tel', 'text', 'number'],
      priority: 4,
    },
    location: {
      keywords: ['location', 'city', 'current location'],
      patterns: [/\blocation\b/i, /\bcity\b/i, /\bcurrent[_-]?location\b/i, /\bcity[_-]?state\b/i, /\bcity.*country/i],
      excludePatterns: [/\bstreet\b/i, /\bzip\b/i, /\bpostal\b/i, /\beligibl/i, /\bauthori[sz]/i, /\bsponsorship\b/i, /\blegally\b/i, /\bwork[_-]?permit\b/i, /\bright[_-]?to[_-]?work\b/i, /\bvisa\b/i, /\bethnicity\b/i, /\brace\b/i, /\bgender\b/i, /\bdisabilit/i, /\bveteran\b/i],
      autocomplete: ['address-level2'],
      inputTypes: ['text'],
      priority: 5,
    },
    linkedin: {
      keywords: ['linkedin', 'linked-in'],
      patterns: [/\blinked[-_]?in\b/i, /\bli[_-]?url\b/i, /\bli[_-]?profile\b/i],
      excludePatterns: [],
      autocomplete: [],
      inputTypes: ['url', 'text'],
      priority: 6,
    },
    github: {
      keywords: ['github'],
      patterns: [/\bgit[-_]?hub\b/i],
      excludePatterns: [],
      autocomplete: [],
      inputTypes: ['url', 'text'],
      priority: 7,
    },
    portfolio: {
      keywords: ['website', 'portfolio', 'personal site', 'homepage', 'blog'],
      patterns: [/\bwebsite\b/i, /\bportfolio\b/i, /\bpersonal[_-]?(?:site|url|page)\b/i, /\bhomepage\b/i, /\b(?:personal|your)[_-]?website\b/i],
      excludePatterns: [/\blinkedin\b/i, /\bgithub\b/i, /\btwitter\b/i, /\bfacebook\b/i, /\bcompany\b/i],
      autocomplete: ['url'],
      inputTypes: ['url', 'text'],
      priority: 8,
    },
    university: {
      keywords: ['school', 'university', 'college', 'institution', 'edu'],
      patterns: [/\bschool[_-]?name\b/i, /\buniversity\b/i, /\bcollege\b/i, /\binstitution\b/i, /\balma[_-]?mater\b/i, /\bschool\b/i],
      excludePatterns: [/\bhigh[_-]?school\b/i],
      autocomplete: [],
      inputTypes: ['text', 'select-one'],
      priority: 9,
    },
    degree: {
      keywords: ['degree', 'education level', 'qualification'],
      patterns: [/\bdegree\b/i, /\beducation[_-]?level\b/i, /\bqualification\b/i, /\bdegree[_-]?type\b/i],
      excludePatterns: [],
      autocomplete: [],
      inputTypes: ['text', 'select-one'],
      priority: 10,
    },
    gpa: {
      keywords: ['gpa', 'grade point', 'cgpa'],
      patterns: [/\bgpa\b/i, /\bgrade[_-]?point/i, /\bcgpa\b/i, /\bcumulative[_-]?gpa/i],
      excludePatterns: [],
      autocomplete: [],
      inputTypes: ['text', 'number'],
      priority: 11,
    },
    graduationYear: {
      keywords: ['graduation year', 'end year', 'completion year'],
      patterns: [/\bend[_-]?date[_-]?year\b/i, /\bgraduation[_-]?year\b/i, /\bend[_-]?year\b/i, /\bcompletion[_-]?year\b/i, /\byear[_-]?of[_-]?graduation\b/i],
      excludePatterns: [/\bstart\b/i, /\bbegin\b/i],
      autocomplete: [],
      inputTypes: ['text', 'number', 'select-one'],
      priority: 12,
    },
    workAuthorization: {
      keywords: ['authorized', 'authorization', 'eligible', 'legally'],
      patterns: [/\bauthori[sz]ed[_-]?to[_-]?work\b/i, /\bwork[_-]?authori[sz]/i, /\blegally[_-]?(?:authori[sz]|eligible|permitted)\b/i, /\beligibl(?:e|ity)[_-]?to[_-]?work\b/i, /\bright[_-]?to[_-]?work\b/i],
      excludePatterns: [],
      autocomplete: [],
      inputTypes: ['select-one', 'text'],
      priority: 13,
    },
    sponsorship: {
      keywords: ['sponsorship', 'visa', 'sponsor'],
      patterns: [/\bsponsorship\b/i, /\bvisa[_-]?sponsor/i, /\brequire[_-]?(?:visa|sponsorship)\b/i, /\bneed[_-]?(?:visa|sponsorship)\b/i, /\bimmigration[_-]?sponsor/i],
      excludePatterns: [],
      autocomplete: [],
      inputTypes: ['select-one', 'text'],
      priority: 14,
    },
    gender: {
      keywords: ['gender', 'sex'],
      patterns: [/\bgender\b/i, /\bsex\b/i, /\bgender[_-]?identity\b/i],
      excludePatterns: [],
      autocomplete: ['sex'],
      inputTypes: ['select-one', 'text'],
      priority: 15,
    },
    veteranStatus: {
      keywords: ['veteran', 'military', 'armed forces'],
      patterns: [/\bveteran\b/i, /\bvet[_-]?status\b/i, /\bmilitary[_-]?(?:status|service)\b/i, /\bprotected[_-]?veteran\b/i],
      excludePatterns: [],
      autocomplete: [],
      inputTypes: ['select-one', 'text'],
      priority: 16,
    },
    ethnicity: {
      keywords: ['ethnicity', 'race', 'ethnic'],
      patterns: [/\bethnicity\b/i, /\brace\b/i, /\bethnic\b/i, /\bracial\b/i, /\brace.*ethnicity\b/i],
      excludePatterns: [/\bhispanic\b/i, /\blatino\b/i],
      autocomplete: [],
      inputTypes: ['select-one', 'text'],
      priority: 17,
    },
    disabilityStatus: {
      keywords: ['disability', 'disabled'],
      patterns: [/\bdisabilit/i, /\bdisabled\b/i, /\bhandicap/i],
      excludePatterns: [],
      autocomplete: [],
      inputTypes: ['select-one', 'text'],
      priority: 18,
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
        const label = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
        if (label) sources.push(label.textContent);
      }

      // 2. Parent <label> wrapping
      const parentLabel = input.closest('label');
      if (parentLabel) sources.push(parentLabel.textContent);

      // 3. aria-label
      const ariaLabel = input.getAttribute('aria-label');
      if (ariaLabel) sources.push(ariaLabel);

      // 4. aria-labelledby (supports multiple IDs)
      const labelledBy = input.getAttribute('aria-labelledby');
      if (labelledBy) {
        const ids = labelledBy.split(/\s+/);
        for (const id of ids) {
          const labelEl = document.getElementById(id);
          if (labelEl) sources.push(labelEl.textContent);
        }
      }

      // 5. title attribute
      const title = input.getAttribute('title');
      if (title) sources.push(title);

      // 6. data-label attribute
      const dataLabel = input.getAttribute('data-label');
      if (dataLabel) sources.push(dataLabel);

      // 7. Previous siblings (search back up to 3)
      let sibling = input.previousElementSibling;
      let siblingChecks = 0;
      while (sibling && siblingChecks < 3) {
        if (['LABEL', 'SPAN', 'DIV', 'P', 'STRONG', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(sibling.tagName)) {
          const text = sibling.textContent.trim();
          if (text && text.length < 200) {
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
          '[class*="form-row"], [class*="input-group"], [data-field]'
        );
        if (container) {
          // Check legend for fieldsets
          const legend = container.querySelector('legend');
          if (legend && !legend.contains(input)) {
            sources.push(legend.textContent);
          }

          // Check label elements
          const labelEl = container.querySelector('label, [class*="label"], [class*="Label"]');
          if (labelEl && !labelEl.contains(input)) {
            sources.push(labelEl.textContent);
          }

          // Fallback: extract container text without form elements
          if (sources.length === 0) {
            const clone = container.cloneNode(true);
            clone.querySelectorAll('input, select, textarea, button, script, style, option, svg, [role="listbox"]').forEach((el) => el.remove());
            const text = clone.textContent.replace(/\s+/g, ' ').trim();
            if (text && text.length > 2 && text.length < 300) {
              sources.push(text);
            }
          }
        }
      }

      // 9. aria-describedby (lower priority, but useful)
      const describedBy = input.getAttribute('aria-describedby');
      if (describedBy) {
        const ids = describedBy.split(/\s+/);
        for (const id of ids) {
          const el = document.getElementById(id);
          if (el) {
            const text = el.textContent.trim();
            if (text.length < 200) sources.push(text);
          }
        }
      }

      return sources.join(' ').toLowerCase().trim();
    }

    static getAttributes(input) {
      return {
        id: (input.id || '').toLowerCase(),
        name: (input.name || '').toLowerCase(),
        placeholder: (input.placeholder || '').toLowerCase(),
        className: (typeof input.className === 'string' ? input.className : '').toLowerCase(),
        type: (input.type || '').toLowerCase(),
        autocomplete: (input.autocomplete || '').toLowerCase(),
        dataTestId: (input.getAttribute('data-testid') || input.getAttribute('data-test-id') || input.getAttribute('data-qa') || '').toLowerCase(),
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
      walkShadowRoots(document);

      // Same-origin iframes
      document.querySelectorAll('iframe').forEach((iframe) => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            iframeDoc.querySelectorAll('input, textarea, select').forEach((el) => inputs.add(el));
          }
        } catch (_) { /* cross-origin */ }
      });

      return Array.from(inputs);
    }
  }

  // ==================== FIELD MATCHER ====================

  class FieldMatcher {
    static calculateScore(input, mapping) {
      const attrs = DOMUtils.getAttributes(input);
      const labelText = DOMUtils.getLabelText(input);
      const allText = [attrs.id, attrs.name, attrs.placeholder, attrs.className, attrs.dataTestId, labelText].join(' ');

      let score = 0;

      // Exclude check
      for (const pattern of mapping.excludePatterns || []) {
        if (pattern.test(allText)) return 0;
      }

      // Autocomplete match (highest signal)
      for (const ac of mapping.autocomplete) {
        if (attrs.autocomplete === ac || attrs.autocomplete.includes(ac)) {
          score += 50;
          break;
        }
      }

      // Input type match
      if (mapping.inputTypes.includes(attrs.type)) {
        score += 10;
        // Exact semantic type match is very strong
        if (['email', 'tel', 'url'].includes(attrs.type) && attrs.type === mapping.inputTypes[0]) {
          score += 20;
        }
      }

      // Pattern matches (word boundary regex — most reliable)
      for (const pattern of mapping.patterns) {
        if (pattern.test(attrs.id)) { score += 35; break; }
        if (pattern.test(attrs.name)) { score += 30; break; }
        if (pattern.test(attrs.dataTestId)) { score += 30; break; }
        if (pattern.test(labelText)) { score += 35; break; }
        if (pattern.test(attrs.placeholder)) { score += 25; break; }
      }

      // Keyword matches (fuzzy — lower weight, use word boundaries)
      for (const keyword of mapping.keywords) {
        const kwRegex = new RegExp('\\b' + keyword.replace(/[-_]/g, '[-_]?') + '\\b', 'i');
        if (kwRegex.test(attrs.id) || kwRegex.test(attrs.name)) { score += 15; break; }
        if (kwRegex.test(labelText)) { score += 20; break; }
        if (kwRegex.test(attrs.placeholder)) { score += 10; break; }
        if (kwRegex.test(attrs.dataTestId)) { score += 15; break; }
      }

      return Math.min(score, 100);
    }

    static findBestMatch(fieldName, inputs, usedInputs) {
      const mapping = FIELD_MAPPINGS[fieldName];
      if (!mapping) return null;

      let bestMatch = null;
      let bestScore = 25; // Minimum threshold

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
      male: ['man', 'masculine', 'm', 'male'],
      female: ['woman', 'feminine', 'f', 'female'],
      man: ['male', 'm', 'man', 'masculine'],
      woman: ['female', 'f', 'woman', 'feminine'],
      'm': ['male', 'man', 'masculine'],
      'f': ['female', 'woman', 'feminine'],
      'non-binary': ['nonbinary', 'non binary', 'genderqueer', 'other', 'prefer to self-describe', 'non-binary'],
      'decline': ['decline to self-identify', "i don't wish to answer", 'prefer not to say', 'prefer not to answer', 'not specified', 'choose not to disclose', 'decline'],
      'decline to self-identify': ["i don't wish to answer", 'prefer not to say', 'prefer not to answer', 'decline', 'not specified'],
      "i don't wish to answer": ['decline to self-identify', 'prefer not to say', 'prefer not to answer', 'decline', 'not specified'],
      'prefer not to say': ['decline to self-identify', "i don't wish to answer", 'prefer not to answer', 'decline', 'not specified'],
      yes: ['y', 'true', '1', 'yes'],
      no: ['n', 'false', '0', 'no'],
      // Work authorization
      'authorized': ['yes', 'y', 'true', '1'],
      // Veteran
      'not a veteran': ['no', 'n', 'i am not a protected veteran', 'i am not a veteran'],
    };

    static setValue(element, value) {
      const originalValue = element.value;

      if (element.tagName === 'SELECT') {
        return this.setSelectValue(element, value);
      }

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;

      // Focus first
      element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      element.focus();

      // Set value using native setter (bypasses React/Angular getter/setter)
      if (element.tagName === 'INPUT' && nativeInputValueSetter) {
        nativeInputValueSetter.call(element, value);
      } else if (element.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(element, value);
      }

      element.value = value;
      element.setAttribute('value', value);

      // Reset React internal value tracker
      const tracker = element._valueTracker;
      if (tracker) tracker.setValue('');

      // Dispatch events for all frameworks
      this.dispatchEvents(element, value);

      // Blur
      element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

      return element.value !== originalValue || element.value === value;
    }

    static setSelectValue(selectEl, value) {
      const originalValue = selectEl.value;
      const valueLower = String(value).toLowerCase().trim();
      const options = Array.from(selectEl.options);

      // Filter out placeholder options
      const validOptions = options.filter((o) => o.value && o.value !== '' && !o.disabled);

      let match = null;

      // 1. Exact text match
      match = validOptions.find((o) => o.text.trim().toLowerCase() === valueLower);

      // 2. Exact value match
      if (!match) match = validOptions.find((o) => o.value.trim().toLowerCase() === valueLower);

      // 3. Option text contains value
      if (!match) match = validOptions.find((o) => o.text.trim().toLowerCase().includes(valueLower));

      // 4. Value contains option text (for short options like "Yes"/"No")
      if (!match) {
        match = validOptions.find((o) => {
          const optText = o.text.trim().toLowerCase();
          return optText.length > 1 && valueLower.includes(optText);
        });
      }

      // 5. Synonym matching (bidirectional)
      if (!match) {
        const synonyms = this.SYNONYMS[valueLower] || [];
        // Also check reverse: if any synonym key maps to our value
        const allSynonyms = new Set(synonyms);
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

      // 6. Fuzzy substring matching (last resort)
      if (!match) {
        let bestScore = 0;
        for (const opt of validOptions) {
          const optText = opt.text.trim().toLowerCase();
          const score = this.fuzzyScore(optText, valueLower);
          if (score > bestScore && score > 0.6) {
            bestScore = score;
            match = opt;
          }
        }
      }

      if (match) {
        selectEl.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
        selectEl.focus();
        selectEl.value = match.value;
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

      // Simple word overlap scoring
      const words1 = str1.split(/\s+/);
      const words2 = str2.split(/\s+/);
      let matchCount = 0;
      for (const w1 of words1) {
        if (words2.some((w2) => w1 === w2 || w1.includes(w2) || w2.includes(w1))) {
          matchCount++;
        }
      }
      return matchCount / Math.max(words1.length, words2.length);
    }

    static dispatchEvents(element, value) {
      const events = [
        new Event('input', { bubbles: true, cancelable: true }),
        new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: String(value) }),
        new Event('change', { bubbles: true, cancelable: true }),
      ];

      // Angular: ngModelChange
      try {
        const ngModel = element.getAttribute('ng-model') || element.getAttribute('data-ng-model');
        if (ngModel) {
          events.push(new CustomEvent('ngModelChange', { bubbles: true, detail: value }));
        }
      } catch (_) { /* ignore */ }

      // Keyboard events (helps some frameworks)
      events.push(
        new KeyboardEvent('keydown', { bubbles: true, key: 'a' }),
        new KeyboardEvent('keyup', { bubbles: true, key: 'a' }),
      );

      for (const event of events) {
        try {
          element.dispatchEvent(event);
        } catch (_) { /* ignore */ }
      }
    }

    static addVisualFeedback(element, success = true) {
      // Respect reduced motion preference
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

    const sortedFields = Object.entries(profile)
      .filter(([, value]) => value)
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

    return { filledCount, totalFields: sortedFields.length, filledFields };
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
