/**
 * ============================================================
 * Analytics & Visualization Script for Survey Data
 * ============================================================
 * 
 * This script adds a custom menu to your Google Sheet to generate
 * a visual dashboard with charts based on the survey responses.
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions -> Apps Script.
 * 3. Click the "+" next to "Files" and select "Script".
 * 4. Name it "Analytics".
 * 5. Paste this code into the new "Analytics.gs" file.
 * 6. Save (Ctrl+S).
 * 7. Refresh your Google Sheet. You will see a new menu: "📊 Аналитика Анкеты".
 * ============================================================
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Аналитика Анкеты')
    .addItem('Сгенерировать/Обновить Дашборд', 'generateDashboard')
    .addToUi();
}

/**
 * Main function to parse data and create/update the Dashboard sheet.
 */
function generateDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dataSheet = ss.getSheets()[0]; // Assumes first sheet contains raw data
  var dashboardName = 'Дашборд Аналитики';
  var dashSheet = ss.getSheetByName(dashboardName);
  
  // Create or Clear Dashboard sheet
  if (dashSheet) {
    dashSheet.clear(); 
    var charts = dashSheet.getCharts();
    for (var i = 0; i < charts.length; i++) {
       dashSheet.removeChart(charts[i]);
    }
  } else {
    dashSheet = ss.insertSheet(dashboardName, 1);
  }
  
  var data = dataSheet.getDataRange().getValues();
  if (data.length <= 1) {
    SpreadsheetApp.getUi().alert('Данных пока нет. Дождитесь хотя бы одного ответа!');
    return;
  }
  
  var headers = data[0];
  var rows = data.slice(1);
  var totalResponses = rows.length;
  
  // Dashboard Header Styling
  dashSheet.getRange('A1:B1').setValues([['МЕТРИКА', 'ЗНАЧЕНИЕ']])
    .setFontWeight('bold')
    .setBackground('#1a1a2e')
    .setFontColor('#d4a843')
    .setHorizontalAlignment('center');
  
  var currentRow = 2;
  dashSheet.getRange(currentRow, 1, 1, 2).setValues([['Всего получено ответов', totalResponses]]);
  currentRow += 2;
  
  // 1. AGE DISTRIBUTION
  var ageColIdx = headers.indexOf('1. Ваш возраст');
  if (ageColIdx > -1) {
    var ageCounts = {};
    rows.forEach(function(r) {
      var val = r[ageColIdx];
      if (val) ageCounts[val] = (ageCounts[val] || 0) + 1;
    });
    
    dashSheet.getRange(currentRow, 1).setValue('Распределение по возрасту').setFontWeight('bold');
    currentRow++;
    var ageStartRow = currentRow;
    for (var ageGroup in ageCounts) {
      dashSheet.getRange(currentRow, 1, 1, 2).setValues([[ageGroup, ageCounts[ageGroup]]]);
      currentRow++;
    }
    var ageEndRow = currentRow - 1;
    
    // Create Pie Chart
    if (ageEndRow >= ageStartRow) {
      var ageChart = dashSheet.newChart()
        .asPieChart()
        .addRange(dashSheet.getRange(ageStartRow, 1, ageEndRow - ageStartRow + 1, 2))
        .setOption('title', 'Возраст аудитории')
        .setOption('pieHole', 0.4) // Donut style
        .setOption('colors', ['#d4a843', '#1a1a2e', '#4b5d67', '#8d93ab'])
        .setPosition(2, 4, 0, 0)
        .build();
      dashSheet.insertChart(ageChart);
    }
    currentRow += 2;
  }
  
  // 2. FILM RATINGS COMPARISON (Bar Chart)
  dashSheet.getRange(currentRow, 1, 1, 2).setValues([['ФИЛЬМ (НОВАЯ ВЕРСИЯ)', 'СРЕДНЯЯ ОЦЕНКА (1-5)']])
    .setFontWeight('bold')
    .setBackground('#efefef');
  currentRow++;
  
  var filmRatingCols = [
    { label: 'А зори здесь тихие', header: '6. «А зори здесь тихие» — оценка (1-5)' },
    { label: 'Мастер и Маргарита', header: '7. «Мастер и Маргарита» — оценка (1-5)' },
    { label: 'Москва слезам не верит', header: '8. «Москва слезам не верит» — оценка (1-5)' },
    { label: 'Ну, погоди!', header: '9. «Ну, погоди!» — оценка (1-5)' },
    { label: 'Простоквашино', header: '10. «Простоквашино» — оценка (1-5)' },
    { label: 'Чебурашка', header: '11. «Чебурашка» — оценка (1-5)' },
    { label: 'Иван Васильевич', header: '12. «Иван Васильевич» — оценка (1-5)' }
  ];
  
  var ratingsStartRow = currentRow;
  filmRatingCols.forEach(function(film) {
    var idx = headers.indexOf(film.header);
    if (idx > -1) {
      var sum = 0, count = 0;
      rows.forEach(function(r) {
        var val = parseFloat(r[idx]);
        if (!isNaN(val) && val > 0) {
          sum += val;
          count++;
        }
      });
      var avg = count > 0 ? (sum / count).toFixed(2) : 0;
      dashSheet.getRange(currentRow, 1, 1, 2).setValues([[film.label, Number(avg)]]);
      currentRow++;
    }
  });
  var ratingsEndRow = currentRow - 1;
  
  // Create Column Chart for Ratings
  if (ratingsEndRow >= ratingsStartRow) {
    var ratingsChart = dashSheet.newChart()
      .asColumnChart()
      .addRange(dashSheet.getRange(ratingsStartRow, 1, ratingsEndRow - ratingsStartRow + 1, 2))
      .setOption('title', 'Средний рейтинг новых версий (1-5)')
      .setOption('vAxis', { minValue: 0, maxValue: 5 })
      .setOption('colors', ['#d4a843'])
      .setOption('legend', { position: 'none' })
      .setPosition(18, 4, 0, 0)
      .build();
    dashSheet.insertChart(ratingsChart);
  }
  
  // Cleanup Styling
  dashSheet.autoResizeColumns(1, 2);
  dashSheet.getRange(1, 1, currentRow-1, 2).setBorder(true, true, true, true, true, true, '#cccccc', SpreadsheetApp.BorderStyle.SOLID);
  
  SpreadsheetApp.getUi().alert('Анализ завершен! Дашборд обновлен на листе "' + dashboardName + '".');
}
