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
    const response = await axiosClient.get('/v1/DocumentTypes');
    return response.data;
  }
};