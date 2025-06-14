const gallery = document.querySelector('.gallery');
const slides = document.querySelectorAll('.slide');
const dotsContainer = document.querySelector('.dots');
let currentIndex = 0;
let autoScrollInterval;

document.addEventListener('DOMContentLoaded', function() {
    // Функции для работы с модальным окном
    function openModal() {
        const modal = document.getElementById('modalOverlay');
        if (modal) {
            modal.style.display = 'flex';
        } else {
            console.error('Modal element not found');
        }
    }

    function closeModal() {
        const modal = document.getElementById('modalOverlay');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Обработчик отправки формы
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const review = document.getElementById('review').value.trim();

            if (!name || !review) {
                alert('Пожалуйста, заполните все поля');
                return;
            }

            try {
                const response = await fetch('/submit-review', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fio: name,
                        review_text: review
                    })
                });

                if (response.ok) {
                    alert('Спасибо за ваш отзыв!');
                    closeModal();
                    this.reset();
                } else {
                    alert('Произошла ошибка при отправке отзыва');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при отправке отзыва');
            }
        });
    }

    // Добавляем обработчик для кнопки "Оставить отзыв"
    const reviewButton = document.querySelector('.button3');
    if (reviewButton) {
        reviewButton.addEventListener('click', openModal);
    } else {
        console.error('Review button not found');
    }

    // Add close button functionality
    const closeButton = document.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
});




// Создаем индикаторы
slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    if(index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
});

// Функция переключения слайдов
function goToSlide(index) {
    currentIndex = index;
    gallery.style.transform = `translateX(-${index * 100}%)`;
    
    // Обновляем индикаторы
    document.querySelectorAll('.dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

// Стрелки
document.querySelector('.left-arrow').addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    goToSlide(currentIndex);
});

document.querySelector('.right-arrow').addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % slides.length;
    goToSlide(currentIndex);
});

// Автопрокрутка
function startAutoScroll() {
    autoScrollInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % slides.length;
        goToSlide(currentIndex);
    }, 5000);
}

// Остановка при наведении
gallery.parentElement.addEventListener('mouseenter', () => {
    clearInterval(autoScrollInterval);
});

gallery.parentElement.addEventListener('mouseleave', startAutoScroll);


 

// Запуск
startAutoScroll();





   