import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../utils/types';

const STORAGE_KEY = '@neetu_collection_transactions';

export const storageService = {
    async getTransactions(): Promise<Transaction[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to fetch transactions', e);
            return [];
        }
    },

    async saveTransaction(transaction: Transaction): Promise<void> {
        try {
            const transactions = await this.getTransactions();
            const newTransactions = [transaction, ...transactions];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTransactions));
        } catch (e) {
            console.error('Failed to save transaction', e);
        }
    },

    async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
        try {
            const transactions = await this.getTransactions();
            const newTransactions = transactions.map((t) =>
                t.id === id ? { ...t, ...updates } : t
            );
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTransactions));
        } catch (e) {
            console.error('Failed to update transaction', e);
        }
    },

    async deleteTransaction(id: string): Promise<void> {
        try {
            const transactions = await this.getTransactions();
            const newTransactions = transactions.filter((t) => t.id !== id);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTransactions));
        } catch (e) {
            console.error('Failed to delete transaction', e);
        }
    },

    async getMasterShops(): Promise<string[]> {
        try {
            const data = await AsyncStorage.getItem('@neetu_collection_shops');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to fetch shops', e);
            return [];
        }
    },

    async saveMasterShop(shopName: string): Promise<void> {
        try {
            const shops = await this.getMasterShops();
            if (!shops.includes(shopName)) {
                await AsyncStorage.setItem('@neetu_collection_shops', JSON.stringify([shopName, ...shops]));
            }
        } catch (e) {
            console.error('Failed to save shop', e);
        }
    },

    async getDirectory(): Promise<any[]> {
        try {
            const data = await AsyncStorage.getItem('@neetu_collection_directory');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to fetch directory', e);
            return [];
        }
    },

    async saveDirectoryItem(item: any): Promise<void> {
        try {
            const directory = await this.getDirectory();
            const existingIndex = directory.findIndex(i => i.id === item.id);
            let newDirectory;
            if (existingIndex >= 0) {
                newDirectory = [...directory];
                newDirectory[existingIndex] = item;
            } else {
                newDirectory = [item, ...directory];
            }
            await AsyncStorage.setItem('@neetu_collection_directory', JSON.stringify(newDirectory));

            // Also save to master shops for backward compatibility with autocomplete
            if (item.type === 'Vendor') {
                await this.saveMasterShop(item.name);
            }
        } catch (e) {
            console.error('Failed to save directory item', e);
        }
    },

    async deleteDirectoryItem(id: string): Promise<void> {
        try {
            const directory = await this.getDirectory();
            const newDirectory = directory.filter(i => i.id !== id);
            await AsyncStorage.setItem('@neetu_collection_directory', JSON.stringify(newDirectory));
        } catch (e) {
            console.error('Failed to delete directory item', e);
        }
    },

    async setAuthStatus(isLoggedIn: boolean): Promise<void> {
        try {
            await AsyncStorage.setItem('@neetu_collection_logged_in', JSON.stringify(isLoggedIn));
        } catch (e) {
            console.error('Failed to set auth status', e);
        }
    },

    async getAuthStatus(): Promise<boolean> {
        try {
            const data = await AsyncStorage.getItem('@neetu_collection_logged_in');
            return data ? JSON.parse(data) : false;
        } catch (e) {
            console.error('Failed to get auth status', e);
            return false;
        }
    }
};
