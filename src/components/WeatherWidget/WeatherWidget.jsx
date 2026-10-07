import React, { useEffect, useState } from 'react';
import PdaCard from '../PdaCard/PdaCard';

export default function WeatherWidget({ focused, isOnline }) {
  const [weather, setWeather] = useState({ temp: '--', desc: 'Chargement...', isLoaded: false });

  useEffect(() => {
    let isSubscribed = true;

    const fetchWeather = async () => {
      if (!isOnline) {
        if (isSubscribed) {
          setWeather({ temp: '--', desc: 'Hors ligne', isLoaded: false });
        }
        return;
      }

      try {
        const lat = import.meta.env.VITE_LATITUDE || 0;
        const lon = import.meta.env.VITE_LONGITUDE || 0;
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=weathercode`);
        if (!response.ok) throw new Error('Erreur météo');

        const data = await response.json();
        if (data && data.current_weather && data.hourly && isSubscribed) {
          const currentTemp = `${Math.round(data.current_weather.temperature)}°C`;
          const currentHourIndex = new Date().getHours();
          const remainingDayCodes = data.hourly.weathercode.slice(currentHourIndex);
          const rainCodes = [55, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
          const willRainLater = remainingDayCodes.some((code) => rainCodes.includes(code));

          const weatherMap = {
            "0": "Ciel dégagé",
            "1": "Principalement dégagé",
            "2": "Partiellement nuageux",
            "3": "Couvert",
            "45": "Brouillard",
            "48": "Brouillard givrant",
            "51": "Bruine légère",
            "53": "Bruine modérée",
            "55": "Bruine dense",
            "56": "Bruine verglaçante légère",
            "57": "Bruine verglaçante dense",
            "61": "Pluie faible",
            "63": "Pluie modérée",
            "65": "Pluie forte",
            "66": "Pluie verglaçante légère",
            "67": "Pluie verglaçante forte",
            "71": "Chute de neige faible",
            "73": "Chute de neige modérée",
            "75": "Chute de neige forte",
            "77": "Grains de neige",
            "80": "Averses faibles",
            "81": "Averses modérées",
            "82": "Averses violentes",
            "85": "Averse de neige faibles",
            "86": "Averse de neige fortes",
            "95": "Orage",
            "96": "Orage avec grêle légère",
            "97": "Orage fort",
            "99": "Orage avec grêle forte"
          }

          let description = weatherMap[data.current_weather.weathercode] || 'Variable';
          if (!rainCodes.includes(data.current_weather.weathercode) && willRainLater) {
            description = 'Pluie prévue plus tard';
          }

          setWeather({ temp: currentTemp, desc: description, isLoaded: true });
        }
      } catch {
        if (isSubscribed) {
          setWeather({ temp: '--', desc: 'Erreur météo', isLoaded: false });
        }
      }
    };

    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 60 * 60 * 1000);

    return () => {
      isSubscribed = false;
      clearInterval(weatherInterval);
    };
  }, [isOnline]);

  return (
    <PdaCard focused={focused} title="Météo" icon="🌤️" style={{ flex: '0 0 auto' }}>
      <div className="weather-hero" style={{ padding: '0.2rem 0' }}>
        <div className="temp-main" style={{ fontSize: '3rem' }}>{weather.temp}</div>
        <div className="weather-desc">{weather.desc}</div>
        <div className="location">📍 {import.meta.env.VITE_NAME || 'Point zéro'}</div>
      </div>
    </PdaCard>
  );
}