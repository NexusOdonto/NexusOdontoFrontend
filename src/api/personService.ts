import axiosClient from './axiosClient';

export interface Person {
  id: string;
  documentTypeId: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  sexId?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

export interface CreatePersonRequest {
  documentTypeId: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  sexId?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export const personService = {
  getAll: async (): Promise<Person[]> => {
    const response = await axiosClient.get('/api/v1/persons');
    return response.data;
  },
  
  getById: async (id: string): Promise<Person> => {
    const response = await axiosClient.get(`/api/v1/persons/${id}`);
    return response.data;
  },
  
  create: async (data: CreatePersonRequest): Promise<Person> => {
    const response = await axiosClient.post('/api/v1/persons', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Person>): Promise<Person> => {
    const response = await axiosClient.put(`/api/v1/persons/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/v1/persons/${id}`);
  }
};