'use strict';

const https = require('https');

const PLT_AFFINITY = { profit: 0.5, love: 0.2, tax: 0.3 };

function skill_weather(input) {
    return new Promise((resolve) => {
        const location = typeof input === 'string' ? input : (input.location || input.city || 'New York');
        const units = input.units || 'metric';
        
        const geoData = geocodeLocation(location);
        
        fetchWeather(geoData.lat, geoData.lon, units).then(data => {
            resolve({
                skill: 'weather',
                plt_affinity: PLT_AFFINITY,
                location,
                ...data,
                timestamp: Date.now(),
            });
        }).catch(e => {
            resolve({
                skill: 'weather',
                plt_affinity: PLT_AFFINITY,
                location,
                error: e.message,
                simulated: simulateWeather(location),
                timestamp: Date.now(),
            });
        });
    });
}

function geocodeLocation(location) {
    const locations = {
        'new york': { lat: 40.7128, lon: -74.0060, city: 'New York' },
        'london': { lat: 51.5074, lon: -0.1278, city: 'London' },
        'tokyo': { lat: 35.6762, lon: 139.6503, city: 'Tokyo' },
        'paris': { lat: 48.8566, lon: 2.3522, city: 'Paris' },
        'sydney': { lat: -33.8688, lon: 151.2093, city: 'Sydney' },
        'default': { lat: 40.7128, lon: -74.0060, city: location },
    };
    
    const key = location.toLowerCase();
    return locations[key] || { ...locations.default, city: location };
}

function fetchWeather(lat, lon, units) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`;
    
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const current = json.current || {};
                    resolve({
                        temperature: current.temperature_2m,
                        condition: weatherCodeToCondition(current.weather_code),
                        wind_speed: current.wind_speed_10m,
                        units,
                        source: 'Open-Meteo API',
                    });
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function weatherCodeToCondition(code) {
    const conditions = {
        0: 'Clear',
        1: 'Mostly Clear',
        2: 'Partly Cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Foggy',
        51: 'Light Drizzle',
        53: 'Drizzle',
        55: 'Heavy Drizzle',
        61: 'Light Rain',
        63: 'Rain',
        65: 'Heavy Rain',
        71: 'Light Snow',
        73: 'Snow',
        75: 'Heavy Snow',
        80: 'Rain Showers',
        81: 'Heavy Showers',
        95: 'Thunderstorm',
    };
    return conditions[code] || 'Unknown';
}

function simulateWeather(location) {
    return {
        temperature: 22,
        condition: 'Partly Cloudy',
        wind_speed: 12,
        units: 'metric',
        source: 'Simulated',
        note: 'API unavailable, using estimate',
    };
}

module.exports = { skill_weather };