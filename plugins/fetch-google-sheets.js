require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

module.exports = {
  // Хук запускается перед сборкой сайта
  onPreBuild: async ({ utils, inputs }) => {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const spreadsheetId = '1NSo81z2rTAqZ1tRmqSDvxvXLcaQlnsObRAqQ0oOU-wc';
    const range = 'redroom_videos!A1:F1000';

    const sheets = google.sheets({ version: 'v4', auth: apiKey });

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
            lat: row[4], // Широта
            lng: row[5], // Долгота
          };
        });

        // Сохраняем данные в файл JSON
        const filePath = path.resolve(process.cwd(), 'public/video_list.json');
        fs.writeFileSync(filePath, JSON.stringify(namedRows, null, 2));

        console.log('JSON updated!');
      } else {
        console.log('No data for update.');
      }
    } catch (error) {
      utils.build.failBuild('Error while parsing Google Sheets', { error });
    }
  },
};
