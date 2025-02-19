let questions = [];
let numQuestions = 0;
let passingPercentage = 0;
let currentQuestionIndex = 0;
let timer;
let timeLeft;
let answers = [];

async function loadConfigAndQuestions() {
    try {
        const configResponse = await fetch('config.json');
        const config = await configResponse.json();
        timeLeft = config.timerDuration * 60;
        numQuestions = config.maxNumQuestions;
        passingPercentage = config.passingPercentage;

        const questionsResponse = await fetch(`questions-source/${config.questionsSourceFile}`);
        const allQuestions = await questionsResponse.json();

        // Shuffle the questions and load only the specified number of questions
        questions = shuffle(allQuestions.questions).slice(0, numQuestions);
        answers = Array(questions.length).fill(null);

        displayTitle(allQuestions.appTitle);
        displayQuestion(currentQuestionIndex);
        timer = setInterval(updateTimer, 1000);
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
    document.getElementById('title').textContent = title;
}

function displayQuestion(index) {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = '';

    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    questionDiv.id = 'question-' + index; // Add an id attribute

    const questionLabel = document.createElement('label');
    questionLabel.className = 'question-label';
    questionLabel.textContent = (index + 1) + '. ' + questions[index].question;
    questionDiv.appendChild(questionLabel);

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
        radioLabel.textContent = option;
        radioLabel.insertBefore(radio, radioLabel.firstChild);

        questionDiv.appendChild(radioLabel);
    });

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
        option.classList.remove('correct', 'incorrect'); // Remove previous highlights
        if (questions[questionIndex].answer === option.textContent.trim()) {
            option.classList.add('correct');
        }
        if (selectedOptionIndex === index && selectedOption !== questions[questionIndex].answer) {
            option.classList.add('incorrect');
        }
    });
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
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
    questions.forEach((q, index) => {
        if (answers[index] === q.answer) {
            score++;
        }
    });

    const percentage = (score / questions.length) * 100;
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
}