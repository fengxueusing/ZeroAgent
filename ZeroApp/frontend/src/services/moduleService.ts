const API_URL = 'http://localhost:8000/api/v1';

export interface Module {
    name: str;
    content: str;
}

export const getModules = async (): Promise<Module[]> => {
    const response = await fetch(`${API_URL}/modules/`);
    if (!response.ok) throw new Error('Failed to fetch modules');
    return response.json();
};

export const createModule = async (name: string, content: string): Promise<Module> => {
    const response = await fetch(`${API_URL}/modules/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create module');
    }
    return response.json();
};

export const updateModule = async (name: string, content: string): Promise<Module> => {
    const response = await fetch(`${API_URL}/modules/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });
    if (!response.ok) throw new Error('Failed to update module');
    return response.json();
};

export const deleteModule = async (name: string): Promise<void> => {
    const response = await fetch(`${API_URL}/modules/${name}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete module');
    }
};
