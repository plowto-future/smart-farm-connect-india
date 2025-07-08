
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Save, Download, Trash2, Edit2, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FarmCalculator = () => {
  const { toast } = useToast();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [polygon, setPolygon] = useState(null);
  const [coordinates, setCoordinates] = useState([]);
  const [area, setArea] = useState(0);
  const [unit, setUnit] = useState('acres');
  const [farmName, setFarmName] = useState('');
  const [farmDescription, setFarmDescription] = useState('');
  const [savedFarms, setSavedFarms] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = () => {
      if (!window.google) {
        console.error('Google Maps not loaded');
        return;
      }

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 28.6139, lng: 77.2090 }, // Delhi, India
        zoom: 15,
        mapTypeId: 'satellite'
      });

      setMap(mapInstance);
    };

    if (window.google) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=geometry,drawing`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }
  }, []);

  // Calculate area using coordinates
  const calculatePolygonArea = (coords) => {
    if (coords.length < 3) return 0;
    
    // Simple polygon area calculation (Shoelace formula)
    let area = 0;
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      area += coords[i].lat * coords[j].lng;
      area -= coords[j].lat * coords[i].lng;
    }
    area = Math.abs(area) / 2;
    
    // Convert to square meters (approximate)
    const sqMeters = area * 111320 * 111320 * Math.cos(coords[0].lat * Math.PI / 180);
    return sqMeters;
  };

  // Convert area units
  const convertArea = (areaInSqMeters, targetUnit) => {
    switch (targetUnit) {
      case 'acres':
        return areaInSqMeters / 4047;
      case 'hectares':
        return areaInSqMeters / 10000;
      case 'sqmeters':
        return areaInSqMeters;
      default:
        return areaInSqMeters;
    }
  };

  // Start drawing mode
  const startDrawing = () => {
    if (!map) return;
    
    setIsDrawing(true);
    setCoordinates([]);
    
    if (polygon) {
      polygon.setMap(null);
    }

    const newPolygon = new window.google.maps.Polygon({
      paths: [],
      strokeColor: '#22c55e',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#22c55e',
      fillOpacity: 0.35,
      editable: true,
      draggable: false
    });

    newPolygon.setMap(map);
    setPolygon(newPolygon);

    // Add click listener to map
    const clickListener = map.addListener('click', (event) => {
      const newCoords = [...coordinates, {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      }];
      
      setCoordinates(newCoords);
      newPolygon.setPath(newCoords);
      
      const areaInSqMeters = calculatePolygonArea(newCoords);
      setArea(convertArea(areaInSqMeters, unit));
    });

    // Clean up listener when done
    newPolygon.addListener('rightclick', () => {
      window.google.maps.event.removeListener(clickListener);
      setIsDrawing(false);
      
      toast({
        title: "Area calculated!",
        description: `Farm area: ${area.toFixed(2)} ${unit}`,
      });
    });
  };

  // Clear the current drawing
  const clearDrawing = () => {
    if (polygon) {
      polygon.setMap(null);
      setPolygon(null);
    }
    setCoordinates([]);
    setArea(0);
    setIsDrawing(false);
  };

  // Save farm profile
  const saveFarm = () => {
    if (!farmName || coordinates.length < 3) {
      toast({
        title: "Error",
        description: "Please enter farm name and draw the area first.",
        variant: "destructive",
      });
      return;
    }

    const newFarm = {
      id: Date.now(),
      name: farmName,
      description: farmDescription,
      coordinates,
      area: area.toFixed(2),
      unit,
      createdAt: new Date().toLocaleDateString()
    };

    setSavedFarms([...savedFarms, newFarm]);
    setFarmName('');
    setFarmDescription('');
    
    toast({
      title: "Farm saved!",
      description: `${farmName} has been saved successfully.`,
    });
  };

  // Load a saved farm
  const loadFarm = (farm) => {
    clearDrawing();
    
    const newPolygon = new window.google.maps.Polygon({
      paths: farm.coordinates,
      strokeColor: '#22c55e',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#22c55e',
      fillOpacity: 0.35,
      editable: true
    });

    newPolygon.setMap(map);
    setPolygon(newPolygon);
    setCoordinates(farm.coordinates);
    setArea(farm.area);
    setUnit(farm.unit);
    
    // Center map on the farm
    const bounds = new window.google.maps.LatLngBounds();
    farm.coordinates.forEach(coord => bounds.extend(coord));
    map.fitBounds(bounds);
  };

  // Delete a saved farm
  const deleteFarm = (farmId) => {
    setSavedFarms(savedFarms.filter(farm => farm.id !== farmId));
    toast({
      title: "Farm deleted",
      description: "Farm profile has been removed.",
    });
  };

  // Export farm data
  const exportData = () => {
    const data = {
      farmName,
      area: area.toFixed(2),
      unit,
      coordinates,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${farmName || 'farm-data'}.json`;
    a.click();
    
    toast({
      title: "Data exported!",
      description: "Farm data has been downloaded.",
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculator">Area Calculator</TabsTrigger>
          <TabsTrigger value="saved">Saved Farms ({savedFarms.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Interactive Map</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={mapRef} 
                  className="w-full h-96 rounded-lg border"
                  style={{ minHeight: '400px' }}
                />
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button onClick={startDrawing} disabled={isDrawing}>
                    {isDrawing ? 'Drawing...' : 'Start Drawing'}
                  </Button>
                  <Button variant="outline" onClick={clearDrawing}>
                    Clear
                  </Button>
                  <Button variant="outline" onClick={exportData} disabled={!area}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                {isDrawing && (
                  <p className="text-sm text-gray-600 mt-2">
                    Click on the map to mark corners. Right-click to finish drawing.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Controls Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Calculation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <select 
                    id="unit"
                    className="w-full p-2 border rounded-md"
                    value={unit}
                    onChange={(e) => {
                      setUnit(e.target.value);
                      if (coordinates.length > 0) {
                        const areaInSqMeters = calculatePolygonArea(coordinates);
                        setArea(convertArea(areaInSqMeters, e.target.value));
                      }
                    }}
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="sqmeters">Square Meters</option>
                  </select>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800">Calculated Area</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {area.toFixed(2)} {unit}
                  </p>
                  {coordinates.length > 0 && (
                    <Badge className="mt-2 bg-green-100 text-green-700">
                      {coordinates.length} points marked
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farmName">Farm Name</Label>
                  <Input
                    id="farmName"
                    placeholder="Enter farm name..."
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farmDescription">Description (Optional)</Label>
                  <Textarea
                    id="farmDescription"
                    placeholder="Add farm details..."
                    value={farmDescription}
                    onChange={(e) => setFarmDescription(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={saveFarm} 
                  className="w-full"
                  disabled={!farmName || coordinates.length < 3}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Farm Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Saved Farm Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              {savedFarms.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No saved farms yet. Create your first farm profile using the calculator.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedFarms.map((farm) => (
                    <Card key={farm.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{farm.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFarm(farm.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{farm.description}</p>
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-green-600">
                            {farm.area} {farm.unit}
                          </p>
                          <p className="text-xs text-gray-500">Created: {farm.createdAt}</p>
                        </div>
                        <Button
                          onClick={() => loadFarm(farm)}
                          className="w-full mt-3"
                          variant="outline"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Load on Map
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FarmCalculator;
