require('dotenv').config();
const fs = require("fs");
const { google } = require("googleapis");
const path = require("path");

// Укажи свой API Key
const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

// ID таблицы Google (можно найти в URL таблицы)
const spreadsheetId = "1NSo81z2rTAqZ1tRmqSDvxvXLcaQlnsObRAqQ0oOU-wc"; // Пример: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'

// Диапазон ячеек для чтения
const range = "redroom_videos!A1:F400"; // Укажи диапазон ячеек

async function readSheet() {
  const sheets = google.sheets({ version: "v4", auth: apiKey });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (rows.length) {
      const filteredRows = rows.filter((row) => {
        const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
        const coordinateRegex = /^-?\d{1,2}\.\d{1,6}$/;
        return (
          dateRegex.test(row[2]) &&
          dateRegex.test(row[3]) &&
          coordinateRegex.test(row[4]) &&
          coordinateRegex.test(row[5])
        );
      });

      const namedRows = filteredRows.map((row, index) => {
        return {
          id: index,
          title: row[0], // Имя
          youtubeId: row[1], // Фамилия
          periodStart: row[2].split(".").reverse().join("-"), // Дата начала
          periodEnd: row[3].split(".").reverse().join("-"), // Дата окончания
          lat: row[4], // Дата окончания
          lng: row[5], // Дата окончания
        };
      });

      // Сохраняем данные в файл JSON
      fs.writeFileSync(
        path.join(__dirname, "../../public/video_list.json"),
        JSON.stringify(namedRows, null, 2)
      );
      console.log("Данные успешно сохранены в data/video_list.json");
    } else {
      console.log("Нет данных для чтения.");
    }
  } catch (error) {
    console.error("Ошибка при получении данных:", error);
  }
}

readSheet();
