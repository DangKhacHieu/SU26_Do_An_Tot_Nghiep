/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

// Chúng ta sẽ lấy axios instance từ trong notificationService
// Bằng cách mock instance đó
import notificationService from '../notificationService';

describe('NotificationService', () => {
    let mockAxios: MockAdapter;

    beforeEach(() => {
        // notificationService sử dụng this.api là một instance được tạo qua axios.create
        // Vì vậy ta mock instance đó.
        mockAxios = new MockAdapter((notificationService as any).api);
    });

    it('should correctly parse API errors and NOT fallback to mock data', async () => {
        // Arrange: API trả về 500
        mockAxios.onGet('/notifications').reply(500, {
            detail: 'Server is currently down'
        });

        // Act & Assert
        await expect(notificationService.getNotifications()).rejects.toThrow('Server is currently down');
    });

    it('should send correct payload and endpoint', async () => {
        // Arrange
        mockAxios.onPut('/notifications/1/read').reply(200);

        // Act
        await notificationService.markAsRead(1);

        // Assert: Endpoint was hit correctly
        expect(mockAxios.history.put.length).toBe(1);
        expect(mockAxios.history.put[0].url).toBe('/notifications/1/read');
    });
});
