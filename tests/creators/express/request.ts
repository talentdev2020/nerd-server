import { Request } from 'express';

export default function create(token: string): Request {
  function header(s: 'set-cookie'): string[];
  function header(s: string): string;
  function header(s: 'set-cookie' | string): string[] | string {
    return token;
  }

  const request: Partial<Request> = {
    header: header,
  };

  return request as Request;
}
