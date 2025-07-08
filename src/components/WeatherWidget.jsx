
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Sun, CloudRain, Wind } from "lucide-react";

const WeatherWidget = () => {
  const weatherData = {
    location: "Haryana, India",
    current: {
      temp: "28°C",
      condition: "Partly Cloudy",
      humidity: "65%",
      windSpeed: "12 km/h"
    },
    forecast: [
      { day: "Today", high: "32°", low: "22°", icon: Sun, condition: "Sunny" },
      { day: "Tomorrow", high: "29°", low: "20°", icon: CloudRain, condition: "Light Rain" },
      { day: "Wed", high: "26°", low: "18°", icon: CloudRain, condition: "Rain" },
      { day: "Thu", high: "30°", low: "21°", icon: Cloud, condition: "Cloudy" }
    ]
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sun className="h-5 w-5 text-yellow-500" />
          <span>Weather Forecast</span>
          <span className="text-sm font-normal text-gray-500">- {weatherData.location}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">{weatherData.current.temp}</div>
              <div className="text-gray-600">{weatherData.current.condition}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Cloud className="h-4 w-4 text-blue-500" />
                <span>Humidity: {weatherData.current.humidity}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Wind className="h-4 w-4 text-gray-500" />
                <span>Wind: {weatherData.current.windSpeed}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {weatherData.forecast.map((day, index) => {
              const Icon = day.icon;
              return (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">{day.day}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium">{day.high}</span>
                    <span className="text-gray-500">{day.low}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <CloudRain className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Farming Alert</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Light rain expected tomorrow. Consider postponing pesticide application and check drainage systems.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
