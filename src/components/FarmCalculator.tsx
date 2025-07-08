
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator, MapPin, Save, Download, Trash2 } from "lucide-react";

interface Coordinate {
  lat: number;
  lng: number;
}

interface FarmProfile {
  id: string;
  name: string;
  coordinates: Coordinate[];
  area: number;
  unit: string;
  createdAt: Date;
}

const FarmCalculator = () => {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [farmName, setFarmName] = useState('');
  const [unit, setUnit] = useState<'acres' | 'hectares' | 'sqm'>('acres');
  const [savedFarms, setSavedFarms] = useState<FarmProfile[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Calculate area using the Shoelace formula
  const calculateArea = useCallback((coords: Coordinate[]): number => {
    if (coords.length < 3) return 0;
    
    let area = 0;
    const n = coords.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coords[i].lat * coords[j].lng;
      area -= coords[j].lat * coords[i].lng;
    }
    
    area = Math.abs(area) / 2;
    
    // Convert from square degrees to square meters (approximate)
    const areaInSqM = area * 111320 * 111320;
    
    // Convert to selected unit
    switch (unit) {
      case 'acres':
        return areaInSqM / 4047;
      case 'hectares':
        return areaInSqM / 10000;
      case 'sqm':
        return areaInSqM;
      default:
        return areaInSqM / 4047;
    }
  }, [unit]);

  const currentArea = calculateArea(coordinates);

  const handleMapClick = (lat: number, lng: number) => {
    if (isDrawing) {
      setCoordinates(prev => [...prev, { lat, lng }]);
    }
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setCoordinates([]);
  };

  const finishDrawing = () => {
    setIsDrawing(false);
  };

  const clearDrawing = () => {
    setCoordinates([]);
    setIsDrawing(false);
  };

  const saveFarm = () => {
    if (coordinates.length >= 3 && farmName.trim()) {
      const newFarm: FarmProfile = {
        id: Date.now().toString(),
        name: farmName.trim(),
        coordinates: [...coordinates],
        area: currentArea,
        unit,
        createdAt: new Date()
      };
      setSavedFarms(prev => [...prev, newFarm]);
      setFarmName('');
      setCoordinates([]);
      setIsDrawing(false);
    }
  };

  const deleteFarm = (id: string) => {
    setSavedFarms(prev => prev.filter(farm => farm.id !== id));
  };

  const loadFarm = (farm: FarmProfile) => {
    setCoordinates(farm.coordinates);
    setUnit(farm.unit as 'acres' | 'hectares' | 'sqm');
    setFarmName(farm.name);
  };

  const exportData = () => {
    const data = {
      currentFarm: {
        name: farmName,
        coordinates,
        area: currentArea,
        unit
      },
      savedFarms
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'farm-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-6 w-6 text-green-600" />
            <span>Farm Area Calculator</span>
          </CardTitle>
          <CardDescription>
            Calculate your farm area accurately using interactive mapping tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interactive Map Placeholder */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-4">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto" />
              <div className="space-y-2">
                <p className="text-gray-600 font-medium">Interactive Map Area</p>
                <p className="text-sm text-gray-500">
                  Click "Start Drawing" to mark your farm boundaries
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {!isDrawing && coordinates.length === 0 && (
                    <Button onClick={startDrawing} className="bg-green-600 hover:bg-green-700">
                      Start Drawing
                    </Button>
                  )}
                  {isDrawing && (
                    <Button onClick={finishDrawing} variant="outline">
                      Finish Drawing ({coordinates.length} points)
                    </Button>
                  )}
                  {coordinates.length > 0 && (
                    <Button onClick={clearDrawing} variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Drawing Instructions */}
          {isDrawing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Drawing Mode Active:</strong> Click on the map to mark boundary points. 
                You need at least 3 points to calculate area.
              </p>
            </div>
          )}

          {/* Area Calculation Results */}
          {coordinates.length >= 3 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800">Calculated Area</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {currentArea.toFixed(2)} {unit}
                  </p>
                  <p className="text-sm text-green-700">
                    Based on {coordinates.length} boundary points
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {coordinates.length} Points
                </Badge>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="farmName">Farm Name</Label>
              <Input
                id="farmName"
                placeholder="Enter farm name"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unit">Measurement Unit</Label>
              <select
                id="unit"
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'acres' | 'hectares' | 'sqm')}
              >
                <option value="acres">Acres</option>
                <option value="hectares">Hectares</option>
                <option value="sqm">Square Meters</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex space-x-2">
                <Button
                  onClick={saveFarm}
                  disabled={coordinates.length < 3 || !farmName.trim()}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button onClick={exportData} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Farms */}
      {savedFarms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Farm Profiles</CardTitle>
            <CardDescription>
              Your previously calculated farm areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedFarms.map((farm) => (
                <div
                  key={farm.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{farm.name}</h3>
                    <Button
                      onClick={() => deleteFarm(farm.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Area:</strong> {farm.area.toFixed(2)} {farm.unit}</p>
                    <p><strong>Points:</strong> {farm.coordinates.length}</p>
                    <p><strong>Saved:</strong> {farm.createdAt.toLocaleDateString()}</p>
                  </div>
                  <Button
                    onClick={() => loadFarm(farm)}
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                  >
                    Load Farm
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips and Help */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use the Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Step-by-Step Guide</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Click "Start Drawing" to begin marking your farm boundaries</li>
                <li>Click on the map to add boundary points</li>
                <li>Add at least 3 points to form a closed area</li>
                <li>Click "Finish Drawing" when done</li>
                <li>Enter a farm name and select your preferred unit</li>
                <li>Save your farm profile for future reference</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Tips for Accuracy</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Mark points along the actual field boundaries</li>
                <li>Use more points for irregular shaped fields</li>
                <li>Double-check your boundary points before saving</li>
                <li>Export your data for backup and sharing</li>
                <li>Use GPS coordinates for maximum accuracy</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmCalculator;
