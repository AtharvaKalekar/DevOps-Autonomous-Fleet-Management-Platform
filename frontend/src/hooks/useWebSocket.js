import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export function useWebSocket(url = 'ws://localhost:4000') {
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchInitialAlerts = async () => {
      try {
        const res = await api.getAlerts('false');
        if (res.success) {
          setAlerts(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch initial alerts:', err);
      }
    };
    fetchInitialAlerts();
  }, []);

  const connect = () => {
    setConnectionStatus('connecting');
    console.log(`Connecting to WebSocket at ${url}...`);
    
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connection established.');
      setConnectionStatus('connected');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;

        switch (type) {
          case 'initial_state':
            console.log('Received initial vehicle snapshot:', payload.length);
            setVehicles(payload);
            break;

          case 'telemetry_update':
            // Merge coordinates and sensor updates into vehicles array
            setVehicles((prevVehicles) =>
              prevVehicles.map((v) => {
                const update = payload.find((u) => u.vehicleId === v.id);
                if (update) {
                  return {
                    ...v,
                    latitude: update.lat,
                    longitude: update.lng,
                    speed: update.speed,
                    fuel_level: update.fuel,
                    engine_temp: update.engineTemp,
                    status: update.status,
                  };
                }
                return v;
              })
            );
            break;

          case 'new_alert':
            console.log('Received live alert:', payload);
            setAlerts((prevAlerts) => [payload, ...prevAlerts]);
            
            // Show custom styled toast notifications based on severity
            const toastText = `${payload.message}`;
            if (payload.severity === 'critical') {
              toast.error(toastText, {
                duration: 6000,
                style: {
                  background: '#7F1D1D',
                  color: '#FEE2E2',
                  border: '1px solid #EF4444',
                },
              });
            } else if (payload.severity === 'high') {
              toast(toastText, {
                icon: '⚠️',
                duration: 5000,
                style: {
                  background: '#78350F',
                  color: '#FEF3C7',
                  border: '1px solid #F59E0B',
                },
              });
            } else {
              toast(toastText, {
                icon: 'ℹ️',
                duration: 4000,
                style: {
                  background: '#1E3A8A',
                  color: '#DBEAFE',
                  border: '1px solid #3B82F6',
                },
              });
            }
            break;

          case 'alert_resolved':
            // Automatically remove the resolved alert from local feed
            setAlerts((prevAlerts) => prevAlerts.filter((a) => a.id !== payload.id));
            break;

          case 'alert_updated':
            setAlerts((prevAlerts) =>
              prevAlerts.map((a) => (a.id === payload.id ? payload : a))
            );
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected. Reconnection scheduled in 5 seconds.');
      setConnectionStatus('disconnected');
      
      // Auto-reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket connection error:', err);
      ws.close();
    };
  };

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [url]);

  return { vehicles, setVehicles, alerts, setAlerts, connectionStatus };
}
