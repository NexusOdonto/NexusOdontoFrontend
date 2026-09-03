import * as signalR from '@microsoft/signalr';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;

  public async startConnection(hubUrl?: string): Promise<signalR.HubConnection | null> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    if (this.isConnecting) {
      return this.connection;
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5170/api';
    const serverOrigin = baseUrl.replace(/\/api\/?$/, '');
    const targetHubUrl = hubUrl || `${serverOrigin}/hubs/notifications`;

    this.isConnecting = true;

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(targetHubUrl, {
          accessTokenFactory: () => localStorage.getItem('auth_token') || '',
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.None)
        .build();

      await this.connection.start();
      console.log('⚡ Conexión SignalR Hub establecida exitosamente con el backend.');
      return this.connection;
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.warn('ℹ️ Conexión a SignalR Hub no disponible (usando polling de respaldo):', error?.message || error);
      }
      return null;
    } finally {
      this.isConnecting = false;
    }
  }

  public async stopConnection(): Promise<void> {
    if (this.connection) {
      try {
        if (this.connection.state === signalR.HubConnectionState.Connected) {
          await this.connection.stop();
        }
      } catch {
        // Ignorar errores al cerrar conexión no activa
      } finally {
        this.connection = null;
      }
    }
  }

  public on(eventName: string, callback: (...args: any[]) => void): void {
    if (this.connection) {
      this.connection.on(eventName, callback);
    }
  }

  public off(eventName: string, callback: (...args: any[]) => void): void {
    if (this.connection) {
      this.connection.off(eventName, callback);
    }
  }

  public getConnectionState(): signalR.HubConnectionState | undefined {
    return this.connection?.state;
  }
}

export const signalRService = new SignalRService();
export default signalRService;
