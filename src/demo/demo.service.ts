import { Injectable } from '@nestjs/common';

@Injectable()
export class DemoService {
    getApp() {
        return "This is an App";
    }
}
