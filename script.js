/**
 * Survey Form Logic
 * - Step navigation with animations
 * - Progress bar updates
 * - Validation
 * - Data collection & submission to Google Sheets via Apps Script
 */

// ============================================================
// CONFIGURATION — Replace with your Google Apps Script Web App URL
// ============================================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyX-j0y8NxrkhkokCzhhHp-57Wetwz11SFuLsD3Xkxe18tJ7heXyXi_5NWn-s_FQ3Mv/exec';
// ============================================================

const TOTAL_STEPS = 11; // 0..10
let currentStep = 0;

// DOM elements
const form = document.getElementById('surveyForm');
const steps = document.querySelectorAll('.step');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressWrapper = document.getElementById('progressWrapper');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnSubmit = document.getElementById('btnSubmit');
const navButtons = document.getElementById('navButtons');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateNavButtons();
    updateProgress();
    initCheckboxLimits();
});

// ===== Step Navigation =====
function nextStep() {
    if (currentStep < TOTAL_STEPS - 1) {
        if (!validateStep(currentStep)) return;

        const currentEl = steps[currentStep];
        currentEl.style.animation = 'fadeSlideOut 0.3s ease-in forwards';

        setTimeout(() => {
            currentEl.classList.remove('active');
            currentEl.style.animation = '';

            currentStep++;
            const nextEl = steps[currentStep];
            nextEl.classList.add('active');
            nextEl.style.animation = 'fadeSlideIn 0.5s ease-out forwards';

            updateNavButtons();
            updateProgress();
            scrollToTop();
        }, 300);
    }
}

function prevStep() {
    if (currentStep > 0) {
        const currentEl = steps[currentStep];
        currentEl.style.animation = 'fadeSlideOut 0.3s ease-in forwards';

        setTimeout(() => {
            currentEl.classList.remove('active');
            currentEl.style.animation = '';

            currentStep--;
            const prevEl = steps[currentStep];
            prevEl.classList.add('active');
            prevEl.style.animation = 'fadeSlideIn 0.5s ease-out forwards';

            updateNavButtons();
            updateProgress();
            scrollToTop();
        }, 300);
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Update UI =====
function updateNavButtons() {
    // Welcome page (step 0): hide nav buttons (has its own "Start" button)
    // Thank You page (step 10): hide nav buttons
    const isWelcome = currentStep === 0;
    const isThankYou = currentStep === TOTAL_STEPS - 1;
    const isLastQuestion = currentStep === TOTAL_STEPS - 2;

    navButtons.style.display = (isWelcome || isThankYou) ? 'none' : 'flex';
    btnPrev.style.display = currentStep > 0 ? 'inline-flex' : 'none';
    btnNext.style.display = (!isLastQuestion && !isThankYou) ? 'inline-flex' : 'none';
    btnSubmit.style.display = isLastQuestion ? 'inline-flex' : 'none';

    // Hide progress on welcome and thank-you
    progressWrapper.style.display = (isWelcome || isThankYou) ? 'none' : 'block';
}

function updateProgress() {
    const progress = ((currentStep) / (TOTAL_STEPS - 1)) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${currentStep} / ${TOTAL_STEPS - 1}`;
}

// ===== Validation =====
function validateStep(stepIndex) {
    const stepEl = steps[stepIndex];
    const requiredGroups = stepEl.querySelectorAll('[data-required="true"]');
    let isValid = true;

    requiredGroups.forEach(group => {
        const questionBlock = group.closest('.question-block');
        const name = group.dataset.name;

        // Check radio groups and rating groups
        if (group.classList.contains('radio-group') || group.classList.contains('rating-group')) {
            const checked = group.querySelector('input[type="radio"]:checked');
            if (!checked) {
                questionBlock.classList.add('has-error');
                const msg = group.classList.contains('rating-group')
                    ? 'Пожалуйста, поставьте оценку'
                    : 'Пожалуйста, выберите один вариант';
                showError(questionBlock, msg);
                isValid = false;
            } else {
                questionBlock.classList.remove('has-error');
                hideError(questionBlock);
            }
        }

        // Check checkbox groups
        if (group.classList.contains('checkbox-group')) {
            const checked = group.querySelectorAll('input[type="checkbox"]:checked');
            if (checked.length === 0) {
                questionBlock.classList.add('has-error');
                showError(questionBlock, 'Пожалуйста, выберите хотя бы один вариант');
                isValid = false;
            } else {
                questionBlock.classList.remove('has-error');
                hideError(questionBlock);
            }
        }
    });

    if (!isValid) {
        // Scroll to first error
        const firstError = stepEl.querySelector('.has-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    return isValid;
}

function showError(block, message) {
    let errorEl = block.querySelector('.error-message');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        block.appendChild(errorEl);
    }
    errorEl.textContent = message;
}

function hideError(block) {
    const errorEl = block.querySelector('.error-message');
    if (errorEl) errorEl.remove();
}

// Clear error when user makes a selection
document.addEventListener('change', (e) => {
    if (e.target.type === 'radio' || e.target.type === 'checkbox') {
        const questionBlock = e.target.closest('.question-block');
        if (questionBlock) {
            questionBlock.classList.remove('has-error');
            hideError(questionBlock);
        }
    }
});

// ===== Checkbox Limit (for Q5) =====
function initCheckboxLimits() {
    document.querySelectorAll('.checkbox-group[data-max]').forEach(group => {
        const max = parseInt(group.dataset.max);
        const checkboxes = group.querySelectorAll('input[type="checkbox"]');

        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const checked = group.querySelectorAll('input[type="checkbox"]:checked');
                if (checked.length > max) {
                    cb.checked = false;
                    // Flash a hint
                    const block = group.closest('.question-block');
                    showError(block, `Можно выбрать не более ${max} вариантов`);
                    setTimeout(() => hideError(block), 2500);
                }
            });
        });
    });
}

// ===== Column name mapping (field → readable header) =====
const COLUMN_MAP = {
    'q1_age':            '1. Ваш возраст',
    'q2_watching':       '2. Смотрите ли советские фильмы?',
    'q3_attitude':       '3. Отношение к ремейкам',
    'q4_values':         '4. Ценности советского кино актуальны?',
    'q5_purpose':        '5. Цель создания ремейков',
    'q5_purpose_other':  '5. Другое (уточнение)',

    'q6_old':      '6. «А зори здесь тихие» — советская версия',
    'q6_new':      '6. «А зори здесь тихие» — новая версия',
    'q6_prefer':   '6. «А зори здесь тихие» — что понравилось больше',
    'q6_rating':   '6. «А зори здесь тихие» — оценка (1-5)',
    'q6_comment':  '6. «А зори здесь тихие» — комментарий',

    'q7_old':      '7. «Мастер и Маргарита» — советская версия',
    'q7_new':      '7. «Мастер и Маргарита» — новая версия',
    'q7_prefer':   '7. «Мастер и Маргарита» — что понравилось больше',
    'q7_rating':   '7. «Мастер и Маргарита» — оценка (1-5)',
    'q7_comment':  '7. «Мастер и Маргарита» — комментарий',

    'q8_old':      '8. «Москва слезам не верит» — советская версия',
    'q8_new':      '8. «Москва слезам не верит» — новая версия',
    'q8_prefer':   '8. «Москва слезам не верит» — что понравилось больше',
    'q8_rating':   '8. «Москва слезам не верит» — оценка (1-5)',
    'q8_comment':  '8. «Москва слезам не верит» — комментарий',

    'q9_old':      '9. «Ну, погоди!» — советская версия',
    'q9_new':      '9. «Ну, погоди!» — новая версия',
    'q9_prefer':   '9. «Ну, погоди!» — что понравилось больше',
    'q9_rating':   '9. «Ну, погоди!» — оценка (1-5)',
    'q9_comment':  '9. «Ну, погоди!» — комментарий',

    'q10_old':     '10. «Простоквашино» — советская версия',
    'q10_new':     '10. «Простоквашино» — новая версия',
    'q10_prefer':  '10. «Простоквашино» — что понравилось больше',
    'q10_rating':  '10. «Простоквашино» — оценка (1-5)',
    'q10_comment': '10. «Простоквашино» — комментарий',

    'q11_old':     '11. «Чебурашка» — советская версия',
    'q11_new':     '11. «Чебурашка» — новая версия',
    'q11_prefer':  '11. «Чебурашка» — что понравилось больше',
    'q11_rating':  '11. «Чебурашка» — оценка (1-5)',
    'q11_comment': '11. «Чебурашка» — комментарий',

    'q12_old':     '12. «Иван Васильевич» — советская версия',
    'q12_new':     '12. «Иван Васильевич» — новая версия',
    'q12_prefer':  '12. «Иван Васильевич» — что понравилось больше',
    'q12_rating':  '12. «Иван Васильевич» — оценка (1-5)',
    'q12_comment': '12. «Иван Васильевич» — комментарий',

    'q13_differences':  '13. Отличия старых и новых версий',
    'q13_other':        '13. Другое (уточнение)',
    'q14_values':       '14. Ценности в новых экранизациях',
};

// ===== Data Collection =====
function collectFormData() {
    const raw = {};

    // Collect all radio values
    const radios = form.querySelectorAll('input[type="radio"]:checked');
    radios.forEach(radio => {
        raw[radio.name] = radio.value;
    });

    // Collect all checkbox values
    const checkboxGroups = {};
    form.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        if (!checkboxGroups[cb.name]) checkboxGroups[cb.name] = [];
        checkboxGroups[cb.name].push(cb.value);
    });
    for (const [name, values] of Object.entries(checkboxGroups)) {
        raw[name] = values.join('; ');
    }

    // Collect text inputs and textareas
    form.querySelectorAll('textarea, input.inline-text').forEach(input => {
        if (input.value.trim()) {
            raw[input.name] = input.value.trim();
        }
    });

    // Map to readable column names
    const data = {};
    data['№ ответа'] = '';  // Will be set by Apps Script
    data['Дата и время'] = new Date().toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    // Add all fields in order using readable names
    for (const [fieldName, columnName] of Object.entries(COLUMN_MAP)) {
        data[columnName] = raw[fieldName] || '';
    }

    return data;
}

// ===== Form Submission =====
async function submitForm() {
    if (!validateStep(currentStep)) return;

    const data = collectFormData();

    // Check if Google Script URL is configured
    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        console.log('Survey data (Google Script not configured):', data);
        showThankYou();
        return;
    }

    // Show loading
    loadingOverlay.classList.add('show');

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        // no-cors mode always returns opaque response, so we assume success
        showThankYou();
    } catch (error) {
        console.error('Submission error:', error);
        alert('Произошла ошибка при отправке. Пожалуйста, попробуйте ещё раз.');
    } finally {
        loadingOverlay.classList.remove('show');
    }
}

function showThankYou() {
    const currentEl = steps[currentStep];
    currentEl.style.animation = 'fadeSlideOut 0.3s ease-in forwards';

    setTimeout(() => {
        currentEl.classList.remove('active');
        currentEl.style.animation = '';

        currentStep = TOTAL_STEPS - 1;
        steps[currentStep].classList.add('active');
        steps[currentStep].style.animation = 'fadeSlideIn 0.5s ease-out forwards';

        updateNavButtons();
        updateProgress();
        scrollToTop();
    }, 300);
}
