/**
 * TrackJobs Auto-Fill Content Script
 * Ported from JobPilot — fuzzy form field matching + multi-framework filling
 * Injected programmatically via chrome.scripting.executeScript (activeTab)
 */

(function () {
  'use strict';

  if (window.__tjaAutofillInjected) return;
  window.__tjaAutofillInjected = true;

  // ==================== FIELD MAPPINGS ====================

  const FIELD_MAPPINGS = {
    firstName: {
      keywords: ['first', 'fname', 'given', 'forename', 'prénom'],
      patterns: [/first[_-]?name/i, /fname/i, /given[_-]?name/i, /forename/i, /^fn$/i],
      excludePatterns: [/last/i, /surname/i, /family/i],
      autocomplete: ['given-name'],
      inputTypes: ['text'],
      priority: 1,
    },
    lastName: {
      keywords: ['last', 'lname', 'surname', 'family', 'nom'],
      patterns: [/last[_-]?name/i, /lname/i, /surname/i, /family[_-]?name/i, /^ln$/i],
      excludePatterns: [/first/i, /given/i, /forename/i],
      autocomplete: ['family-name'],
      inputTypes: ['text'],
      priority: 2,
    },
    email: {
      keywords: ['email', 'e-mail', 'mail', 'courriel'],
      patterns: [/e?-?mail/i, /email[_-]?addr/i],
      excludePatterns: [/confirm/i, /verify/i, /retype/i],
      autocomplete: ['email'],
      inputTypes: ['email', 'text'],
      priority: 3,
    },
    phone: {
      keywords: ['phone', 'tel', 'mobile', 'cell', 'contact', 'téléphone'],
      patterns: [/phone/i, /tel(?:ephone)?/i, /mobile/i, /cell/i, /contact[_-]?num/i],
      excludePatterns: [/fax/i, /work/i, /office/i],
      autocomplete: ['tel', 'tel-national', 'tel-local'],
      inputTypes: ['tel', 'text', 'number'],
      priority: 4,
    },
    location: {
      keywords: ['location', 'city', 'address', 'country', 'region', 'area', 'ville', 'lieu'],
      patterns: [/location/i, /city/i, /^address$/i, /current[_-]?location/i, /^loc$/i],
      excludePatterns: [/street/i, /zip/i, /postal/i, /state/i, /eligible/i, /authori[sz]/i, /sponsorship/i, /legally/i, /work permit/i, /right to work/i, /visa/i, /ethnicity/i, /race/i, /gender/i, /disability/i, /veteran/i, /hispanic/i],
      autocomplete: ['address-level2', 'locality'],
      inputTypes: ['text'],
      priority: 5,
    },
    linkedin: {
      keywords: ['linkedin', 'linked-in', 'linked in'],
      patterns: [/linked[_-]?in/i, /li[_-]?url/i, /li[_-]?profile/i],
      excludePatterns: [],
      autocomplete: [],
      inputTypes: ['url', 'text'],
      priority: 6,
    },
    github: {
      keywords: ['github', 'portfolio', 'git', 'repo', 'code'],
      patterns: [/github/i, /portfolio/i, /git[_-]?hub/i, /code[_-]?repo/i],
      excludePatterns: [],
      autocomplete: [],
      inputTypes: ['url', 'text'],
      priority: 7,
    },
    website: {
      keywords: ['website', 'web', 'site', 'homepage', 'personal', 'url', 'blog'],
      patterns: [/website/i, /personal[_-]?site/i, /homepage/i, /personal[_-]?url/i, /blog/i, /^url$/i],
      excludePatterns: [/linkedin/i, /github/i, /twitter/i, /facebook/i],
      autocomplete: ['url'],
      inputTypes: ['url', 'text'],
      priority: 8,
    },
    school: {
      keywords: ['school', 'university', 'college', 'institution'],
      patterns: [/school/i, /university/i, /college/i, /institution/i, /alma[_-]?mater/i],
      excludePatterns: [/high[_-]?school/i],
      autocomplete: [],
      inputTypes: ['text', 'select-one'],
      priority: 9,
    },
    degree: {
      keywords: ['degree', 'education level', 'qualification'],
      patterns: [/degree/i, /education[_-]?level/i, /qualification/i],
      excludePatterns: [],
      autocomplete: [],
      inputTypes: ['text', 'select-one'],
      priority: 10,
    },
    discipline: {
      keywords: ['discipline', 'major', 'field of study', 'specialization', 'subject', 'concentration'],
      patterns: [/discipline/i, /major/i, /field[_-]?of[_-]?study/i, /specializ/i, /concentration/i],
      excludePatterns: [],
      autocomplete: [],
      inputTypes: ['text', 'select-one'],
      priority: 11,
    },
    eduEndYear: {
      keywords: ['end date year', 'graduation year'],
      patterns: [/end[_-]?date[_-]?year/i, /graduation[_-]?year/i, /end[_-]?year/i, /completion[_-]?year/i],
      excludePatterns: [/start/i, /begin/i],
      autocomplete: [],
      inputTypes: ['text', 'number', 'select-one'],
      priority: 12,
    },
    gender: {
      keywords: ['gender', 'sex'],
      patterns: [/gender/i, /^sex$/i, /identify.*gender/i],
      excludePatterns: [],
      autocomplete: ['sex'],
      inputTypes: ['select-one', 'text'],
      priority: 13,
    },
    hispanicLatino: {
      keywords: ['hispanic', 'latino', 'latina', 'latinx'],
      patterns: [/hispanic/i, /latino/i, /latina/i, /latinx/i],
      excludePatterns: [],
      autocomplete: [],
      inputTypes: ['select-one', 'text'],
      priority: 14,
    },
    ethnicity: {
      keywords: ['ethnicity', 'race', 'ethnic'],
      patterns: [/ethnicity/i, /race/i, /ethnic/i, /racial/i],
      excludePatterns: [/hispanic/i, /latino/i],
      autocomplete: [],
      inputTypes: ['select-one', 'text'],
      priority: 15,
    },
    veteranStatus: {
      keywords: ['veteran', 'military', 'armed forces'],
      patterns: [/veteran/i, /military[_-]?status/i, /armed[_-]?forces/i],
      excludePatterns: [],
      autocomplete: [],
      inputTypes: ['select-one', 'text'],
      priority: 16,
    },
    disabilityStatus: {
      keywords: ['disability', 'disabled'],
      patterns: [/disability/i, /disabled/i, /handicap/i],
      excludePatterns: [],
      autocomplete: [],
      inputTypes: ['select-one', 'text'],
      priority: 17,
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
        element.type !== 'radio'
      );
    }

    static getLabelText(input) {
      const sources = [];

      if (input.id) {
        const label = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
        if (label) sources.push(label.textContent);
      }

      const parentLabel = input.closest('label');
      if (parentLabel) sources.push(parentLabel.textContent);

      if (input.getAttribute('aria-label')) {
        sources.push(input.getAttribute('aria-label'));
      }

      const labelledBy = input.getAttribute('aria-labelledby');
      if (labelledBy) {
        const labelEl = document.getElementById(labelledBy);
        if (labelEl) sources.push(labelEl.textContent);
      }

      const prevSibling = input.previousElementSibling;
      if (prevSibling && ['LABEL', 'SPAN', 'DIV'].includes(prevSibling.tagName)) {
        sources.push(prevSibling.textContent);
      }

      if (sources.length === 0) {
        const container = input.closest('div, fieldset, li, [class*="field"], [class*="question"], [class*="form-group"]');
        if (container) {
          const labelEl = container.querySelector('label, legend, [class*="label"]');
          if (labelEl && !labelEl.contains(input)) {
            sources.push(labelEl.textContent);
          }
          if (sources.length === 0) {
            const clone = container.cloneNode(true);
            clone.querySelectorAll('input, select, textarea, button, script, style, option, svg').forEach((el) => el.remove());
            const text = clone.textContent.trim();
            if (text && text.length > 2 && text.length < 200) {
              sources.push(text);
            }
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
        className: (input.className || '').toLowerCase(),
        type: (input.type || '').toLowerCase(),
        autocomplete: (input.autocomplete || '').toLowerCase(),
      };
    }
  }

  // ==================== FIELD MATCHER ====================

  class FieldMatcher {
    static calculateScore(input, mapping) {
      const attrs = DOMUtils.getAttributes(input);
      const labelText = DOMUtils.getLabelText(input);
      const allText = Object.values(attrs).join(' ') + ' ' + labelText;

      let score = 0;

      for (const pattern of mapping.excludePatterns || []) {
        if (pattern.test(allText)) return 0;
      }

      for (const ac of mapping.autocomplete) {
        if (attrs.autocomplete.includes(ac)) {
          score += 50;
          break;
        }
      }

      if (mapping.inputTypes.includes(attrs.type)) {
        score += 10;
        if (attrs.type === 'email' && mapping.inputTypes[0] === 'email') score += 20;
        if (attrs.type === 'tel' && mapping.inputTypes[0] === 'tel') score += 20;
        if (attrs.type === 'url' && mapping.inputTypes[0] === 'url') score += 20;
      }

      for (const pattern of mapping.patterns) {
        if (pattern.test(attrs.id)) score += 35;
        if (pattern.test(attrs.name)) score += 30;
        if (pattern.test(attrs.placeholder)) score += 25;
        if (pattern.test(labelText)) score += 35;
      }

      for (const keyword of mapping.keywords) {
        if (attrs.id.includes(keyword)) score += 15;
        if (attrs.name.includes(keyword)) score += 15;
        if (attrs.placeholder.includes(keyword)) score += 10;
        if (labelText.includes(keyword)) score += 20;
      }

      return Math.min(score, 100);
    }

    static findBestMatch(fieldName, inputs, usedInputs) {
      const mapping = FIELD_MAPPINGS[fieldName];
      if (!mapping) return null;

      let bestMatch = null;
      let bestScore = 20;

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
      male: ['man', 'masculine', 'm'],
      female: ['woman', 'feminine', 'f'],
      man: ['male', 'm'],
      woman: ['female', 'f'],
      'non-binary': ['nonbinary', 'non binary', 'genderqueer', 'other', 'prefer to self-describe'],
      'decline to self-identify': ["i don't wish to answer", 'prefer not to say', 'prefer not to answer', 'decline', 'not specified', 'choose not to disclose'],
      "i don't wish to answer": ['decline to self-identify', 'prefer not to say', 'prefer not to answer', 'decline', 'not specified'],
      yes: ['y', 'true', '1'],
      no: ['n', 'false', '0'],
    };

    static setValue(element, value) {
      const originalValue = element.value;

      if (element.tagName === 'SELECT') {
        return this.setSelectValue(element, value);
      }

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;

      element.focus();

      if (element.tagName === 'INPUT' && nativeInputValueSetter) {
        nativeInputValueSetter.call(element, value);
      } else if (element.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(element, value);
      }

      element.value = value;
      element.setAttribute('value', value);

      // Reset React value tracker
      const tracker = element._valueTracker;
      if (tracker) tracker.setValue('');

      this.dispatchEvents(element, value);
      element.blur();

      return element.value !== originalValue;
    }

    static setSelectValue(selectEl, value) {
      const originalValue = selectEl.value;
      const valueLower = value.toLowerCase().trim();
      const options = Array.from(selectEl.options);

      let match = options.find((o) => o.text.trim().toLowerCase() === valueLower);
      if (!match) match = options.find((o) => o.value.toLowerCase() === valueLower);
      if (!match) match = options.find((o) => o.text.trim().toLowerCase().includes(valueLower) && o.value);
      if (!match)
        match = options.find((o) => {
          const optText = o.text.trim().toLowerCase();
          return optText && optText !== '' && valueLower.includes(optText) && o.value;
        });
      if (!match) {
        const synonyms = this.SYNONYMS[valueLower] || [];
        for (const syn of synonyms) {
          match = options.find((o) => {
            const optText = o.text.trim().toLowerCase();
            return optText === syn || optText.includes(syn) || syn.includes(optText);
          });
          if (match) break;
        }
      }

      if (match) {
        selectEl.focus();
        selectEl.value = match.value;
        this.dispatchEvents(selectEl, match.value);
        selectEl.blur();
        return selectEl.value !== originalValue;
      }

      return false;
    }

    static dispatchEvents(element, value) {
      const events = [
        new Event('input', { bubbles: true, cancelable: true }),
        new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: value }),
        new Event('change', { bubbles: true, cancelable: true }),
        new FocusEvent('blur', { bubbles: true, cancelable: true }),
      ];

      for (const event of events) {
        try {
          element.dispatchEvent(event);
        } catch (e) {
          /* ignore */
        }
      }
    }

    static addVisualFeedback(element, success = true) {
      const originalBg = element.style.backgroundColor;
      element.style.transition = 'background-color 0.3s ease';
      element.style.backgroundColor = success ? '#d1fae5' : '#fee2e2';

      setTimeout(() => {
        element.style.backgroundColor = originalBg;
      }, 1500);
    }
  }

  // ==================== AUTO-FILL ORCHESTRATOR ====================

  function autoFill(profile) {
    const inputs = new Set();
    document.querySelectorAll('input, textarea, select').forEach((el) => inputs.add(el));

    // Also search inside iframes (same-origin only)
    try {
      document.querySelectorAll('iframe').forEach((iframe) => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            iframeDoc.querySelectorAll('input, textarea, select').forEach((el) => inputs.add(el));
          }
        } catch (e) {
          /* cross-origin */
        }
      });
    } catch (e) {
      /* ignore */
    }

    const inputArray = Array.from(inputs);
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
          const filled = FormFiller.setValue(match, value);
          if (filled || match.value === value) {
            usedInputs.add(match);
            filledCount++;
            filledFields.push(fieldName);
            FormFiller.addVisualFeedback(match, true);
          }
        } catch (error) {
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
