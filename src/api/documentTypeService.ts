import axiosClient from './axiosClient';

export interface DocumentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export const documentTypeService = {
  getAll: async (): Promise<DocumentType[]> => {
    const response = await axiosClient.get('/api/v1/document-types');
    return response.data;
  }
};