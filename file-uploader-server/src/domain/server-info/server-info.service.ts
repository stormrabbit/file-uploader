import { Injectable } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class ServerInfoService {
  getIpv4Addresses(): string[] {
    const raw = os.networkInterfaces();
    const result: string[] = [];

    for (const addrs of Object.values(raw)) {
      for (const addr of addrs || []) {
        if (
          addr.family === 'IPv4' &&
          !addr.internal &&
          !addr.address.startsWith('169.254.')
        ) {
          result.push(addr.address);
        }
      }
    }

    return result;
  }
}
