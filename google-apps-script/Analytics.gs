/**
 * ============================================================
 * Продвинутая Аналитика Анкеты (v2.0)
 * ============================================================
 * Этот скрипт строит подробные графики по КАЖДОМУ вопросу анкеты,
 * включая анализ чекбоксов (множественный выбор) и рейтингов.
 * 
 * ИНСТРУКЦИЯ:
 * 1. Вставьте этот код в файл Analytics.gs в редакторе Apps Script.
 * 2. Сохраните и обновите страницу таблицы.
 * 3. Нажмите "📊 Аналитика Анкеты" -> "Создать полный отчет".
 * ============================================================
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Аналитика Анкеты')
    .addItem('🚀 Создать полный отчет (Дашборд)', 'generateFullDashboard')
    .addToUi();
}

/**
 * Основная функция генерации дашборда
 * @param {boolean} isSilent - если true, не показывать алерты (для запуска в фоне)
 */
function generateFullDashboard(isSilent) {
  isSilent = isSilent === true; // гарантия типа boolean
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dataSheet = ss.getSheets()[0];
  var dashName = 'Полный Отчет';
  var dash = ss.getSheetByName(dashName) || ss.insertSheet(dashName, 1);
  
  dash.clear();
  var charts = dash.getCharts();
  charts.forEach(c => dash.removeChart(c));

  var data = dataSheet.getDataRange().getValues();
  if (data.length <= 1) {
    SpreadsheetApp.getUi().alert('Данных пока нет!');
    return;
  }

  var headers = data[0];
  var rows = data.slice(1);
  
  // Константы для оформления
  var CHART_WIDTH = 450;
  var CHART_HEIGHT = 300;
  var GRID_COLS = 2; // Графики в 2 колонки
  var chartCount = 0;
  
  // 1. Заголовок отчета
  dash.getRange('A1:E1').merge().setValue('ОТЧЕТ ПО РЕЗУЛЬТАТАМ ИССЛЕДОВАНИЯ КИНО')
    .setFontSize(18).setFontWeight('bold').setFontColor('#d4a843').setBackground('#1a1a2e')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  dash.setRowHeight(1, 50);

  // 2. Сводная статистика
  dash.getRange('A3:B3').setValues([['Показатель', 'Значение']]).setFontWeight('bold').setBackground('#efefef');
  dash.getRange('A4:B4').setValues([['Всего респондентов', rows.length]]);
  
  var dashRow = 7; // Начинаем выводить вспомогательные данные (скрытые или в стороне)
  var reportRow = 4; // Строка для позиционирования графиков (виртуальная)

  // Функция для отрисовки графика
  function addChartToGrid(title, statsData, type) {
    var startRow = dashRow;
    var numRows = statsData.length;
    if (numRows === 0) return;

    // Записываем данные для графика в "служебную" область (колонки AA, AB и далее)
    var statsCol = 27; // Колонка AA
    dash.getRange(startRow, statsCol, numRows, 2).setValues(statsData);
    var range = dash.getRange(startRow, statsCol, numRows, 2);
    
    var chartBuilder = dash.newChart();
    if (type === 'PIE') {
      chartBuilder.asPieChart().setOption('pieHole', 0.4);
    } else {
      chartBuilder.asColumnChart().setOption('legend', {position: 'none'});
    }

    // Позиционирование в сетке
    var gridPosX = (chartCount % GRID_COLS) * 8 + 1; // Колонки A=1, I=9...
    var gridPosY = Math.floor(chartCount / GRID_COLS) * 16 + 8;

    var chart = chartBuilder
      .addRange(range)
      .setOption('title', title)
      .setOption('colors', ['#d4a843', '#1a1a2e', '#4b5d67', '#8d93ab', '#d8d8d8'])
      .setPosition(gridPosY, gridPosX, 0, 0)
      .setOption('width', CHART_WIDTH)
      .setOption('height', CHART_HEIGHT)
      .build();

    dash.insertChart(chart);
    dashRow += numRows + 1;
    chartCount++;
  }

  // ОБРАБОТКА ВОПРОСОВ
  headers.forEach((header, idx) => {
    // Пропускаем технические поля (№ ответа, дата и время)
    if (idx < 2 || header.includes('комментарий') || header.includes('Другое')) return;

    var counts = {};
    var isCheckbox = (header.includes('Цель создания') || header.includes('Отличия старых'));
    var isRating = header.includes('оценка (1-5)');

    if (isCheckbox) {
      // Обработка чекбоксов (разделяем по запятой)
      rows.forEach(r => {
        var val = r[idx];
        if (val) {
          val.toString().split(',').forEach(item => {
            var clean = item.trim();
            if (clean) counts[clean] = (counts[clean] || 0) + 1;
          });
        }
      });
    } else {
      // Обычный выбор или рейтинг
      rows.forEach(r => {
        var val = r[idx];
        if (val !== undefined && val !== '') counts[val] = (counts[val] || 0) + 1;
      });
    }

    var stats = Object.keys(counts).map(k => [k, counts[k]]);
    // Сортируем для красоты (по убыванию если это не рейтинг)
    if (!isRating) {
       stats.sort((a, b) => b[1] - a[1]);
    } else {
       stats.sort((a, b) => a[0] - b[0]);
    }

    if (stats.length > 0) {
      var chartType = (stats.length > 5 || isCheckbox || isRating) ? 'BAR' : 'PIE';
      addChartToGrid(header, stats, chartType);
    }
  });

  // Скрываем служебные колонки с данными для графиков
  dash.hideColumns(27, 2); 
  
  dash.autoResizeColumns(1, 5);
  
  // Если запуск не "тихий" (через меню), то показываем уведомление
  if (!isSilent) {
    SpreadsheetApp.getUi().alert('🚀 Полный отчет готов! Создано графиков: ' + chartCount + '\nПроверьте лист "Полный Отчет".');
  }
}
