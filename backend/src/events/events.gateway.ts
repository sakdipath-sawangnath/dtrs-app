import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  afterInit(_server: Server) {
    console.log('WebSocket initialized');
  }

  notifyJobUpdate(job: any) {
    this.server.emit('job-updated', job);
  }

  notifyNewJob(job: any) {
    this.server.emit('new-job', job);
  }
}
