import axiosClient from './axiosClient';

export interface EmployeeResponseDto {
  id: string;
  personId: string;
  jobTitleId: string;
  employeeCode?: string;
  hireDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateEmployeeDto {
  personId: string;
  jobTitleId: string;
  hireDate: string;
  employeeCode?: string;
}

export const employeeService = {
  getAll: async (): Promise<EmployeeResponseDto[]> => {
    const response = await axiosClient.get('/v1/Employees');
    return response.data;
  },

  getById: async (id: string): Promise<EmployeeResponseDto> => {
    const response = await axiosClient.get(`/v1/Employees/${id}`);
    return response.data;
  },

  create: async (data: CreateEmployeeDto): Promise<EmployeeResponseDto> => {
    const response = await axiosClient.post('/v1/Employees', data);
    return response.data;
  },
};
