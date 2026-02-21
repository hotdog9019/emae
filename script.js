// script.js
document.addEventListener('DOMContentLoaded', function() {
    
    // === РАБОТА С ПОПАПАМИ ===
    
    // Получаем все элементы
    const openWindowBtn = document.getElementById('openWindowBtn');
    const windowPopup = document.getElementById('windowPopup');
    const closeWindowBtn = document.getElementById('closeWindowBtn');
    
    const swapMenuBtn = document.getElementById('swapMenuBtn');
    const swapPopup = document.getElementById('swapPopup');
    const closeSwapBtn = document.getElementById('closeSwapBtn');
    
    const cartBtn = document.getElementById('cartBtn');
    const cartPopup = document.getElementById('cartPopup');
    const closeCartBtn = document.getElementById('closeCartBtn');
    
    // Функция открытия попапа
    function openPopup(popup) {
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // запрещаем скролл
    }
    
    // Функция закрытия попапа
    function closePopup(popup) {
        popup.style.display = 'none';
        document.body.style.overflow = 'auto'; // разрешаем скролл
    }
    
    // Открытие по кнопкам
    if (openWindowBtn) {
        openWindowBtn.addEventListener('click', () => openPopup(windowPopup));
    }
    
    if (swapMenuBtn) {
        swapMenuBtn.addEventListener('click', () => openPopup(swapPopup));
    }
    
    if (cartBtn) {
        cartBtn.addEventListener('click', () => openPopup(cartPopup));
    }
    
    // Закрытие по крестикам
    if (closeWindowBtn) {
        closeWindowBtn.addEventListener('click', () => closePopup(windowPopup));
    }
    
    if (closeSwapBtn) {
        closeSwapBtn.addEventListener('click', () => closePopup(swapPopup));
    }
    
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => closePopup(cartPopup));
    }
    
    // Закрытие при клике на фон
    [windowPopup, swapPopup, cartPopup].forEach(popup => {
        popup.addEventListener('click', function(e) {
            if (e.target === this) {
                closePopup(this);
            }
        });
    });
    
    // === ДЛЯ МЕНЮ СО СВАПОМ ===
    const swapItems = document.querySelectorAll('.swap-item');
    swapItems.forEach(item => {
        item.addEventListener('click', function() {
            // Здесь можно добавить логику свапа
            console.log('Выбрано:', this.textContent);
            
            // Визуальная обратная связь
            this.style.backgroundColor = 'rgba(245, 179, 66, 0.2)';
            setTimeout(() => {
                this.style.backgroundColor = '';
            }, 200);
        });
    });
    
    // === СКАЧИВАНИЕ МЕНЮ ===
    const downloadBtn = document.querySelector('.btn-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function(e) {
            // Можно добавить аналитику или уведомление
            console.log('Скачивание меню...');
        });
    }
    
    console.log('Сайт Normando готов!');
});