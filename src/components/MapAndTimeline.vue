<template>
    <div class="container">
        <div id="map" ref="map" class="map"></div>
        <div id="timeline" ref="timeline" class="timeline"></div>
    </div>
</template>

<script>
import L from "leaflet";  // Импорт библиотеки Leaflet для карты
import "leaflet/dist/leaflet.css";  // Подключение стилей Leaflet

import { Timeline } from "vis-timeline";  // Импорт необходимых классов из vis-timeline
import { DataSet } from "vis-data";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";  // Подключение стилей для vis-timeline

export default {
    name: "MapAndTimeline",
    data() {
        return {
            map: null,
            timeline: null,
            markers: [],
            videos: [],
        };
    },
    async mounted() {
        await this.loadVideoList();
        // Инициализация карты после монтирования компонента
        this.initMap();
        // Инициализация временной шкалы
        this.initTimeline();
    },
    methods: {
        async loadVideoList() {
            // Динамическая загрузка JSON файла при монтировании компонента
            await fetch('/video_list.json')
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Ошибка при загрузке JSON файла');
                    }
                    return response.json(); // Преобразуем ответ в JSON
                })
                .then((data) => {
                    this.videos = data; // Записываем данные в состояние компонента
                    console.log(this.videos);
                })
                .catch((error) => {
                    console.error(error.message);
                });
        },
        initMap() {
            this.map = L.map(this.$refs.map).setView([51.505, -0.09], 3);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
            }).addTo(this.map);
        },
        // Функция для объединения пересекающихся периодов
        mergeOverlappingPeriods(periods) {
            // Сортируем периоды по дате начала
            const sortedPeriods = periods.sort((a, b) => a.periodStart - b.periodStart);

            const mergedPeriods = [];
            let currentPeriod = sortedPeriods[0];

            for (let i = 1; i < sortedPeriods.length; i++) {
                const nextPeriod = sortedPeriods[i];

                // Проверяем, пересекаются ли периоды
                if (currentPeriod.periodEnd >= nextPeriod.periodStart) {
                    // Если пересекаются, объединяем их (берём максимальную конечную дату)
                    currentPeriod.periodEnd = new Date(Math.max(currentPeriod.periodEnd, nextPeriod.periodEnd));
                } else {
                    // Если не пересекаются, сохраняем текущий период и начинаем новый
                    mergedPeriods.push(currentPeriod);
                    currentPeriod = nextPeriod;
                }
            }

            // Не забываем добавить последний период
            mergedPeriods.push(currentPeriod);

            return mergedPeriods;
        },
        initTimeline() {
            const container = this.$refs.timeline;

            const parsedData = this.videos.map(item => ({
                ...item,
                periodStart: new Date(item.periodStart.split('.')[0], item.periodStart.split('.')[1], item.periodStart.split('.')[2]),
                periodEnd: new Date(item.periodEnd.split('.')[0], item.periodEnd.split('.')[1], item.periodEnd.split('.')[2]),
            }));

            const mergedPeriods = this.mergeOverlappingPeriods(parsedData);

            // Преобразование данных для DataSet временной шкалы
            const timelineItems = mergedPeriods.map((item, index) => {
                return {
                    id: index + 1,
                    content: "",
                    start: item.periodStart,
                    end: item.periodEnd,
                };
            });

            const items = new DataSet(timelineItems);

            const options = {
                width: "100%",
                height: "150px",
                margin: { item: 10 },
                selectable: true,
            };

            this.timeline = new Timeline(container, items, options);

            // Обработка события клика по шкале времени
            this.timeline.on("click", (properties) => {
                const clickedTime = properties.time;  // Время, на которое кликнули
                this.showMarkersForTime(clickedTime);
            });
        },
        showMarkersForTime(clickedTime) {
            // Очищаем старые маркеры
            this.clearMarkers();

            // Преобразуем выбранное время к формату, который можно сравнивать с периодами
            const selectedDate = new Date(clickedTime);

            // Ищем видео, которые относятся к выбранному времени
            const videosInRange = this.videos.filter((video) => {
                const periodStart = new Date(video.periodStart);
                const periodEnd = new Date(video.periodEnd);
                return selectedDate >= periodStart && selectedDate <= periodEnd;
            });

            // Добавляем маркеры на карту для найденных видео
            const bounds = [];

            videosInRange.forEach((video) => {
                const videoId = video.youtubeId; // Предположим, что у каждого видео есть поле youtubeId
                const youtubeLink = `https://www.youtube.com/watch?v=${videoId}`;
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;

                // Создаем кастомный маркер с изображением превью
                const icon = L.icon({
                    iconUrl: thumbnailUrl,  // Превью как иконка
                    iconSize: [100, 75],  // Размер маркера (например, 100x56)
                    iconAnchor: [50, 37],  // Центр маркера
                    popupAnchor: [0, -37],  // Место появления попапа относительно маркера
                    className: 'custom-video-marker',
                });

                const marker = L.marker([video.lat, video.lng], { icon: icon }).addTo(this.map);

                // Добавляем событие клика на маркер для перехода на YouTube
                marker.on('click', function () {
                    window.open(youtubeLink, '_blank');  // Открываем видео в новой вкладке
                });

                this.markers.push(marker);

                // Добавляем координаты маркера в bounds
                bounds.push([video.lat, video.lng]);
            });

            if (videosInRange.length === 1) {
                const video = videosInRange[0];
                this.map.setView([video.lat, video.lng], 7);
            } else if (videosInRange.length > 0) {
                // Центрируем карту, чтобы охватить все маркеры
                this.map.fitBounds(bounds, { padding: [50, 100] });
            }
        },
        clearMarkers() {
            // Удаляем все маркеры с карты
            this.markers.forEach((marker) => {
                this.map.removeLayer(marker);
            });
            this.markers = [];
        },
    },
};
</script>

<style scoped>
.container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.map {
    height: 400px;
    width: 80%;
    margin-bottom: 20px;
}

.timeline {
    height: 150px;
    width: 80%;
}
</style>