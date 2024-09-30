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
            videos: [
                {
                    id: 1,
                    title: "Видео 1",
                    periodStart: "2020-01-01",
                    periodEnd: "2020-06-01",
                    lat: 51.505,
                    lng: -0.09,
                    popup: "Видео 1",
                    youtubeId: "dzoJ4IHv8i4",
                },
                {
                    id: 2,
                    title: "Видео 2",
                    periodStart: "2020-05-01",
                    periodEnd: "2020-12-31",
                    lat: 52.505,
                    lng: -1.09,
                    popup: "Видео 2",
                    youtubeId: "lSIYIqrT2z8",
                },
                {
                    id: 3,
                    title: "Видео 3",
                    periodStart: "2020-01-01",
                    periodEnd: "2021-06-01",
                    lat: 48.8566,
                    lng: 2.3522,
                    popup: "Видео 3",
                    youtubeId: "dzoJ4IHv8i4",
                },
                {
                    id: 4,
                    title: "Видео 4",
                    periodStart: "2021-03-01",
                    periodEnd: "2021-12-31",
                    lat: 50.8566,
                    lng: 3.3522,
                    popup: "Видео 4",
                    youtubeId: "lSIYIqrT2z8",
                },
                {
                    id: 5,
                    title: "Видео 5",
                    periodStart: "2022-01-01",
                    periodEnd: "2022-12-31",
                    lat: 40.7128,
                    lng: -74.006,
                    popup: "Видео 5",
                    youtubeId: "dzoJ4IHv8i4",
                },
            ],
        };
    },
    mounted() {
        // Инициализация карты после монтирования компонента
        this.initMap();
        // Инициализация временной шкалы
        this.initTimeline();
    },
    methods: {
        initMap() {
            this.map = L.map(this.$refs.map).setView([51.505, -0.09], 3);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
            }).addTo(this.map);
        },
        initTimeline() {
            const container = this.$refs.timeline;

            const items = new DataSet([
                { id: 1, content: "2020", start: "2020-01-01", end: "2022-12-31" },
            ]);

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