import axios from 'axios';
import type { AxiosInstance } from 'axios';

export interface RelayState {
  in1: number;
  in2: number;
  in3: number;
  in4: number;
}

export interface WiFiStatus {
  connected: number;
  ssid: string;
  ip: string;
  rssi: number;
}

export interface ActionLog {
  id: string;
  relay: number;
  action: 'ON' | 'OFF';
  timestamp: number;
}

export interface Schedule {
  id: string;
  relay: number;
  time: string;
  action: 'ON' | 'OFF';
  enabled: boolean;
  daysOfWeek: number[]; // 0-6, 0 = Sunday
}

class APIClientService {
  private client: AxiosInstance;
  private baseURL: string = '';

  constructor() {
    this.client = axios.create({
      timeout: 5000,
    });
  }

  setBaseURL(ip: string) {
    this.baseURL = `http://${ip}`;
    this.client.defaults.baseURL = this.baseURL;
  }

  async getRelayState(): Promise<RelayState> {
    const response = await this.client.get<RelayState>('/state');
    return response.data;
  }

  async setRelay(relay: number, state: number): Promise<{ success: number }> {
    const response = await this.client.post('/relay/set', { relay, state });
    return response.data;
  }

  async controlMultipleRelays(relays: number[], states: number[]): Promise<RelayState> {
    const relayStr = relays.join(',');
    const stateStr = states.join(',');
    const response = await this.client.get<RelayState>(`/relay/multi?relay=${relayStr}&state=${stateStr}`);
    return response.data;
  }

  async getWiFiStatus(): Promise<WiFiStatus> {
    const response = await this.client.get<WiFiStatus>('/wifi/status');
    return response.data;
  }

  async configureWiFi(ssid: string, password: string): Promise<{ success: number }> {
    const response = await this.client.post('/wifi/config', { ssid, password });
    return response.data;
  }

  async resetWiFi(): Promise<{ success: number }> {
    const response = await this.client.post('/wifi/reset');
    return response.data;
  }
}

export const APIClient = new APIClientService();
