const DOM = {
    app: document.getElementById('app')
};

let state = {
    view: 'menu',
    mode: '',
    category: '',
    questions: [],
    currentIndex: 0,
    examAnswers: {},
    hasAnsweredCurrent: false
};

document.addEventListener('DOMContentLoaded', () => {
    // Basic verification
    if (typeof quizData === 'undefined') {
        DOM.app.innerHTML = `
            <div class="bg-red-900/30 text-red-500 p-6 rounded-xl border border-red-800 fade-in text-center shadow-lg">
                <i class="fa-solid fa-triangle-exclamation text-4xl mb-4"></i>
                <h2 class="text-xl font-bold mb-2 mono-font">BŁĄD KRYTYCZNY [ERR_01]</h2>
                <p>Brak połączenia z bazą danych (plik data.js nie załadowany).</p>
            </div>
        `;
        return;
    }

    // Safety processing of json values
    if (!quizData.pytania) quizData.pytania = [];

    renderMenu();
});

function getCategories() {
    const set = new Set();
    quizData.pytania.forEach(q => {
        if (q.dzial) set.add(q.dzial.trim());
    });
    return Array.from(set).sort();
}

function renderMenu() {
    state.view = 'menu';
    const categories = getCategories();

    let html = `
        <div class="bg-army-800 rounded-2xl shadow-2xl p-6 sm:p-10 fade-in border border-army-700/50">
            <h1 class="text-2xl sm:text-3xl font-black text-center text-stone-200 mb-2 mono-font tracking-wide">TERMINAL SZKOLENIOWY</h1>
            <p class="text-center text-army-400 mb-8 font-medium italic">Skonfiguruj parametry symulacji uderzeniowej.</p>
            
            <div class="mb-8 p-6 bg-army-900 rounded-xl border border-army-700">
                <label class="block text-sm font-bold text-army-300 mb-3 uppercase tracking-widest mono-font">
                    <i class="fa-solid fa-folder-tree mr-2 text-yellow-600/80"></i> Zakres operacyjny:
                </label>
                <div class="relative">
                    <select id="categorySelect" class="w-full border-army-600 rounded-lg py-3 px-4 appearance-none outline-none ring-2 ring-transparent focus:ring-army-400 focus:border-army-400 bg-army-800 text-stone-200 shadow-sm transition-all font-medium text-sm sm:text-base cursor-pointer">
                        <option value="ALL">PEŁNE SPEKTRUM (${quizData.pytania.length} pytań)</option>
                        ${categories.map(c => {
        const count = quizData.pytania.filter(q => q.dzial.trim() === c).length;
        return `<option value="${c}">${c} (${count} pytań)</option>`;
    }).join('')}
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-army-400">
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                </div>
            </div>
            
            <label class="block text-sm font-bold text-army-300 mb-4 px-2 uppercase tracking-widest text-center mono-font">
                Tryb symulacji
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onclick="startQuiz('training')" class="flex flex-col items-center justify-center p-6 border-2 border-army-700 rounded-xl hover:border-army-500 hover:bg-army-700/40 transition-all group shadow-md cursor-pointer">
                    <div class="w-16 h-16 bg-army-900/80 border border-army-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <i class="fa-solid fa-dumbbell text-2xl text-army-300 group-hover:text-stone-200 transition-colors"></i>
                    </div>
                    <span class="text-lg font-bold text-stone-200 mb-1 line-clamp-1 mono-font">TRENING TAKTYCZNY</span>
                    <span class="text-sm text-army-400 text-center font-medium leading-relaxed">Natychmiastowe raporty z poprawności. Idealny do kalibracji nowej wiedzy.</span>
                </button>
                
                <button onclick="startQuiz('exam')" class="flex flex-col items-center justify-center p-6 border-2 border-army-700 rounded-xl hover:border-yellow-700/50 hover:bg-yellow-900/10 transition-all group shadow-md cursor-pointer">
                    <div class="w-16 h-16 bg-army-900/80 border border-army-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <i class="fa-solid fa-stopwatch text-2xl text-yellow-600/80 group-hover:text-yellow-500 transition-colors"></i>
                    </div>
                    <span class="text-lg font-bold text-stone-200 mb-1 line-clamp-1 mono-font">EGZAMIN BOJOWY</span>
                    <span class="text-sm text-army-400 text-center font-medium leading-relaxed">System sprawdzający bez taryfy ulgowej. Raport końcowy na mecie.</span>
                </button>
            </div>
        </div>
    `;

    DOM.app.innerHTML = html;
}

function startQuiz(mode) {
    const categorySelect = document.getElementById('categorySelect');
    const category = categorySelect.value;

    let filteredQuestions = [];
    if (category === 'ALL') {
        filteredQuestions = [...quizData.pytania];
    } else {
        filteredQuestions = quizData.pytania.filter(q => q.dzial.trim() === category);
    }

    // Przetasowanie
    filteredQuestions.sort(() => Math.random() - 0.5);

    state = {
        view: 'quiz',
        mode: mode,
        category: category,
        questions: filteredQuestions,
        currentIndex: 0,
        examAnswers: {},
        hasAnsweredCurrent: false
    };

    // Bezpieczeństwo
    if (state.questions.length === 0) {
        alert("Pusty obszar operacyjny!");
        return;
    }

    renderQuiz();
}

function renderQuiz() {
    const q = state.questions[state.currentIndex];
    const total = state.questions.length;
    const progress = Math.max(0, Math.round(((state.currentIndex) / total) * 100));

    const isSingleFact = (q.odpowiedzi.length === 1);
    const isMultipleChoice = q.poprawne.length > 1;

    // Kiedy pytania mają 1 odpowiedź i to Tryb Egzaminu -> auto punktujemy.
    if (isSingleFact && state.mode === 'exam' && !state.examAnswers[state.currentIndex]) {
        state.examAnswers[state.currentIndex] = [0];
    }

    // Auto potwierdzenie w trybie treningu - bezpośrednie pójście dalej
    if (isSingleFact && state.mode === 'training') {
        state.hasAnsweredCurrent = true;
    }

    let answersHtml = '';

    if (isSingleFact) {
        answersHtml = `
            <div class="bg-blue-900/20 border-l-4 border-blue-600 p-5 rounded-r-xl my-8">
                <div class="flex items-start">
                    <i class="fa-solid fa-circle-info text-blue-500 text-xl mt-1 mr-4 shrink-0"></i>
                    <div>
                        <p class="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 mono-font">[ DANE WYWIADOWCZE ]</p>
                        <p class="text-stone-300 font-medium leading-relaxed text-lg">${q.odpowiedzi[0]}</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        answersHtml = `
            <div class="space-y-3 mt-8">
                ${q.odpowiedzi.map((ans, idx) => {
            let btnBaseStyling = "w-full text-left p-4 rounded-xl border-2 transition-all font-medium group flex items-start ";

            let isChecked = false;
            if (state.examAnswers[state.currentIndex] && state.examAnswers[state.currentIndex].includes(idx)) {
                isChecked = true;
            }

            const isAnsCorrect = q.poprawne.some(p => p.trim() === ans.trim());

            if (state.mode === 'training' && state.hasAnsweredCurrent) {
                btnBaseStyling += " cursor-default ";
                if (isChecked && isAnsCorrect) {
                    btnBaseStyling += " border-green-600 bg-green-900/30 text-green-400";
                } else if (isChecked && !isAnsCorrect) {
                    btnBaseStyling += " border-red-800/80 bg-red-900/20 text-red-400";
                } else if (!isChecked && isAnsCorrect) {
                    btnBaseStyling += " border-army-400 bg-army-700/50 text-stone-300";
                } else {
                    btnBaseStyling += " border-army-700/30 text-army-600 opacity-50";
                }
            } else {
                btnBaseStyling += " cursor-pointer ";
                if (isChecked) {
                    btnBaseStyling += " border-army-400 bg-army-700/60 text-stone-200 shadow-inner";
                } else {
                    btnBaseStyling += " border-army-700/60 text-stone-400 hover:border-army-500 hover:bg-army-700/30 hover:text-stone-200";
                }
            }

            let iconHtml = '';
            let iconWrapperClasses = "w-6 h-6 rounded-sm border-2 mr-4 mt-0.5 flex items-center justify-center shrink-0 transition-colors ";

            if (state.mode === 'training' && state.hasAnsweredCurrent) {
                if (isChecked && isAnsCorrect) {
                    iconWrapperClasses += " border-green-500 bg-green-600";
                    iconHtml = '<i class="fa-solid fa-check text-stone-100 text-xs"></i>';
                } else if (isChecked && !isAnsCorrect) {
                    iconWrapperClasses += " border-red-700 bg-red-700";
                    iconHtml = '<i class="fa-solid fa-xmark text-stone-100 text-xs"></i>';
                } else if (!isChecked && isAnsCorrect) {
                    iconWrapperClasses += " border-army-400 bg-army-400";
                    iconHtml = '<i class="fa-solid fa-check text-army-900 text-xs"></i>';
                } else {
                    iconWrapperClasses += " border-army-700/50";
                }
            } else {
                if (isChecked) {
                    iconWrapperClasses += " border-army-300 bg-army-500";
                    iconHtml = '<i class="fa-solid fa-check text-army-900 font-bold text-xs"></i>';
                } else {
                    iconWrapperClasses += " border-army-600 group-hover:border-army-400";
                }
            }

            return `
                        <button id="ans-btn-${idx}" onclick="handleAnswerClick(${idx})" class="${btnBaseStyling}" ${state.mode === 'training' && state.hasAnsweredCurrent ? 'disabled' : ''}>
                            <div class="${iconWrapperClasses}">
                                ${iconHtml}
                            </div>
                            <span class="leading-relaxed flex-1">${ans}</span>
                        </button>
                    `;
        }).join('')}
            </div>
        `;
    }

    const nextBtnText = state.currentIndex === total - 1
        ? ((state.mode === 'exam') ? 'GENERUJ RAPORT <i class="fa-solid fa-satellite-dish ml-2"></i>' : 'ZAKOŃCZ SESJĘ <i class="fa-solid fa-satellite-dish ml-2"></i>')
        : 'NASTĘPNY CEL <i class="fa-solid fa-angles-right ml-2 lg:ml-3"></i>';

    let nextDisabled = false;
    if (state.mode === 'training' && !state.hasAnsweredCurrent) {
        nextDisabled = true;
    }

    let progressColor = state.mode === 'training' ? 'bg-army-400' : 'bg-yellow-600/80';

    let verifyBtnHtml = '';
    if (state.mode === 'training' && isMultipleChoice && !state.hasAnsweredCurrent) {
        const arr = state.examAnswers[state.currentIndex] || [];
        const isAnySelected = arr.length > 0;
        verifyBtnHtml = `
            <button id="verifyBtn" onclick="verifyTrainingSelections()" ${!isAnySelected ? 'disabled' : ''} class="bg-blue-800 hover:bg-blue-700 text-stone-100 font-bold py-3 px-6 sm:px-8 rounded shadow-md border border-blue-600 transition-all disabled:opacity-30 disabled:hover:bg-blue-800 flex items-center group mono-font tracking-wider mr-2">
                WERYFIKUJ CEL <i class="fa-solid fa-shield-halved ml-2"></i>
            </button>
        `;
    }

    let html = `
        <div class="bg-army-800 rounded-2xl shadow-xl overflow-hidden fade-in relative border border-army-700/50">
            
            <!-- Widoczny pasek postępu (top) -->
            <div class="w-full bg-army-900 h-1.5">
                <div class="${progressColor} h-1.5 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(255,255,255,0.2)]" style="width: ${progress}%"></div>
            </div>

            <!-- Nagłówek -->
            <div class="bg-army-900/50 px-6 sm:px-8 py-4 border-b border-army-700 display flex justify-between items-center">
                <div class="flex items-center space-x-3">
                    <span class="px-3 py-1 bg-army-800 text-stone-300 text-xs font-bold uppercase tracking-wider rounded border border-army-600 mono-font">
                        ${state.mode === 'training' ? '<i class="fa-solid fa-dumbbell text-army-400 mr-2"></i>TRENING' : '<i class="fa-solid fa-stopwatch text-yellow-600/80 mr-2"></i>EGZAMIN'}
                    </span>
                    <span class="text-xs sm:text-sm font-bold text-army-400 mono-font tracking-widest">OBIEKT ${state.currentIndex + 1}/${total}</span>
                </div>
                <button onclick="quitQuiz()" class="text-army-500 hover:text-red-500 hover:bg-red-900/20 w-8 h-8 rounded shrink-0 flex items-center justify-center transition-colors" title="Przerwij Misję">
                    <i class="fa-solid fa-power-off text-sm"></i>
                </button>
            </div>
            
            <!-- Główna zawartość -->
            <div class="px-6 sm:px-10 py-8 lg:py-10 relative">
                <div class="absolute right-0 top-0 text-[100px] text-army-700/20 mr-4 mt-4 select-none pointer-events-none mono-font hidden sm:block">${state.currentIndex + 1}</div>
                
                <div class="flex items-center flex-wrap gap-3 mb-3">
                    <div class="text-[10px] font-bold text-army-500 uppercase tracking-widest mono-font flex items-center">
                        <i class="fa-solid fa-folder-open mr-2"></i> ${q.dzial}
                    </div>
                    ${isMultipleChoice ? `
                    <div class="text-[10px] font-bold text-blue-400 uppercase tracking-widest mono-font flex items-center bg-blue-900/30 px-2 py-1 rounded border border-blue-800/50">
                        <i class="fa-solid fa-list-check mr-2"></i> WIELOKROTNY WYBÓR
                    </div>
                    ` : ''}
                </div>

                <h2 class="text-xl sm:text-2xl font-bold text-stone-200 leading-snug whitespace-pre-line relative z-10">
                    <span class="text-army-500 font-medium mr-2 mono-font">#${q.id}</span>${q.pytanie}
                </h2>

                ${q.image ? `
                <div class="mt-6 mb-4 flex justify-center bg-army-900/40 p-2 rounded-xl border border-army-700/50 overflow-hidden shadow-inner group relative">
                    <img src="img/${q.image}" 
                         alt="FEEDS_INTEL" 
                         class="max-w-full h-auto max-h-[320px] object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.02] shadow-lg"
                         onerror="this.parentElement.innerHTML='<div class=\'p-4 text-army-500 italic text-[10px] mono-font opacity-60 flex items-center\'><i class=\'fa-solid fa-triangle-exclamation mr-2\'></i> [ SIGNAL LOST: BRAK PLIKU img/${q.image} ]</div>'">
                    <div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span class="bg-army-900/80 text-army-500 text-[8px] px-2 py-1 rounded mono-font border border-army-700 uppercase">intel_source: q_${q.id}</span>
                    </div>
                </div>
                ` : ''}

                <div class="relative z-10">
                    ${answersHtml}
                </div>
                
                <div class="mt-10 sm:mt-12 flex justify-between items-end flex-wrap gap-4 relative z-10 w-full pt-4 border-t border-army-700/30">
                    <button onclick="finishQuizEarly()" class="bg-army-800 hover:bg-red-900/60 text-stone-400 hover:text-stone-200 font-bold py-2.5 px-4 rounded shadow-sm border border-army-600 hover:border-red-700 transition-all flex items-center group mono-font tracking-wider text-xs whitespace-nowrap">
                        <i class="fa-solid fa-flag-checkered mr-2"></i> ZAKOŃCZ I PODSUMUJ
                    </button>
                    <div class="flex flex-wrap gap-4 ml-auto">
                        ${verifyBtnHtml}
                        <button id="nextBtn" onclick="nextQuestion()" ${nextDisabled ? 'disabled' : ''} class="bg-army-600 hover:bg-army-500 text-stone-100 font-bold py-3 px-6 sm:px-8 rounded shadow-md border border-army-500 transition-all disabled:opacity-30 disabled:hover:bg-army-600 disabled:cursor-not-allowed flex items-center group mono-font tracking-wider">
                            ${nextBtnText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    DOM.app.innerHTML = html;
}

function handleAnswerClick(idx) {
    if (state.mode === 'training') {
        if (state.hasAnsweredCurrent) return;
        selectTrainingAnswer(idx);
    } else {
        selectExamAnswer(idx);
    }
}

function selectTrainingAnswer(idx) {
    const q = state.questions[state.currentIndex];
    const isMultipleChoice = q.poprawne.length > 1;

    if (!state.examAnswers[state.currentIndex]) {
        state.examAnswers[state.currentIndex] = [];
    }

    if (isMultipleChoice) {
        const arr = state.examAnswers[state.currentIndex];
        if (arr.includes(idx)) {
            state.examAnswers[state.currentIndex] = arr.filter(i => i !== idx);
        } else {
            arr.push(idx);
        }
    } else {
        state.examAnswers[state.currentIndex] = [idx];
        state.hasAnsweredCurrent = true;
    }

    renderQuiz();
}

function verifyTrainingSelections() {
    state.hasAnsweredCurrent = true;
    renderQuiz();
}

function selectExamAnswer(idx) {
    if (!state.examAnswers[state.currentIndex]) {
        state.examAnswers[state.currentIndex] = [];
    }
    const q = state.questions[state.currentIndex];
    const isMultipleChoice = q.poprawne.length > 1;

    if (isMultipleChoice) {
        const arr = state.examAnswers[state.currentIndex];
        if (arr.includes(idx)) {
            state.examAnswers[state.currentIndex] = arr.filter(i => i !== idx);
        } else {
            arr.push(idx);
        }
    } else {
        state.examAnswers[state.currentIndex] = [idx];
    }
    renderQuiz();
}

function nextQuestion() {
    if (state.currentIndex < state.questions.length - 1) {
        state.currentIndex++;
        state.hasAnsweredCurrent = false;
        renderQuiz();
        window.scrollTo(0, 0);
    } else {
        finishQuiz();
    }
}

function quitQuiz() {
    if (confirm('UWAGA: Czy przerwać operację i zresetować pozycje? (Utracisz niezapisane postępy)')) {
        renderMenu();
    }
}

function finishQuiz() {
    renderSummary();
}

function finishQuizEarly() {
    if (confirm('Zakończyć symulację i wygenerować raport wyników tylko z przerobionych pytań?')) {
        let answeredCount = state.currentIndex;
        if (state.hasAnsweredCurrent || (state.mode === 'exam' && state.examAnswers[state.currentIndex] && state.examAnswers[state.currentIndex].length > 0) || (state.mode === 'exam' && state.questions[state.currentIndex].odpowiedzi.length === 1)) {
            answeredCount++;
        }

        if (answeredCount === 0) {
            renderMenu();
        } else {
            state.questions = state.questions.slice(0, answeredCount);
            renderSummary();
        }
    }
}

function renderSummary() {
    let score = 0;
    const errorsList = [];

    state.questions.forEach((q, idx) => {
        if (q.odpowiedzi.length === 1) {
            score++;
            return;
        }

        const userSelectedIndices = state.examAnswers[idx] || [];

        if (userSelectedIndices.length === 0) {
            errorsList.push({ question: q, userAns: null });
            return;
        }

        let allCorrect = true;
        const selectedTexts = userSelectedIndices.map(i => q.odpowiedzi[i].trim());
        const correctTexts = q.poprawne.map(p => p.trim());

        if (selectedTexts.length !== correctTexts.length) {
            allCorrect = false;
        } else {
            for (let text of selectedTexts) {
                if (!correctTexts.includes(text)) {
                    allCorrect = false;
                    break;
                }
            }
        }

        if (allCorrect) {
            score++;
        } else {
            errorsList.push({ question: q, userAns: selectedTexts.map(s => `- ${s}`).join('<br>') });
        }
    });

    const total = state.questions.length;
    const percent = Math.round((score / total) * 100);

    let colorBadge = 'bg-army-600';
    let iconClass = 'fa-medal';
    if (percent < 50) {
        colorBadge = 'bg-red-900/60';
        iconClass = 'fa-skull';
    }
    else if (percent < 75) {
        colorBadge = 'bg-yellow-800/80';
        iconClass = 'fa-shield-halved';
    }

    let errorsHtml = '';
    if (errorsList.length > 0) {
        errorsHtml = `
            <div class="mt-12 bg-army-900/50 border border-army-700/50 rounded-xl p-6 sm:p-8">
                <h3 class="text-xl font-bold text-stone-300 mb-6 flex items-center mono-font tracking-wide">
                    <i class="fa-solid fa-list-check text-army-500 mr-3"></i> RAPORT BŁĘDÓW OPERACYJNYCH:
                </h3>
                <div class="space-y-6">
                    ${errorsList.map((err, i) => `
                        <div class="bg-army-800 border border-army-700 rounded p-5 shadow-sm">
                            <h4 class="font-bold text-stone-200 mb-4 whitespace-pre-line leading-relaxed">${i + 1}. <span class="text-army-500 font-medium mr-1 mono-font">#${err.question.id}</span> ${err.question.pytanie}</h4>
                            
                            <div class="mb-4 bg-army-900/40 p-3 rounded border-l-2 border-red-700/60">
                                <span class="text-[10px] font-bold text-army-400 uppercase tracking-widest block mb-2 mono-font">Zanotowana odpowiedź układu:</span>
                                <div class="flex items-start">
                                    <i class="fa-solid fa-xmark text-red-500 mt-1 mr-3"></i>
                                    <span class="text-sm text-stone-400 font-medium">${err.userAns === null ? 'BRAK DANYCH (OMINIĘTO)' : err.userAns}</span>
                                </div>
                            </div>
                            
                            <div class="bg-green-900/10 p-3 rounded border-l-2 border-green-600/50">
                                <span class="text-[10px] font-bold text-army-400 uppercase tracking-widest block mb-2 mono-font">Odpowiedź prawidła (protokół):</span>
                                <div class="flex items-start">
                                    <i class="fa-solid fa-check text-green-500 mt-1 mr-3"></i>
                                    <span class="text-sm text-green-400 font-bold">${err.question.poprawne.join('<br>')}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    DOM.app.innerHTML = `
        <div class="bg-army-800 rounded-2xl shadow-2xl overflow-hidden fade-in border border-army-700/50">
            <!-- Header Result -->
            <div class="${colorBadge} px-6 py-12 text-center text-stone-100 relative shadow-inner">
                <div class="absolute w-full h-full inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMiIgZmlsbD0iI2ZmZiI+PC9jaXJjbGU+Cjwvc3ZnPg==')]"></div>
                <i class="fa-solid ${iconClass} text-6xl mb-6 relative z-10 text-stone-200"></i>
                <h2 class="text-3xl font-black mb-2 relative z-10 mono-font tracking-wider">RAPORT KOŃCOWY MISJI</h2>
                <p class="text-stone-300 font-medium relative z-10 uppercase tracking-widest text-sm">${state.category === 'ALL' ? 'PEŁEN ZAKRES OPERACYJNY' : state.category}</p>
            </div>
            
            <div class="px-6 sm:px-10 py-10 relative">
                <!-- Score Number -->
                <div class="flex flex-col items-center mb-6">
                    <div class="text-7xl font-black text-stone-200 tracking-tighter mb-4 mono-font">${percent}<span class="text-4xl text-army-500">%</span></div>
                    <div class="inline-flex items-center space-x-3 bg-army-900 border border-army-700 px-5 py-2.5 rounded shadow-inner font-bold text-stone-300 mono-font text-sm">
                        <span>SUKCES: <span class="text-green-500">${score}</span></span>
                        <span class="text-army-600">/</span>
                        <span>CELE: <span class="text-stone-300">${total}</span></span>
                    </div>
                </div>
                
                ${errorsHtml}
                
                <div class="mt-12 text-center pb-4">
                    <button onclick="renderMenu()" class="bg-army-700 hover:bg-army-600 border border-army-500 text-stone-200 font-bold py-4 px-10 rounded shadow transition-all group inline-flex items-center mono-font tracking-widest uppercase">
                        <i class="fa-solid fa-terminal mr-3 group-hover:-translate-x-1 transition-transform"></i> WRÓĆ DO TERMINALA
                    </button>
                </div>
            </div>
        </div>
    `;
    window.scrollTo(0, 0);
}
