let appTitle = null;
let appPrefix = null;
let inclusions = [];
let exclusions = [];
let numQuestions = 0;
let passingPercentage = 0;
let timer;
let timeLeft;
let currentQuestionIndex = 0;
let questions = [];
let answers = [];
const questionData = {
    currentQuestionIndex: 0,
    questions: [],
    answers: []
}

async function loadConfigAndQuestions() {
    try {
        const configResponse = await fetch('config.json');
        const config = await configResponse.json();
        timeLeft = config.timerDuration * 60;
        numQuestions = config.maxNumQuestions;
        passingPercentage = config.passingPercentage;

        if (!config.disableTimer) {
            timer = setInterval(updateTimer, 1000);
            document.getElementById('reset-button').style.display = 'none';
        } else { // Timer disabled, values should be retreived from storage, if it exists
            document.getElementById('timer').style.display = 'none';
        }
        await retrieveAndSetQuestionData(config);

        displayTitle(appTitle);
        displayQuestion(currentQuestionIndex);
    } catch (error) {
        console.error('Error loading config or questions:', error);
        document.getElementById('timer').textContent = 'Error loading timer';
    }
}

window.onload = loadConfigAndQuestions;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function displayTitle(title) {
    document.getElementsByTagName('title')[0].textContent = title;
    document.getElementById('title').textContent = title;
}

function displayQuestion(index) {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = '';

    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    questionDiv.id = 'question-' + index; // Add an id attribute

    // Add a div to display the question index in the upper right-hand corner
    const questionIndexDiv = document.createElement('div');
    questionIndexDiv.className = 'question-index';
    questionIndexDiv.textContent = `ID: ${questions[index].id}`;
    questionDiv.appendChild(questionIndexDiv);

    // Check for image
    const imagePrefix = `${appPrefix}${questions[index].id}`; // Use template literals for better readability
    const imagePath = `assets/images/${imagePrefix}.jpg`;
    fetch(imagePath, { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                const img = document.createElement('img');
                img.src = imagePath;
                img.alt = 'Question Image';
                img.className = 'question-image';
                img.style.maxWidth = '50%'; // Restrict the size of the image
                img.style.maxHeight = '50%'; // Restrict the size of the image
                img.style.height = 'auto';
                questionDiv.prepend(img);
            }
        });

    const questionLabel = document.createElement('label');
    questionLabel.className = 'question-label';
    questionLabel.innerHTML = questions[index].question;
    questionDiv.appendChild(questionLabel);

    if (Array.isArray(questions[index].answer)) {
        // Render checkboxes for multiple answers
        questions[index].options.forEach((option, optionIndex) => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'question' + index;
            checkbox.value = option;
            checkbox.onclick = function () {
                if (!answers[index]) {
                    answers[index] = [];
                }
                if (checkbox.checked) {
                    answers[index].push(option);
                } else {
                    const optionIndex = answers[index].indexOf(option);
                    if (optionIndex > -1) {
                        answers[index].splice(optionIndex, 1);
                    }
                    // Remove background highlighting when checkbox is unchecked
                    setTimeout(() => {
                        checkboxLabel.classList.remove('correct', 'incorrect');
                    }, 0);
                }
                if (document.getElementById('showAnswersCheckbox').checked) {
                    highlightAnswer(index, option, optionIndex);
                }
            };

            const checkboxLabel = document.createElement('label');
            checkboxLabel.className = 'option-label';
            checkboxLabel.style.marginLeft = '10px';

            // Check for image answer
            const answerImagePath = `assets/images/${imagePrefix}_${String.fromCharCode(97 + optionIndex)}.jpg`;
            fetch(answerImagePath, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        const img = document.createElement('img');
                        img.src = answerImagePath;
                        img.alt = 'Answer Image';
                        img.className = 'answer-image';
                        img.style.maxWidth = '50%'; // Restrict the size of the image
                        img.style.maxHeight = '50%'; // Restrict the size of the image
                        img.style.height = 'auto';
                        checkboxLabel.innerHTML = `${option}<br>`;
                        checkboxLabel.appendChild(img);
                    } else {
                        checkboxLabel.textContent = option;
                        console.log(`Image not found for option ${optionIndex + 1} of question ${index + 1}`);
                    }
                    checkboxLabel.insertBefore(checkbox, checkboxLabel.firstChild);
                    questionDiv.appendChild(checkboxLabel);
                })
                .catch(() => {
                    checkboxLabel.textContent = option;
                    checkboxLabel.insertBefore(checkbox, checkboxLabel.firstChild);
                    questionDiv.appendChild(checkboxLabel);
                });
        });
    } else {
        // Render radio buttons for single answer
        questions[index].options.forEach((option, optionIndex) => {
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'question' + index;
            radio.value = option;
            radio.onclick = function () {
                answers[index] = option;
                if (document.getElementById('showAnswersCheckbox').checked) {
                    highlightAnswer(index, option, optionIndex);
                }
            };

            const radioLabel = document.createElement('label');
            radioLabel.className = 'option-label';
            radioLabel.style.marginLeft = '10px';

            // Check for image answer
            const answerImagePath = `assets/images/${imagePrefix}_${String.fromCharCode(97 + optionIndex)}.jpg`;
            fetch(answerImagePath, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        const img = document.createElement('img');
                        img.src = answerImagePath;
                        img.alt = 'Answer Image';
                        img.className = 'answer-image';
                        img.style.maxWidth = '50%'; // Restrict the size of the image
                        img.style.maxHeight = '50%'; // Restrict the size of the image
                        img.style.height = 'auto';
                        radioLabel.innerHTML = `${option}<br>`;
                        radioLabel.appendChild(img);
                    } else {
                        radioLabel.textContent = option;
                    }
                    radioLabel.insertBefore(radio, radioLabel.firstChild);
                    questionDiv.appendChild(radioLabel);
                })
                .catch(() => {
                    radioLabel.textContent = option;
                    radioLabel.insertBefore(radio, radioLabel.firstChild);
                    questionDiv.appendChild(radioLabel);
                });
        });
    }

    quizDiv.appendChild(questionDiv);

    if (index === questions.length - 1) {
        document.getElementById('next-button').style.display = 'none';
        document.getElementById('submit-button').style.display = 'inline';
    }
}

function highlightAnswer(questionIndex, selectedOption, selectedOptionIndex) {
    const questionDiv = document.getElementById('question-' + questionIndex); // Use the id to select the correct div
    const options = questionDiv.querySelectorAll('.option-label');

    options.forEach((option, index) => {
        // Remove previous highlights only if the option is not checked
        const inputElement = option.querySelector('input');
        if (!inputElement.checked) {
            option.classList.remove('correct', 'incorrect');
        }

        if (Array.isArray(questions[questionIndex].answer)) {
            // For multiple-answer questions, check if the selected option is in the correct answers array
            if (selectedOptionIndex === index) {
                if (questions[questionIndex].answer.includes(selectedOption)) {
                    option.classList.add('correct');
                } else {
                    option.classList.add('incorrect');
                }
            }
        } else {
            // For single-answer questions, check if the option is the correct answer
            if (selectedOptionIndex === index && questions[questionIndex].answer === selectedOption) {
                option.classList.add('correct');
            }
            if (selectedOptionIndex === index && selectedOption !== questions[questionIndex].answer) {
                option.classList.add('incorrect');
            }
        }
    });
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        storeQuestionData();
        displayQuestion(currentQuestionIndex);
    }
}

function updateTimer() {
    if (timeLeft <= 0) {
        clearInterval(timer);
        submitQuiz();
    } else {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('timer').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
}

function submitQuiz() {
    clearInterval(timer);

    let score = 0;
    let totalPossiblePoints = 0;
    let penaltyFactor = 0.5; // Adjust this to change the penalty severity

    questions.forEach((q, index) => {
        if (Array.isArray(q.answer)) {
            // Multiple-answer question logic
            let correctAnswers = q.answer; // List of correct answers
            let incorrectOptions = q.options.filter(option => !correctAnswers.includes(option)); // List of incorrect options
            let userSelections = Array.isArray(answers[index]) ? answers[index] : [];

            let correctCount = userSelections.filter(ans => correctAnswers.includes(ans)).length;
            let incorrectCount = userSelections.filter(ans => incorrectOptions.includes(ans)).length;

            totalPossiblePoints += correctAnswers.length;

            // Calculate score with penalty
            let questionScore = (correctCount / correctAnswers.length) * 100; // Base score
            let penalty = (incorrectCount * penaltyFactor * (100 / correctAnswers.length)); // Deduction based on incorrect answers

            let finalScore = Math.max(0, questionScore - penalty); // Ensure score does not go negative
            score += finalScore / 100 * correctAnswers.length; // Normalize score to match point system
        } else {
            // Single-answer question logic
            totalPossiblePoints++;
            if (answers[index] === q.answer) {
                score++;
            }
        }
    });

    const percentage = (score / totalPossiblePoints) * 100;
    document.getElementById('quiz').style.display = 'none';
    document.getElementById('next-button').style.display = 'none';
    document.getElementById('submit-button').style.display = 'none';
    document.getElementById('timer').style.display = 'none';
    document.getElementById('showAnswersCheckboxContainer').style.display = 'none';
    const result = document.getElementById('result');
    result.textContent = `You scored ${percentage.toFixed(2)}%`;
    result.style.display = 'block';

    // Change color based on passing percentage
    if (percentage >= passingPercentage) {
        result.style.color = 'green';
        result.textContent += ' - Passed';
    } else {
        result.style.color = 'red';
        result.textContent += ' - Failed';
    }
    localStorage.clear();
}

// Function to reset the test
function resetQuiz() {
    localStorage.clear();
    window.location.reload();
}

// Function to store current question and answered questions in localStorage
function storeQuestionData() {
    questionData.questions = questions;
    questionData.answers = answers;
    questionData.currentQuestionIndex = currentQuestionIndex;
    localStorage.setItem('questionData', JSON.stringify(questionData));
}

// Function to retrieve and set current question from localStorage
async function retrieveAndSetQuestionData(config) {
    const questionsResponse = await fetch(`data/${config.questionsSourceFile}`);
    const allQuestions = await questionsResponse.json();
    appTitle = allQuestions.appTitle;
    appPrefix = allQuestions.appPrefix;
    inclusions = allQuestions.inclusions;
    exclusions = allQuestions.exclusions;

    // Filter questions based on inclusions and exclusions, exclusions take precedence
    let filteredQuestions = allQuestions.questions.filter(question => {
        if (exclusions.length > 0 && exclusions.includes(question.id)) {
            return false;
        }

        return !(inclusions.length > 0 && !inclusions.includes(question.id));
    });

    const storedQuestionData = JSON.parse(localStorage.getItem('questionData'));

    if (config.disableTimer && storedQuestionData !== null) {
        questions = storedQuestionData.questions;
        answers = storedQuestionData.answers;
        currentQuestionIndex = storedQuestionData.currentQuestionIndex;
    } else {
        questions = config.shuffleQuestions ? shuffle(filteredQuestions).slice(0, numQuestions) : filteredQuestions.slice(0, numQuestions);
        answers = Array(questions.length).fill(null);
    }
}
