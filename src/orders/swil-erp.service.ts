import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SwilOrderItem {
    product_code: string;
    product_name: string;
    qty: number;
    unit_price: string;
    discount_price: string;
    total: string;
    hsn_code?: string;
}

export interface SwilOrderPayload {
    order_no: string;
    store_id: string;
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    payment_method: string;
    payment_gateway_ref?: string;
    subtotal: string;
    delivery_charge: string;
    discount: string;
    total_amount: string;
    items: SwilOrderItem[];
}

export interface SwilOrderResponse {
    erp_order_id: string;
    message?: string;
}

@Injectable()
export class SwilErpService {
    private readonly logger = new Logger(SwilErpService.name);
    private readonly orderDownloadUrl: string;
    private readonly apiKey: string;

    constructor(private readonly configService: ConfigService) {
        this.orderDownloadUrl = this.configService.get<string>('SWIL_ORDER_DOWNLOAD_URL', '');
        this.apiKey = this.configService.get<string>('SWIL_API_KEY', '');
    }

    async pushOrder(payload: SwilOrderPayload): Promise<SwilOrderResponse> {
        if (!this.orderDownloadUrl) {
            this.logger.warn('SWIL_ORDER_DOWNLOAD_URL not configured — skipping ERP push (dev mode)');
            return { erp_order_id: `DEV-${Date.now()}`, message: 'Dev mode: ERP push skipped' };
        }

        const response = await axios.post<SwilOrderResponse>(
            this.orderDownloadUrl,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                },
                timeout: 15000,
            },
        );

        return response.data;
    }
}
