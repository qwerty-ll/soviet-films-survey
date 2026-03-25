/**
 * ============================================================
 * Google Apps Script для приёма данных из анкеты
 * ============================================================
 * 
 * ИНСТРУКЦИЯ ПО НАСТРОЙКЕ:
 * 
 * 1. Создайте новую Google Таблицу (Google Sheets):
 *    https://sheets.google.com → "Создать таблицу"
 * 
 * 2. Откройте редактор скриптов:
 *    Расширения → Apps Script
 * 
 * 3. Удалите весь код по умолчанию и вставьте код ниже
 *    (начиная со строки "function doPost(e)")
 * 
 * 4. Нажмите "Сохранить" (Ctrl+S)
 * 
 * 5. Опубликуйте как веб-приложение:
 *    - Нажмите "Развертывание" → "Новое развертывание"
 *    - Тип: "Веб-приложение"
 *    - Описание: "Анкета"
 *    - Выполнять как: "Я" (ваш аккаунт)
 *    - Доступ: "Все" (Anyone)
 *    - Нажмите "Развернуть"
 * 
 * 6. Скопируйте URL веб-приложения и вставьте его в файл
 *    script.js вместо 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'
 * 
 * 7. Готово! Теперь данные из анкеты будут записываться
 *    в вашу Google Таблицу.
 * 
 * ============================================================
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Если первая строка пустая, добавляем заголовки
    if (sheet.getLastRow() === 0) {
      var headers = Object.keys(data);
      sheet.appendRow(headers);
    }
    
    // Формируем строку данных в порядке заголовков
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = [];
    
    for (var i = 0; i < headers.length; i++) {
      row.push(data[headers[i]] || '');
    }
    
    // Проверяем, есть ли новые поля, которых ещё нет в заголовках
    var existingHeaders = new Set(headers);
    for (var key in data) {
      if (!existingHeaders.has(key)) {
        headers.push(key);
        row.push(data[key]);
        // Добавляем новый заголовок
        sheet.getRange(1, headers.length).setValue(key);
      }
    }
    
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Тест: открыть URL в браузере покажет что скрипт работает
function doGet(e) {
  return ContentService
    .createTextOutput('Скрипт анкеты работает! Используйте POST для отправки данных.')
    .setMimeType(ContentService.MimeType.TEXT);
}
